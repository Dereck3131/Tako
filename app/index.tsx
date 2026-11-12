import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Border, Colors, Motion } from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { TakoMascot } from '../src/components/TakoMascot';
import { BrandWordmark } from '../src/components/NeoUI';
import { useReducedMotion } from '../src/components/MotionPrimitives';

function FloatingCoin({
  style,
  rotate,
}: {
  style: object;
  rotate: string;
}) {
  return (
    <View style={[styles.coinWrap, style, { transform: [{ rotate }] }]} pointerEvents="none">
      <View style={styles.coinShadow} />
      <View style={styles.coin}>
        <Text style={styles.coinText}>$</Text>
      </View>
    </View>
  );
}

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
    outputRange: [reducedMotion ? 1 : 0.95, 1],
  });

  return (
    <DotGridBackground>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue to onboarding"
        style={styles.container}
        onPress={() => router.replace('/onboarding')}
      >
        {/* 4 Floating $ Coins */}
        <FloatingCoin style={{ left: 40, top: 96 }} rotate="-14deg" />
        <FloatingCoin style={{ right: 46, top: 150 }} rotate="12deg" />
        <FloatingCoin style={{ left: 64, bottom: 170 }} rotate="10deg" />
        <FloatingCoin style={{ right: 60, bottom: 120 }} rotate="-8deg" />

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
          <TakoMascot size={230} />
          <View style={styles.mascotShadow} />
          <View style={{ marginTop: 22 }}>
            <BrandWordmark fontSize={42} />
          </View>
          <Text style={styles.tagline}>Eight arms. One bill. Zero drama.</Text>
        </Animated.View>

        {/* Bottom 3 Dots */}
        <View style={styles.bottomDots}>
          <View style={[styles.dot, { backgroundColor: Colors.ink }]} />
          <View style={[styles.dot, { backgroundColor: Colors.amber }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
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
  },
  coinWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  coinShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 22,
    backgroundColor: Colors.ink,
  },
  coin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.amber,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
  },
  centerContent: {
    alignItems: 'center',
  },
  mascotShadow: {
    width: 150,
    height: 14,
    borderRadius: 75,
    backgroundColor: 'rgba(20, 18, 58, 0.16)',
    marginTop: -6,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textBody,
    marginTop: 6,
  },
  bottomDots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: Border.width,
    borderColor: Colors.ink,
  },
});
