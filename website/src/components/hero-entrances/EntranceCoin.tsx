'use client';

import { motion } from 'motion/react';
import React from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function PesoCoinSvg({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="#FFC857" stroke="#2B1B3D" strokeWidth="3" />
      <circle cx="24" cy="24" r="15.5" stroke="#E09F1F" strokeWidth="1.8" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fill="#2B1B3D"
        fontSize="22"
        fontWeight="900"
        fontFamily="var(--font-display), sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}

/**
 * Variant A — COIN SPLIT (~1.8s at 1x)
 * A big ₱ coin drops in and splits into 3 smaller coins that fly to "New split",
 * "Scan QR", and Tako's shoulder as Tako pops up to catch the last coin.
 * Headline and buttons rise cleanly as the coins land.
 */
export function EntranceCoin({
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
      {/* Left Column: Headline + Subline + Controls */}
      <div className="lg:col-span-6">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
          {HEADLINE_WORDS.map((word, idx) => (
            <motion.span
              key={word}
              initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.42), delay: s(0.76 + idx * 0.07), ease: EASE_OUT }
              }
              className="mr-[0.22em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : skipped
                ? { duration: 0 }
                : { duration: s(0.44), delay: s(1.06), ease: EASE_OUT }
          }
          className="mt-4"
        >
          {subline}
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : skipped
                ? { duration: 0 }
                : { duration: s(0.44), delay: s(1.2), ease: EASE_OUT }
          }
          className="mt-7"
        >
          {controls}
        </motion.div>
      </div>

      {/* Right Column: Phone + Coin Split Props + Tako */}
      <div
        className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
        style={{ perspective: 1100 }}
      >
        {glowSlot}

        <div className="relative">
          {/* Ephemeral Coin Split choreography props (GPU transform + opacity only) */}
          {!instant && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            >
              {/* Big master ₱ coin drops in and splits */}
              <motion.div
                initial={{ opacity: 0, y: -150, scale: 0.9, rotate: -18 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [-150, -10, -4, -4],
                  scale: [0.9, 1.15, 1.05, 0.72],
                  rotate: [-18, 6, 0, 0],
                }}
                transition={{
                  duration: s(0.54),
                  times: [0, 0.45, 0.78, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={64} />
              </motion.div>

              {/* Split coin #1 -> flies to "New split" chip (top-right) */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, 76, 128],
                  y: [0, -70, -110],
                  scale: [0.6, 1, 0.75],
                  rotate: [0, 120, 220],
                }}
                transition={{
                  duration: s(0.62),
                  delay: s(0.38),
                  times: [0, 0.35, 0.82, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={32} />
              </motion.div>

              {/* Split coin #2 -> flies to "Scan QR" chip (bottom-left) */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, -78, -124],
                  y: [0, 62, 118],
                  scale: [0.6, 1, 0.75],
                  rotate: [0, -110, -210],
                }}
                transition={{
                  duration: s(0.66),
                  delay: s(0.42),
                  times: [0, 0.35, 0.82, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={32} />
              </motion.div>

              {/* Split coin #3 -> arcs to Tako's top-left shoulder as he catches it */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, -56, -108],
                  y: [0, -120, -168],
                  scale: [0.6, 1.05, 0.8],
                  rotate: [0, 95, 190],
                }}
                transition={{
                  duration: s(0.76),
                  delay: s(0.48),
                  times: [0, 0.35, 0.85, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={34} />
              </motion.div>
            </div>
          )}

          {/* Tako pops up to catch the 3rd coin */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 54, scale: 0.88 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.62), bounce: 0.26, delay: s(0.64) }
            }
            className="relative z-20"
          >
            {takoSlot}
          </motion.div>

          {/* Chip 1 pops as coin #1 lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.88, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.44), bounce: 0.24, delay: s(0.84) }
            }
            className="relative z-20"
          >
            {chipNewSplitSlot}
          </motion.div>

          {/* Chip 2 pops as coin #2 lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.88, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.44), bounce: 0.24, delay: s(0.92) }
            }
            className="relative z-20"
          >
            {chipScanQrSlot}
          </motion.div>

          {/* Phone rises smoothly right as master coin lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 26, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.5), delay: s(0.32), ease: EASE_OUT }
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
