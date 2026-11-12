import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Colors } from '../constants/theme';

/**
 * Soft & Clean cobalt hero gradient (#4A7BFF to #2F65F6).
 */
export function HeroShaderBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="heroCobaltGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.primaryGradientStart} />
            <Stop offset="100%" stopColor={Colors.primaryGradientEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroCobaltGrad)" />
      </Svg>
    </View>
  );
}
