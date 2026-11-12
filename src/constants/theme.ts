import { TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  // Canvas & Surfaces
  background: '#FBF3E4',
  card: '#FFFFFF',
  cardDark: '#14123A',
  cardMidnight: '#14123A',
  amberTint: '#FFF1C2',

  // Brand Primaries
  primary: '#2F65F6',
  primaryLight: '#EEF3FF',

  // Accents & Status
  amber: '#FFB400',
  amberLight: '#FFF1C2',
  amberText: '#8A5300',
  mint: '#A8F0CD',
  mintProgress: '#3DDC97',
  mintText: '#0B7A4B',
  emerald: '#3DDC97',
  emeraldLight: '#A8F0CD',
  danger: '#B3261E',
  dangerLight: '#FDECEC',

  // Ink & Typography
  ink: '#14123A',
  textPrimary: '#14123A',
  textSecondary: '#4B4975',
  textBody: '#3B3963',
  textMuted: '#4B4975',
  textWhite: '#FFFFFF',
  textOnDarkMuted: '#E9E6FF',
  textOnDarkSubtle: '#D9D5FF',

  // Borders
  border: '#14123A',
  borderDashed: '#14123A',
  dotGrid: 'rgba(20, 18, 58, 0.13)',
};

export const Radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  card: 22,
  cardLg: 26,
  sheet: 32,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Border = {
  width: 2.5,
  chipWidth: 2,
};

export const TouchTarget = {
  minSize: 44,
};

export const Shadows: Record<'card' | 'cardSoft' | 'button', ViewStyle> = {
  card: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSoft: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const Motion = {
  easeOut: [0.23, 1, 0.32, 1] as const,
  easeInOut: [0.77, 0, 0.175, 1] as const,
  easeDrawer: [0.32, 0.72, 0, 1] as const,
  durationFast: 140,
  durationNormal: 240,
  durationSlow: 320,
  pressScale: 0.97,
  staggerMs: 45,
};

export const Typography: Record<string, TextStyle> = {
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 32,
    color: Colors.ink,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    color: Colors.ink,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 21,
    color: Colors.ink,
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: Colors.textBody,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  micro: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  currencyHero: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
  },
  currencyLg: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  currencyMd: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
};
