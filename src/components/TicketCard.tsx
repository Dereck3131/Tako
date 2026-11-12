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
    <View style={[styles.wrapper, Shadows.card, style]}>
      {/* Hard offset shadow */}
      <View style={styles.shadow} />

      <View style={styles.card}>
        <View style={[styles.topSection, topStyle]}>{childrenTop}</View>

        {/* Perforated dashed divider with side notches */}
        <View style={styles.dividerRow}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.notchRight} />
        </View>

        <View style={[styles.bottomSection, bottomStyle]}>{childrenBottom}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: Radii.card,
    backgroundColor: Colors.ink,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    overflow: 'hidden',
  },
  topSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 0,
  },
  dividerRow: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    marginHorizontal: 14,
  },
  notchLeft: {
    position: 'absolute',
    left: -12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.background,
    borderWidth: Border.width,
    borderColor: Colors.ink,
  },
  notchRight: {
    position: 'absolute',
    right: -12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.background,
    borderWidth: Border.width,
    borderColor: Colors.ink,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 0,
  },
});
