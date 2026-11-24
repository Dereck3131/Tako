import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SpringPressable } from '@/components/SpringPressable';
import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified WCAG-AA primary pill CTA button with spring scale(0.97) press feedback.
 */
export function PrimaryButton({
  label,
  onPress,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: PrimaryButtonProps) {
  const { palette } = useTakoTheme();
  const isDisabled = disabled || loading;

  return (
    <SpringPressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.btn,
        {
          backgroundColor: isDisabled ? palette.chip : palette.ctaBg,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.ctaInk} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={isDisabled ? palette.mute : palette.ctaInk}
            />
          )}
          <Text
            style={[
              styles.label,
              {
                color: isDisabled ? palette.mute : palette.ctaInk,
                fontFamily: TakoFonts.bold,
              },
            ]}>
            {label}
          </Text>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={18}
              color={isDisabled ? palette.mute : palette.ctaInk}
            />
          )}
        </>
      )}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radii.pill,
  },
  label: {
    fontSize: 16,
  },
});
