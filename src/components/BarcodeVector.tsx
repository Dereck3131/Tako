import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '../constants/theme';

export const BarcodeVector: React.FC<{ height?: number }> = ({ height = 30 }) => {
  const bars = [
    { w: 2, s: 2 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 1 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 2 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 1 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 2 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 1 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 2 },
    { w: 1, s: 3 },
    { w: 3, s: 2 },
    { w: 2, s: 2 },
    { w: 3, s: 2 },
    { w: 1, s: 3 },
    { w: 2, s: 2 },
  ];

  let currentX = 0;

  return (
    <View style={styles.container}>
      <Svg height={height} width="100%" viewBox="0 0 260 30" preserveAspectRatio="none">
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.w + bar.s + 2;
          return (
            <Rect
              key={idx}
              x={x}
              y="0"
              width={bar.w}
              height="30"
              fill={Colors.ink}
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
    width: '100%',
  },
});
