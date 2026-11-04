import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'emerald' | 'amber' | 'blue' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'amber' }) => {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return { bg: Colors.emeraldLight, text: Colors.emerald };
      case 'amber':
        return { bg: Colors.amberLight, text: Colors.amber };
      case 'blue':
        return { bg: Colors.primaryLight, text: Colors.primary };
      case 'gray':
      default:
        return { bg: '#F1F5F9', text: Colors.textSecondary };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
