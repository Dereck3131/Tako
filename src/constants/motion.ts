import { Easing } from 'react-native-reanimated';

/**
 * TabTogether Motion Tokens
 *
 * Rules:
 * - GPU-only properties: transform & opacity (exception: out-of-flow progress/pill width).
 * - UI transitions stay <= 300ms; mascot & celebration moments may run longer.
 * - Never animate from scale(0); use scale(0.92..0.97) -> 1.
 * - Always respect reduced motion via useReducedMotion().
 */
export const MotionTokens = {
  // Custom cubic-bezier curves (Emil Kowalski / Apple fluid curves)
  easing: {
    easeOut: [0.23, 1, 0.32, 1] as const,
    easeInOut: [0.77, 0, 0.175, 1] as const,
    easeDrawer: [0.32, 0.72, 0, 1] as const,
    reanimatedOut: Easing.bezier(0.23, 1, 0.32, 1),
    reanimatedInOut: Easing.bezier(0.77, 0, 0.175, 1),
    reanimatedDrawer: Easing.bezier(0.32, 0.72, 0, 1),
  },

  // Durations in ms
  duration: {
    press: 120,
    fast: 160,
    normal: 240,
    slow: 280,
    sheet: 300,
    exitFast: 180,
    wiggle: 480,
    inkSquirt: 420,
    coinDrop: 460,
    mascotBreath: 3400,
    mascotSwim: 2400,
    mascotBlinkMin: 3000,
    mascotBlinkMax: 6000,
    reducedFade: 120,
  },

  // Reanimated 4 spring configs (duration + dampingRatio)
  spring: {
    // Default UI settle, no overshoot
    settle: { duration: 380, dampingRatio: 1 },
    // Gentle bounce for playful entrances & gesture snap-back
    bounce: { duration: 420, dampingRatio: 0.76 },
    // Bottom sheet / drawer drag release
    sheet: { duration: 300, dampingRatio: 0.84 },
    // Tako peek-in & celebration
    playful: { duration: 480, dampingRatio: 0.68 },
    // Tab indicator glide
    tabPill: { duration: 280, dampingRatio: 0.9 },
  },

  // Stagger values
  stagger: {
    itemMs: 40,
    maxItems: 5,
    firstRunMs: 90,
  },

  // Scales & distances
  scale: {
    press: 0.97,
    enterFrom: 0.96,
    popFrom: 0.92,
  },
  distance: {
    enterY: 10,
    peekY: 26,
    slideX: 18,
  },
} as const;
