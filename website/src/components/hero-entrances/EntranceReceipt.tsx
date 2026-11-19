'use client';

import { motion } from 'motion/react';
import React, { useRef } from 'react';

import { HEADLINE_WORDS, type HeroEntranceProps } from './types';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * 4 torn paper scraps that fly from the receipt tear midpoint toward the 4 headline words.
 */
const TORN_SCRAPS = [
  { tx: -90, ty: -42, rot: -14, delay: 0.50 },
  { tx: 18, ty: -34, rot: 11, delay: 0.56 },
  { tx: -68, ty: 28, rot: -9, delay: 0.62 },
  { tx: 46, ty: 38, rot: 13, delay: 0.68 },
] as const;

/**
 * Variant D — RECEIPT TEAR (<2.0s at 1x)
 * A tall cream paper receipt (220x420 desktop, 150x286 mobile) with zigzag edges
 * and readable printed lines drops from above with a bounce while the nav, background,
 * and phone outline are already visible. A coral tentacle with sucker dots swipes across,
 * tears the receipt in half, and 4 torn scraps fly into the real DOM headline words
 * with a 60ms staggered spring. Then the phone rises and Tako does the Peek-a-Boo pull-up.
 */
export function EntranceReceipt({
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
      {/* Left Column: Hero-sized Receipt Tear -> Real DOM Headline Words */}
      <div className="relative lg:col-span-6">
        {/* Ephemeral hero-sized receipt (220x420 desktop, 150x286 mobile) + tentacle swipe */}
        {!instant && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-10 z-30 flex items-start justify-center sm:-top-16 lg:justify-start lg:pl-14"
          >
            <div className="relative h-[286px] w-[150px] sm:h-[420px] sm:w-[220px]">
              {/* TOP HALF of the receipt (drops with bounce, then tears up-left) */}
              <motion.svg
                viewBox="0 0 220 218"
                fill="none"
                className="absolute inset-x-0 top-0 h-[52%] w-full drop-shadow-[0_14px_28px_rgba(43,27,61,0.18)]"
                initial={{ opacity: 0, y: -180, rotate: -2 }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  y: [-180, 10, 0, -22, -40],
                  x: [0, 0, 0, -24, -46],
                  rotate: [-2, 1.5, 0, -9, -15],
                }}
                transition={{
                  duration: s(0.86),
                  times: [0, 0.28, 0.44, 0.76, 1],
                  ease: EASE_OUT,
                }}
              >
                {/* Cream receipt body with zigzag top edge and jagged bottom tear edge */}
                <path
                  d="M4 12 L16 4 L28 12 L40 4 L52 12 L64 4 L76 12 L88 4 L100 12 L112 4 L124 12 L136 4 L148 12 L160 4 L172 12 L184 4 L196 12 L208 4 L216 12 V204 L196 212 L176 202 L152 214 L128 202 L104 214 L80 202 L56 214 L32 204 L4 212 Z"
                  fill="#FFFDF7"
                  stroke="#E5D9C3"
                  strokeWidth="2.5"
                />
                {/* Receipt header */}
                <text
                  x="110"
                  y="44"
                  textAnchor="middle"
                  fill="#2B1B3D"
                  fontSize="15"
                  fontWeight="900"
                  letterSpacing="2"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  TAKO TAB
                </text>
                <line x1="22" y1="58" x2="198" y2="58" stroke="#D8CBB3" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Readable line items */}
                <text x="22" y="88" fill="#2B1B3D" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
                  RAMEN YA
                </text>
                <text x="198" y="88" textAnchor="end" fill="#2B1B3D" fontSize="13" fontWeight="800" fontFamily="ui-monospace, monospace">
                  ₱2,480
                </text>
                <text x="22" y="118" fill="#4A3A5C" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
                  GYOZA (x2)
                </text>
                <text x="198" y="118" textAnchor="end" fill="#4A3A5C" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
                  ₱420
                </text>
                <text x="22" y="148" fill="#4A3A5C" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
                  ICED TEA (x4)
                </text>
                <text x="198" y="148" textAnchor="end" fill="#4A3A5C" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
                  ₱360
                </text>
                <line x1="22" y1="176" x2="198" y2="176" stroke="#FF7A8A" strokeWidth="2" strokeDasharray="5 4" opacity="0.7" />
              </motion.svg>

              {/* BOTTOM HALF of the receipt (drops mated to top half, then tears down-right) */}
              <motion.svg
                viewBox="0 0 220 218"
                fill="none"
                className="absolute inset-x-0 bottom-0 h-[52%] w-full drop-shadow-[0_14px_28px_rgba(43,27,61,0.16)]"
                initial={{ opacity: 0, y: -180, rotate: -2 }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  y: [-180, 10, 0, 28, 52],
                  x: [0, 0, 0, 26, 50],
                  rotate: [-2, 1.5, 0, 10, 17],
                }}
                transition={{
                  duration: s(0.86),
                  times: [0, 0.28, 0.44, 0.76, 1],
                  ease: EASE_OUT,
                }}
              >
                {/* Mated jagged top tear edge and zigzag bottom edge */}
                <path
                  d="M4 12 L32 4 L56 14 L80 2 L104 14 L128 2 L152 14 L176 2 L196 12 L216 4 V206 L208 214 L196 206 L184 214 L172 206 L160 214 L148 206 L136 214 L124 206 L112 214 L100 206 L88 214 L76 206 L64 214 L52 206 L40 214 L28 206 L16 214 L4 206 Z"
                  fill="#FFFDF7"
                  stroke="#E5D9C3"
                  strokeWidth="2.5"
                />
                <text x="22" y="56" fill="#2B1B3D" fontSize="15" fontWeight="900" fontFamily="ui-monospace, monospace">
                  TOTAL
                </text>
                <text x="198" y="56" textAnchor="end" fill="#D92D4B" fontSize="16" fontWeight="900" fontFamily="ui-monospace, monospace">
                  ₱3,260
                </text>
                <line x1="22" y1="76" x2="198" y2="76" stroke="#D8CBB3" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="110" y="108" textAnchor="middle" fill="#6E5A82" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
                  SPLIT 4 WAYS • ₱815 EA
                </text>
                {/* Decorative barcode */}
                <g fill="#2B1B3D" opacity="0.22">
                  <rect x="38" y="132" width="4" height="36" />
                  <rect x="46" y="132" width="2" height="36" />
                  <rect x="52" y="132" width="6" height="36" />
                  <rect x="64" y="132" width="3" height="36" />
                  <rect x="72" y="132" width="5" height="36" />
                  <rect x="82" y="132" width="2" height="36" />
                  <rect x="88" y="132" width="7" height="36" />
                  <rect x="100" y="132" width="3" height="36" />
                  <rect x="108" y="132" width="5" height="36" />
                  <rect x="118" y="132" width="2" height="36" />
                  <rect x="124" y="132" width="6" height="36" />
                  <rect x="136" y="132" width="3" height="36" />
                  <rect x="144" y="132" width="5" height="36" />
                  <rect x="154" y="132" width="2" height="36" />
                  <rect x="162" y="132" width="6" height="36" />
                  <rect x="174" y="132" width="4" height="36" />
                </g>
              </motion.svg>

              {/* Crisp coral tear-line flash right along the rip */}
              <motion.svg
                viewBox="0 0 220 20"
                fill="none"
                className="absolute inset-x-0 top-1/2 z-10 h-5 w-full -translate-y-1/2"
                initial={{ opacity: 0, scaleX: 0.1 }}
                animate={{ opacity: [0, 1, 0], scaleX: [0.1, 1.06, 1.12] }}
                transition={{
                  duration: s(0.28),
                  delay: s(0.42),
                  times: [0, 0.45, 1],
                  ease: EASE_OUT,
                }}
              >
                <path
                  d="M4 10 L32 3 L56 15 L80 4 L104 16 L128 4 L152 16 L176 4 L196 14 L216 6"
                  stroke="#FF7A8A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>

              {/* Visible coral tentacle with sucker dots swiping across the receipt */}
              <motion.svg
                viewBox="0 0 180 68"
                fill="none"
                className="absolute left-1/2 top-1/2 z-20 h-14 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-16 sm:w-44"
                initial={{ opacity: 0, x: -130, rotate: -10 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: [-130, -10, 96, 140],
                  rotate: [-10, 4, 10, 16],
                }}
                transition={{
                  duration: s(0.46),
                  delay: s(0.30),
                  times: [0, 0.28, 0.76, 1],
                  ease: EASE_OUT,
                }}
              >
                <path
                  d="M6 42 C38 14 108 10 162 24 C176 28 174 44 156 46 C112 49 58 48 16 56 Z"
                  fill="#FF7A8A"
                  stroke="#2B1B3D"
                  strokeWidth="2.5"
                />
                {/* Sucker dots */}
                <circle cx="144" cy="36" r="5" fill="#FFB8C1" />
                <circle cx="122" cy="38" r="5.5" fill="#FFB8C1" />
                <circle cx="98" cy="40" r="5.5" fill="#FFB8C1" />
                <circle cx="74" cy="42" r="5" fill="#FFB8C1" />
                <circle cx="52" cy="44" r="4.5" fill="#FFB8C1" />
              </motion.svg>

              {/* 4 torn paper scraps visibly flying toward the 4 headline word positions */}
              {TORN_SCRAPS.map((scrap, idx) => (
                <motion.div
                  key={idx}
                  className="absolute left-1/2 top-1/2 z-20 h-6 w-12 -ml-6 -mt-3 rounded-[4px] border border-[#E5D9C3] bg-[#FFFDF7] shadow-sm"
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.7, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: [0, scrap.tx * 0.65, scrap.tx],
                    y: [0, scrap.ty * 0.65, scrap.ty],
                    scale: [0.7, 1.05, 0.8],
                    rotate: [0, scrap.rot, scrap.rot * 1.4],
                  }}
                  transition={{
                    duration: s(0.32),
                    delay: s(scrap.delay),
                    times: [0, 0.35, 0.75, 1],
                    ease: EASE_OUT,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Real DOM headline words springing in as the torn pieces arrive (60ms stagger) */}
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
          {HEADLINE_WORDS.map((word, idx) => (
            <motion.span
              key={word}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : skipped
                    ? false
                    : {
                        opacity: 0,
                        y: idx < 2 ? -24 : 20,
                        x: idx % 2 === 0 ? -16 : 16,
                        rotate: idx % 2 === 0 ? -5 : 5,
                        scale: 0.88,
                      }
              }
              animate={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : skipped
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        duration: s(0.46),
                        bounce: 0.24,
                        delay: s(0.64 + idx * 0.06),
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
                : { duration: s(0.36), delay: s(0.96), ease: EASE_OUT }
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
                : { duration: s(0.36), delay: s(1.06), ease: EASE_OUT }
          }
          className="mt-7"
        >
          {controls}
        </motion.div>
      </div>

      {/* Right Column: Phone outline visible from frame 0 -> phone rises -> Tako Peek-a-Boo */}
      <div
        className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
        style={{ perspective: 1100 }}
      >
        {glowSlot}

        <div className="relative">
          {/* Subtle phone outline visible from frame 0 during receipt drop so screen is never empty */}
          {!instant && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0.65 }}
              animate={{ opacity: [0.65, 0.65, 0] }}
              transition={{
                duration: s(1.18),
                times: [0, 0.76, 1],
                ease: EASE_OUT,
              }}
              className="pointer-events-none absolute inset-0 z-0 rounded-[44px] border-2 border-dashed border-[var(--coral-accent)]/40 bg-[var(--surface)]/25"
            />
          )}

          {/* Grabbing tentacle tip wrapping the phone's top-left corner (same as Variant C) */}
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
                duration: s(0.56),
                delay: s(1.04),
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

          {/* Tako peeks up over top-left corner after phone rises (same as Variant C) */}
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
                  : { type: 'spring', duration: s(0.62), bounce: 0.28, delay: s(1.18) }
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
                  : { duration: s(0.32), delay: s(1.42), ease: EASE_OUT }
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
                  : { duration: s(0.32), delay: s(1.48), ease: EASE_OUT }
            }
            onAnimationComplete={handleFinalComplete}
            className="relative z-20"
          >
            {chipScanQrSlot}
          </motion.div>

          {/* Phone rises cleanly over its outline after the receipt tears */}
          <motion.div
            initial={
              reducedMotion ? { opacity: 0 } : skipped ? false : { opacity: 0, y: 34, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : skipped
                  ? { duration: 0 }
                  : { duration: s(0.42), delay: s(0.84), ease: EASE_OUT }
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
