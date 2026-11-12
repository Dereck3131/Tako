import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

interface DotGridBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Soft & Clean canvas surface (#F6F7FB).
 * Keeps the component name for drop-in compatibility while removing the chunky dot grid.
 */
export function DotGridBackground({ children, style }: DotGridBackgroundProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
