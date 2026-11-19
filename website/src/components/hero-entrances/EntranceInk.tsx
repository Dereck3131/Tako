'use client';

import { motion } from 'motion/react';
import React, { useRef } from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Overlapping organic coral ink blobs (no SVG blur filters, no dark crimson/purple/gray).
 * Centered near Tako's shoulder; peaks at ~55% hero coverage for ~140ms then wipes away.
 */
const INK_BLOBS = [
  // Main core blob (mascot body coral)
  { cx: 56, cy: 46, r: 23, color: '#FF7A8A', dx: 0, dy: 0, delay: 0 },
  // Upper-left organic lobe (soft coral)
  { cx: 38, cy: 36, r: 19, color: '#FF8E9C', dx: -14, dy: -8, delay: 0.03 },
  // Lower-left lobe (lighter peach-coral edge — never gray/muddy)
  { cx: 34, cy: 56, r: 17, color: '#FFA4B0', dx: -16, dy: 8, delay: 0.05 },
  // Upper-right lobe
  { cx: 70, cy: 34, r: 18, color: '#FF8595', dx: 12, dy: -10, delay: 0.02 },
  // Lower-right lobe
  { cx: 68, cy: 60, r: 16, color: '#FF98A6', dx: 10, dy: 12, delay: 0.04 },
  // Mid-left soft highlight lobe
  { cx: 48, cy: 54, r: 14, color: '#FFB6BF', dx: -6, dy: 5, delay: 0.06 },
  // Bright coral-pink specular highlight near center
  { cx: 55, cy: 40, r: 10, color: '#FFD0D6', dx: -2, dy: -4, delay: 0.04 },
] as const;

/**
 * Variant B — INK REVEAL (<1.6s at 1x)
 * Brand coral organic ink blobs expand from Tako's position to ~55% coverage
 * for <=150ms, then wipe away via clip-path. Headline, phone, and buttons are
 * visible behind the thinning coral ink (never stray fragments), and Tako
 * surfaces from the ink with a spring.
 */
export function EntranceInk({
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
    <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
      {/* Organic brand-coral ink cloud scoped inside hero (nav & bg visible from frame 0) */}
      {!instant && (
        <motion.div
          aria-hidden="true"
          initial={{
            clipPath: 'circle(90% at 58% 46%)',
            opacity: 1,
          }}
          animate={{
            clipPath: [
              'circle(90% at 58% 46%)',
              'circle(90% at 58% 46%)',
              'circle(0% at 62% 44%)',
            ],
            opacity: [1, 0.92, 0],
          }}
          transition={{
            duration: s(0.98),
            times: [0, 0.5, 1],
            ease: EASE_OUT,
          }}
          className="pointer-events-none absolute -inset-x-4 -inset-y-8 z-30 overflow-hidden"
        >
          <div className="relative h-full w-full">
            {INK_BLOBS.map((blob, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${blob.cx}%`,
                  top: `${blob.cy}%`,
                  width: `${blob.r * 2}vw`,
                  height: `${blob.r * 2}vw`,
                  maxWidth: `${blob.r * 15}px`,
                  maxHeight: `${blob.r * 15}px`,
                  minWidth: `${blob.r * 7}px`,
                  minHeight: `${blob.r * 7}px`,
                  marginLeft: `calc(-0.5 * clamp(${blob.r * 7}px, ${blob.r * 2}vw, ${blob.r * 15}px))`,
                  marginTop: `calc(-0.5 * clamp(${blob.r * 7}px, ${blob.r * 2}vw, ${blob.r * 15}px))`,
                  background: `radial-gradient(circle at 42% 38%, ${blob.color} 0%, ${blob.color} 68%, rgba(255, 122, 138, 0) 100%)`,
                }}
                initial={{ opacity: 0, scale: 0.08, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.94, 0.92, 0.52, 0],
                  scale: [0.08, 1.0, 1.04, 0.86, 0.45],
                  x: [0, blob.dx, blob.dx * 1.15, blob.dx * 0.6, 0],
                  y: [0, blob.dy, blob.dy * 1.15, blob.dy * 0.6, 0],
                }}
                transition={{
                  duration: s(0.92),
                  delay: s(blob.delay),
                  times: [0, 0.36, 0.52, 0.78, 1],
                  ease: EASE_OUT,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Hero content laid out in final space from frame 0; revealed cleanly behind thinning ink */}
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-6">
          <motion.h1
            initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.48), delay: s(0.18), ease: EASE_OUT }
            }
            className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            {HEADLINE_WORDS.map((word) => (
              <span key={word} className="mr-[0.22em] inline-block">
                {word}
              </span>
            ))}
          </motion.h1>

          <motion.div
            initial={reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.44), delay: s(0.32), ease: EASE_OUT }
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
                  : { duration: s(0.44), delay: s(0.44), ease: EASE_OUT }
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
            {/* Tako surfaces out of the receding coral ink with a spring */}
            <motion.div
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : skipped
                    ? false
                    : { opacity: 0, y: 58, scale: 0.84, rotate: -6 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { type: 'spring', duration: s(0.68), bounce: 0.28, delay: s(0.46) }
              }
              className="relative z-20"
            >
              {takoSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.9, y: 8 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.34), delay: s(0.76), ease: EASE_OUT }
              }
              className="relative z-20"
            >
              {chipNewSplitSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, scale: 0.9, y: 8 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.34), delay: s(0.84), ease: EASE_OUT }
              }
              onAnimationComplete={handleFinalComplete}
              className="relative z-20"
            >
              {chipScanQrSlot}
            </motion.div>

            <motion.div
              initial={
                reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 18, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : { duration: s(0.46), delay: s(0.24), ease: EASE_OUT }
              }
              className="relative z-10"
            >
              {phoneSlot}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
