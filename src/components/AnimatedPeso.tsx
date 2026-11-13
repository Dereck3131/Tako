import React, { useEffect, useRef, useState } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { formatPeso } from '@/constants/theme';

interface AnimatedPesoProps {
  cents: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * Smoothly animates peso amounts over 200ms ease-out when value changes.
 */
export function AnimatedPeso({ cents, style, numberOfLines }: AnimatedPesoProps) {
  const reducedMotion = useReducedMotion();
  const [displayCents, setDisplayCents] = useState(cents);
  const prevCentsRef = useRef(cents);
  const popScale = useSharedValue(1);

  useEffect(() => {
    const start = prevCentsRef.current;
    const end = cents;
    if (start === end) return;
    prevCentsRef.current = end;

    if (reducedMotion) {
      return;
    }

    popScale.value = 0.96;
    popScale.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });

    const duration = 200;
    const startTime = Date.now();
    let rafId = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCents(Math.round(start + (end - start) * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cents, popScale, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value }],
  }));

  return (
    <Animated.Text style={[style, animStyle]} numberOfLines={numberOfLines}>
      {formatPeso(reducedMotion ? cents : displayCents)}
    </Animated.Text>
  );
}
