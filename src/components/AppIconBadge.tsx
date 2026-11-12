import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Shadows } from '../constants/theme';
import { TakoMascot } from './TakoMascot';

/**
 * Screen 11: App Icon — Tako holding a coin on an amber rounded square.
 */
export function AppIconBadge({ size = 80 }: { size?: number }) {
  const radius = Math.round(size * 0.24);
  const coinSize = Math.round(size * 0.34);

  return (
    <View
      style={[
        styles.square,
        Shadows.cardSoft,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <TakoMascot size={Math.round(size * 0.78)} />
      <View
        style={[
          styles.coinWrap,
          {
            width: coinSize,
            height: coinSize,
            right: Math.round(size * 0.08),
            bottom: Math.round(size * 0.08),
          },
        ]}
      >
        <Svg width={coinSize} height={coinSize} viewBox="0 0 32 32">
          <Circle
            cx={16}
            cy={16}
            r={14}
            fill="#FFFFFF"
            stroke={Colors.ink}
            strokeWidth={2}
          />
          <Path
            d="M16 9V23M12.5 12.5C12.5 10.8 19.5 10.8 19.5 13C19.5 15.2 12.5 15 12.5 17.5C12.5 20 19.5 20 19.5 18"
            stroke={Colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
}

export function AppIconShowcase() {
  return (
    <View style={styles.showcaseRow}>
      {[104, 68, 48, 32].map((s) => (
        <View key={s} style={styles.showcaseItem}>
          <AppIconBadge size={s} />
          <Text style={styles.sizeLabel}>{s}px</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  coinWrap: {
    position: 'absolute',
  },
  showcaseRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  showcaseItem: {
    alignItems: 'center',
    gap: 6,
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
