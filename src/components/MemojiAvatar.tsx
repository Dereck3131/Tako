import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Rect, Path, Ellipse } from 'react-native-svg';

export type MemojiId = 'you' | 'mia' | 'jonas' | 'aly' | 'ken';

interface MemojiAvatarProps {
  id: MemojiId | string;
  size?: number;
  style?: ViewStyle;
}

export const MemojiAvatar: React.FC<MemojiAvatarProps> = ({
  id,
  size = 44,
  style,
}) => {
  const getAvatarConfig = () => {
    switch (id) {
      case 'mia':
        return {
          bg: '#E0EEFE',
          skin: '#FCD8B8',
          hair: '#5B3728',
          blush: '#F87171',
          cap: null,
          mouth: '#E11D48',
        };
      case 'jonas':
        return {
          bg: '#FEF3C7',
          skin: '#E5A675',
          hair: '#1E293B',
          blush: '#FB923C',
          cap: '#FBBF24',
          mouth: '#7C2D12',
        };
      case 'aly':
        return {
          bg: '#DCFCE7',
          skin: '#FCD8B8',
          hair: '#EA580C',
          blush: '#F87171',
          cap: null,
          mouth: '#991B1B',
        };
      case 'ken':
        return {
          bg: '#EDE9FE',
          skin: '#8D5337',
          hair: '#1E293B',
          blush: '#A855F7',
          cap: '#7C3AED',
          mouth: '#FFFFFF',
        };
      case 'you':
      default:
        return {
          bg: '#FCE7F3',
          skin: '#FAD5BC',
          hair: '#6D4129',
          blush: '#FB7185',
          cap: null,
          mouth: '#E11D48',
        };
    }
  };

  const cfg = getAvatarConfig();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cfg.bg,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Head Skin */}
        <Circle cx="50" cy="56" r="32" fill={cfg.skin} />

        {/* Ears */}
        <Circle cx="18" cy="56" r="6" fill={cfg.skin} />
        <Circle cx="82" cy="56" r="6" fill={cfg.skin} />

        {/* Hair / Cap */}
        {cfg.cap ? (
          <>
            {/* Beanie / Cap */}
            <Path
              d="M 22 52 C 22 28, 78 28, 78 52 Z"
              fill={cfg.cap}
            />
            {/* Front hair fringe */}
            <Rect x="28" y="48" width="44" height="6" rx="3" fill={cfg.hair} />
          </>
        ) : (
          <>
            {/* Bowl Haircut */}
            <Path
              d="M 20 54 C 18 30, 82 30, 80 54 C 80 44, 20 44, 20 54 Z"
              fill={cfg.hair}
            />
            <Rect x="24" y="38" width="52" height="14" rx="4" fill={cfg.hair} />
          </>
        )}

        {/* Eyes */}
        <Circle cx="38" cy="56" r="4" fill="#0F172A" />
        <Circle cx="62" cy="56" r="4" fill="#0F172A" />

        {/* Blush */}
        <Circle cx="30" cy="62" r="5" fill={cfg.blush} opacity="0.4" />
        <Circle cx="70" cy="62" r="5" fill={cfg.blush} opacity="0.4" />

        {/* Nose */}
        <Circle cx="50" cy="61" r="2" fill="#C28461" />

        {/* Mouth */}
        {id === 'mia' || id === 'you' ? (
          <Ellipse cx="50" cy="70" rx="6" ry="7" fill={cfg.mouth} />
        ) : id === 'ken' ? (
          <Path
            d="M 42 68 Q 50 76 58 68 Z"
            fill={cfg.mouth}
          />
        ) : (
          <Path
            d="M 44 69 Q 50 74 56 69"
            stroke={cfg.mouth}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
