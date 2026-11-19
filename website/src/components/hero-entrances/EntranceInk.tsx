'use client';

import { motion } from 'motion/react';
import React from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Variant B — INK REVEAL (~1.75s at 1x)
 * Tako squirts a coral ink cloud that spreads across the hero and wipes away
 * via clip-path (no full-screen blur) to reveal the headline, phone, and buttons.
 * Tako surfaces from the ink with a spring.
 */
export function EntranceInk({
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
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
      {/* Ephemeral coral ink cloud overlay that expands then wipes away via clip-path */}
      {!instant && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0.96, clipPath: 'circle(8% at 68% 46%)' }}
          animate={{
            opacity: [0.96, 0.96, 0.92, 0],
            clipPath: [
              'circle(8% at 68% 46%)',
              'circle(95% at 55% 48%)',
              'circle(140% at 50% 50%)',
              'circle(0% at 15% 12%)',
            ],
          }}
          transition={{
            duration: s(1.18),
            times: [0, 0.36, 0.56, 1],
            ease: EASE_OUT,
          }}
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            background:
              'radial-gradient(circle at 65% 45%, #FF7A8A 0%, #D92D4B 52%, #2B1B3D 100%)',
          }}
        />
      )}

      {/* Content revealed via circular clip-path sweep */}
      <motion.div
        initial={
          reducedMotion
            ? { opacity: 0 }
            : skipped
              ? false
              : { clipPath: 'circle(0% at 68% 46%)', opacity: 0.95 }
        }
        animate={
          reducedMotion
            ? { opacity: 1 }
            : { clipPath: 'circle(150% at 50% 50%)', opacity: 1 }
        }
        transition={
          reducedMotion
            ? { duration: 0.2 }
            : skipped
              ? { duration: 0 }
              : { duration: s(0.95), delay: s(0.32), ease: EASE_OUT }
        }
        className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8"
      >
        {/* Left Column */}
        <div className="lg:col-span-6">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
            {HEADLINE_WORDS.map((word) => (
              <span key={word} className="mr-[0.22em] inline-block">
                {word}
              </span>
            ))}
          </h1>

          <div className="mt-4">{subline}</div>
          <div className="mt-7">{controls}</div>
        </div>

        {/* Right Column */}
        <div
          className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
          style={{ perspective: 1100 }}
        >
          {glowSlot}

          <div className="relative">
            {/* Tako surfaces out of the receding ink with a spring */}
            <motion.div
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : skipped
                    ? false
                    : { opacity: 0, y: 64, scale: 0.86, rotate: -6 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { type: 'spring', duration: s(0.72), bounce: 0.26, delay: s(0.78) }
              }
              className="relative z-20"
            >
              {takoSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.9 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.36), delay: s(0.92), ease: EASE_OUT }
              }
              className="relative z-20"
            >
              {chipNewSplitSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.9 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.36), delay: s(1.0), ease: EASE_OUT }
              }
              className="relative z-20"
            >
              {chipScanQrSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0.8, scale: 0.96 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.55), delay: s(0.45), ease: EASE_OUT }
              }
              className="relative z-10"
            >
              {phoneSlot}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
