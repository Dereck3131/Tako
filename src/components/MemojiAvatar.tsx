import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type MemojiId =
  | 'you'
  | 'mia'
  | 'jonas'
  | 'aly'
  | 'ken'
  | 'bear'
  | 'fox'
  | 'panda'
  | 'frog'
  | 'cat';

interface MemojiAvatarProps {
  id: MemojiId;
  size?: number;
}

export function resolveAnimal(id: MemojiId): 'bear' | 'fox' | 'panda' | 'frog' | 'cat' {
  switch (id) {
    case 'mia':
    case 'fox':
      return 'fox';
    case 'jonas':
    case 'panda':
      return 'panda';
    case 'aly':
    case 'frog':
      return 'frog';
    case 'ken':
    case 'cat':
      return 'cat';
    case 'you':
    case 'bear':
    default:
      return 'bear';
  }
}

export function MemojiAvatar({ id, size = 40 }: MemojiAvatarProps) {
  const animal = resolveAnimal(id);

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {animal === 'fox' && (
        <>
          <Circle cx={20} cy={20} r={19} fill="#FFE2B8" stroke="#14123A" strokeWidth={2} />
          <Path
            d="M9 18 9 7 18 12M31 18 31 7 22 12"
            fill="#FF8A3D"
            stroke="#14123A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M8 18Q20 9 32 18Q32 33 20 35Q8 33 8 18Z"
            fill="#FF8A3D"
            stroke="#14123A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path d="M13 26Q20 22 27 26Q24 33 20 33Q16 33 13 26Z" fill="#FFFFFF" />
          <Circle cx={20} cy={27} r={2} fill="#14123A" />
          <Circle cx={14.5} cy={21} r={1.7} fill="#14123A" />
          <Circle cx={25.5} cy={21} r={1.7} fill="#14123A" />
        </>
      )}

      {animal === 'panda' && (
        <>
          <Circle cx={20} cy={20} r={19} fill="#D8F5E3" stroke="#14123A" strokeWidth={2} />
          <Circle cx={10} cy={10} r={5} fill="#14123A" />
          <Circle cx={30} cy={10} r={5} fill="#14123A" />
          <Ellipse
            cx={20}
            cy={22}
            rx={13}
            ry={12}
            fill="#FFFFFF"
            stroke="#14123A"
            strokeWidth={2}
          />
          <Ellipse cx={14.5} cy={21} rx={3} ry={4} fill="#14123A" />
          <Ellipse cx={25.5} cy={21} rx={3} ry={4} fill="#14123A" />
          <Circle cx={14.8} cy={20.5} r={1} fill="#FFFFFF" />
          <Circle cx={25.2} cy={20.5} r={1} fill="#FFFFFF" />
          <Ellipse cx={20} cy={27} rx={2} ry={1.4} fill="#14123A" />
        </>
      )}

      {animal === 'frog' && (
        <>
          <Circle cx={20} cy={20} r={19} fill="#E0F7D4" stroke="#14123A" strokeWidth={2} />
          <Ellipse
            cx={20}
            cy={25}
            rx={15}
            ry={10}
            fill="#4CC46F"
            stroke="#14123A"
            strokeWidth={2}
          />
          <Circle cx={11} cy={13} r={6} fill="#4CC46F" stroke="#14123A" strokeWidth={2} />
          <Circle cx={29} cy={13} r={6} fill="#4CC46F" stroke="#14123A" strokeWidth={2} />
          <Circle cx={11} cy={13} r={3.3} fill="#FFFFFF" />
          <Circle cx={29} cy={13} r={3.3} fill="#FFFFFF" />
          <Circle cx={11.5} cy={13.5} r={1.6} fill="#14123A" />
          <Circle cx={28.5} cy={13.5} r={1.6} fill="#14123A" />
          <Path
            d="M12 27Q20 33 28 27"
            fill="none"
            stroke="#14123A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </>
      )}

      {animal === 'cat' && (
        <>
          <Circle cx={20} cy={20} r={19} fill="#E9E0FF" stroke="#14123A" strokeWidth={2} />
          <Path
            d="M8 19 9 6 19 12M32 19 31 6 21 12"
            fill="#B79CFF"
            stroke="#14123A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M8 19Q20 9 32 19Q33 33 20 35Q7 33 8 19Z"
            fill="#B79CFF"
            stroke="#14123A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Circle cx={14.5} cy={22} r={1.7} fill="#14123A" />
          <Circle cx={25.5} cy={22} r={1.7} fill="#14123A" />
          <Path d="M18.5 26h3l-1.5 2z" fill="#FF8FA3" />
          <Path
            d="M5 25h6M5 29h6M29 25h6M29 29h6"
            stroke="#14123A"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      )}

      {animal === 'bear' && (
        <>
          <Circle cx={20} cy={20} r={19} fill="#FFE9D6" stroke="#14123A" strokeWidth={2} />
          <Circle cx={10} cy={10} r={5} fill="#B97A4A" stroke="#14123A" strokeWidth={2} />
          <Circle cx={30} cy={10} r={5} fill="#B97A4A" stroke="#14123A" strokeWidth={2} />
          <Circle cx={20} cy={22} r={13} fill="#B97A4A" stroke="#14123A" strokeWidth={2} />
          <Ellipse cx={20} cy={27} rx={6} ry={4.5} fill="#F3D3A8" />
          <Ellipse cx={20} cy={25.5} rx={2} ry={1.4} fill="#14123A" />
          <Circle cx={14.5} cy={20} r={1.7} fill="#14123A" />
          <Circle cx={25.5} cy={20} r={1.7} fill="#14123A" />
        </>
      )}
    </Svg>
  );
}
