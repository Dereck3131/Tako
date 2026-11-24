import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type BadgeId =
  | 'on-time-streak'
  | 'speed-settler'
  | 'zero-nudge'
  | 'host-most'
  | 'full-table'
  | 'clean-slate'
  | 'tako-legend';

interface TakoBadgeEmblemProps {
  id: string;
  unlocked: boolean;
  isDark?: boolean;
  size?: number;
}

// Smooth 14-lobe scalloped medal path centered at (50, 50)
function buildScallopPath(lobes = 14, rOuter = 47, rInner = 42.2): string {
  const cx = 50;
  const cy = 50;
  const steps = lobes * 2;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i * Math.PI * 2) / steps - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const m = mid(curr, next);
    d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

const SCALLOP_PATH = buildScallopPath(14, 47.5, 42.5);

const UNLOCKED_COLORS: Record<BadgeId, { bg: string; glyph: string }> = {
  'on-time-streak': { bg: '#FF9F43', glyph: '#FFFFFF' },
  'speed-settler': { bg: '#FFD15C', glyph: '#2B1B3D' },
  'zero-nudge': { bg: '#BFA8EC', glyph: '#2B1B3D' },
  'host-most': { bg: '#FF7A8A', glyph: '#FFFFFF' },
  'full-table': { bg: '#26C2B5', glyph: '#FFFFFF' },
  'clean-slate': { bg: '#46C99B', glyph: '#FFFFFF' },
  'tako-legend': { bg: '#FFC857', glyph: '#2B1B3D' },
};

export function TakoBadgeEmblem({
  id,
  unlocked,
  isDark = false,
  size = 56,
}: TakoBadgeEmblemProps) {
  const key: BadgeId =
    id === 'on-time-streak' ||
    id === 'speed-settler' ||
    id === 'zero-nudge' ||
    id === 'host-most' ||
    id === 'full-table' ||
    id === 'clean-slate' ||
    id === 'tako-legend'
      ? id
      : 'clean-slate';

  const bgColor = unlocked
    ? UNLOCKED_COLORS[key].bg
    : isDark
      ? '#352A44'
      : '#E5E0D5';

  const ringStroke = unlocked
    ? 'rgba(255, 255, 255, 0.45)'
    : isDark
      ? '#4A3C5E'
      : '#CBC4B5';

  const shineStroke = unlocked
    ? 'rgba(255, 255, 255, 0.72)'
    : isDark
      ? 'rgba(255, 255, 255, 0.16)'
      : 'rgba(255, 255, 255, 0.85)';

  const glyphColor = unlocked
    ? UNLOCKED_COLORS[key].glyph
    : isDark
      ? '#837599'
      : '#A49B8B';

  const renderGlyph = () => {
    // 1. On-time streak — bold flame drop
    if (key === 'on-time-streak') {
      const flamePath =
        'M50 31 C50 31 61 42.5 61 52.5 C61 59.4 56.1 65 50 65 C43.9 65 39 59.4 39 52.5 C39 48.2 41.2 44.3 43.2 41.8 C43.6 45 45.8 46.8 47.4 45.2 C48.8 43.8 48.2 37.5 50 31 Z';
      return unlocked ? (
        <Path d={flamePath} fill={glyphColor} />
      ) : (
        <Path
          d={flamePath}
          fill="none"
          stroke={glyphColor}
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    // 2. Speed Settler — bold lightning bolt
    if (key === 'speed-settler') {
      const boltPath = 'M53.5 31 L37 52.5 H48.5 L46 69 L63 47.5 H51.5 Z';
      return unlocked ? (
        <Path
          d={boltPath}
          fill={glyphColor}
          stroke={glyphColor}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d={boltPath}
          fill="none"
          stroke={glyphColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    // 3. Zero-Nudge Pro — big 4-point sparkle + smaller bottom-right sparkle
    if (key === 'zero-nudge') {
      const bigStar =
        'M45.5 33 L49.3 43.7 L60 47.5 L49.3 51.3 L45.5 62 L41.7 51.3 L31 47.5 L41.7 43.7 Z';
      const smallStar =
        'M61.5 53 L63.5 58.2 L68.5 60 L63.5 61.8 L61.5 67 L59.5 61.8 L54.5 60 L59.5 58.2 Z';
      return unlocked ? (
        <>
          <Path d={bigStar} fill={glyphColor} stroke={glyphColor} strokeWidth={1.5} strokeLinejoin="round" />
          <Path d={smallStar} fill={glyphColor} stroke={glyphColor} strokeWidth={1.2} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <Path d={bigStar} fill="none" stroke={glyphColor} strokeWidth={3.2} strokeLinejoin="round" />
          <Path d={smallStar} fill="none" stroke={glyphColor} strokeWidth={2.6} strokeLinejoin="round" />
        </>
      );
    }

    // 4. Host with the Most / Tako Legend — 3-point crown
    if (key === 'host-most' || key === 'tako-legend') {
      const crownPath = 'M33 61 L31 41 L42 48.5 L50 36.5 L58 48.5 L69 41 L67 61 Z';
      return unlocked ? (
        <Path
          d={crownPath}
          fill={glyphColor}
          stroke={glyphColor}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d={crownPath}
          fill="none"
          stroke={glyphColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    // 5. Full Table — twin friends outline
    if (key === 'full-table') {
      return (
        <>
          <Circle cx="43" cy="43" r="5.8" fill="none" stroke={glyphColor} strokeWidth={3.6} />
          <Circle cx="57" cy="43" r="5.8" fill="none" stroke={glyphColor} strokeWidth={3.6} />
          <Path
            d="M32 62 C32 55.2 36.8 51.5 43 51.5 C49.2 51.5 54 55.2 54 62"
            fill="none"
            stroke={glyphColor}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
          <Path
            d="M46 62 C46 55.2 50.8 51.5 57 51.5 C63.2 51.5 68 55.2 68 62"
            fill="none"
            stroke={glyphColor}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
        </>
      );
    }

    // 6. Clean Slate — bold checkmark with sparkle + at top-right tip
    return (
      <>
        <Path
          d="M35.5 52 L44.5 61 L63.5 40.5"
          fill="none"
          stroke={glyphColor}
          strokeWidth={4.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M64 35.5 V42.5 M60.5 39 H67.5"
          fill="none"
          stroke={glyphColor}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={SCALLOP_PATH} fill={bgColor} />
      <Circle
        cx="50"
        cy="50"
        r="34.5"
        fill="none"
        stroke={ringStroke}
        strokeWidth={2.6}
      />
      <Path
        d="M24.5 41 A27 27 0 0 1 41 24.5"
        fill="none"
        stroke={shineStroke}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      {renderGlyph()}
    </Svg>
  );
}
