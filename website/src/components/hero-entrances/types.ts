import type React from 'react';

export type EntranceVariantId = 'coin' | 'ink' | 'peek' | 'receipt';
export type EntranceSpeed = 0.5 | 1 | 2;

export interface EntranceVariantMeta {
  id: EntranceVariantId;
  keyLabel: 'A' | 'B' | 'C' | 'D';
  name: string;
  durationSec: number;
}

export const ENTRANCE_VARIANTS: EntranceVariantMeta[] = [
  { id: 'coin', keyLabel: 'A', name: 'Coin Split', durationSec: 1.8 },
  { id: 'ink', keyLabel: 'B', name: 'Ink Reveal', durationSec: 1.75 },
  { id: 'peek', keyLabel: 'C', name: 'Peek-a-Boo', durationSec: 1.6 },
  { id: 'receipt', keyLabel: 'D', name: 'Receipt Tear', durationSec: 1.85 },
];

export const HEADLINE_WORDS = ['Split', 'bills,', 'not', 'friendships.'] as const;

export interface HeroEntranceProps {
  /** Playback speed multiplier (0.5x = slower, 1x = normal, 2x = faster) */
  speed: EntranceSpeed;
  /** True when user clicked/pressed a key/scrolled or prefers-reduced-motion */
  skipped: boolean;
  /** True when prefers-reduced-motion is active (fades final state over ~200ms) */
  reducedMotion: boolean;
  subline: React.ReactNode;
  controls: React.ReactNode;
  /** Right-column phone + Tako + chips stage wrapper slots */
  phoneSlot: React.ReactNode;
  takoSlot: React.ReactNode;
  chipNewSplitSlot: React.ReactNode;
  chipScanQrSlot: React.ReactNode;
  glowSlot: React.ReactNode;
}
