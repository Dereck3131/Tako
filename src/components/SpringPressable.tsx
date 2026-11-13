import React, { useEffect, useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SpringPressableProps extends PressableProps {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Interruptible UI-thread spring press feedback (scale 0.97 by default).
 */
export function SpringPressable({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: SpringPressableProps) {
  const reducedMotion = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withSpring(
      isPressed && !disabled ? scaleTo : 1,
      isPressed ? { damping: 18, stiffness: 360 } : { damping: 16, stiffness: 320 }
    );
  }, [disabled, isPressed, reducedMotion, scale, scaleTo]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        setIsPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setIsPressed(false);
        onPressOut?.(e);
      }}
      style={[animStyle, style]}>
      {children}
    </AnimatedPressable>
  );
}
