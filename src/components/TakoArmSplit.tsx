import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import {
  Colors,
  Motion,
  Radii,
  Shadows,
  Spacing,
  TouchTarget,
} from '../constants/theme';
import { MemojiAvatar, MemojiId } from './MemojiAvatar';
import { TakoMascot } from './TakoMascot';
import { Badge } from './Badge';
import { useReducedMotion } from './MotionPrimitives';
import { allocateSharesLargestRemainder } from '../services/splitEngine';
import { CurrencyCode, formatMoney } from '../services/currency';
import { AppLanguage, t } from '../constants/i18n';
import { triggerHaptic } from '../services/feedbackEngine';

export interface ArmSplitParticipant {
  id: string;
  avatarId: MemojiId;
  name: string;
  basisPoints: number; // 0..10000
}

interface TakoArmSplitProps {
  itemTitle: string;
  itemPriceCents: number;
  participants: ArmSplitParticipant[];
  currency: CurrencyCode;
  language: AppLanguage;
  roundToPeso?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  wiggleSignal?: number;
  onDragActiveChange?: (isDragging: boolean) => void;
  onChangeShare: (memberId: string, targetBps: number) => void;
  onResetEven: () => void;
}

const ARM_PALETTE = [
  Colors.primary,
  Colors.amber,
  Colors.mintProgress,
  Colors.textSecondary,
  Colors.ink,
  '#4A7BFF',
  Colors.amberText,
  Colors.mintText,
];

const CANVAS_HEIGHT = 350;
const MIN_CANVAS_WIDTH = 318;
const TAKO_HEAD_SIZE = 104;
const MIN_ARM_RADIUS = 64; // Keeps avatars clear of Tako's 104px head

/**
 * Linear share-to-arm-length mapping:
 * Allows continuous smooth tracking from MIN_ARM_RADIUS to maxRadius.
 * Maps 0% -> MIN_ARM_RADIUS (74px) and 100% -> maxRadius (~160px).
 */
function sharePctToArmLength(pct: number, maxRadius: number): number {
  const t = Math.max(0, Math.min(100, pct)) / 100;
  return MIN_ARM_RADIUS + t * (maxRadius - MIN_ARM_RADIUS);
}

function armLengthToSharePct(radius: number, maxRadius: number): number {
  if (maxRadius <= MIN_ARM_RADIUS) return 0;
  const ratio = (radius - MIN_ARM_RADIUS) / (maxRadius - MIN_ARM_RADIUS);
  // Smooth 1% granularity (or 0.5%) for fluid dragging without chunky 5% jumps
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return pct;
}

/**
 * Generates an organic tapered cubic Bézier tentacle path (thick at Tako's head,
 * tapering toward the avatar with a rounded tip) plus suction dot coordinates along the curve.
 */
function buildTaperedArm(
  cx: number,
  cy: number,
  ex: number,
  ey: number,
  bendSign: number
): { pathD: string; suctionDots: { x: number; y: number }[] } {
  const dx = ex - cx;
  const dy = ey - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular unit vector
  const px = -uy;
  const py = ux;

  // Gentle organic S-curve control points
  const c1x = cx + dx * 0.34 + px * (14 * bendSign);
  const c1y = cy + dy * 0.34 + py * (14 * bendSign);
  const c2x = cx + dx * 0.7 - px * (10 * bendSign);
  const c2y = cy + dy * 0.7 - py * (10 * bendSign);

  const steps = 12;
  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  const suctionDots: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const tVal = i / steps;
    const mt = 1 - tVal;
    // Cubic Bézier point
    const bx =
      mt * mt * mt * cx +
      3 * mt * mt * tVal * c1x +
      3 * mt * tVal * tVal * c2x +
      tVal * tVal * tVal * ex;
    const by =
      mt * mt * mt * cy +
      3 * mt * mt * tVal * c1y +
      3 * mt * tVal * tVal * c2y +
      tVal * tVal * tVal * ey;

    // Cubic Bézier tangent
    const tx =
      3 * mt * mt * (c1x - cx) +
      6 * mt * tVal * (c2x - c1x) +
      3 * tVal * tVal * (ex - c2x);
    const ty =
      3 * mt * mt * (c1y - cy) +
      6 * mt * tVal * (c2y - c1y) +
      3 * tVal * tVal * (ey - c2y);
    const tLen = Math.hypot(tx, ty) || 1;
    const nx = -ty / tLen;
    const ny = tx / tLen;

    // Taper smoothly from 15px half-width at head to 6px half-width at avatar
    const halfW = 15 * (1 - tVal) + 6 * tVal;
    leftPts.push({ x: bx + nx * halfW, y: by + ny * halfW });
    rightPts.push({ x: bx - nx * halfW, y: by - ny * halfW });

    if (i === 4 || i === 6 || i === 8 || i === 10) {
      suctionDots.push({ x: bx + nx * (halfW * 0.35), y: by + ny * (halfW * 0.35) });
    }
  }

  const startL = leftPts[0];
  const endL = leftPts[leftPts.length - 1];
  const endR = rightPts[rightPts.length - 1];

  const leftSegments = leftPts
    .slice(1)
    .map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const rightSegments = [...rightPts]
    .reverse()
    .slice(1)
    .map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  // Rounded tip cap arc from endL to endR
  const pathD = [
    `M ${startL.x.toFixed(1)} ${startL.y.toFixed(1)}`,
    leftSegments,
    `A 6 6 0 0 1 ${endR.x.toFixed(1)} ${endR.y.toFixed(1)}`,
    rightSegments,
    'Z',
  ].join(' ');

  return { pathD, suctionDots };
}

export function TakoArmSplit({
  itemTitle,
  itemPriceCents,
  participants,
  currency,
  language,
  roundToPeso = false,
  isLoading = false,
  errorMessage = null,
  wiggleSignal = 0,
  onDragActiveChange,
  onChangeShare,
  onResetEven,
}: TakoArmSplitProps) {
  const reducedMotion = useReducedMotion();
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const [canvasWidth, setCanvasWidth] = useState(MIN_CANVAS_WIDTH);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showDragHint, setShowDragHint] = useState(true);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  // Largest-remainder math: whole % sums to 100 and centavos sum to itemPriceCents
  const allocations = useMemo(
    () =>
      allocateSharesLargestRemainder(
        itemPriceCents,
        participants.map((p) => ({ memberId: p.id, basisPoints: p.basisPoints }))
      ),
    [itemPriceCents, participants]
  );

  const allocMap = useMemo(
    () => new Map(allocations.map((a) => [a.memberId, a])),
    [allocations]
  );

  const totalPct = useMemo(
    () => allocations.reduce((s, a) => s + a.percent, 0),
    [allocations]
  );

  const isEvenSplit = useMemo(() => {
    if (participants.length === 0) return false;
    const evenBps = Math.round(10000 / participants.length);
    return participants.every((p) => Math.abs(p.basisPoints - evenBps) <= 100);
  }, [participants]);

  // Happy Tako wiggle when even or confirmed (250ms ease-out, transform only)
  useEffect(() => {
    if (reducedMotion || (!isEvenSplit && wiggleSignal === 0)) return;
    wiggleAnim.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(wiggleAnim, {
        toValue: 1,
        duration: 80,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: -1,
        duration: 90,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: 0,
        duration: 80,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [isEvenSplit, wiggleSignal, reducedMotion, wiggleAnim]);

  const wiggleRotate = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const handleStep = (participant: ArmSplitParticipant, deltaPct: number) => {
    setShowDragHint(false);
    const currentPct = allocMap.get(participant.id)?.percent ?? Math.round(participant.basisPoints / 100);
    const nextPct = Math.max(0, Math.min(100, Math.round((currentPct + deltaPct) / 5) * 5));
    if (nextPct === currentPct) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('tick');
    onChangeShare(participant.id, nextPct * 100);
    const estCents = Math.round((itemPriceCents * nextPct) / 100);
    setLiveAnnouncement(
      `${participant.name} ${nextPct} percent, ${formatMoney(estCents, currency, {
        roundToWhole: roundToPeso,
      })}`
    );
  };

  if (isLoading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.stateText}>Syncing Tako arms…</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.stateBox, { backgroundColor: Colors.dangerLight }]}>
        <Text style={[styles.stateText, { color: Colors.danger }]}>{errorMessage}</Text>
      </View>
    );
  }

  if (participants.length < 2) {
    return (
      <View style={styles.stateBox}>
        <TakoMascot size={72} mood="waiting" hideLegs />
        <Text style={styles.stateText}>
          Invite at least 2 people to fan out Tako&apos;s arms for {itemTitle}.
        </Text>
      </View>
    );
  }

  const useRadialCanvas = participants.length >= 2 && participants.length <= 8;
  const effectiveWidth = Math.max(MIN_CANVAS_WIDTH, canvasWidth);
  const centerX = effectiveWidth / 2;
  const centerY = 170;
  // Allow up to 170px+ while keeping avatars/labels inside 360px canvas
  const maxArmRadius = Math.min(170, centerY - 12);
  const evenPct = 100 / participants.length;
  const evenRadius = sharePctToArmLength(evenPct, maxArmRadius);
  // Rotate angles so 4 arms sit diagonally (-128°, -38°, 52°, 142°) — never a + sign
  const angleOffset = -Math.PI * 0.68;

  return (
    <View style={styles.container}>
      {/* Live region for screen-reader announcements */}
      <Text accessibilityLiveRegion="polite" style={styles.srOnly}>
        {liveAnnouncement}
      </Text>

      {/* Top status bar: real-sum 100% claimed chip + Split evenly */}
      <View style={styles.topStatusRow}>
        <Badge
          label={totalPct === 100 ? t(language, 'claimed100') : `${totalPct}% claimed`}
          variant={totalPct === 100 ? 'emerald' : 'amber'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(language, 'splitEvenly')}
          onPress={() => {
            setShowDragHint(false);
            triggerHaptic('tick');
            onResetEven();
            setLiveAnnouncement(`${t(language, 'splitEvenly')} for ${itemTitle}`);
          }}
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <Text style={styles.resetBtnText}>{t(language, 'splitEvenly')}</Text>
        </Pressable>
      </View>

      {/* Segmented bar in existing palette colors */}
      <View style={styles.segmentedBar} accessibilityLabel="Share breakdown bar">
        {participants.map((p, idx) => {
          const pct = allocMap.get(p.id)?.percent ?? 0;
          if (pct <= 0) return null;
          return (
            <View
              key={p.id}
              style={{
                flex: pct,
                height: '100%',
                backgroundColor: ARM_PALETTE[idx % ARM_PALETTE.length],
              }}
            />
          );
        })}
      </View>

      {/* Full-width Radial Tako Arms Diagram (2 to 8 people) */}
      {useRadialCanvas && (
        <View
          style={styles.canvasWrap}
          onLayout={(e: LayoutChangeEvent) => {
            const w = e.nativeEvent.layout.width;
            if (w >= MIN_CANVAS_WIDTH && Math.abs(w - canvasWidth) > 2) {
              setCanvasWidth(w);
            }
          }}
        >
          {/* Layer 1 (behind Tako head, in front of background): Dashed ring + Tapered Bézier Arms */}
          <Svg width={effectiveWidth} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
            <Circle
              cx={centerX}
              cy={centerY}
              r={evenRadius}
              fill="none"
              stroke="#C5CBDD"
              strokeWidth={1.5}
              strokeDasharray="3 6"
            />
            <SvgText
              x={centerX + evenRadius + 4}
              y={centerY - 10}
              fill={Colors.textSecondary}
              fontSize={10}
              fontWeight="600"
            >
              Even
            </SvgText>
            <SvgText
              x={centerX + evenRadius + 4}
              y={centerY + 2}
              fill={Colors.textSecondary}
              fontSize={10}
              fontWeight="600"
            >
              split
            </SvgText>

            {participants.map((p, idx) => {
              const angle = angleOffset + (idx / participants.length) * Math.PI * 2;
              const pct = allocMap.get(p.id)?.percent ?? 0;
              const radius = sharePctToArmLength(pct, maxArmRadius);
              const ex = centerX + Math.cos(angle) * radius;
              const ey = centerY + Math.sin(angle) * radius;
              const color = ARM_PALETTE[idx % ARM_PALETTE.length];
              const bendSign = idx % 2 === 0 ? 1 : -1;
              const { pathD, suctionDots } = buildTaperedArm(centerX, centerY, ex, ey, bendSign);
              const isDragging = draggingId === p.id;
              const isFirst = idx === 0;

              return (
                <React.Fragment key={p.id}>
                  <Path
                    d={pathD}
                    fill={color}
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                  <Circle cx={ex} cy={ey} r={isFirst ? 7.5 : 6.0} fill={color} />
                  {isDragging &&
                    suctionDots.map((dot, dIdx) => (
                      <Circle
                        key={dIdx}
                        cx={dot.x}
                        cy={dot.y}
                        r={2.3}
                        fill="#FFFFFF"
                        opacity={0.85}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Layer 2: Center Tako Head Only (104px wide, no legs) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerTako,
              {
                left: centerX - TAKO_HEAD_SIZE / 2,
                top: centerY - Math.round(TAKO_HEAD_SIZE * 0.48),
                transform: [{ rotate: wiggleRotate }],
              },
            ]}
          >
            <TakoMascot
              size={TAKO_HEAD_SIZE}
              mood={isEvenSplit ? 'happy' : 'counting'}
              hideLegs
            />
          </Animated.View>

          {/* Layer 3: Draggable Avatars + Non-Truncating Above/Below Labels */}
          {participants.map((p, idx) => {
            const angle = angleOffset + (idx / participants.length) * Math.PI * 2;
            const alloc = allocMap.get(p.id);
            const pct = alloc?.percent ?? 0;
            const cents = alloc?.cents ?? 0;
            const radius = sharePctToArmLength(pct, maxArmRadius);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const amountText = formatMoney(cents, currency, { roundToWhole: roundToPeso });

            // Place label directly above top-half avatars and directly below bottom-half avatars
            const sinA = Math.sin(angle);
            const labelW = 90;
            const labelH = 34;
            const labelLeft = Math.max(
              2,
              Math.min(effectiveWidth - labelW - 2, x - labelW / 2)
            );
            const rawTop = sinA < 0 ? y - 68 : y + 34;
            const labelTop = Math.max(2, Math.min(CANVAS_HEIGHT - labelH - 2, rawTop));

            return (
              <React.Fragment key={p.id}>
                <RadialArmHandle
                  participant={p}
                  angle={angle}
                  x={x}
                  y={y}
                  pct={pct}
                  maxRadius={maxArmRadius}
                  amountText={amountText}
                  accentColor={ARM_PALETTE[idx % ARM_PALETTE.length]}
                  onDragStateChange={(active) => {
                    setDraggingId(active ? p.id : null);
                    onDragActiveChange?.(active);
                    if (active) setShowDragHint(false);
                  }}
                  onSnapPct={(nextPct) => {
                    if (nextPct !== pct) {
                      // Light tick on 5% intervals so haptics feel crisp without buzzing continuously
                      if (nextPct % 5 === 0) {
                        triggerHaptic('tick');
                      }
                      onChangeShare(p.id, nextPct * 100);
                      setLiveAnnouncement(`${p.name} ${nextPct} percent`);
                    }
                  }}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.outsideLabel,
                    Shadows.cardSoft,
                    {
                      left: labelLeft,
                      top: labelTop,
                      width: labelW,
                      minWidth: 84,
                    },
                  ]}
                >
                  <Text style={styles.labelName}>{p.name}</Text>
                  <Text style={styles.labelMeta}>
                    {pct}% · {amountText}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}

          {showDragHint && (
            <View pointerEvents="none" style={styles.dragHintPill}>
              <Text style={styles.dragHintPillText}>Drag to adjust</Text>
            </View>
          )}
        </View>
      )}

      {/* Accessible Numeric Steppers (visible focus state + aria-live) */}
      <View style={styles.stepperList}>
        {participants.length > 8 && (
          <Text style={styles.fallbackNotice}>
            More than 8 friends — using list mode for clarity.
          </Text>
        )}
        {participants.map((p, idx) => {
          const alloc = allocMap.get(p.id);
          const pct = alloc?.percent ?? 0;
          const cents = alloc?.cents ?? 0;
          const color = ARM_PALETTE[idx % ARM_PALETTE.length];
          const minusKey = `${p.id}-minus`;
          const plusKey = `${p.id}-plus`;

          return (
            <View key={p.id} style={styles.stepperRow}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <MemojiAvatar id={p.avatarId} size={30} />
              <View style={styles.stepperInfo}>
                <Text style={styles.stepperName}>{p.name}</Text>
                <Text style={styles.stepperAmount}>{pct}%</Text>
              </View>
              <View style={styles.stepperControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${p.name} share by 5%`}
                  onFocus={() => setFocusedKey(minusKey)}
                  onBlur={() => setFocusedKey((k) => (k === minusKey ? null : k))}
                  onPress={() => handleStep(p, -5)}
                  style={({ pressed }) => [
                    styles.stepBtn,
                    focusedKey === minusKey && styles.stepBtnFocused,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <TypeableAmountInput
                  memberName={p.name}
                  cents={cents}
                  itemPriceCents={itemPriceCents}
                  currency={currency}
                  onCommitCents={(typedCents) => {
                    if (itemPriceCents <= 0) return;
                    const targetBps = Math.max(
                      0,
                      Math.min(10000, Math.round((typedCents / itemPriceCents) * 10000))
                    );
                    setShowDragHint(false);
                    triggerHaptic('tick');
                    onChangeShare(p.id, targetBps);
                    setLiveAnnouncement(
                      `${p.name} updated to ${formatMoney(typedCents, currency)}`
                    );
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${p.name} share by 5%`}
                  onFocus={() => setFocusedKey(plusKey)}
                  onBlur={() => setFocusedKey((k) => (k === plusKey ? null : k))}
                  onPress={() => handleStep(p, 5)}
                  style={({ pressed }) => [
                    styles.stepBtn,
                    focusedKey === plusKey && styles.stepBtnFocused,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface TypeableAmountInputProps {
  memberName: string;
  cents: number;
  itemPriceCents: number;
  currency: CurrencyCode;
  onCommitCents: (cents: number) => void;
}

function TypeableAmountInput({
  memberName,
  cents,
  itemPriceCents,
  currency,
  onCommitCents,
}: TypeableAmountInputProps) {
  const formatted = (cents / 100).toFixed(2);
  const [draft, setDraft] = useState(formatted);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft((cents / 100).toFixed(2));
    }
  }, [cents, isFocused]);

  const commit = () => {
    setIsFocused(false);
    const cleaned = draft.replace(/[^0-9.]/g, '');
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft((cents / 100).toFixed(2));
      return;
    }
    const clampedCents = Math.max(0, Math.min(itemPriceCents, Math.round(parsed * 100)));
    setDraft((clampedCents / 100).toFixed(2));
    if (clampedCents !== cents) {
      onCommitCents(clampedCents);
    }
  };

  return (
    <View style={[styles.amountInputWrap, isFocused && styles.amountInputWrapFocused]}>
      <Text style={styles.amountPrefix}>{currency === 'PHP' ? '₱' : '$'}</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onFocus={() => setIsFocused(true)}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
        accessibilityLabel={`Amount for ${memberName}`}
        style={styles.amountInput}
      />
    </View>
  );
}

interface RadialArmHandleProps {
  participant: ArmSplitParticipant;
  angle: number;
  x: number;
  y: number;
  pct: number;
  maxRadius: number;
  amountText: string;
  accentColor: string;
  onDragStateChange: (active: boolean) => void;
  onSnapPct: (nextPct: number) => void;
}

function RadialArmHandle({
  participant,
  angle,
  x,
  y,
  pct,
  maxRadius,
  amountText,
  accentColor,
  onDragStateChange,
  onSnapPct,
}: RadialArmHandleProps) {
  const startRadiusRef = useRef(sharePctToArmLength(pct, maxRadius));
  const latestPctRef = useRef(pct);
  latestPctRef.current = pct;
  const lastEmittedPctRef = useRef(pct);
  const onDragRef = useRef(onDragStateChange);
  onDragRef.current = onDragStateChange;
  const onSnapRef = useRef(onSnapPct);
  onSnapRef.current = onSnapPct;
  const angleRef = useRef(angle);
  angleRef.current = angle;
  const maxRadiusRef = useRef(maxRadius);
  maxRadiusRef.current = maxRadius;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startRadiusRef.current = sharePctToArmLength(
            latestPctRef.current,
            maxRadiusRef.current
          );
          lastEmittedPctRef.current = latestPctRef.current;
          onDragRef.current(true);
        },
        onPanResponderMove: (_evt, gesture) => {
          const a = angleRef.current;
          const radialDelta =
            gesture.dx * Math.cos(a) + gesture.dy * Math.sin(a);
          const maxR = maxRadiusRef.current;
          const nextRadius = Math.max(
            MIN_ARM_RADIUS,
            Math.min(maxR, startRadiusRef.current + radialDelta)
          );
          const smoothPct = armLengthToSharePct(nextRadius, maxR);
          if (smoothPct !== lastEmittedPctRef.current) {
            lastEmittedPctRef.current = smoothPct;
            onSnapRef.current(smoothPct);
          }
        },
        onPanResponderRelease: () => onDragRef.current(false),
        onPanResponderTerminate: () => onDragRef.current(false),
      }),
    []
  );

  return (
    <View
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`${participant.name} arm ${pct}% (${amountText})`}
      style={[
        styles.handleWrap,
        Platform.OS === 'web'
          ? ({ touchAction: 'none', userSelect: 'none', cursor: 'grab' } as object)
          : null,
        {
          left: x - 24,
          top: y - 24,
        },
      ]}
    >
      <View
        style={[
          styles.avatarRing,
          Shadows.cardSoft,
          { borderColor: accentColor },
        ]}
      >
        <MemojiAvatar id={participant.avatarId} size={38} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  stateBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dragHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  resetBtn: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    marginTop: Spacing.sm,
    gap: 2,
  },
  canvasWrap: {
    width: '100%',
    minWidth: MIN_CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    marginTop: Spacing.xs,
    position: 'relative',
  },
  centerTako: {
    position: 'absolute',
    width: TAKO_HEAD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleWrap: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outsideLabel: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 4,
    paddingVertical: 3,
    alignItems: 'center',
  },
  labelName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
  dragHintPill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 8,
    backgroundColor: Colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  dragHintPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepperList: {
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  fallbackNotice: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepperInfo: {
    flex: 1,
    minWidth: 54,
    justifyContent: 'center',
  },
  stepperName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  stepperAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepBtnFocused: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    width: 82,
    paddingHorizontal: 6,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
    overflow: 'hidden',
  },
  amountInputWrapFocused: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  amountPrefix: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 2,
  },
  amountInput: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'right',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          boxSizing: 'border-box',
          backgroundColor: 'transparent',
        } as object)
      : null),
  },
});
