import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, ViewStyle } from 'react-native';
import { Motion } from '../constants/theme';

const EASE_OUT_BEZIER = Easing.bezier(0.23, 1, 0.32, 1);

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(Boolean(enabled));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      if (mounted) setReduced(Boolean(enabled));
    });

    let mql: MediaQueryList | null = null;
    const onWebChange = (e: MediaQueryListEvent) => {
      if (mounted) setReduced(e.matches);
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql.matches) setReduced(true);
      mql.addEventListener?.('change', onWebChange);
    }

    return () => {
      mounted = false;
      sub?.remove?.();
      mql?.removeEventListener?.('change', onWebChange);
    };
  }, []);

  return reduced;
}

interface StaggerItemProps {
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
  distance?: number;
}

/**
 *GPU-only (opacity + transform) staggered entrance.
 * Caps stagger at 5 items so long lists never queue behind earlier items.
 * Never animates from scale(0); uses scale(0.97) -> 1.
 */
export function StaggerItem({
  index = 0,
  children,
  style,
  distance = 10,
}: StaggerItemProps) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cappedDelay = reducedMotion ? 0 : Math.min(index, 5) * Motion.staggerMs;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 140 : Motion.durationNormal,
      delay: cappedDelay,
      easing: EASE_OUT_BEZIER,
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();
    return () => anim.stop();
  }, [index, progress, reducedMotion]);

  const opacity = progress;
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [reducedMotion ? 0 : distance, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [reducedMotion ? 1 : 0.97, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
