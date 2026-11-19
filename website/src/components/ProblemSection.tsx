'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { TakoMascot } from './TakoMascot';

const RECEIPT_LINES = [
  { item: 'Tonkotsu Ramen ×2', price: '₱780.00' },
  { item: 'Gyoza (6 pcs)', price: '₱280.00' },
  { item: 'Chashu Rice Bowl ×2', price: '₱640.00' },
  { item: 'Karaage Platter', price: '₱420.00' },
  { item: 'Matcha Iced Tea ×4', price: '₱360.00' },
];

const CHOPPED_SHARES = [
  { name: 'You', amount: '₱620', color: '#FF7A8A', x: -56, y: -10, rot: -5 },
  { name: 'Mika', amount: '₱620', color: '#2EC4B6', x: 56, y: -6, rot: 4 },
  { name: 'Ken', amount: '₱620', color: '#B9A5E8', x: -48, y: 12, rot: -3 },
  { name: 'Jules', amount: '₱620', color: '#FFC857', x: 48, y: 10, rot: 5 },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  const useScrollScrub = isDesktop && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const receiptScaleY = useTransform(scrollYProgress, [0.12, 0.45], [0.68, 1]);
  const receiptY = useTransform(scrollYProgress, [0.12, 0.45], [24, 0]);
  const chipsProgress = useTransform(scrollYProgress, [0.42, 0.68], [0, 1]);
  const chipOpacity = useTransform(scrollYProgress, [0.38, 0.56], [0, 1]);
  const chipLeftX = useTransform(chipsProgress, [0, 1], [0, -10]);
  const chipRightX = useTransform(chipsProgress, [0, 1], [0, 10]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="problem-heading"
      className="relative py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left: Story Copy + Sad Tako */}
          <div className="lg:col-span-5">
            <h2
              id="problem-heading"
              className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)] text-balance"
            >
              The bill lands. Everyone suddenly checks their phone.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mute)] sm:text-lg">
              &ldquo;Sino ulit nag-extra rice?&rdquo; One person ends up typing into a calculator
              while the group chat goes quiet for three days.
            </p>

            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <TakoMascot mood="sad" size={76} />
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-display)] text-base font-extrabold text-[var(--ink)]">
                  Mental math shouldn&apos;t ruin dinner.
                </p>
                <p className="mt-0.5 text-sm text-[var(--mute)]">
                  Tako chops the receipt down to the exact centavo so nobody plays treasurer.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Scroll-unrolling receipt + chopped total shares */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto max-w-md">
              <motion.div
                initial={!useScrollScrub && !reducedMotion ? { opacity: 0, y: 18 } : undefined}
                whileInView={!useScrollScrub && !reducedMotion ? { opacity: 1, y: 0 } : undefined}
                viewport={!useScrollScrub ? { once: true, amount: 0.2 } : undefined}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={
                  useScrollScrub
                    ? {
                        scaleY: receiptScaleY,
                        y: receiptY,
                        transformOrigin: 'top center',
                      }
                    : undefined
                }
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)]"
              >
                <div className="flex items-center justify-between border-b border-dashed border-[var(--border)] pb-3">
                  <span className="font-[family-name:var(--font-display)] text-sm font-black uppercase tracking-wider text-[var(--ink)]">
                    Barkada Dinner
                  </span>
                  <span className="text-xs font-semibold text-[var(--mute)] tabular-nums">
                    Table 08 · 4 pax
                  </span>
                </div>

                <ul className="divide-y divide-dashed divide-[var(--border)]/60 py-2">
                  {RECEIPT_LINES.map((line) => (
                    <li
                      key={line.item}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-[var(--ink)]">{line.item}</span>
                      <span className="font-semibold text-[var(--mute)] tabular-nums">
                        {line.price}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex items-baseline justify-between border-t-2 border-[var(--ink)]/15 pt-3">
                  <span className="font-[family-name:var(--font-display)] text-base font-black text-[var(--ink)]">
                    TOTAL
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-2xl font-black text-[var(--cta-bg)] tabular-nums">
                    ₱2,480.00
                  </span>
                </div>
              </motion.div>

              {/* Chopped share pills emerging below the receipt */}
              <motion.div
                initial={!useScrollScrub && !reducedMotion ? { opacity: 0, y: 12 } : undefined}
                whileInView={!useScrollScrub && !reducedMotion ? { opacity: 1, y: 0 } : undefined}
                viewport={!useScrollScrub ? { once: true, amount: 0.25 } : undefined}
                transition={{ duration: 0.4, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
                style={useScrollScrub ? { opacity: chipOpacity } : undefined}
                className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
              >
                {CHOPPED_SHARES.map((share, idx) => (
                  <motion.div
                    key={share.name}
                    style={
                      useScrollScrub
                        ? { x: idx % 2 === 0 ? chipLeftX : chipRightX }
                        : undefined
                    }
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: share.color }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[var(--mute)]">
                        {share.name}
                      </div>
                      <div className="font-[family-name:var(--font-display)] text-sm font-black text-[var(--ink)] tabular-nums">
                        {share.amount}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
