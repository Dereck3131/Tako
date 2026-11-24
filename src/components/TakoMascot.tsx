import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useTakoTheme } from '@/context/ThemeContext';
import { playSound } from '@/lib/sounds';
import type { TakoState } from '@/types/tako';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TakoMascotProps {
  state?: TakoState;
  size?: number;
  interactive?: boolean;
  hidePeekCard?: boolean;
  onCelebrate?: () => void;
}

const CONFETTI_ITEMS = [
  { type: 'circle' as const, color: '#FF7A8A', dx: -62, dy: -44, r: 4 },
  { type: 'rect' as const, color: '#2EC4B6', dx: -34, dy: -66, s: 7 },
  { type: 'circle' as const, color: '#FFC857', dx: -8, dy: -72, r: 3.5 },
  { type: 'rect' as const, color: '#B9A5E8', dx: 22, dy: -68, s: 7 },
  { type: 'circle' as const, color: '#2EC4B6', dx: 50, dy: -52, r: 4 },
  { type: 'rect' as const, color: '#FF7A8A', dx: 70, dy: -26, s: 7 },
  { type: 'circle' as const, color: '#B9A5E8', dx: -72, dy: -18, r: 3 },
  { type: 'rect' as const, color: '#FFC857', dx: 42, dy: -78, s: 6 },
];

const COIN_ITEMS = [
  { dx: -80, dy: 42, delay: 0 },
  { dx: -76, dy: 98, delay: 120 },
  { dx: 76, dy: 42, delay: 240 },
  { dx: 72, dy: 98, delay: 360 },
];

export function TakoMascot({
  state = 'idle',
  size = 200,
  interactive = true,
  hidePeekCard = false,
  onCelebrate,
}: TakoMascotProps) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();
  const [tempCelebrate, setTempCelebrate] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeState: TakoState = tempCelebrate ? 'celebrate' : state;

  // Core shared animation values
  const bobProgress = useSharedValue(0);
  const swayProgress = useSharedValue(0);
  const waveProgress = useSharedValue(0);
  const blinkScale = useSharedValue(1);
  const jumpProgress = useSharedValue(0);
  const confettiProgress = useSharedValue(0);
  const thinkProgress = useSharedValue(0);
  const coinProgress = useSharedValue(0);
  const zzzProgress = useSharedValue(0);
  const peekProgress = useSharedValue(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Cancel previous state animations cleanly
    cancelAnimation(bobProgress);
    cancelAnimation(swayProgress);
    cancelAnimation(waveProgress);
    cancelAnimation(blinkScale);
    cancelAnimation(jumpProgress);
    cancelAnimation(confettiProgress);
    cancelAnimation(thinkProgress);
    cancelAnimation(coinProgress);
    cancelAnimation(zzzProgress);
    cancelAnimation(peekProgress);

    if (reducedMotion) {
      bobProgress.value = 0;
      swayProgress.value = 0;
      waveProgress.value = 0;
      blinkScale.value = activeState === 'sleep' ? 0.1 : 1;
      jumpProgress.value = 0;
      confettiProgress.value = 0;
      thinkProgress.value = 0;
      coinProgress.value = 0;
      zzzProgress.value = 0;
      peekProgress.value = 0;
      return;
    }

    // Bobbing
    const bobDuration =
      activeState === 'wave'
        ? 1200
        : activeState === 'think'
          ? 2100
          : activeState === 'sleep' || activeState === 'sad'
            ? 2500
            : activeState === 'coins'
              ? 900
              : 1600;

    if (activeState !== 'celebrate' && activeState !== 'peek') {
      bobProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: bobDuration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: bobDuration, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else {
      bobProgress.value = 0;
    }

    // Tentacle sway
    const swayDur =
      activeState === 'celebrate'
        ? 250
        : activeState === 'sleep' || activeState === 'sad'
          ? 3000
          : 1300;
    swayProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: swayDur, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    // Eye blink or sleep
    if (activeState === 'sleep') {
      blinkScale.value = withTiming(0.1, { duration: 200 });
    } else {
      blinkScale.value = 1;
      blinkScale.value = withRepeat(
        withSequence(
          withDelay(4200, withTiming(0.08, { duration: 110 })),
          withTiming(1, { duration: 130 })
        ),
        -1
      );
    }

    // State-specific motions
    if (activeState === 'wave') {
      waveProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 375, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 375, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else {
      waveProgress.value = 0;
    }

    if (activeState === 'celebrate') {
      jumpProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) })
        ),
        -1
      );
      confettiProgress.value = 0;
      confettiProgress.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
        -1
      );
    } else {
      jumpProgress.value = 0;
      confettiProgress.value = 0;
    }

    if (activeState === 'think' || activeState === 'confused') {
      thinkProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else {
      thinkProgress.value = 0;
    }

    if (activeState === 'coins') {
      coinProgress.value = 0;
      coinProgress.value = withRepeat(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.cubic) }),
        -1
      );
    } else {
      coinProgress.value = 0;
    }

    if (activeState === 'sleep') {
      zzzProgress.value = 0;
      zzzProgress.value = withRepeat(
        withTiming(1, { duration: 3600, easing: Easing.out(Easing.quad) }),
        -1
      );
    } else {
      zzzProgress.value = 0;
    }

    if (activeState === 'peek') {
      peekProgress.value = withRepeat(
        withSequence(
          withDelay(400, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })),
          withDelay(1400, withTiming(0, { duration: 900, easing: Easing.inOut(Easing.cubic) }))
        ),
        -1
      );
    } else {
      peekProgress.value = 0;
    }
  }, [
    activeState,
    reducedMotion,
    bobProgress,
    swayProgress,
    waveProgress,
    blinkScale,
    jumpProgress,
    confettiProgress,
    thinkProgress,
    coinProgress,
    zzzProgress,
    peekProgress,
  ]);

  const handlePress = () => {
    if (!interactive) return;
    playSound('boop');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setTempCelebrate(true);
    onCelebrate?.();
    timerRef.current = setTimeout(() => {
      setTempCelebrate(false);
    }, 2000);
  };

  // Animated body group props (pivot at 62, 116)
  const bodyAnimProps = useAnimatedProps(() => {
    'worklet';
    let ty = 0;
    let sx = 1;
    let sy = 1;
    if (activeState === 'celebrate') {
      ty = -34 * jumpProgress.value;
      sx = 1 + 0.08 * (1 - jumpProgress.value) - 0.05 * jumpProgress.value;
      sy = 1 - 0.1 * (1 - jumpProgress.value) + 0.06 * jumpProgress.value;
    } else if (activeState === 'peek') {
      ty = 74 - 48 * peekProgress.value;
    } else {
      ty = -6 * bobProgress.value;
      sx = 1 - 0.015 * bobProgress.value;
      sy = 1 + 0.02 * bobProgress.value;
    }
    return {
      transform: [
        { translateX: 62 },
        { translateY: 116 + ty },
        { scaleX: sx },
        { scaleY: sy },
        { translateX: -62 },
        { translateY: -116 },
      ],
    };
  });

  const shadowAnimatedProps = useAnimatedProps(() => {
    if (activeState === 'peek') {
      return { opacity: 0, rx: 46, ry: 6 };
    }
    if (activeState === 'celebrate') {
      const factor = 1 - 0.35 * jumpProgress.value;
      return {
        opacity: 1 - 0.45 * jumpProgress.value,
        rx: 46 * factor,
        ry: 6 * factor,
      };
    }
    const factor = 1 - 0.1 * bobProgress.value;
    return {
      opacity: 1 - 0.2 * bobProgress.value,
      rx: 46 * factor,
      ry: 6 * factor,
    };
  });

  const leftEyeScaleProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 44 },
      { translateY: 52 },
      { scaleY: blinkScale.value },
      { translateX: -44 },
      { translateY: -52 },
    ],
  }));

  const rightEyeScaleProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 80 },
      { translateY: 52 },
      { scaleY: blinkScale.value },
      { translateX: -80 },
      { translateY: -52 },
    ],
  }));

  const pupilOffsetProps = useAnimatedProps(() => {
    if (activeState === 'think') {
      const x = (thinkProgress.value - 0.5) * 7;
      const y = -3 * Math.abs(Math.sin(thinkProgress.value * Math.PI));
      return { transform: [{ translateX: x }, { translateY: y }] };
    }
    if (activeState === 'coins') {
      const p = coinProgress.value;
      const x = p < 0.35 ? 0 : p < 0.68 ? -4 : 4;
      const y = p < 0.35 ? -4 : 1;
      return { transform: [{ translateX: x }, { translateY: y }] };
    }
    return { transform: [{ translateX: 0 }, { translateY: 0 }] };
  });

  const waveTentacleProps = useAnimatedProps(() => {
    const deg =
      activeState === 'wave'
        ? -12 - 50 * waveProgress.value
        : 5 * swayProgress.value;
    return {
      transform: [
        { translateX: 110 },
        { translateY: 70 },
        { rotate: `${deg}deg` },
        { translateX: -110 },
        { translateY: -70 },
      ],
    };
  });

  const t1Props = useAnimatedProps(() => ({
    transform: [
      { translateX: 14 },
      { translateY: 70 },
      { rotate: `${5 * swayProgress.value}deg` },
      { translateX: -14 },
      { translateY: -70 },
    ],
  }));

  const t2Props = useAnimatedProps(() => ({
    transform: [
      { translateX: 38 },
      { translateY: 65 },
      { rotate: `${-5 * swayProgress.value}deg` },
      { translateX: -38 },
      { translateY: -65 },
    ],
  }));

  const t3Props = useAnimatedProps(() => ({
    transform: [
      { translateX: 62 },
      { translateY: 62 },
      { rotate: `${5 * swayProgress.value}deg` },
      { translateX: -62 },
      { translateY: -62 },
    ],
  }));

  const t4Props = useAnimatedProps(() => ({
    transform: [
      { translateX: 86 },
      { translateY: 65 },
      { rotate: `${-5 * swayProgress.value}deg` },
      { translateX: -86 },
      { translateY: -65 },
    ],
  }));

  const height = Math.round((size * 214) / 192);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : 'image'}
      accessibilityLabel="Tako the octopus. Tap to make Tako celebrate."
      style={({ pressed }) => [
        styles.wrapper,
        { width: size, height },
        pressed && interactive && { opacity: 0.96 },
      ]}>
      <View style={{ width: size, height }}>
        <Svg
          width={size}
          height={height}
          viewBox="-34 -62 192 214">
          {/* Ground shadow */}
          <AnimatedEllipse
            cx={62}
            cy={124}
            fill={palette.shadow}
            animatedProps={shadowAnimatedProps}
          />

          {/* Confetti for celebrate */}
          {activeState === 'celebrate' &&
            CONFETTI_ITEMS.map((item, idx) => (
              <ConfettiParticle
                key={idx}
                item={item}
                progress={confettiProgress}
              />
            ))}

          {/* Tako body */}
          <AnimatedG animatedProps={bodyAnimProps}>
            {/* Tentacles */}
            <AnimatedG animatedProps={t1Props}>
              <Ellipse cx={14} cy={92} rx={12} ry={24} fill="#F0627A" />
              <Circle cx={14} cy={98} r={4} fill="#FFB3BC" />
              <Circle cx={14} cy={108} r={3.5} fill="#FFB3BC" />
            </AnimatedG>
            <AnimatedG animatedProps={t2Props}>
              <Ellipse cx={38} cy={89} rx={12} ry={27} fill="#F0627A" />
              <Circle cx={38} cy={98} r={4} fill="#FFB3BC" />
              <Circle cx={38} cy={109} r={3.5} fill="#FFB3BC" />
            </AnimatedG>
            <AnimatedG animatedProps={t3Props}>
              <Ellipse cx={62} cy={87} rx={12} ry={29} fill="#F0627A" />
              <Circle cx={62} cy={98} r={4} fill="#FFB3BC" />
              <Circle cx={62} cy={109} r={3.5} fill="#FFB3BC" />
            </AnimatedG>
            <AnimatedG animatedProps={t4Props}>
              <Ellipse cx={86} cy={89} rx={12} ry={27} fill="#F0627A" />
              <Circle cx={86} cy={98} r={4} fill="#FFB3BC" />
              <Circle cx={86} cy={109} r={3.5} fill="#FFB3BC" />
            </AnimatedG>
            <AnimatedG animatedProps={waveTentacleProps}>
              <Ellipse cx={110} cy={92} rx={12} ry={24} fill="#F0627A" />
              <Circle cx={110} cy={98} r={4} fill="#FFB3BC" />
              <Circle cx={110} cy={108} r={3.5} fill="#FFB3BC" />
            </AnimatedG>

            {/* Head */}
            <Ellipse cx={62} cy={48} rx={52} ry={46} fill="#FF7A8A" />
            <Ellipse cx={41} cy={18} rx={13} ry={6} fill="#FF9AA6" />

            {/* Eyes */}
            <AnimatedG animatedProps={leftEyeScaleProps}>
              <Ellipse cx={44} cy={52} rx={12} ry={14} fill="#FFFFFF" />
              <AnimatedG animatedProps={pupilOffsetProps}>
                <Ellipse cx={46} cy={55} rx={5.5} ry={7.5} fill="#2B1B3D" />
                <Circle cx={47.5} cy={52} r={2} fill="#FFFFFF" />
              </AnimatedG>
            </AnimatedG>
            <AnimatedG animatedProps={rightEyeScaleProps}>
              <Ellipse cx={80} cy={52} rx={12} ry={14} fill="#FFFFFF" />
              <AnimatedG animatedProps={pupilOffsetProps}>
                <Ellipse cx={82} cy={55} rx={5.5} ry={7.5} fill="#2B1B3D" />
                <Circle cx={83.5} cy={52} r={2} fill="#FFFFFF" />
              </AnimatedG>
            </AnimatedG>

            {/* Cheeks */}
            <Ellipse cx={28} cy={72} rx={7.5} ry={4.5} fill="#FF9FAA" />
            <Ellipse cx={96} cy={72} rx={7.5} ry={4.5} fill="#FF9FAA" />

            {/* Mouth & Sad Brows/Tear */}
            {activeState === 'celebrate' ? (
              <Path d="M53 71Q62 90 71 71Z" fill="#2B1B3D" />
            ) : activeState === 'sad' ? (
              <>
                <Path
                  d="M34 39Q42 35 49 38"
                  fill="none"
                  stroke="#2B1B3D"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
                <Path
                  d="M75 38Q82 35 90 39"
                  fill="none"
                  stroke="#2B1B3D"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
                <Path
                  d="M34 65C34 65 30 71 34 74C38 71 34 65 34 65Z"
                  fill="#6EC6FF"
                />
                <Path
                  d="M52 78Q62 70 72 78"
                  fill="none"
                  stroke="#2B1B3D"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <Path
                d="M52 72Q62 82 72 72"
                fill="none"
                stroke="#2B1B3D"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}

            {/* Thinking dots */}
            {activeState === 'think' && (
              <>
                <ThinkDot cx={108} cy={2} r={3} phase={0} progress={thinkProgress} />
                <ThinkDot cx={118} cy={-10} r={4.5} phase={0.2} progress={thinkProgress} />
                <ThinkDot cx={130} cy={-26} r={6.5} phase={0.4} progress={thinkProgress} />
              </>
            )}

            {/* Confused question marks */}
            {activeState === 'confused' && (
              <>
                <ConfusedMark x={-6} y={14} fontSize={18} phase={0} progress={thinkProgress} />
                <ConfusedMark x={112} y={-2} fontSize={20} phase={0.33} progress={thinkProgress} />
                <ConfusedMark x={126} y={32} fontSize={15} phase={0.66} progress={thinkProgress} />
              </>
            )}
          </AnimatedG>

          {/* Sleeping Zzz */}
          {activeState === 'sleep' && (
            <>
              <SleepZ phase={0} progress={zzzProgress} />
              <SleepZ phase={0.33} progress={zzzProgress} />
              <SleepZ phase={0.66} progress={zzzProgress} />
            </>
          )}

          {/* Split ₱ Coins */}
          {activeState === 'coins' &&
            COIN_ITEMS.map((c, idx) => (
              <SplitCoin key={idx} dx={c.dx} dy={c.dy} offset={c.delay / 3200} progress={coinProgress} />
            ))}

          {/* Peek QR Card */}
          {activeState === 'peek' && !hidePeekCard && (
            <G>
              <Rect x={-6} y={96} width={136} height={60} rx={14} fill="#FFF6EE" />
              <Rect x={10} y={106} width={18} height={18} rx={3} fill="#2B1B3D" />
              <Rect x={14} y={110} width={10} height={10} rx={1.5} fill="#FFF6EE" />
              <Rect x={17} y={113} width={4} height={4} fill="#2B1B3D" />
              <Rect x={96} y={106} width={18} height={18} rx={3} fill="#2B1B3D" />
              <Rect x={100} y={110} width={10} height={10} rx={1.5} fill="#FFF6EE" />
              <Rect x={103} y={113} width={4} height={4} fill="#2B1B3D" />
              <G fill="#2B1B3D">
                <Rect x={38} y={108} width={7} height={7} />
                <Rect x={50} y={114} width={7} height={7} />
                <Rect x={64} y={107} width={7} height={7} />
                <Rect x={78} y={114} width={7} height={7} />
                <Rect x={12} y={132} width={7} height={7} />
                <Rect x={28} y={130} width={7} height={7} />
                <Rect x={46} y={128} width={7} height={7} />
                <Rect x={62} y={134} width={7} height={7} />
                <Rect x={80} y={128} width={7} height={7} />
                <Rect x={98} y={132} width={7} height={7} />
              </G>
            </G>
          )}
        </Svg>
      </View>
    </Pressable>
  );
}

function ConfettiParticle({
  item,
  progress,
}: {
  item: (typeof CONFETTI_ITEMS)[number];
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const p = progress.value;
    const opacity = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;
    const scale = 0.4 + 0.6 * p;
    return {
      opacity: Math.max(0, opacity),
      transform: [
        { translateX: 62 + item.dx * p },
        { translateY: 30 + item.dy * p },
        { scale },
        { rotate: `${200 * p}deg` },
        { translateX: -62 },
        { translateY: -30 },
      ],
    };
  });

  return (
    <AnimatedG animatedProps={animatedProps}>
      {item.type === 'circle' ? (
        <Circle cx={62} cy={30} r={item.r} fill={item.color} />
      ) : (
        <Rect x={60} y={28} width={item.s} height={item.s} rx={2} fill={item.color} />
      )}
    </AnimatedG>
  );
}

function ThinkDot({
  cx,
  cy,
  r,
  phase,
  progress,
}: {
  cx: number;
  cy: number;
  r: number;
  phase: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const t = (progress.value + phase) % 1;
    const opacity = t < 0.5 ? t * 2 : (1 - t) * 2;
    return { opacity };
  });

  return <AnimatedCircle cx={cx} cy={cy} r={r} fill="#B9A5E8" animatedProps={animatedProps} />;
}

function ConfusedMark({
  x,
  y,
  fontSize,
  phase,
  progress,
}: {
  x: number;
  y: number;
  fontSize: number;
  phase: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const t = (progress.value + phase) % 1;
    const opacity = 0.55 + 0.45 * Math.sin(t * Math.PI);
    const dy = -4 * Math.sin(t * Math.PI);
    return {
      opacity,
      transform: [{ translateY: dy }],
    };
  });

  return (
    <AnimatedG animatedProps={animatedProps}>
      <SvgText x={x} y={y} fontSize={fontSize} fontWeight="800" fill="#B9A5E8">
        ?
      </SvgText>
    </AnimatedG>
  );
}

function SleepZ({
  phase,
  progress,
}: {
  phase: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const t = (progress.value + phase) % 1;
    const opacity = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    const scale = 0.7 + 0.6 * t;
    return {
      opacity: Math.max(0, opacity),
      transform: [
        { translateX: 104 + 16 * t },
        { translateY: 8 - 34 * t },
        { scale },
        { translateX: -104 },
        { translateY: -8 },
      ],
    };
  });

  return (
    <AnimatedG animatedProps={animatedProps}>
      <SvgText x={104} y={8} fontSize={15} fontWeight="800" fill="#B9A5E8">
        Z
      </SvgText>
    </AnimatedG>
  );
}

function SplitCoin({
  dx,
  dy,
  offset,
  progress,
}: {
  dx: number;
  dy: number;
  offset: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const t = (progress.value - offset + 1) % 1;
    let tx = 0;
    let ty = 0;
    let scale = 1;
    let opacity = 1;

    if (t < 0.12) {
      opacity = t / 0.12;
      scale = 0.3 + (1.3 * t) / 0.12;
    } else if (t < 0.3) {
      const k = (t - 0.12) / 0.18;
      ty = -6 * k;
      scale = 1.6;
    } else if (t < 0.62) {
      const k = (t - 0.3) / 0.32;
      tx = dx * k;
      ty = -6 + (dy + 6) * k;
      scale = 1.6 - 0.6 * k;
    } else if (t < 0.88) {
      tx = dx;
      ty = dy;
      scale = 1;
    } else {
      tx = dx;
      ty = dy;
      opacity = 1 - (t - 0.88) / 0.12;
    }

    return {
      opacity: Math.max(0, opacity),
      transform: [
        { translateX: 62 + tx },
        { translateY: -22 + ty },
        { scale },
        { translateX: -62 },
        { translateY: 22 },
      ],
    };
  });

  return (
    <AnimatedG animatedProps={animatedProps}>
      <Circle cx={62} cy={-22} r={9} fill="#FFC857" />
      <Circle cx={62} cy={-22} r={6.5} fill="none" stroke="#E0A526" strokeWidth={1.5} />
      <SvgText
        x={62}
        y={-18.6}
        fontSize={9}
        fontWeight="800"
        fill="#8A5A00"
        textAnchor="middle">
        ₱
      </SvgText>
    </AnimatedG>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
