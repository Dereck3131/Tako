import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Border,
  Colors,
  Motion,
  Radii,
  Shadows,
  Spacing,
  TouchTarget,
} from '../constants/theme';
import { MotionTokens } from '../constants/motion';
import { useReducedMotion } from './MotionPrimitives';

interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  noBorder?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function NeoCard({
  children,
  style,
  contentStyle,
  backgroundColor = Colors.card,
  borderRadius = Radii.card,
  borderColor = Colors.border,
  noBorder = false,
  elevated = false,
  onPress,
  accessibilityLabel,
}: NeoCardProps) {
  const renderCard = (pressed: boolean) => (
    <View
      style={[
        elevated ? Shadows.hero : Shadows.card,
        {
          backgroundColor,
          borderRadius,
          borderColor,
          borderWidth: noBorder ? 0 : Border.width,
          overflow: 'hidden',
        },
        pressed && { transform: [{ scale: Motion.pressScale }] },
        style,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={4}
      >
        {({ pressed }) => renderCard(pressed)}
      </Pressable>
    );
  }

  return renderCard(false);
}

interface NeoButtonProps {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  height?: number;
  fontSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function NeoButton({
  label,
  children,
  onPress,
  backgroundColor = Colors.primary,
  textColor = Colors.textWhite,
  borderColor,
  height = 50,
  fontSize = 15,
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}: NeoButtonProps) {
  const effectiveHeight = Math.max(height, TouchTarget.minSize);
  const isLight =
    backgroundColor === '#FFFFFF' ||
    backgroundColor === Colors.card ||
    backgroundColor === Colors.primaryLight ||
    backgroundColor === Colors.surfaceSubtle;
  const resolvedBorderColor =
    borderColor ?? (isLight ? Colors.border : 'transparent');
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || reducedMotion) return;
    scale.value = withTiming(MotionTokens.scale.press, {
      duration: MotionTokens.duration.press,
      easing: MotionTokens.easing.reanimatedOut,
    });
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(1, {
      duration: MotionTokens.duration.fast,
      easing: MotionTokens.easing.reanimatedOut,
    });
  };

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={[
          styles.buttonBase,
          !isLight && Shadows.button,
          isLight && Shadows.cardSoft,
          {
            height: effectiveHeight,
            backgroundColor,
            borderRadius: Radii.pill,
            borderWidth: resolvedBorderColor === 'transparent' ? 0 : Border.width,
            borderColor: resolvedBorderColor,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        {children ?? (
          <Text
            numberOfLines={1}
            style={[
              styles.buttonText,
              { color: textColor, fontSize },
              textStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface NeoInputProps extends TextInputProps {
  label: string;
}

export function NeoInput({ label, style, ...props }: NeoInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor="#918EB0"
        style={[
          styles.input,
          focused && styles.inputFocused,
          style,
        ]}
      />
    </View>
  );
}

interface BrandWordmarkProps {
  fontSize?: number;
  onDark?: boolean;
}

export function BrandWordmark({ fontSize = 16, onDark = false }: BrandWordmarkProps) {
  return (
    <Text
      style={{
        fontSize,
        fontWeight: '700',
        letterSpacing: fontSize > 30 ? -1 : -0.3,
        color: onDark ? Colors.textWhite : Colors.ink,
      }}
    >
      Tab
      <Text style={{ color: onDark ? Colors.textWhite : Colors.primary }}>
        Together
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  inputGroup: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: 6,
  },
  input: {
    minHeight: 50,
    borderWidth: Border.width,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.ink,
    backgroundColor: Colors.card,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
});
