import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MotionTokens } from '../constants/motion';
import { useIsScreenActive, useReducedMotion } from './MotionPrimitives';
import { triggerHaptic } from '../services/feedbackEngine';

const AnimatedG = Animated.createAnimatedComponent(G);

export type TakoState =
  | 'waiting'
  | 'happy'
  | 'counting'
  | 'empty_pockets'
  | 'empty-pockets'
  | 'celebrating'
  | 'loading'
  | 'happy_wiggle'
  | 'ink_squirt';

export interface TakoLookAt {
  x: number; // -1..1
  y: number; // -1..1
}

export interface TakoProps {
  /** Mood or action state */
  state?: TakoState;
  /** Diameter/width in px */
  size?: number;
  /** Hide tentacles when Tako is used as center head in TakoArmSplit */
  hideLegs?: boolean;
  /** Slide up from behind a card with spring overshoot on mount */
  peekIn?: boolean;
  /** Clamped eye tracking target (-1..1) */
  lookAt?: TakoLookAt | null;
  /** Increment to trigger a 480ms happy wiggle */
  wiggleKey?: number;
  /** Increment to trigger a playful ink-squirt + recoil */
  inkSquirtKey?: number;
  /** Allow tapping Tako for a wave + giggle squash-and-stretch */
  interactive?: boolean;
  /** Optional callback when Tako is tapped */
  onPress?: () => void;
  /** Pause idle loops when screen/tab is inactive or offscreen */
  isActive?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function Tako({
  state = 'happy',
  size = 120,
  hideLegs = false,
  peekIn = false,
  lookAt = null,
  wiggleKey = 0,
  inkSquirtKey = 0,
  interactive = false,
  onPress,
  isActive = true,
  style,
  accessibilityLabel = 'Tako the octopus',
}: TakoProps) {
  const reducedMotion = useReducedMotion();
  const screenActive = useIsScreenActive(isActive);
  const canLoop = screenActive && !reducedMotion;

  const normalizedState = state === 'empty-pockets' ? 'empty_pockets' : state;
  const isWaiting = normalizedState === 'waiting';
  const isCounting = normalizedState === 'counting';
  const isEmptyPockets = normalizedState === 'empty_pockets';
  const isCelebrating = normalizedState === 'celebrating';
  const isLoading = normalizedState === 'loading';
  const armsRaised = isCelebrating || normalizedState === 'happy' || normalizedState === 'happy_wiggle';

  // Container transforms (peek-in, tap squash/stretch, wiggle, ink recoil, loading float)
  const containerY = useSharedValue(peekIn && !reducedMotion ? MotionTokens.distance.peekY : 0);
  const containerX = useSharedValue(0);
  const containerScaleX = useSharedValue(1);
  const containerScaleY = useSharedValue(1);
  const containerRotate = useSharedValue(0);
  const containerOpacity = useSharedValue(peekIn && !reducedMotion ? 0.6 : 1);

  // SVG part shared values
  const headBreath = useSharedValue(1);
  const armWaveA = useSharedValue(0);
  const armWaveB = useSharedValue(0);
  const blinkScaleY = useSharedValue(1);
  const pupilX = useSharedValue(0);
  const pupilY = useSharedValue(0);
  const coinFlipX = useSharedValue(1);
  const confettiFloat = useSharedValue(0);
  const inkProgress = useSharedValue(0);
  const [tapCount, setTapCount] = useState(0);

  // 1. Peek-in entrance
  useEffect(() => {
    if (!peekIn) return;
    if (reducedMotion) {
      containerY.value = 0;
      containerOpacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
      return;
    }
    containerOpacity.value = withTiming(1, {
      duration: MotionTokens.duration.fast,
      easing: MotionTokens.easing.reanimatedOut,
    });
    containerY.value = withSpring(0, MotionTokens.spring.playful);
  }, [containerOpacity, containerY, peekIn, reducedMotion]);

  // 2. Idle breathing + arm sway (lagging slightly behind head) + loading float
  useEffect(() => {
    if (!canLoop) {
      cancelAnimation(headBreath);
      cancelAnimation(armWaveA);
      cancelAnimation(armWaveB);
      headBreath.value = withTiming(1, { duration: 150 });
      armWaveA.value = withTiming(0, { duration: 150 });
      armWaveB.value = withTiming(0, { duration: 150 });
      if (!peekIn) {
        containerY.value = withTiming(0, { duration: 150 });
        containerRotate.value = withTiming(0, { duration: 150 });
      }
      return;
    }

    const breathDuration = isWaiting ? 4200 : MotionTokens.duration.mascotBreath;
    headBreath.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: breathDuration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: breathDuration / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    // Offset arm phases so tentacles lag softly behind the head
    const armAmplitude = isCelebrating ? 9 : isWaiting ? 3.5 : 6;
    const armDuration = isCelebrating ? 1100 : isWaiting ? 3600 : 2600;
    armWaveA.value = withDelay(
      140,
      withRepeat(
        withSequence(
          withTiming(armAmplitude, {
            duration: armDuration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-armAmplitude, {
            duration: armDuration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );
    armWaveB.value = withDelay(
      320,
      withRepeat(
        withSequence(
          withTiming(-armAmplitude * 0.9, {
            duration: armDuration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(armAmplitude * 0.9, {
            duration: armDuration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        false
      )
    );

    // Loading gentle swim / float loop
    if (isLoading) {
      containerY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1100, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      containerRotate.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else if (!peekIn) {
      containerY.value = withTiming(0, { duration: 220 });
      containerRotate.value = withTiming(0, { duration: 220 });
    }

    return () => {
      cancelAnimation(headBreath);
      cancelAnimation(armWaveA);
      cancelAnimation(armWaveB);
    };
  }, [
    armWaveA,
    armWaveB,
    canLoop,
    containerRotate,
    containerY,
    headBreath,
    isCelebrating,
    isLoading,
    isWaiting,
    peekIn,
  ]);

  // 3. Random blink every 3-6 seconds
  useEffect(() => {
    if (!canLoop || isWaiting) {
      blinkScaleY.value = 1;
      return;
    }
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const nextMs =
        MotionTokens.duration.mascotBlinkMin +
        Math.random() * (MotionTokens.duration.mascotBlinkMax - MotionTokens.duration.mascotBlinkMin);
      timeoutId = setTimeout(() => {
        blinkScaleY.value = withSequence(
          withTiming(0.08, { duration: 75, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) })
        );
        scheduleBlink();
      }, nextMs);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [blinkScaleY, canLoop, isWaiting]);

  // 4. Look-at (finger/drag tracking) or soft idle eye look-around
  useEffect(() => {
    if (lookAt) {
      const tx = clamp(lookAt.x, -1, 1) * 3.4;
      const ty = clamp(lookAt.y, -1, 1) * 2.8;
      pupilX.value = withTiming(tx, { duration: 90, easing: MotionTokens.easing.reanimatedOut });
      pupilY.value = withTiming(ty, { duration: 90, easing: MotionTokens.easing.reanimatedOut });
      return;
    }
    if (!canLoop || isWaiting) {
      pupilX.value = withTiming(0, { duration: 200 });
      pupilY.value = withTiming(0, { duration: 200 });
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleGlance = () => {
      const nextMs = 2600 + Math.random() * 2800;
      timeoutId = setTimeout(() => {
        const dx = (Math.random() - 0.5) * 4.2;
        const dy = (Math.random() - 0.5) * 2.2;
        pupilX.value = withSequence(
          withTiming(dx, { duration: 240, easing: MotionTokens.easing.reanimatedOut }),
          withDelay(900, withTiming(0, { duration: 300, easing: MotionTokens.easing.reanimatedOut }))
        );
        pupilY.value = withSequence(
          withTiming(dy, { duration: 240, easing: MotionTokens.easing.reanimatedOut }),
          withDelay(900, withTiming(0, { duration: 300, easing: MotionTokens.easing.reanimatedOut }))
        );
        scheduleGlance();
      }, nextMs);
    };
    scheduleGlance();
    return () => clearTimeout(timeoutId);
  }, [canLoop, isWaiting, lookAt, pupilX, pupilY]);

  // 5. Counting mood coin flip & Celebrating confetti float
  useEffect(() => {
    if (isCounting && canLoop) {
      coinFlipX.value = withRepeat(
        withSequence(
          withTiming(0.22, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withDelay(1100, withTiming(1, { duration: 50 }))
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(coinFlipX);
      coinFlipX.value = 1;
    }

    if (isCelebrating && canLoop) {
      confettiFloat.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(confettiFloat);
      confettiFloat.value = 0;
    }
  }, [canLoop, coinFlipX, confettiFloat, isCelebrating, isCounting]);

  // 6. Happy wiggle trigger
  const playWiggle = useCallback(() => {
    if (reducedMotion) return;
    containerRotate.value = withSequence(
      withTiming(-7, { duration: 85 }),
      withTiming(7, { duration: 95 }),
      withTiming(-5, { duration: 90 }),
      withTiming(4, { duration: 85 }),
      withSpring(0, MotionTokens.spring.playful)
    );
    containerScaleX.value = withSequence(
      withTiming(1.07, { duration: 100 }),
      withTiming(0.95, { duration: 110 }),
      withSpring(1, MotionTokens.spring.playful)
    );
    containerScaleY.value = withSequence(
      withTiming(0.93, { duration: 100 }),
      withTiming(1.06, { duration: 110 }),
      withSpring(1, MotionTokens.spring.playful)
    );
  }, [containerRotate, containerScaleX, containerScaleY, reducedMotion]);

  useEffect(() => {
    if (wiggleKey > 0 || normalizedState === 'happy_wiggle') {
      playWiggle();
    }
  }, [normalizedState, playWiggle, wiggleKey]);

  // 7. Ink-squirt + recoil trigger
  useEffect(() => {
    if (inkSquirtKey <= 0 && normalizedState !== 'ink_squirt') return;
    if (reducedMotion) return;
    inkProgress.value = 0;
    inkProgress.value = withSequence(
      withTiming(1, { duration: 280, easing: MotionTokens.easing.reanimatedOut }),
      withTiming(0, { duration: 160 })
    );
    // Anticipation + recoil
    containerX.value = withSequence(
      withTiming(4, { duration: 70 }),
      withTiming(-7, { duration: 110, easing: MotionTokens.easing.reanimatedOut }),
      withSpring(0, MotionTokens.spring.bounce)
    );
    containerScaleX.value = withSequence(
      withTiming(0.92, { duration: 70 }),
      withTiming(1.08, { duration: 110 }),
      withSpring(1, MotionTokens.spring.bounce)
    );
  }, [containerScaleX, containerX, inkProgress, inkSquirtKey, normalizedState, reducedMotion]);

  // 8. Tap reaction (wave + giggle)
  const handlePress = () => {
    if (!interactive && !onPress) return;
    triggerHaptic('tick');
    setTapCount((c) => c + 1);
    if (!reducedMotion) {
      containerScaleX.value = withSequence(
        withTiming(1.09, { duration: 90, easing: MotionTokens.easing.reanimatedOut }),
        withTiming(0.94, { duration: 110 }),
        withSpring(1, MotionTokens.spring.playful)
      );
      containerScaleY.value = withSequence(
        withTiming(0.91, { duration: 90, easing: MotionTokens.easing.reanimatedOut }),
        withTiming(1.07, { duration: 110 }),
        withSpring(1, MotionTokens.spring.playful)
      );
      containerRotate.value = withSequence(
        withTiming(-5, { duration: 95 }),
        withTiming(5, { duration: 105 }),
        withSpring(0, MotionTokens.spring.playful)
      );
    }
    onPress?.();
  };

  // Animated props for SVG groups (using standard SVG transform strings for Web + Native)
  const headAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(60, 54) scale(${headBreath.value}) translate(-60, -54)`,
  }));

  const armLeftOuterProps = useAnimatedProps(() => ({
    transform: `rotate(${armWaveA.value}, 34, 68)`,
  }));

  const armLeftInnerProps = useAnimatedProps(() => ({
    transform: `rotate(${armWaveB.value * 0.7}, 50, 80)`,
  }));

  const armRightInnerProps = useAnimatedProps(() => ({
    transform: `rotate(${-armWaveB.value * 0.7}, 70, 80)`,
  }));

  const armRightOuterProps = useAnimatedProps(() => ({
    transform: `rotate(${-armWaveA.value}, 86, 68)`,
  }));

  const eyeLeftBlinkProps = useAnimatedProps(() => ({
    transform: `translate(47, 54) scale(1, ${blinkScaleY.value}) translate(-47, -54)`,
  }));

  const eyeRightBlinkProps = useAnimatedProps(() => ({
    transform: `translate(73, 54) scale(1, ${blinkScaleY.value}) translate(-73, -54)`,
  }));

  const pupilsProps = useAnimatedProps(() => ({
    transform: `translate(${pupilX.value}, ${pupilY.value})`,
  }));

  const coinProps = useAnimatedProps(() => ({
    transform: `translate(99, 98) scale(${coinFlipX.value}, 1) translate(-99, -98)`,
  }));

  const confettiProps = useAnimatedProps(() => ({
    transform: `translate(0, ${-confettiFloat.value * 5})`,
    opacity: 0.75 + confettiFloat.value * 0.25,
  }));

  const inkPuffProps = useAnimatedProps(() => ({
    opacity: inkProgress.value,
    transform: `translate(${inkProgress.value * 14 + 98}, ${-inkProgress.value * 6 + 72}) scale(${0.7 + inkProgress.value * 0.45}) translate(-98, -72)`,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [
      { translateX: containerX.value },
      { translateY: containerY.value },
      { rotate: `${containerRotate.value}deg` },
      { scaleX: containerScaleX.value },
      { scaleY: containerScaleY.value },
    ],
  }));

  const svgWidth = size;
  const svgHeight = hideLegs ? Math.round(size * (74 / 76)) : size;

  const svgContent = (
    <Animated.View style={[style, containerStyle]}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={hideLegs ? '22 12 76 74' : '0 0 120 120'}
      >
        {/* Confetti accents for celebrating mood */}
        {isCelebrating && !hideLegs && (
          <AnimatedG animatedProps={confettiProps}>
            <Circle cx={18} cy={22} r={3.5} fill="#FFB400" />
            <Circle cx={102} cy={20} r={3.5} fill="#14B87A" />
            <Rect x={24} y={36} width={5} height={5} rx={1} fill="#2F65F6" transform="rotate(20 26 38)" />
            <Rect x={96} y={34} width={5} height={5} rx={1} fill="#FFB400" transform="rotate(-18 98 36)" />
            <Circle cx={60} cy={8} r={3} fill="#14B87A" />
          </AnimatedG>
        )}

        {/* Ink puff for ink_squirt */}
        {!hideLegs && (
          <AnimatedG animatedProps={inkPuffProps}>
            <Circle cx={96} cy={70} r={5} fill="#14123A" opacity={0.82} />
            <Circle cx={106} cy={63} r={3.5} fill="#14123A" opacity={0.65} />
            <Circle cx={109} cy={74} r={2.5} fill="#2F65F6" opacity={0.75} />
          </AnimatedG>
        )}

        {/* Tentacles (each arm in its own animated group with offset phase) */}
        {!hideLegs && (
          <G>
            <AnimatedG animatedProps={armLeftOuterProps}>
              <Path
                d={armsRaised ? 'M32 64C14 54 14 34 22 26' : 'M38 72C22 88 30 106 14 104'}
                fill="none"
                stroke="#14123A"
                strokeWidth={15}
                strokeLinecap="round"
              />
              <Path
                d={armsRaised ? 'M32 64C14 54 14 34 22 26' : 'M38 72C22 88 30 106 14 104'}
                fill="none"
                stroke="#2F65F6"
                strokeWidth={9}
                strokeLinecap="round"
              />
            </AnimatedG>

            <AnimatedG animatedProps={armLeftInnerProps}>
              <Path
                d="M50 80C44 96 56 108 44 114"
                fill="none"
                stroke="#14123A"
                strokeWidth={15}
                strokeLinecap="round"
              />
              <Path
                d="M50 80C44 96 56 108 44 114"
                fill="none"
                stroke="#2F65F6"
                strokeWidth={9}
                strokeLinecap="round"
              />
            </AnimatedG>

            <AnimatedG animatedProps={armRightInnerProps}>
              <Path
                d="M70 80C76 96 64 108 76 114"
                fill="none"
                stroke="#14123A"
                strokeWidth={15}
                strokeLinecap="round"
              />
              <Path
                d="M70 80C76 96 64 108 76 114"
                fill="none"
                stroke="#2F65F6"
                strokeWidth={9}
                strokeLinecap="round"
              />
            </AnimatedG>

            <AnimatedG animatedProps={armRightOuterProps}>
              <Path
                d={armsRaised ? 'M88 64C106 54 106 34 98 26' : 'M82 72C98 88 90 106 106 104'}
                fill="none"
                stroke="#14123A"
                strokeWidth={15}
                strokeLinecap="round"
              />
              <Path
                d={armsRaised ? 'M88 64C106 54 106 34 98 26' : 'M82 72C98 88 90 106 106 104'}
                fill="none"
                stroke="#2F65F6"
                strokeWidth={9}
                strokeLinecap="round"
              />
            </AnimatedG>
          </G>
        )}

        {/* Head / Body group with slow breathing */}
        <AnimatedG animatedProps={headAnimatedProps}>
          <Path
            d="M26 56C26 28 42 16 60 16S94 28 94 56C94 74 80 82 60 82S26 74 26 56Z"
            fill="#2F65F6"
            stroke="#14123A"
            strokeWidth={3.5}
          />

          {/* Highlight & freckles */}
          <Ellipse
            cx={45}
            cy={31}
            rx={8}
            ry={4}
            fill="#FFFFFF"
            opacity={0.35}
            transform="rotate(-25 45 31)"
          />
          <Circle cx={72} cy={27} r={3.5} fill="#FFB400" />
          <Circle cx={80} cy={38} r={2.5} fill="#FFB400" />

          {/* Left Eye + Eyelid */}
          <AnimatedG animatedProps={eyeLeftBlinkProps}>
            <Circle cx={47} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
            {isWaiting ? (
              <Path d="M39 54H55" stroke="#14123A" strokeWidth={3} strokeLinecap="round" />
            ) : (
              <AnimatedG animatedProps={pupilsProps}>
                <Circle cx={49} cy={55} r={4.2} fill="#14123A" />
                <Circle cx={50.5} cy={53.5} r={1.4} fill="#FFFFFF" />
              </AnimatedG>
            )}
          </AnimatedG>

          {/* Right Eye + Eyelid */}
          <AnimatedG animatedProps={eyeRightBlinkProps}>
            <Circle cx={73} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
            {isWaiting ? (
              <Path d="M65 54H81" stroke="#14123A" strokeWidth={3} strokeLinecap="round" />
            ) : (
              <AnimatedG animatedProps={pupilsProps}>
                <Circle cx={75} cy={55} r={4.2} fill="#14123A" />
                <Circle cx={76.5} cy={53.5} r={1.4} fill="#FFFFFF" />
              </AnimatedG>
            )}
          </AnimatedG>

          {/* Cheeks */}
          <G>
            <Ellipse cx={35} cy={66} rx={5} ry={3} fill="#FF8FA3" />
            <Ellipse cx={85} cy={66} rx={5} ry={3} fill="#FF8FA3" />
          </G>

          {/* Mouth */}
          <G>
            <Path
              d={
                isEmptyPockets
                  ? 'M53 71Q60 65 67 71'
                  : tapCount > 0 && isCelebrating
                  ? 'M52 66Q60 76 68 66'
                  : 'M53 67Q60 74 67 67'
              }
              fill="none"
              stroke="#14123A"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </G>
        </AnimatedG>

        {/* Counting mood: amber coin in hand (flips) */}
        {isCounting && (
          <AnimatedG animatedProps={coinProps}>
            <Circle cx={99} cy={98} r={9} fill="#FFB400" stroke="#14123A" strokeWidth={2.5} />
            <Circle cx={99} cy={98} r={4} fill="none" stroke="#14123A" strokeWidth={1.8} />
          </AnimatedG>
        )}

        {/* Empty pockets mood: turned-out pocket flaps */}
        {isEmptyPockets && (
          <G>
            <Path d="M16 94C10 92 8 98 13 102" fill="#FFFFFF" stroke="#14123A" strokeWidth={2.2} strokeLinecap="round" />
            <Path d="M104 94C110 92 112 98 107 102" fill="#FFFFFF" stroke="#14123A" strokeWidth={2.2} strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );

  if (interactive || onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
      >
        {svgContent}
      </Pressable>
    );
  }

  return svgContent;
}
