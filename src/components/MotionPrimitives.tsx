import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  AppStateStatus,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MotionTokens } from '../constants/motion';
import { Colors, Radii, Shadows } from '../constants/theme';

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

/**
 * Tracks whether the app/tab is currently active and visible so idle loops
 * pause when the screen is hidden, backgrounded, or off-screen.
 */
export function useIsScreenActive(isFocused = true): boolean {
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');
  const [docVisible, setDocVisible] = useState(() =>
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? document.visibilityState !== 'hidden'
      : true
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      setAppActive(nextState === 'active');
    });

    const onVisibility = () => {
      if (typeof document !== 'undefined') {
        setDocVisible(document.visibilityState !== 'hidden');
      }
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      sub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, []);

  return isFocused && appActive && docVisible;
}

interface StaggerItemProps {
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
  distance?: number;
  baseDelayMs?: number;
}

/**
 * GPU-only (opacity + transform) staggered entrance on the UI thread via Reanimated.
 * Uses decaying organic stagger (not uniform metronome) and caps at 5 items.
 * Never animates from scale(0); uses scale(0.97) -> 1.
 */
export function StaggerItem({
  index = 0,
  children,
  style,
  distance = MotionTokens.distance.enterY,
  baseDelayMs = 0,
}: StaggerItemProps) {
  const reducedMotion = useReducedMotion();
  const clampedIdx = Math.min(Math.max(index, 0), MotionTokens.stagger.maxItems);
  // Decaying stagger curve: 0, 44, 80, 110, 134, 152ms (organic, never sluggish)
  const organicDelay =
    clampedIdx === 0
      ? 0
      : Math.round(clampedIdx * MotionTokens.stagger.itemMs - clampedIdx * clampedIdx * 2);
  const totalDelay = reducedMotion ? 0 : baseDelayMs + organicDelay;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      totalDelay,
      withTiming(1, {
        duration: reducedMotion ? MotionTokens.duration.reducedFade : MotionTokens.duration.normal,
        easing: MotionTokens.easing.reanimatedOut,
      })
    );
  }, [progress, reducedMotion, totalDelay]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    if (reducedMotion) {
      return { opacity: p };
    }
    return {
      opacity: p,
      transform: [
        { translateY: (1 - p) * distance },
        { scale: 0.97 + p * 0.03 },
      ],
    };
  });

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  style?: TextStyle | TextStyle[];
  durationMs?: number;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

/**
 * Smoothly counts between numeric values with tabular-nums so digits never jitter.
 * Respects reducedMotion (snaps immediately).
 */
export function AnimatedNumber({
  value,
  formatter,
  style,
  durationMs = 280,
  numberOfLines = 1,
  adjustsFontSizeToFit,
  minimumFontScale,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = React.useRef(value);

  useEffect(() => {
    const startVal = prevRef.current;
    if (startVal === value) return;
    if (reducedMotion) {
      prevRef.current = value;
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Cubic ease-out matching (0.23, 1, 0.32, 1) feel
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(startVal + (value - startVal) * eased);
      setDisplayValue(next);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        prevRef.current = value;
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      prevRef.current = value;
    };
  }, [durationMs, reducedMotion, value]);

  return (
    <Text
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
    >
      {formatter(displayValue)}
    </Text>
  );
}

interface PopInProps {
  children: React.ReactNode;
  triggerKey?: string | number | boolean;
  style?: ViewStyle;
}

/**
 * Subtle pop-in (0.92 -> 1.03 -> 1) for status chips like "Paid" or new friend joins.
 */
export function PopIn({ children, triggerKey, style }: PopInProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : MotionTokens.scale.popFrom);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: MotionTokens.duration.reducedFade });
      return;
    }
    scale.value = MotionTokens.scale.popFrom;
    opacity.value = 0;
    opacity.value = withTiming(1, {
      duration: MotionTokens.duration.fast,
      easing: MotionTokens.easing.reanimatedOut,
    });
    scale.value = withSequence(
      withTiming(1.04, {
        duration: 150,
        easing: MotionTokens.easing.reanimatedOut,
      }),
      withSpring(1, MotionTokens.spring.settle)
    );
  }, [opacity, reducedMotion, scale, triggerKey]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

interface DraggableBottomSheetProps {
  children: React.ReactNode;
  onDismiss: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * Spring-driven bottom sheet with 1:1 drag-to-dismiss and velocity handoff.
 * Symmetric enter/exit along translateY; backdrop fades smoothly.
 */
export function DraggableBottomSheet({
  children,
  onDismiss,
  style,
  accessibilityLabel = 'Close modal',
}: DraggableBottomSheetProps) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(reducedMotion ? 0 : 48);
  const backdropOpacity = useSharedValue(0);
  const closingRef = React.useRef(false);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, {
      duration: reducedMotion ? MotionTokens.duration.reducedFade : MotionTokens.duration.normal,
      easing: MotionTokens.easing.reanimatedOut,
    });
    if (reducedMotion) {
      translateY.value = 0;
    } else {
      translateY.value = withSpring(0, MotionTokens.spring.sheet);
    }
  }, [backdropOpacity, reducedMotion, translateY]);

  const handleClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    backdropOpacity.value = withTiming(0, {
      duration: MotionTokens.duration.exitFast,
      easing: MotionTokens.easing.reanimatedOut,
    });
    if (reducedMotion) {
      onDismiss();
      return;
    }
    translateY.value = withTiming(
      420,
      {
        duration: MotionTokens.duration.exitFast,
        easing: MotionTokens.easing.reanimatedOut,
      },
      (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }
    );
  }, [backdropOpacity, onDismiss, reducedMotion, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      } else {
        // Gentle rubber-banding upward
        translateY.value = e.translationY * 0.18;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 520) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, {
          ...MotionTokens.spring.sheet,
          velocity: e.velocityY,
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={sheetStyles.root}>
      <Animated.View style={[sheetStyles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[sheetStyles.sheet, Shadows.hero, style, sheetStyle]}>
          <View style={sheetStyles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(20, 18, 58, 0.42)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
    maxHeight: '90%',
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
