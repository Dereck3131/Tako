import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AmbientGlow } from '@/components/AmbientGlow';
import { TakoMascot } from '@/components/TakoMascot';
import { TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface TakoSplashProps {
  onFinish?: () => void;
  autoDismissMs?: number;
}

const LETTERS = ['t', 'a', 'k', 'o'] as const;

export function TakoSplash({ onFinish, autoDismissMs = 3100 }: TakoSplashProps) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();

  const overlayOpacity = useSharedValue(1);
  const takoX = useSharedValue(reducedMotion ? 0 : 140);
  const takoY = useSharedValue(reducedMotion ? 0 : -20);
  const takoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const takoScaleX = useSharedValue(1);
  const takoScaleY = useSharedValue(1);
  const oPressY = useSharedValue(0);
  const oPressScaleY = useSharedValue(1);
  const tagOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const tagY = useSharedValue(reducedMotion ? 0 : 8);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => {
        onFinish?.();
      }, 900);
      return () => clearTimeout(t);
    }

    // Tako parabolic jump from right onto the "o" at 950ms
    takoOpacity.value = withDelay(950, withTiming(1, { duration: 90 }));
    takoX.value = withDelay(950, withTiming(0, { duration: 760, easing: Easing.linear }));
    takoY.value = withDelay(
      950,
      withSequence(
        withTiming(-95, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) })
      )
    );

    // Squash & stretch on landing at 1710ms
    takoScaleX.value = withDelay(
      1710,
      withSequence(
        withTiming(1.14, { duration: 90 }),
        withTiming(0.94, { duration: 150 }),
        withTiming(1.02, { duration: 120 }),
        withTiming(1, { duration: 120 })
      )
    );
    takoScaleY.value = withDelay(
      1710,
      withSequence(
        withTiming(0.86, { duration: 90 }),
        withTiming(1.08, { duration: 150 }),
        withTiming(0.98, { duration: 120 }),
        withTiming(1, { duration: 120 })
      )
    );

    // "o" letter press on landing
    oPressY.value = withDelay(
      1710,
      withSequence(withTiming(4, { duration: 120 }), withTiming(0, { duration: 220 }))
    );
    oPressScaleY.value = withDelay(
      1710,
      withSequence(withTiming(0.95, { duration: 120 }), withTiming(1, { duration: 220 }))
    );

    // Tagline fade in at 2100ms
    tagOpacity.value = withDelay(2100, withTiming(1, { duration: 550 }));
    tagY.value = withDelay(2100, withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) }));

    const dismissTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 320 });
      setTimeout(() => onFinish?.(), 330);
    }, autoDismissMs);

    return () => clearTimeout(dismissTimer);
  }, [
    autoDismissMs,
    onFinish,
    overlayOpacity,
    oPressScaleY,
    oPressY,
    reducedMotion,
    tagOpacity,
    tagY,
    takoOpacity,
    takoScaleX,
    takoScaleY,
    takoX,
    takoY,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const takoStyle = useAnimatedStyle(() => ({
    opacity: takoOpacity.value,
    transform: [
      { translateX: takoX.value },
      { translateY: takoY.value },
      { scaleX: takoScaleX.value },
      { scaleY: takoScaleY.value },
    ],
  }));

  const oStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: oPressY.value }, { scaleY: oPressScaleY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: palette.bg },
        overlayStyle,
      ]}>
      {/* Warm ambient glow */}
      <AmbientGlow size={420} />

      <View style={styles.center}>
        <View style={styles.wordRow}>
          {LETTERS.map((char, index) => (
            <SplashLetter
              key={char}
              char={char}
              index={index}
              color={palette.ink}
              reducedMotion={reducedMotion}
              isO={char === 'o'}
              oStyle={oStyle}
              takoStyle={takoStyle}
            />
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            { color: palette.mute, fontFamily: TakoFonts.bold },
            tagStyle,
          ]}>
          SPLIT THE BILL. KEEP THE FRIENDS.
        </Animated.Text>
      </View>

      {onFinish && (
        <Pressable
          onPress={onFinish}
          style={[styles.skipBtn, { backgroundColor: palette.chip }]}>
          <Text style={[styles.skipText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
            Skip
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function SplashLetter({
  char,
  index,
  color,
  reducedMotion,
  isO,
  oStyle,
  takoStyle,
}: {
  char: string;
  index: number;
  color: string;
  reducedMotion: boolean;
  isO: boolean;
  oStyle: ReturnType<typeof useAnimatedStyle>;
  takoStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 36);
  const scale = useSharedValue(reducedMotion ? 1 : 0.82);

  useEffect(() => {
    if (reducedMotion) return;
    const delay = 140 + index * 115;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 11, stiffness: 180 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 190 }));
  }, [index, opacity, reducedMotion, scale, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.letterWrap, animStyle]}>
      {isO && (
        <Animated.View style={[styles.perch, takoStyle]}>
          <TakoMascot state="wave" size={84} interactive={false} />
        </Animated.View>
      )}
      <Animated.View style={isO ? oStyle : undefined}>
        <Text
          style={[
            styles.letter,
            { color, fontFamily: TakoFonts.black },
          ]}>
          {char}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.65,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 44,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  letterWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  perch: {
    position: 'absolute',
    bottom: 58,
    left: -6,
    zIndex: 10,
  },
  letter: {
    fontSize: 96,
    lineHeight: 102,
    letterSpacing: -4,
  },
  tagline: {
    marginTop: 18,
    fontSize: 13,
    letterSpacing: 2,
    textAlign: 'center',
  },
  skipBtn: {
    position: 'absolute',
    bottom: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 14,
  },
});
