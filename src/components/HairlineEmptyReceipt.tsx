import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Colors } from '../constants/theme';

/**
 * Signature Moment #2 (Phase 4):
 * Single isometric hairline-style illustration used ONLY for the empty receipt state.
 * Built from rounded isometric strokes in ink (#14123A) with one cobalt highlight stroke.
 */
export function HairlineEmptyReceipt({ size = 136 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 140 140" fill="none">
        {/* Soft ground shadow */}
        <Path
          d="M32 114 L70 128 L108 114"
          stroke="rgba(20, 18, 58, 0.16)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Isometric receipt ticket */}
        <Path
          d="M34 38 L70 22 L106 38 L106 102 L94 96 L82 106 L70 98 L58 106 L46 96 L34 102 Z"
          fill="#FFFFFF"
          stroke={Colors.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top header line (cobalt highlight) */}
        <Path
          d="M50 48 L90 48"
          stroke={Colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Receipt hairline rows */}
        <Path
          d="M48 62 L82 62 M48 73 L92 73 M48 84 L74 84"
          stroke={Colors.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
        />

        {/* Floating isometric coin */}
        <Circle
          cx={104}
          cy={36}
          r={14}
          fill={Colors.amber}
          stroke={Colors.ink}
          strokeWidth={2.5}
        />
        <Path
          d="M104 29 V43 M100 32.5 C100 30.8 108 30.8 108 33.5 C108 36 100 35.5 100 38.5 C100 41 108 41 108 39"
          stroke={Colors.ink}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Rect x={0} y={0} width={0} height={0} />
      </Svg>
    </View>
  );
}
