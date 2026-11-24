import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useId } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTakoTheme } from '@/context/ThemeContext';

interface LegendAvatarFrameProps {
  active: boolean;
  size: number;
  ringThickness?: number;
  gap?: number;
  showCrest?: boolean;
  children: React.ReactNode;
}

export function LegendAvatarFrame({
  active,
  size,
  ringThickness = 3.5,
  gap = 2.5,
  showCrest = true,
  children,
}: LegendAvatarFrameProps) {
  const { palette } = useTakoTheme();
  const gradId = useId();

  if (!active) {
    return <>{children}</>;
  }

  const outerSize = size + (ringThickness + gap) * 2;
  const center = outerSize / 2;
  const radius = center - ringThickness / 2;
  const crestSize = Math.max(16, Math.round(size * 0.34));
  const iconSize = Math.max(9, Math.round(crestSize * 0.54));

  return (
    <View
      style={[
        styles.wrap,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
        },
        styles.goldGlow,
      ]}>
      <Svg
        width={outerSize}
        height={outerSize}
        viewBox={`0 0 ${outerSize} ${outerSize}`}
        style={styles.ringSvg}
        pointerEvents="none">
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFF3B0" />
            <Stop offset="35%" stopColor="#FFC857" />
            <Stop offset="70%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#FFE082" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={ringThickness}
        />
      </Svg>

      <View
        style={[
          styles.innerGap,
          {
            width: size + gap * 2,
            height: size + gap * 2,
            borderRadius: (size + gap * 2) / 2,
            backgroundColor: palette.surface,
          },
        ]}>
        {children}
      </View>

      {showCrest && (
        <View
          pointerEvents="none"
          style={[
            styles.crest,
            {
              width: crestSize,
              height: crestSize,
              borderRadius: crestSize / 2,
              backgroundColor: '#FFC857',
              borderColor: palette.surface,
            },
          ]}>
          <Ionicons name="trophy" size={iconSize} color="#2B1B3D" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerGap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldGlow: Platform.select({
    ios: {
      shadowColor: '#F59E0B',
      shadowOpacity: 0.48,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)',
    },
  }),
});
