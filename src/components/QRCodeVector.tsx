import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { Border, Colors, Radii, Shadows } from '../constants/theme';

export const QRCodeVector: React.FC<{ size?: number }> = ({ size = 216 }) => {
  const innerSize = Math.round(size * 0.785);

  return (
    <View style={[styles.card, Shadows.card, { width: size, height: size }]}>
      <Svg width={innerSize} height={innerSize} viewBox="0 0 25 25">
        <G fill={Colors.ink}>
          <Path d="M0 0h7v7H0zM18 0h7v7h-7zM0 18h7v7H0z" />
          <Path d="M9 0h3v1H9zM13 0h2v2h-2zM9 2h1v2H9zM11 3h3v1h-3zM15 4h2v1h-2zM8 5h2v1H8zM11 6h1v3h-1zM13 5h3v2h-3zM0 8h2v1H0zM3 8h3v2H3zM8 8h2v2H8zM15 9h3v1h-3zM19 8h2v2h-2zM22 8h3v1h-3zM0 11h1v2H0zM2 11h3v1H2zM6 10h1v3H6zM9 11h2v2H9zM12 11h3v1h-3zM16 12h1v2h-1zM18 11h3v1h-3zM22 11h2v3h-2zM4 13h2v2H4zM8 14h1v2H8zM10 14h3v1h-3zM14 14h1v3h-1zM19 13h2v2h-2zM9 19h2v1H9zM12 19h1v3h-1zM14 18h3v1h-3zM18 19h1v3h-1zM20 18h2v2h-2zM23 19h2v2h-2zM9 21h2v2H9zM14 21h3v2h-3zM20 22h3v1h-3zM10 24h3v1h-3zM19 24h4v1h-4z" />
        </G>
        <G fill="#FFFFFF">
          <Rect x={1} y={1} width={5} height={5} />
          <Rect x={19} y={1} width={5} height={5} />
          <Rect x={1} y={19} width={5} height={5} />
        </G>
        <G fill={Colors.primary}>
          <Rect x={2} y={2} width={3} height={3} />
          <Rect x={20} y={2} width={3} height={3} />
          <Rect x={2} y={20} width={3} height={3} />
        </G>
      </Svg>

      {/* Slim Cobalt Corner Brackets */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.cardLg,
    borderWidth: Border.width,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
  },
  cornerTL: {
    left: -3,
    top: -3,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    right: -3,
    top: -3,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    left: -3,
    bottom: -3,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    right: -3,
    bottom: -3,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },
});
