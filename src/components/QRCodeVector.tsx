import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '../constants/theme';

export const QRCodeVector: React.FC<{ size?: number }> = ({ size = 200 }) => {
  return (
    <View style={[styles.card, { width: size, height: size }]}>
      <Svg width={size - 32} height={size - 32} viewBox="0 0 100 100">
        {/* Top-Left Finder Bracket (Cobalt Blue) */}
        <Path
          d="M 6 24 L 6 10 A 4 4 0 0 1 10 6 L 24 6"
          stroke={Colors.primary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top-Left Inner Square */}
        <Rect x="14" y="14" width="16" height="16" rx="4" fill={Colors.primary} />

        {/* Top-Right Finder Bracket (Cobalt Blue) */}
        <Path
          d="M 76 6 L 90 6 A 4 4 0 0 1 94 10 L 94 24"
          stroke={Colors.primary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top-Right Inner Square */}
        <Rect x="70" y="14" width="16" height="16" rx="4" fill={Colors.primary} />

        {/* Bottom-Left Finder Bracket (Cobalt Blue) */}
        <Path
          d="M 6 76 L 6 90 A 4 4 0 0 0 10 94 L 24 94"
          stroke={Colors.primary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom-Left Inner Square */}
        <Rect x="14" y="70" width="16" height="16" rx="4" fill={Colors.primary} />

        {/* Bottom-Right Corner Accent */}
        <Path
          d="M 76 94 L 90 94 A 4 4 0 0 0 94 90 L 94 76"
          stroke={Colors.primary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Center / Body QR modules */}
        <Rect x="42" y="10" width="8" height="14" rx="2" fill="#0F172A" />
        <Rect x="54" y="18" width="10" height="8" rx="2" fill="#0F172A" />
        <Rect x="38" y="32" width="16" height="8" rx="2" fill="#0F172A" />
        <Rect x="46" y="44" width="8" height="18" rx="2" fill={Colors.primary} />
        <Rect x="58" y="34" width="12" height="14" rx="2" fill="#0F172A" />
        <Rect x="14" y="44" width="14" height="8" rx="2" fill="#0F172A" />
        <Rect x="18" y="56" width="10" height="8" rx="2" fill="#0F172A" />
        <Rect x="74" y="46" width="12" height="12" rx="2" fill="#0F172A" />
        <Rect x="70" y="62" width="14" height="8" rx="2" fill="#0F172A" />
        <Rect x="36" y="68" width="14" height="10" rx="2" fill="#0F172A" />
        <Rect x="54" y="72" width="8" height="14" rx="2" fill="#0F172A" />
        <Rect x="44" y="86" width="18" height="8" rx="2" fill="#0F172A" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
});
