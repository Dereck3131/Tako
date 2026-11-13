import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface TakoMarkProps {
  size?: number;
  color?: string;
  eyeColor?: string;
}

/**
 * Optically simplified Tako brand mark for small sizes (16–48px):
 * bold head silhouette, 4 chunky rounded tentacles, high-contrast eyes.
 */
export function TakoMark({
  size = 32,
  color = '#FF7A8A',
  eyeColor = '#2B1B3D',
}: TakoMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      accessibilityLabel="Tako mark">
      {/* Head + chunky tentacle silhouette */}
      <Path
        d="M20 4C11.7 4 6 9.8 6 17.6c0 3.7 1.3 6.8 3.2 9.1-.8 2.2-1.8 4.2-1.8 5.5 0 1.8 1.5 3.1 3.2 2.6 1.5-.4 2.7-2.2 3.5-4.3.7 2.4 1.6 4.7 3.1 4.7s2.2-2.3 2.8-4.8c.6 2.5 1.3 4.8 2.8 4.8s2.4-2.3 3.1-4.7c.8 2.1 2 3.9 3.5 4.3 1.7.5 3.2-.8 3.2-2.6 0-1.3-1-3.3-1.8-5.5C32.7 24.4 34 21.3 34 17.6 34 9.8 28.3 4 20 4Z"
        fill={color}
      />
      {/* High-contrast eyes for small-size legibility */}
      <Circle cx="15" cy="17.5" r="2.6" fill={eyeColor} />
      <Circle cx="25" cy="17.5" r="2.6" fill={eyeColor} />
    </Svg>
  );
}
