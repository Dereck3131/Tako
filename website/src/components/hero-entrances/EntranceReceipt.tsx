'use client';

import { motion } from 'motion/react';
import React from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Variant D — RECEIPT TEAR (~1.85s at 1x)
 * A narrow receipt strip drops above the headline, a coral tentacle sweeps across
 * and tears it, and the torn pieces land as the real headline words with a staggered spring.
 * Then the phone rises and Tako does the Peek-a-Boo pull-up.
 */
export function EntranceReceipt({
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
      {/* Left Column: Receipt Tear into Real Headline Words */}
      <div className="relative lg:col-span-6">
        {/* Ephemeral narrow receipt strip + tearing tentacle */}
        {!instant && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 left-0 z-20 flex items-center"
          >
            {/* Left torn half */}
            <motion.svg
              width="124"
              height="44"
              viewBox="0 0 124 44"
              fill="none"
              initial={{ opacity: 0, y: -42, rotate: -2 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [-42, 0, 10, 26],
                x: [0, 0, -14, -22],
                rotate: [-2, 0, -8, -14],
              }}
              transition={{
                duration: s(0.76),
                times: [0, 0.32, 0.65, 1],
                ease: EASE_OUT,
              }}
            >
              <path
                d="M4 4 H116 L112 12 L118 22 L112 32 L116 40 H4 Z"
                fill="#FFFDF9"
                stroke="#2B1B3D"
                strokeWidth="2"
              />
              <path d="M16 14 H92 M16 22 H74 M16 30 H84" stroke="#2B1B3D" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
            </motion.svg>

            {/* Right torn half */}
            <motion.svg
              width="124"
              height="44"
              viewBox="0 0 124 44"
              fill="none"
              className="-ml-2"
              initial={{ opacity: 0, y: -42, rotate: 2 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [-42, 0, 12, 30],
                x: [0, 0, 18, 28],
                rotate: [2, 0, 9, 15],
              }}
              transition={{
                duration: s(0.76),
                times: [0, 0.32, 0.65, 1],
                ease: EASE_OUT,
              }}
            >
              <path
                d="M8 4 H120 V40 H8 L4 32 L10 22 L4 12 Z"
                fill="#FFFDF9"
                stroke="#2B1B3D"
                strokeWidth="2"
              />
              <path d="M22 14 H102 M22 22 H84 M22 30 H96" stroke="#D92D4B" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            </motion.svg>

            {/* Sweeping coral tentacle tip doing the tear */}
            <motion.svg
              width="66"
              height="36"
              viewBox="0 0 66 36"
              fill="none"
              className="absolute left-20 top-1"
              initial={{ opacity: 0, x: -48, rotate: -14 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [-48, 8, 56, 72],
                rotate: [-14, 6, 12, 18],
              }}
              transition={{
                duration: s(0.5),
                delay: s(0.24),
                times: [0, 0.3, 0.72, 1],
                ease: EASE_OUT,
              }}
            >
              <path
                d="M4 22 C18 8 40 6 58 14 C64 17 62 27 54 27 C38 26 22 28 8 31 Z"
                fill="#FF7A8A"
              />
              <circle cx="46" cy="19" r="3" fill="#FFB3BC" />
              <circle cx="34" cy="21" r="2.6" fill="#FFB3BC" />
            </motion.svg>
          </div>
        )}

        {/* Real headline words landing from the torn receipt */}
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
          {HEADLINE_WORDS.map((word, idx) => (
            <motion.span
              key={word}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : skipped
                    ? false
                    : { opacity: 0, y: -22, rotate: idx % 2 === 0 ? -4 : 4, scale: 0.92 }
              }
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        duration: s(0.52),
                        bounce: 0.22,
                        delay: s(0.52 + idx * 0.08),
                      }
              }
              className="mr-[0.22em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : skipped
                ? { duration: 0 }
                : { duration: s(0.4), delay: s(0.86), ease: EASE_OUT }
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
                : { duration: s(0.4), delay: s(0.98), ease: EASE_OUT }
          }
          className="mt-7"
        >
          {controls}
        </motion.div>
      </div>

      {/* Right Column: Phone rises, then Tako peeks up */}
      <div
        className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
        style={{ perspective: 1100 }}
      >
        {glowSlot}

        <div className="relative">
          {/* Tako peeks up over top-left corner after phone rises */}
          <motion.div
            initial={
              reducedMotion
                ? { opacity: 0 }
                : skipped
                  ? false
                  : { opacity: 0, y: 64, scale: 0.86, rotate: -8 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.64), bounce: 0.26, delay: s(1.12) }
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
                  : { duration: s(0.36), delay: s(1.32), ease: EASE_OUT }
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
                  : { duration: s(0.36), delay: s(1.4), ease: EASE_OUT }
            }
            className="relative z-20"
          >
            {chipScanQrSlot}
          </motion.div>

          {/* Phone rises after receipt tear lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 38, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.46), delay: s(0.78), ease: EASE_OUT }
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
