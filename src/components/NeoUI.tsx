import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  Border,
  Colors,
  Motion,
  Radii,
  Shadows,
  TouchTarget,
} from '../constants/theme';

interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  shadowColor?: string;
  shadowOffset?: number;
  borderRadius?: number;
  borderColor?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function NeoCard({
  children,
  style,
  contentStyle,
  backgroundColor = Colors.card,
  shadowColor = Colors.ink,
  shadowOffset = 4,
  borderRadius = Radii.card,
  borderColor = Colors.ink,
  onPress,
  accessibilityLabel,
}: NeoCardProps) {
  const renderCard = (pressed: boolean) => (
    <View
      style={[
        styles.wrapper,
        Shadows.card,
        pressed && { transform: [{ scale: Motion.pressScale }] },
        style,
      ]}
    >
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: shadowColor,
            borderRadius,
            top: shadowOffset,
            left: shadowOffset,
            right: -shadowOffset,
            bottom: -shadowOffset,
          },
        ]}
      />
      <View
        style={[
          styles.surface,
          {
            backgroundColor,
            borderRadius,
            borderColor,
            borderWidth: Border.width,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
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
  shadowColor?: string;
  shadowOffset?: number;
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
  shadowColor = Colors.ink,
  shadowOffset = 3,
  height = 54,
  fontSize = 17,
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}: NeoButtonProps) {
  const effectiveHeight = Math.max(height, TouchTarget.minSize);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.wrapper, disabled && styles.disabled, style]}
    >
      {({ pressed }) => {
        const activePress = pressed && !disabled;
        const shift = activePress ? shadowOffset : 0;
        return (
          <View
            style={[
              Shadows.button,
              activePress && { transform: [{ scale: Motion.pressScale }] },
            ]}
          >
            <View
              style={[
                styles.shadow,
                {
                  backgroundColor: shadowColor,
                  borderRadius: Radii.pill,
                  top: shadowOffset,
                  left: shadowOffset,
                  right: -shadowOffset,
                  bottom: -shadowOffset,
                },
              ]}
            />
            <View
              style={[
                styles.buttonSurface,
                {
                  height: effectiveHeight,
                  backgroundColor,
                  borderRadius: Radii.pill,
                  transform: [{ translateX: shift }, { translateY: shift }],
                },
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
            </View>
          </View>
        );
      }}
    </Pressable>
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
        fontWeight: '800',
        letterSpacing: fontSize > 30 ? -1.5 : -0.4,
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
  wrapper: {
    position: 'relative',
  },
  disabled: {
    opacity: 0.65,
  },
  shadow: {
    position: 'absolute',
  },
  surface: {
    position: 'relative',
    overflow: 'hidden',
  },
  buttonSurface: {
    borderWidth: Border.width,
    borderColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
