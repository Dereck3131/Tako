import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface FieldErrorProps {
  message?: string | null;
  style?: object;
}

/**
 * Unified, accessible inline error message using the single destructive token.
 */
export function FieldError({ message, style }: FieldErrorProps) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();

  if (!message) return null;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(160)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.row, style]}>
      <Ionicons name="alert-circle-outline" size={14} color={palette.destructive} />
      <Text
        style={[
          styles.text,
          { color: palette.destructive, fontFamily: TakoFonts.bold },
        ]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  text: {
    fontSize: 12,
    flexShrink: 1,
    lineHeight: 16,
  },
});
