import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii } from '../constants/theme';

interface TicketCardProps {
  childrenTop: React.ReactNode;
  childrenBottom?: React.ReactNode;
  style?: ViewStyle;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  childrenTop,
  childrenBottom,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.contentTop}>{childrenTop}</View>
      {childrenBottom && (
        <>
          <View style={styles.perforationRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.notchRight} />
          </View>
          <View style={styles.contentBottom}>{childrenBottom}</View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  contentTop: {
    padding: 18,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginVertical: -10,
    overflow: 'hidden',
  },
  notchLeft: {
    width: 14,
    height: 20,
    backgroundColor: Colors.background,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: Colors.borderDashed,
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  notchRight: {
    width: 14,
    height: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  contentBottom: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
