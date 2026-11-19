'use client';

import { motion } from 'motion/react';
import React, { useRef } from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function PesoCoinSvg({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      {/* Brand coral outer bevel */}
      <circle cx="28" cy="28" r="25" fill="#FF7A8A" stroke="#2B1B3D" strokeWidth="2.8" />
      {/* Warm gold face */}
      <circle cx="28" cy="28" r="20" fill="#FFC857" stroke="#E09A1B" strokeWidth="1.8" />
      {/* Subtle top-left specular highlight */}
      <path
        d="M15 21 C18 14 25 11 33 12"
        stroke="#FFF4CC"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <text
        x="28"
        y="36"
        textAnchor="middle"
        fill="#2B1B3D"
        fontSize="24"
        fontWeight="900"
        fontFamily="var(--font-display), sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}

/**
 * Variant A — COIN SPLIT (~1.55s at 1x)
 * A big coral-gold ₱ coin drops in and splits into 3 smaller coins that fly to
 * "New split", "Scan QR", and Tako's shoulder as Tako pops up to catch the last coin.
 * Headline and buttons rise cleanly as the coins land.
 */
export function EntranceCoin({
  speed,
  skipped,
  reducedMotion,
  onEntranceComplete,
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
  const completedRef = useRef(false);

  const handleFinalComplete = () => {
    if (completedRef.current || instant) return;
    completedRef.current = true;
    onEntranceComplete?.();
  };

  return (
    <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
      {/* Left Column: Headline + Subline + Controls (always laid out in final space) */}
      <div className="lg:col-span-6">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
          {HEADLINE_WORDS.map((word, idx) => (
            <motion.span
              key={word}
              initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.38), delay: s(0.62 + idx * 0.06), ease: EASE_OUT }
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
                : { duration: s(0.4), delay: s(0.92), ease: EASE_OUT }
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
                : { duration: s(0.42), delay: s(1.06), ease: EASE_OUT }
          }
          onAnimationComplete={handleFinalComplete}
          className="mt-7"
        >
          {controls}
        </motion.div>
      </div>

      {/* Right Column: Phone + Coral-Gold Coin Split Props + Tako */}
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
              {/* Crisp coral-gold split flash ring right when master coin splits */}
              <motion.div
                className="absolute h-20 w-20 rounded-full border-[3px] border-[#FF7A8A]"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.55, 1.9] }}
                transition={{
                  duration: s(0.38),
                  delay: s(0.32),
                  times: [0, 0.35, 1],
                  ease: EASE_OUT,
                }}
              />

              {/* Big master ₱ coin drops in and splits cleanly */}
              <motion.div
                initial={{ opacity: 0, y: -150, scale: 0.92, rotate: -16 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [-150, -6, 0, 0],
                  scale: [0.92, 1.14, 1.04, 0.65],
                  rotate: [-16, 6, 0, 0],
                }}
                transition={{
                  duration: s(0.46),
                  times: [0, 0.48, 0.78, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={72} />
              </motion.div>

              {/* Split coin #1 -> flies to "New split" chip (top-right) */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.55 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, 74, 134],
                  y: [0, -76, -126],
                  scale: [0.65, 1.05, 0.78],
                  rotate: [0, 120, 220],
                }}
                transition={{
                  duration: s(0.54),
                  delay: s(0.34),
                  times: [0, 0.22, 0.84, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={38} />
              </motion.div>

              {/* Split coin #2 -> flies to "Scan QR" chip (bottom-left) */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.55 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, -78, -132],
                  y: [0, 68, 130],
                  scale: [0.65, 1.05, 0.78],
                  rotate: [0, -110, -210],
                }}
                transition={{
                  duration: s(0.56),
                  delay: s(0.38),
                  times: [0, 0.22, 0.84, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={38} />
              </motion.div>

              {/* Split coin #3 -> arcs to Tako's top-left shoulder as he catches it */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.55 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [0, -52, -108],
                  y: [0, -136, -182],
                  scale: [0.65, 1.08, 0.82],
                  rotate: [0, 95, 190],
                }}
                transition={{
                  duration: s(0.62),
                  delay: s(0.42),
                  times: [0, 0.22, 0.86, 1],
                  ease: EASE_OUT,
                }}
              >
                <PesoCoinSvg size={40} />
              </motion.div>
            </div>
          )}

          {/* Tako pops up to catch the 3rd coin */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 56, scale: 0.88 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.62), bounce: 0.28, delay: s(0.58) }
            }
            className="relative z-20"
          >
            {takoSlot}
          </motion.div>

          {/* Chip 1 pops as coin #1 lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.86, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.42), bounce: 0.26, delay: s(0.76) }
            }
            className="relative z-20"
          >
            {chipNewSplitSlot}
          </motion.div>

          {/* Chip 2 pops as coin #2 lands */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.86, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { type: 'spring', duration: s(0.42), bounce: 0.26, delay: s(0.84) }
            }
            className="relative z-20"
          >
            {chipScanQrSlot}
          </motion.div>

          {/* Phone rises right away so hero is never blank */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 24, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.44), delay: s(0.08), ease: EASE_OUT }
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
