import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radii, Typography } from '../constants/theme';

export type BadgeVariant = 'emerald' | 'amber' | 'blue' | 'neutral' | 'dark';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const getBg = () => {
    switch (variant) {
      case 'emerald':
        return Colors.mint;
      case 'amber':
        return Colors.amberLight;
      case 'blue':
        return Colors.primaryLight;
      case 'dark':
        return Colors.ink;
      case 'neutral':
      default:
        return Colors.surfaceSubtle;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'emerald':
        return Colors.mintText;
      case 'amber':
        return Colors.amberText;
      case 'blue':
        return Colors.primary;
      case 'dark':
        return Colors.textWhite;
      case 'neutral':
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <View style={[styles.chip, { backgroundColor: getBg() }, style]}>
      <Text numberOfLines={1} style={[styles.label, { color: getTextColor() }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: '100%',
  },
  label: {
    ...Typography.tabular,
    fontSize: 12,
    fontWeight: '600',
  },
});
