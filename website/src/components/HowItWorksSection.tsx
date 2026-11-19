'use client';

import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import { AppScreen, type AppScreenName } from './AppScreen';
import { PhoneMockup } from './PhoneMockup';
import { type MascotMood, TakoMascot } from './TakoMascot';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface StepDef {
  id: string;
  stepNum: string;
  title: string;
  body: string;
  screen: AppScreenName;
  mood: MascotMood;
}

const STEPS: StepDef[] = [
  {
    id: 'step-create',
    stepNum: 'Step 1',
    title: 'Enter the bill and add your barkada.',
    body: 'Name the split, type the peso total, and choose equal shares, receipt items, or exact custom amounts.',
    screen: 'new-split',
    mood: 'happy',
  },
  {
    id: 'step-qr',
    stepNum: 'Step 2',
    title: 'Share a QR. Everyone joins.',
    body: 'Tako generates a scannable QR and a short TAKO- code so you can pass your phone around the table or drop the code in chat.',
    screen: 'split-ready',
    mood: 'peeking',
  },
  {
    id: 'step-scan',
    stepNum: 'Step 3',
    title: 'Scan or enter a code to hop in.',
    body: 'Friends scan the code, pick what they ordered, see their exact share, and mark themselves settled.',
    screen: 'scan-to-join',
    mood: 'celebrating',
  },
];

export function HowItWorksSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-driven step detection using IntersectionObserver (performant, zero main-thread scroll listener jank)
  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') return;
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, idx) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(idx);
          }
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [reducedMotion]);

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  const current = STEPS[activeIndex] ?? STEPS[0];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2
            id="how-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Three taps from receipt to settled.
          </h2>
          <p className="mt-3 text-base text-[var(--mute)] sm:text-lg">
            Scroll through or tap a step to see how Tako handles the table.
          </p>
        </div>

        {/* Mobile quick step switcher */}
        <div className="mt-6 flex gap-2 lg:hidden" role="tablist" aria-label="How Tako works">
          {STEPS.map((step, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveIndex(idx)}
                className={clsx(
                  'tako-press min-h-11 flex-1 rounded-full border px-3 py-2 text-sm font-bold',
                  active
                    ? 'border-[var(--cta-bg)] bg-[var(--cta-bg)] text-[var(--cta-ink)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                )}
              >
                {step.stepNum}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          {/* Sticky Phone Mockup (Desktop) / Active Phone (Mobile) */}
          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <div className="relative flex flex-col items-center">
              <div className="mb-3 flex items-center gap-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.mood}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, scale: 0.94, y: -4 }}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                  >
                    <TakoMascot mood={current.mood} size={74} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <PhoneMockup>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${current.screen}-${screenTheme}`}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reducedMotion ? undefined : { opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.24, ease: EASE_OUT }}
                    className="h-full w-full"
                  >
                    <AppScreen screen={current.screen} theme={screenTheme} />
                  </motion.div>
                </AnimatePresence>
              </PhoneMockup>
            </div>
          </div>

          {/* 3 Scroll Steps */}
          <div className="space-y-4 lg:col-span-7 lg:space-y-8">
            {STEPS.map((step, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    stepRefs.current[idx] = el;
                  }}
                  className={clsx(
                    'lg:min-h-[260px] lg:flex lg:items-center',
                    idx === STEPS.length - 1 && 'lg:min-h-[220px]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={clsx(
                      'tako-press w-full rounded-2xl border p-6 text-left transition-colors duration-200 sm:p-8',
                      isActive
                        ? 'border-[var(--coral)] bg-[var(--surface)] shadow-[var(--card-shadow)]'
                        : 'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--coral)]/60'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-flex rounded-full px-3 py-1 text-xs font-extrabold tabular-nums',
                        isActive
                          ? 'bg-[var(--coral-soft)] text-[var(--coral-accent)]'
                          : 'bg-[var(--chip)] text-[var(--ink)]'
                      )}
                    >
                      {step.stepNum}
                    </span>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.02em] text-[var(--ink)]">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-lg text-base leading-relaxed text-[var(--mute)]">
                      {step.body}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
