import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../src/constants/theme';
import { MotionTokens } from '../src/constants/motion';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { Tako } from '../src/components/Tako';
import { BrandWordmark } from '../src/components/NeoUI';
import { useIsScreenActive, useReducedMotion } from '../src/components/MotionPrimitives';

function CoinGlyph({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={Colors.amber} stroke={Colors.ink} strokeWidth={2} />
      <Circle cx={12} cy={12} r={4.5} fill="none" stroke={Colors.ink} strokeWidth={1.6} />
    </Svg>
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const isActive = useIsScreenActive();

  const takoY = useSharedValue(reducedMotion ? 0 : 28);
  const takoScale = useSharedValue(reducedMotion ? 1 : 0.92);
  const takoOpacity = useSharedValue(0);

  const coinLeftOpacity = useSharedValue(0);
  const coinLeftY = useSharedValue(0);
  const coinRightOpacity = useSharedValue(0);
  const coinRightY = useSharedValue(0);

  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(reducedMotion ? 0 : 10);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      takoOpacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
      wordmarkOpacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
      coinLeftOpacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
      coinRightOpacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
    } else {
      // 1. Tako rises in with a spring bounce
      takoOpacity.value = withTiming(1, {
        duration: MotionTokens.duration.normal,
        easing: MotionTokens.easing.reanimatedOut,
      });
      takoY.value = withSpring(0, MotionTokens.spring.playful);
      takoScale.value = withSpring(1, MotionTokens.spring.playful);

      // 2. Coins pop in & float
      coinLeftOpacity.value = withDelay(
        180,
        withTiming(1, { duration: 200, easing: MotionTokens.easing.reanimatedOut })
      );
      coinRightOpacity.value = withDelay(
        260,
        withTiming(1, { duration: 200, easing: MotionTokens.easing.reanimatedOut })
      );

      // 3. Wordmark fades up with slight overlap
      wordmarkOpacity.value = withDelay(
        140,
        withTiming(1, { duration: MotionTokens.duration.normal, easing: MotionTokens.easing.reanimatedOut })
      );
      wordmarkY.value = withDelay(
        140,
        withTiming(0, { duration: MotionTokens.duration.slow, easing: MotionTokens.easing.reanimatedOut })
      );
    }

    const handoffTimer = setTimeout(() => {
      screenOpacity.value = withTiming(0, {
        duration: MotionTokens.duration.exitFast,
        easing: MotionTokens.easing.reanimatedOut,
      });
    }, 1620);

    const navTimer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1800);

    return () => {
      clearTimeout(handoffTimer);
      clearTimeout(navTimer);
    };
  }, [
    coinLeftOpacity,
    coinRightOpacity,
    reducedMotion,
    router,
    screenOpacity,
    takoOpacity,
    takoScale,
    takoY,
    wordmarkOpacity,
    wordmarkY,
  ]);

  useEffect(() => {
    if (reducedMotion || !isActive) return;
    coinLeftY.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(2, { duration: 1100, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    coinRightY.value = withDelay(
      450,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [coinLeftY, coinRightY, isActive, reducedMotion]);

  const takoStyle = useAnimatedStyle(() => ({
    opacity: takoOpacity.value,
    transform: [{ translateY: takoY.value }, { scale: takoScale.value }],
  }));

  const coinLeftStyle = useAnimatedStyle(() => ({
    opacity: coinLeftOpacity.value,
    transform: [{ translateY: coinLeftY.value }],
  }));

  const coinRightStyle = useAnimatedStyle(() => ({
    opacity: coinRightOpacity.value,
    transform: [{ translateY: coinRightY.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const rootStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <DotGridBackground>
      <Animated.View style={[{ flex: 1 }, rootStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to onboarding"
          style={styles.container}
          onPress={() => router.replace('/onboarding')}
        >
          <View style={styles.centerContent}>
            <View style={styles.mascotStage}>
              <Animated.View style={[styles.coinLeft, coinLeftStyle]} pointerEvents="none">
                <CoinGlyph size={24} />
              </Animated.View>
              <Animated.View style={[styles.coinRight, coinRightStyle]} pointerEvents="none">
                <CoinGlyph size={20} />
              </Animated.View>

              <Animated.View style={takoStyle}>
                <Tako state="happy" size={188} isActive={isActive} />
              </Animated.View>
            </View>

            <View style={styles.mascotShadow} />

            <Animated.View style={[{ alignItems: 'center' }, wordmarkStyle]}>
              <View style={{ marginTop: Spacing.xl }}>
                <BrandWordmark fontSize={36} />
              </View>
              <Text style={styles.tagline}>Eight arms. One bill. Zero drama.</Text>
            </Animated.View>
          </View>

          <View style={styles.bottomDots}>
            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: Colors.amber }]} />
            <View style={[styles.dot, { backgroundColor: Colors.mintProgress }]} />
          </View>
        </Pressable>
      </Animated.View>
    </DotGridBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
  },
  mascotStage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinLeft: {
    position: 'absolute',
    left: -14,
    top: 26,
  },
  coinRight: {
    position: 'absolute',
    right: -10,
    top: 46,
  },
  mascotShadow: {
    width: 112,
    height: 10,
    borderRadius: 56,
    backgroundColor: 'rgba(20, 18, 58, 0.08)',
    marginTop: -4,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  bottomDots: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
