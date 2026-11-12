import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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
import { calculateItemCents } from '../services/splitEngine';
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

const CANVAS_SIZE = 304;
const CENTER = CANVAS_SIZE / 2;
const MIN_RADIUS = 56;
const MAX_RADIUS = 122;

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
  onChangeShare,
  onResetEven,
}: TakoArmSplitProps) {
  const reducedMotion = useReducedMotion();
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Centavo-exact allocations (leftover centavo goes to largest share)
  const allocations = useMemo(
    () =>
      calculateItemCents(
        itemPriceCents,
        participants.map((p) => ({ memberId: p.id, basisPoints: p.basisPoints }))
      ),
    [itemPriceCents, participants]
  );

  const allocMap = useMemo(
    () => new Map(allocations.map((a) => [a.memberId, a.cents])),
    [allocations]
  );

  const totalPct = useMemo(
    () => Math.round(participants.reduce((s, p) => s + p.basisPoints, 0) / 100),
    [participants]
  );

  const isEvenSplit = useMemo(() => {
    if (participants.length === 0) return false;
    const evenBps = Math.round(10000 / participants.length);
    return participants.every((p) => Math.abs(p.basisPoints - evenBps) <= 500);
  }, [participants]);

  // Happy wiggle when everyone is even or user confirms
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
    const currentPct = Math.round(participant.basisPoints / 100);
    const nextPct = Math.max(0, Math.min(100, Math.round((currentPct + deltaPct) / 5) * 5));
    if (nextPct === currentPct) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('tick');
    onChangeShare(participant.id, nextPct * 100);
    const estCents = Math.round((itemPriceCents * nextPct) / 100);
    setLiveAnnouncement(
      `${participant.name} ${nextPct}%, ${formatMoney(estCents, currency, {
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
        <TakoMascot size={64} mood="waiting" />
        <Text style={styles.stateText}>
          Invite at least 2 people to fan out Tako&apos;s arms for {itemTitle}.
        </Text>
      </View>
    );
  }

  const useRadialCanvas = participants.length >= 2 && participants.length <= 8;
  const evenPct = 100 / participants.length;
  const evenRadius = MIN_RADIUS + (evenPct / 100) * (MAX_RADIUS - MIN_RADIUS);

  return (
    <View style={styles.container}>
      {/* Live region for screen-reader announcements */}
      <Text
        accessibilityLiveRegion="polite"
        style={styles.srOnly}
      >
        {liveAnnouncement}
      </Text>

      {/* Top status bar: 100% claimed chip + Split evenly reset */}
      <View style={styles.topStatusRow}>
        <Badge
          label={totalPct === 100 ? t(language, 'claimed100') : `${totalPct}%`}
          variant={totalPct === 100 ? 'emerald' : 'amber'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(language, 'splitEvenly')}
          onPress={() => {
            triggerHaptic('tick');
            onResetEven();
            setLiveAnnouncement(
              `${t(language, 'splitEvenly')} for ${itemTitle}`
            );
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
          const pct = Math.max(0, p.basisPoints / 100);
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

      {/* Radial Tako Arms Canvas (2 to 8 people) */}
      {useRadialCanvas && (
        <View style={styles.canvasWrap}>
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill}>
            {/* Dashed ring marking the even split */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={evenRadius}
              fill="none"
              stroke={Colors.border}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            {/* Curved octopus arms from center Tako to each handle */}
            {participants.map((p, idx) => {
              const angle = (idx / participants.length) * Math.PI * 2 - Math.PI / 2;
              const pct = p.basisPoints / 100;
              const radius = MIN_RADIUS + (pct / 100) * (MAX_RADIUS - MIN_RADIUS);
              const endX = CENTER + Math.cos(angle) * radius;
              const endY = CENTER + Math.sin(angle) * radius;
              const ctrlX = CENTER + Math.cos(angle + 0.22) * (radius * 0.55);
              const ctrlY = CENTER + Math.sin(angle + 0.22) * (radius * 0.55);
              const color = ARM_PALETTE[idx % ARM_PALETTE.length];

              return (
                <Path
                  key={p.id}
                  d={`M ${CENTER} ${CENTER} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={10}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              );
            })}
          </Svg>

          {/* Center Tako */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerTako,
              { transform: [{ rotate: wiggleRotate }] },
            ]}
          >
            <TakoMascot size={74} mood={isEvenSplit ? 'happy' : 'counting'} />
          </Animated.View>

          {/* Draggable Animal Avatar Handles */}
          {participants.map((p, idx) => {
            const angle = (idx / participants.length) * Math.PI * 2 - Math.PI / 2;
            const pct = Math.round(p.basisPoints / 100);
            const radius = MIN_RADIUS + (pct / 100) * (MAX_RADIUS - MIN_RADIUS);
            const x = CENTER + Math.cos(angle) * radius;
            const y = CENTER + Math.sin(angle) * radius;
            const cents = allocMap.get(p.id) ?? 0;

            return (
              <RadialArmHandle
                key={p.id}
                participant={p}
                angle={angle}
                x={x}
                y={y}
                pct={pct}
                amountText={formatMoney(cents, currency, { roundToWhole: roundToPeso })}
                accentColor={ARM_PALETTE[idx % ARM_PALETTE.length]}
                onSnapPct={(nextPct) => {
                  if (nextPct !== pct) {
                    triggerHaptic('tick');
                    onChangeShare(p.id, nextPct * 100);
                    setLiveAnnouncement(`${p.name} ${nextPct}%`);
                  }
                }}
              />
            );
          })}
        </View>
      )}

      {/* Accessible Numeric Steppers (always available; primary UI if >8 people) */}
      <View style={styles.stepperList}>
        {participants.length > 8 && (
          <Text style={styles.fallbackNotice}>
            More than 8 friends — using list mode for clarity.
          </Text>
        )}
        {participants.map((p, idx) => {
          const pct = Math.round(p.basisPoints / 100);
          const cents = allocMap.get(p.id) ?? 0;
          const color = ARM_PALETTE[idx % ARM_PALETTE.length];
          return (
            <View key={p.id} style={styles.stepperRow}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <MemojiAvatar id={p.avatarId} size={30} />
              <View style={styles.stepperInfo}>
                <Text style={styles.stepperName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.stepperAmount} numberOfLines={1}>
                  {pct}% · {formatMoney(cents, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>
              <View style={styles.stepperControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${p.name} share by 5%`}
                  onPress={() => handleStep(p, -5)}
                  style={({ pressed }) => [
                    styles.stepBtn,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${p.name} share by 5%`}
                  onPress={() => handleStep(p, 5)}
                  style={({ pressed }) => [
                    styles.stepBtn,
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

interface RadialArmHandleProps {
  participant: ArmSplitParticipant;
  angle: number;
  x: number;
  y: number;
  pct: number;
  amountText: string;
  accentColor: string;
  onSnapPct: (nextPct: number) => void;
}

function RadialArmHandle({
  participant,
  angle,
  x,
  y,
  pct,
  amountText,
  accentColor,
  onSnapPct,
}: RadialArmHandleProps) {
  const startRadiusRef = useRef(MIN_RADIUS + (pct / 100) * (MAX_RADIUS - MIN_RADIUS));
  const latestPctRef = useRef(pct);
  latestPctRef.current = pct;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRadiusRef.current =
            MIN_RADIUS + (latestPctRef.current / 100) * (MAX_RADIUS - MIN_RADIUS);
        },
        onPanResponderMove: (_evt, gesture) => {
          // Project drag delta onto this arm's radial unit vector
          const radialDelta =
            gesture.dx * Math.cos(angle) + gesture.dy * Math.sin(angle);
          const nextRadius = Math.max(
            MIN_RADIUS,
            Math.min(MAX_RADIUS, startRadiusRef.current + radialDelta)
          );
          const rawPct =
            ((nextRadius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 100;
          const snapped = Math.max(0, Math.min(100, Math.round(rawPct / 5) * 5));
          onSnapPct(snapped);
        },
      }),
    [angle, onSnapPct]
  );

  return (
    <View
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`${participant.name} arm ${pct}% (${amountText})`}
      style={[
        styles.handleWrap,
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
        <MemojiAvatar id={participant.avatarId} size={36} />
      </View>
      <View style={styles.handleLabelPill}>
        <Text style={styles.handleLabelText} numberOfLines={1}>
          {pct}% · {amountText}
        </Text>
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
    padding: Spacing.lg,
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
    marginTop: Spacing.md,
    gap: 2,
  },
  canvasWrap: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignSelf: 'center',
    marginTop: Spacing.md,
    position: 'relative',
  },
  centerTako: {
    position: 'absolute',
    left: CENTER - 37,
    top: CENTER - 37,
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleWrap: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleLabelPill: {
    marginTop: 2,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  handleLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
  stepperList: {
    marginTop: Spacing.md,
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
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepperInfo: {
    flex: 1,
    minWidth: 0,
  },
  stepperName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  stepperAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepBtn: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
});
