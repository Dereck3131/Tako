'use client';

import { motion } from 'motion/react';
import React from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Variant C — PEEK-A-BOO (~1.6s at 1x, lightest variant)
 * The phone slides up, a coral tentacle tip grabs its top-left corner,
 * and Tako pulls himself up with a spring, blinks, and waves.
 * Headline words and buttons fade up with a short stagger.
 */
export function EntrancePeek({
  speed,
  skipped,
  reducedMotion,
  subline,
  controls,
  phoneSlot,
  takoSlot,
  chipNewSplitSlot,
  chipScanQrSlot,
  glowSlot,
}: HeroEntranceProps) {
  const s = (t: number) => t / speed;
  const instant = skipped || reducedMotion;

  return (
    <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
      {/* Left Column */}
      <div className="lg:col-span-6">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
          {HEADLINE_WORDS.map((word, idx) => (
            <motion.span
              key={word}
              initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.38), delay: s(0.14 + idx * 0.06), ease: EASE_OUT }
              }
              className="mr-[0.22em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : skipped
                ? { duration: 0 }
                : { duration: s(0.38), delay: s(0.42), ease: EASE_OUT }
          }
          className="mt-4"
        >
          {subline}
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : skipped
                ? { duration: 0 }
                : { duration: s(0.38), delay: s(0.54), ease: EASE_OUT }
          }
          className="mt-7"
        >
          {controls}
        </motion.div>
      </div>

      {/* Right Column */}
      <div
        className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
        style={{ perspective: 1100 }}
      >
        {glowSlot}

        <div className="relative">
          {/* Grabbing tentacle tip wrapping the phone's top-left corner right before Tako pulls up */}
          {!instant && (
            <motion.svg
              aria-hidden="true"
              width="58"
              height="58"
              viewBox="0 0 58 58"
              fill="none"
              initial={{ opacity: 0, scale: 0.6, x: -16, y: 16, rotate: -22 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.05, 1, 0.9],
                x: [-16, 0, 2, -6],
                y: [16, 0, -2, 4],
                rotate: [-22, 4, 0, -10],
              }}
              transition={{
                duration: s(0.68),
                delay: s(0.36),
                times: [0, 0.35, 0.72, 1],
                ease: EASE_OUT,
              }}
              className="pointer-events-none absolute -left-4 top-2 z-30"
            >
              <path
                d="M12 46 C8 30 16 14 34 10 C42 8 48 14 44 21 C40 28 30 24 26 36 C24 43 18 50 12 46 Z"
                fill="#F0627A"
              />
              <circle cx="34" cy="17" r="3.2" fill="#FFB3BC" />
              <circle cx="25" cy="26" r="3" fill="#FFB3BC" />
            </motion.svg>
          )}

          {/* Tako pulls himself up over the top-left corner with a spring */}
          <motion.div
            initial={
              reducedMotion
                ? { opacity: 0 }
                : skipped
                  ? false
                  : { opacity: 0, y: 68, scale: 0.86, rotate: -8 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.68), bounce: 0.28, delay: s(0.58) }
            }
            className="relative z-20"
          >
            {takoSlot}
          </motion.div>

          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.92, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.36), delay: s(0.88), ease: EASE_OUT }
            }
            className="relative z-20"
          >
            {chipNewSplitSlot}
          </motion.div>

          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.92, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.36), delay: s(0.96), ease: EASE_OUT }
            }
            className="relative z-20"
          >
            {chipScanQrSlot}
          </motion.div>

          {/* Phone slides up first */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 42, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.48), delay: s(0.06), ease: EASE_OUT }
            }
            className="relative z-10"
          >
            {phoneSlot}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
