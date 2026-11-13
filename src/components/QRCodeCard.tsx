import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

interface QRCodeCardProps {
  code: string;
  groupName: string;
  emoji: string;
}

/**
 * Generates a deterministic 15x15 QR-inspired matrix seeded by `code`,
 * with authentic finder patterns in the three corners.
 */
function buildMatrix(code: string): boolean[][] {
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const stampFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  stampFinder(0, 0);
  stampFinder(0, size - 5);
  stampFinder(size - 5, 0);

  let seed = 2166136261;
  for (let i = 0; i < code.length; i++) {
    seed ^= code.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      grid[r][c] = (seed & 1) === 1;
    }
  }

  return grid;
}

export function QRCodeCard({ code, groupName, emoji }: QRCodeCardProps) {
  const { palette } = useTakoTheme();
  const matrix = useMemo(() => buildMatrix(code), [code]);
  const cellSize = 10;
  const svgSize = matrix.length * cellSize;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text
          style={[styles.groupName, { color: palette.ink, fontFamily: TakoFonts.black }]}
          numberOfLines={1}>
          {groupName}
        </Text>
      </View>

      <View style={[styles.qrWrap, { backgroundColor: '#FFF6EE' }]}>
        <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {matrix.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <Rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  rx={2}
                  fill="#2B1B3D"
                />
              ) : null
            )
          )}
        </Svg>
      </View>

      <Text style={[styles.codeLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
        INVITE CODE
      </Text>
      <View style={[styles.codePill, { backgroundColor: palette.chip }]}>
        <Text style={[styles.codeText, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          {code}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 22,
  },
  groupName: {
    fontSize: 18,
  },
  qrWrap: {
    padding: 16,
    borderRadius: Radii.lg,
  },
  codeLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
  },
  codePill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  codeText: {
    fontSize: 20,
    letterSpacing: 4,
  },
});
