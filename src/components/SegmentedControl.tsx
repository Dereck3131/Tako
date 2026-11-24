import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified segmented control (elevated white thumb on chip track).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { palette, isDark } = useTakoTheme();

  return (
    <View style={[styles.track, { backgroundColor: palette.chip }, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (opt.key !== value) {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync().catch(() => {});
                }
                onChange(opt.key);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              styles.thumb,
              active && [
                styles.thumbActive,
                { backgroundColor: palette.surface },
                !isDark && styles.thumbShadow,
              ],
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? palette.ink : palette.mute,
                  fontFamily: TakoFonts.bold,
                },
              ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radii.pill,
  },
  thumb: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbActive: {},
  thumbShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 6px rgba(43, 27, 61, 0.08)' },
  }),
  label: {
    fontSize: 13,
  },
});
