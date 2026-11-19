export type ArmScreenKey =
  | 'new-split'
  | 'scan-to-join'
  | 'profile'
  | 'activity'
  | 'sign-in'
  | 'dark-light-pair';

export interface ArmFeature {
  id: string;
  shortLabel: string;
  title: string;
  description: string;
  note?: string;
  screen: ArmScreenKey;
  screenAlt: string;
  /** Desktop radial position (percentage inside the 16:9 stage) */
  side: 'left' | 'right';
  verticalSlot: 'top' | 'bottom';
  /** Pad anchor coordinates in a 1000x560 SVG coordinate space */
  padX: number;
  padY: number;
  /** Root anchor on Tako's body in 1000x560 SVG space */
  rootX: number;
  rootY: number;
  /** Idle sway phase offset (seconds) */
  swayDelay: number;
  /** Subtle eye target direction (-1..1) */
  eyeDirX: number;
  eyeDirY: number;
}

/**
 * Exactly the eight features confirmed for Tako.
 * TODO: Confirm what "Payment details" shows to friends before adding extra copy.
 * Do NOT add unconfirmed claims (auto-sync, mark friends paid offline, ratings, user counts).
 */
export const EIGHT_ARMS: ArmFeature[] = [
  {
    id: 'three-ways',
    shortLabel: 'Split 3 ways',
    title: 'Three ways to split',
    description: 'Equally, By items, or Custom.',
    screen: 'new-split',
    screenAlt: 'Tako New Split screen showing Equal, By items, and Custom split modes',
    side: 'left',
    verticalSlot: 'top',
    rootX: 446,
    rootY: 268,
    padX: 300,
    padY: 108,
    swayDelay: 0,
    eyeDirX: -0.75,
    eyeDirY: -0.7,
  },
  {
    id: 'join-scan',
    shortLabel: 'Join by QR',
    title: 'Join with a scan',
    description: 'Show a QR or enter a code (like TAKO-4821) and friends hop in.',
    note: 'Needs a connection.',
    screen: 'scan-to-join',
    screenAlt: 'Tako Scan to join screen with QR viewfinder and code input',
    side: 'left',
    verticalSlot: 'top',
    rootX: 432,
    rootY: 292,
    padX: 245,
    padY: 224,
    swayDelay: 0.7,
    eyeDirX: -1,
    eyeDirY: -0.15,
  },
  {
    id: 'peso-first',
    shortLabel: 'Peso-first',
    title: 'Peso-first',
    description: 'Built for PHP (₱) with a currency option.',
    screen: 'new-split',
    screenAlt: 'Tako New Split screen showing Philippine Peso input',
    side: 'left',
    verticalSlot: 'bottom',
    rootX: 434,
    rootY: 318,
    padX: 245,
    padY: 356,
    swayDelay: 1.4,
    eyeDirX: -1,
    eyeDirY: 0.35,
  },
  {
    id: 'payment-details',
    shortLabel: 'Pay details',
    title: 'Payment details',
    description: 'Keep your GCash, Maya, and bank accounts in your profile.',
    // TODO: confirm exactly what Payment details does for friends before adding more detail.
    screen: 'profile',
    screenAlt: 'Tako Profile screen showing saved GCash, Maya, and bank payment details',
    side: 'left',
    verticalSlot: 'bottom',
    rootX: 454,
    rootY: 336,
    padX: 312,
    padY: 468,
    swayDelay: 2.1,
    eyeDirX: -0.65,
    eyeDirY: 0.85,
  },
  {
    id: 'activity-history',
    shortLabel: 'Activity',
    title: 'Activity history',
    description: 'Expenses and settlements, all in one place.',
    screen: 'activity',
    screenAlt: 'Tako Activity screen listing expenses and settlements',
    side: 'right',
    verticalSlot: 'top',
    rootX: 554,
    rootY: 268,
    padX: 700,
    padY: 108,
    swayDelay: 0.4,
    eyeDirX: 0.75,
    eyeDirY: -0.7,
  },
  {
    id: 'no-signal',
    shortLabel: 'No signal',
    title: 'Splits without signal',
    description:
      'No bars at the restaurant? Enter the bill, add people, and Tako does the math.',
    note: 'QR joining needs a connection.',
    screen: 'new-split',
    screenAlt: 'Tako New Split screen calculating shares without an internet connection',
    side: 'right',
    verticalSlot: 'top',
    rootX: 568,
    rootY: 292,
    padX: 755,
    padY: 224,
    swayDelay: 1.1,
    eyeDirX: 1,
    eyeDirY: -0.15,
  },
  {
    id: 'guest-mode',
    shortLabel: 'Guest mode',
    title: 'Guest mode',
    description: 'Try Tako without an account.',
    screen: 'sign-in',
    screenAlt: 'Tako Sign in screen with Continue as Guest option',
    side: 'right',
    verticalSlot: 'bottom',
    rootX: 566,
    rootY: 318,
    padX: 755,
    padY: 356,
    swayDelay: 1.8,
    eyeDirX: 1,
    eyeDirY: 0.35,
  },
  {
    id: 'dark-light',
    shortLabel: 'Dark & light',
    title: 'Dark & light',
    description: 'Looks good day or night.',
    screen: 'dark-light-pair',
    screenAlt: 'Side-by-side comparison of Tako New Split in light and dark themes',
    side: 'right',
    verticalSlot: 'bottom',
    rootX: 546,
    rootY: 336,
    padX: 688,
    padY: 468,
    swayDelay: 2.5,
    eyeDirX: 0.65,
    eyeDirY: 0.85,
  },
];
