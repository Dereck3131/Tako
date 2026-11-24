import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTakoTheme } from '@/context/ThemeContext';

interface AmbientGlowProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export function AmbientGlow({
  size = 380,
  color,
  opacity = 1,
  style,
}: AmbientGlowProps) {
  const { palette } = useTakoTheme();
  const gradId = useId();
  const r = size / 2;
  const glowColor = color ?? palette.glow;

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size, opacity }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity={0.95} />
            <Stop offset="55%" stopColor={glowColor} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
