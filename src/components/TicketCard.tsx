import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Border, Colors, Radii, Shadows } from '../constants/theme';

interface TicketCardProps {
  childrenTop: React.ReactNode;
  childrenBottom: React.ReactNode;
  style?: ViewStyle;
  topStyle?: ViewStyle;
  bottomStyle?: ViewStyle;
}

export function TicketCard({
  childrenTop,
  childrenBottom,
  style,
  topStyle,
  bottomStyle,
}: TicketCardProps) {
  return (
    <View style={[styles.card, Shadows.card, style]}>
      <View style={[styles.topSection, topStyle]}>{childrenTop}</View>

      {/* Perforated dashed divider with hairline half-circle notches */}
      <View style={styles.dividerRow}>
        <View style={styles.notchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.notchRight} />
      </View>

      <View style={[styles.bottomSection, bottomStyle]}>{childrenBottom}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: Border.width,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  topSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 0,
  },
  dividerRow: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderDashed,
    marginHorizontal: 14,
  },
  notchLeft: {
    position: 'absolute',
    left: -11,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: Border.width,
    borderColor: Colors.border,
  },
  notchRight: {
    position: 'absolute',
    right: -11,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: Border.width,
    borderColor: Colors.border,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 0,
  },
});
