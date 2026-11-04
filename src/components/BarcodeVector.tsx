import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export const BarcodeVector: React.FC<{ height?: number }> = ({ height = 36 }) => {
  // Deterministic realistic barcode bar sequence
  const bars = [
    { w: 2, s: 2 },
    { w: 4, s: 3 },
    { w: 1, s: 2 },
    { w: 3, s: 1 },
    { w: 5, s: 3 },
    { w: 2, s: 2 },
    { w: 6, s: 4 },
    { w: 1, s: 1 },
    { w: 4, s: 2 },
    { w: 2, s: 3 },
    { w: 5, s: 2 },
    { w: 3, s: 3 },
    { w: 2, s: 1 },
    { w: 4, s: 2 },
    { w: 1, s: 3 },
    { w: 6, s: 2 },
    { w: 3, s: 1 },
    { w: 2, s: 3 },
    { w: 5, s: 2 },
    { w: 1, s: 2 },
    { w: 4, s: 3 },
    { w: 2, s: 1 },
  ];

  let currentX = 0;

  return (
    <View style={styles.container}>
      <Svg height={height} width="220" viewBox="0 0 220 40">
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.w + bar.s + 1;
          return (
            <Rect
              key={idx}
              x={x}
              y="0"
              width={bar.w}
              height="40"
              rx="0.5"
              fill="#0F172A"
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
