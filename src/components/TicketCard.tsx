import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
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
    <View style={[styles.cardContainer, style]}>
      {/* Top Ticket Content */}
      <View style={styles.topContent}>{childrenTop}</View>

      {childrenBottom && (
        <>
          {/* Perforation Separator with Realistic Notches */}
          <View style={styles.separatorRow}>
            {/* Left Circular Bite */}
            <View style={styles.notchLeft} />

            {/* Dashed Vector Line */}
            <View style={styles.dashedLineContainer}>
              <Svg height="2" width="100%">
                <Line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke={Colors.borderDashed}
                  strokeWidth="2"
                  strokeDasharray="6, 5"
                />
              </Svg>
            </View>

            {/* Right Circular Bite */}
            <View style={styles.notchRight} />
          </View>

          {/* Bottom Ticket Content */}
          <View style={styles.bottomContent}>{childrenBottom}</View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    overflow: 'hidden',
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
  },
  topContent: {
    padding: 18,
    paddingBottom: 14,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginVertical: -11,
    zIndex: 10,
  },
  notchLeft: {
    width: 14,
    height: 22,
    backgroundColor: Colors.background,
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  dashedLineContainer: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  notchRight: {
    width: 14,
    height: 22,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  bottomContent: {
    padding: 18,
    paddingTop: 14,
  },
});
