import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radii } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated loading placeholder that respects Reduce Motion.
 */
export function Skeleton({
  width = '100%',
  height,
  borderRadius = Radii.md,
  style,
}: SkeletonProps) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.65);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.75, { duration: 750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.55 : opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: palette.chip,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton card matching split/activity list rows.
 */
export function SplitRowSkeleton() {
  const { palette } = useTakoTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}>
      <Skeleton width={46} height={46} borderRadius={23} />
      <View style={styles.mid}>
        <Skeleton width="62%" height={15} borderRadius={8} />
        <Skeleton width="40%" height={12} borderRadius={6} />
      </View>
      <View style={styles.right}>
        <Skeleton width={64} height={16} borderRadius={8} />
        <Skeleton width={52} height={18} borderRadius={9} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  mid: {
    flex: 1,
    gap: 8,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
});
