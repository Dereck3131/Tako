import React from 'react';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

interface TakoMascotProps {
  size?: number;
}

export function TakoMascot({ size = 120 }: TakoMascotProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Tentacle outlines */}
      <Path
        d="M38 72C22 88 30 106 14 104"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M50 80C44 96 56 108 44 114"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M70 80C76 96 64 108 76 114"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M82 72C98 88 90 106 106 104"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />

      {/* Tentacle inner fills */}
      <Path
        d="M38 72C22 88 30 106 14 104"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M50 80C44 96 56 108 44 114"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M70 80C76 96 64 108 76 114"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M82 72C98 88 90 106 106 104"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />

      {/* Head */}
      <Path
        d="M26 56C26 28 42 16 60 16S94 28 94 56C94 74 80 82 60 82S26 74 26 56Z"
        fill="#2F65F6"
        stroke="#14123A"
        strokeWidth={3.5}
      />

      {/* Highlight & freckles */}
      <Ellipse
        cx={45}
        cy={31}
        rx={8}
        ry={4}
        fill="#FFFFFF"
        opacity={0.35}
        transform="rotate(-25 45 31)"
      />
      <Circle cx={72} cy={27} r={3.5} fill="#FFB400" />
      <Circle cx={80} cy={38} r={2.5} fill="#FFB400" />

      {/* Eyes */}
      <Circle cx={47} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
      <Circle cx={73} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
      <Circle cx={49} cy={55} r={4.2} fill="#14123A" />
      <Circle cx={75} cy={55} r={4.2} fill="#14123A" />
      <Circle cx={50.5} cy={53.5} r={1.4} fill="#FFFFFF" />
      <Circle cx={76.5} cy={53.5} r={1.4} fill="#FFFFFF" />

      {/* Blush & smile */}
      <Ellipse cx={35} cy={66} rx={5} ry={3} fill="#FF8FA3" />
      <Ellipse cx={85} cy={66} rx={5} ry={3} fill="#FF8FA3" />
      <Path
        d="M53 67Q60 74 67 67"
        fill="none"
        stroke="#14123A"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
