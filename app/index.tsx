import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Motion, Spacing } from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { TakoMascot } from '../src/components/TakoMascot';
import { BrandWordmark } from '../src/components/NeoUI';
import { useReducedMotion } from '../src/components/MotionPrimitives';

export default function SplashScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(enterAnim, {
      toValue: 1,
      duration: reducedMotion ? 120 : Motion.durationNormal,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();

    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 1800);

    return () => {
      anim.stop();
      clearTimeout(timer);
    };
  }, [enterAnim, reducedMotion, router]);

  const scale = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [reducedMotion ? 1 : 0.96, 1],
  });

  return (
    <DotGridBackground>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue to onboarding"
        style={styles.container}
        onPress={() => router.replace('/onboarding')}
      >
        {/* Center Tako Mascot & Wordmark */}
        <Animated.View
          style={[
            styles.centerContent,
            {
              opacity: enterAnim,
              transform: [{ scale }],
            },
          ]}
        >
          <TakoMascot size={188} />
          <View style={styles.mascotShadow} />
          <View style={{ marginTop: Spacing.xl }}>
            <BrandWordmark fontSize={36} />
          </View>
          <Text style={styles.tagline}>Eight arms. One bill. Zero drama.</Text>
        </Animated.View>

        {/* Subtle Bottom Progress Dots */}
        <View style={styles.bottomDots}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: Colors.amber }]} />
          <View style={[styles.dot, { backgroundColor: Colors.mintProgress }]} />
        </View>
      </Pressable>
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
    bottom: 52,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
