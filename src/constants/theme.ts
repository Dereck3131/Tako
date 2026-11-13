import { Platform } from 'react-native';

export const TakoColors = {
  light: {
    bg: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F1E9',
    ink: '#2B2B2B',
    mute: '#6A6A6A',
    glow: '#E6E3D5',
    chip: '#EEECE3',
    chipOn: '#2B2B2B',
    chipOnInk: '#FAFAF7',
    border: '#D7D0BE',
    shadow: 'rgba(43, 27, 61, 0.14)',
    // Semantic
    coral: '#FF7A8A',
    coralDeep: '#F0627A',
    coralAccent: '#E5405E',
    accent: '#FF7A8A',
    destructive: '#D92D4B',
    destructiveSoft: '#FDE8EC',
    coralSoft: '#FFE8EC',
    teal: '#2EC4B6',
    tealSoft: '#E2F8F5',
    gold: '#FFC857',
    goldSoft: '#FFF5DA',
    lavender: '#B9A5E8',
    lavenderSoft: '#F1ECFC',
    plum: '#2B1B3D',
  },
  dark: {
    bg: '#1B1424',
    surface: '#241B30',
    surfaceAlt: '#2C2139',
    ink: '#FFF6EE',
    mute: '#B9ABC9',
    glow: '#2E2042',
    chip: '#2C2139',
    chipOn: '#FFF6EE',
    chipOnInk: '#1B1424',
    border: '#3A2C4D',
    shadow: 'rgba(0, 0, 0, 0.42)',
    // Semantic
    coral: '#FF7A8A',
    coralDeep: '#F0627A',
    coralAccent: '#FF6B84',
    accent: '#FF7A8A',
    destructive: '#FF5C77',
    destructiveSoft: '#3D1E2C',
    coralSoft: '#3D2234',
    teal: '#2EC4B6',
    tealSoft: '#19353B',
    gold: '#FFC857',
    goldSoft: '#3A2F1C',
    lavender: '#B9A5E8',
    lavenderSoft: '#2E2447',
    plum: '#2B1B3D',
  },
} as const;

export type TakoPalette = typeof TakoColors.light | typeof TakoColors.dark;

export const Colors = {
  light: {
    text: TakoColors.light.ink,
    background: TakoColors.light.bg,
    backgroundElement: TakoColors.light.chip,
    backgroundSelected: TakoColors.light.glow,
    textSecondary: TakoColors.light.mute,
  },
  dark: {
    text: TakoColors.dark.ink,
    background: TakoColors.dark.bg,
    backgroundElement: TakoColors.dark.chip,
    backgroundSelected: TakoColors.dark.glow,
    textSecondary: TakoColors.dark.mute,
  },
} as const;

export const TakoFonts = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
  fallback: Platform.select({
    ios: 'ui-rounded',
    android: 'sans-serif',
    web: '"Nunito", ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
    default: 'sans-serif',
  }),
};

export const MemberPalette = [
  '#FF7A8A',
  '#2EC4B6',
  '#FFC857',
  '#B9A5E8',
  '#6C9BFF',
  '#F0627A',
  '#45B7D1',
  '#F79D65',
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export function formatPeso(cents: number): string {
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? '-' : ''}₱${formatted}`;
}
