import { Platform, TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  // Canvas & Surfaces
  background: '#F6F7FB',
  card: '#FFFFFF',
  cardDark: '#14123A',
  cardMidnight: '#14123A',
  surfaceSubtle: '#F0F2F8',

  // Brand Primaries
  primary: '#2F65F6',
  primaryGradientStart: '#4A7BFF',
  primaryGradientEnd: '#2F65F6',
  primaryLight: '#EAF0FF',

  // Accents & Status (Pastel tints + high-contrast text)
  amber: '#FFB400',
  amberLight: '#FFF5DB',
  amberTint: '#FFF5DB',
  amberText: '#8A5300',
  mint: '#E6F9F0',
  mintProgress: '#14B87A',
  mintText: '#0B7A4B',
  emerald: '#14B87A',
  emeraldLight: '#E6F9F0',
  danger: '#D92D20',
  dangerLight: '#FEF3F2',

  // Ink & Typography (WCAG AA)
  ink: '#14123A',
  textPrimary: '#14123A',
  textSecondary: '#5B5880',
  textBody: '#5B5880',
  textMuted: '#5B5880',
  textWhite: '#FFFFFF',
  textOnDarkMuted: '#E2E6F5',
  textOnDarkSubtle: '#C5CAE3',

  // Hairline Borders
  border: '#E4E8F2',
  borderDashed: '#E4E8F2',
};

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16, // inputs
  lg: 20, // cards
  card: 20,
  cardLg: 24, // hero
  sheet: 28,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // screen padding
  xxl: 24,
  xxxl: 32,
};

export const Border = {
  width: 1,
  chipWidth: 0,
};

export const TouchTarget = {
  minSize: 44,
};

export const Shadows: Record<'card' | 'cardSoft' | 'button' | 'hero', ViewStyle> = {
  card: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  cardSoft: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  hero: {
    shadowColor: '#14123A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
};

export const Motion = {
  easeOut: [0.23, 1, 0.32, 1] as const,
  easeInOut: [0.77, 0, 0.175, 1] as const,
  easeDrawer: [0.32, 0.72, 0, 1] as const,
  durationFast: 160,
  durationNormal: 240,
  durationSlow: 280,
  pressScale: 0.97,
  staggerMs: 40,
};

const fontFamily = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: undefined,
});

export const Typography: Record<string, TextStyle> = {
  screenTitle: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
    color: Colors.ink,
  },
  sectionTitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
    color: Colors.ink,
  },
  cardTitle: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
    color: Colors.ink,
  },
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  micro: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  currencyHero: {
    fontFamily,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 54,
    fontVariant: ['tabular-nums'],
  },
  currencyLg: {
    fontFamily,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  currencyMd: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  tabular: {
    fontFamily,
    fontVariant: ['tabular-nums'],
  },
};
