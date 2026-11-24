'use client';

import { motion } from 'motion/react';
import React from 'react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export interface HeroReceiptEntranceProps {
  skipped: boolean;
  reducedMotion: boolean;
  isMobile?: boolean;
  eyebrow: React.ReactNode;
  subline: React.ReactNode;
  controls: React.ReactNode;
  badgeSlot: React.ReactNode;
  stageSlot: React.ReactNode;
}

/**
 * Centered Hero Entrance for the Fan of Three Phones:
 * - Headline, subline, and CTAs are real DOM text from first paint.
 * - Tightened vertical spacing so Headline + CTAs + entire Fan fit above the fold
 *   at 1366x768, 1440x900, and 1920x1080.
 */
export function HeroReceiptEntrance({
  skipped,
  reducedMotion,
  isMobile = false,
  eyebrow,
  subline,
  controls,
  badgeSlot,
  stageSlot,
}: HeroReceiptEntranceProps) {
  const instant = skipped || reducedMotion || isMobile;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-between px-5 text-center sm:px-8">
      {/* Top-right rotating circular text badge (away from CTAs) */}
      {badgeSlot}

      {/* Top Centered Header Block */}
      <div className="flex w-full flex-col items-center">
        <div className="mb-1.5">{eyebrow}</div>

        <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-[clamp(2rem,min(4.4vw,5.4dvh),3.75rem)] font-black leading-[0.98] tracking-[-0.035em] text-[var(--ink)] text-balance">
          <span className="block">Split bills,</span>
          <span className="relative inline-block text-[var(--cta-bg)] dark:text-[var(--coral)]">
            not friendships.
            <svg
              aria-hidden="true"
              viewBox="0 0 340 18"
              fill="none"
              preserveAspectRatio="none"
              className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-full overflow-visible sm:-bottom-1.5 sm:h-3"
            >
              <motion.path
                d="M4 13 Q90 3 174 10 T336 7"
                stroke="var(--gold)"
                strokeWidth="4.5"
                strokeLinecap="round"
                initial={instant ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={instant ? { duration: 0 } : { duration: 0.65, delay: 0.25, ease: EASE_OUT }}
              />
            </svg>
          </span>
        </h1>

        <div className="mt-2.5 max-w-[52ch]">{subline}</div>

        <div className="mt-3 w-full">{controls}</div>
      </div>

      {/* Centered Giant-Tako Stage anchored to bottom edge */}
      <div className="relative mt-2 flex w-full flex-1 flex-col items-center justify-end lg:mt-1">
        {stageSlot}
      </div>
    </div>
  );
}
