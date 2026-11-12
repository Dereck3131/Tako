import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Border, Colors, Radii } from '../constants/theme';

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
        return Colors.amber;
      case 'blue':
        return Colors.primary;
      case 'dark':
        return Colors.ink;
      case 'neutral':
      default:
        return Colors.card;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'blue':
      case 'dark':
        return Colors.textWhite;
      default:
        return Colors.ink;
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
    borderWidth: Border.chipWidth,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
