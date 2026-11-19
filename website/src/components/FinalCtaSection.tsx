'use client';

import { Download } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import React from 'react';

import { APK_CONFIG } from '@/lib/config';

import { TakoMascot } from './TakoMascot';

const CONFETTI_PIECES = [
  { x: -120, y: -64, rot: -28, color: '#D92D4B', w: 12, h: 7, delay: 0 },
  { x: -78, y: -96, rot: 22, color: '#2EC4B6', w: 10, h: 7, delay: 0.04 },
  { x: -32, y: -108, rot: -16, color: '#FFC857', w: 11, h: 7, delay: 0.06 },
  { x: 30, y: -104, rot: 34, color: '#FF7A8A', w: 12, h: 7, delay: 0.03 },
  { x: 82, y: -90, rot: -24, color: '#B9A5E8', w: 11, h: 7, delay: 0.05 },
  { x: 122, y: -58, rot: 30, color: '#2EC4B6', w: 10, h: 7, delay: 0.07 },
  { x: -96, y: 10, rot: 42, color: '#FFC857', w: 10, h: 6, delay: 0.09 },
  { x: 98, y: 14, rot: -38, color: '#FF7A8A', w: 11, h: 6, delay: 0.08 },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function FinalCtaSection({
  downloadSlot,
}: {
  downloadSlot?: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="download"
      aria-labelledby="final-cta-heading"
      className="border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--plum)] px-6 py-14 text-center text-[#FFF6EE] sm:px-12 sm:py-16">
          {/* Celebrating Tako + one-time confetti burst on first view */}
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
            {!reducedMotion &&
              CONFETTI_PIECES.map((piece, idx) => (
                <motion.span
                  key={idx}
                  aria-hidden="true"
                  initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6 }}
                  whileInView={{
                    opacity: [0, 1, 1, 0],
                    x: piece.x,
                    y: piece.y,
                    rotate: piece.rot,
                    scale: 1,
                  }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.9,
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

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <TakoMascot mood="celebrating" size={148} />
            </motion.div>
          </div>

          <h2
            id="final-cta-heading"
            className="mx-auto mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.5rem)] font-black leading-[1.04] tracking-[-0.03em] text-balance"
          >
            Split the bill. Keep the friends.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-[#D5C7E8] sm:text-lg">
            Download Tako on Android and make your next barkada dinner the easiest one to settle.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            {downloadSlot ?? (
              <a
                href={APK_CONFIG.url}
                download
                className="tako-press inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-[var(--coral)] px-8 text-base font-extrabold text-[#2B1B3D]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Tako for Android
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
