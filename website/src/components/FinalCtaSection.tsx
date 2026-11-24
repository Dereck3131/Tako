'use client';

import { motion, useReducedMotion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { DownloadBlock } from './DownloadBlock';
import { ReceiptLineHeader } from './ReceiptThread';
import { TakoMascot } from './TakoMascot';

// Narrowed palette: coral, cream, gold only (no mint/lavender)
const CONFETTI_PIECES = [
  { x: -124, y: -64, rot: -28, color: '#E5405E', w: 12, h: 7, delay: 0 },
  { x: -80, y: -102, rot: 22, color: '#FFC857', w: 11, h: 7, delay: 0.04 },
  { x: -34, y: -116, rot: -16, color: '#FFF6EE', w: 11, h: 7, delay: 0.06 },
  { x: 32, y: -112, rot: 34, color: '#FF7A8A', w: 12, h: 7, delay: 0.03 },
  { x: 84, y: -96, rot: -24, color: '#FFC857', w: 11, h: 7, delay: 0.05 },
  { x: 126, y: -60, rot: 30, color: '#FFF6EE', w: 10, h: 7, delay: 0.07 },
  { x: -98, y: 12, rot: 42, color: '#FF7A8A', w: 10, h: 6, delay: 0.09 },
  { x: 102, y: 14, rot: -38, color: '#FFC857', w: 11, h: 6, delay: 0.08 },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Section 8 — Full-bleed deep-plum color block with grain, giant display type,
 * and an actively celebrating Tako (jump + squash-and-stretch + confetti burst
 * on view and on click/tap).
 */
export function FinalCtaSection({
  downloadSlot,
}: {
  downloadSlot?: React.ReactNode;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // Trigger a fresh celebration burst whenever the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setBurstKey((k) => k + 1);
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const triggerCelebrate = () => {
    if (reducedMotion) return;
    setBurstKey((k) => k + 1);
  };

  return (
    <section
      id="download"
      ref={sectionRef}
      aria-labelledby="final-cta-heading"
      className="tako-grain relative overflow-x-clip bg-[#150C20] py-20 text-[#FFF6EE] sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ReceiptLineHeader code="TOTAL" label="Ready to settle" amount="1 tap" onDark />

        <div className="mt-12 flex flex-col items-center text-center">
          {/* Celebrating Tako + confetti burst (fires on scroll-in and on tap/click) */}
          <button
            type="button"
            onClick={triggerCelebrate}
            aria-label="Celebrate with Tako"
            className="relative mx-auto flex h-44 w-44 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF7A8A]"
          >
            {!reducedMotion && burstKey > 0 && (
              <React.Fragment key={burstKey}>
                {CONFETTI_PIECES.map((piece, idx) => (
                  <motion.span
                    key={idx}
                    aria-hidden="true"
                    initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.5 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: piece.x,
                      y: piece.y,
                      rotate: piece.rot,
                      scale: [0.5, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.05,
                      delay: piece.delay,
                      ease: EASE_OUT,
                    }}
                    className="pointer-events-none absolute rounded-sm"
                    style={{
                      width: piece.w,
                      height: piece.h,
                      backgroundColor: piece.color,
                    }}
                  />
                ))}
              </React.Fragment>
            )}

            <motion.div
              key={reducedMotion ? 'static' : `jump-${burstKey}`}
              animate={
                reducedMotion || !inView
                  ? { y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
                  : {
                      y: [0, -20, 0, -10, 0],
                      scaleX: [1, 0.94, 1.07, 0.98, 1],
                      scaleY: [1, 1.08, 0.93, 1.03, 1],
                      rotate: [0, -6, 6, -3, 0],
                    }
              }
              transition={
                reducedMotion || !inView
                  ? { duration: 0.2 }
                  : {
                      duration: 0.95,
                      repeat: Infinity,
                      repeatDelay: 2.8,
                      ease: 'easeInOut',
                    }
              }
              style={{ transformOrigin: 'center bottom' }}
            >
              <TakoMascot mood="celebrating" size={148} />
            </motion.div>
          </button>

          <h2
            id="final-cta-heading"
            className="mx-auto mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.5rem,7vw,5.25rem)] font-black leading-[0.96] tracking-[-0.035em] text-balance"
          >
            Split the bill. Keep the friends.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-[#D2C4E3] sm:text-lg">
            Download Tako on Android and make your next barkada dinner the easiest one to settle.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4">
            {downloadSlot ?? <DownloadBlock variant="final" surface="plum" />}
          </div>
        </div>
      </div>
    </section>
  );
}
