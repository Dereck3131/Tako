'use client';

import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import { AppScreen, type AppScreenName } from './AppScreen';
import { PhoneMockup } from './PhoneMockup';
import { ReceiptLineHeader } from './ReceiptThread';
import { type MascotMood, TakoMascot } from './TakoMascot';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface StepDef {
  id: string;
  code: string;
  stepNum: string;
  title: string;
  body: string;
  note: string;
  screen: AppScreenName;
  mood: MascotMood;
  desktopPos: string;
  tilt: string;
}

const STEPS: StepDef[] = [
  {
    id: 'step-create',
    code: '01',
    stepNum: 'Step 1',
    title: 'Enter the bill and add your barkada.',
    body: 'Name the split, type the peso total, and choose equal shares, receipt items, or custom amounts.',
    note: 'equal, items, or custom',
    screen: 'new-split',
    mood: 'happy',
    desktopPos: 'left-0 top-6',
    tilt: '-rotate-1',
  },
  {
    id: 'step-qr',
    code: '02',
    stepNum: 'Step 2',
    title: 'Share a QR. Everyone joins.',
    body: 'Tako creates a scannable QR and a short TAKO- code to pass around the table or drop in chat.',
    note: 'ipasa lang sa mesa',
    screen: 'split-ready',
    mood: 'peeking',
    desktopPos: 'right-0 top-24',
    tilt: 'rotate-1',
  },
  {
    id: 'step-scan',
    code: '03',
    stepNum: 'Step 3',
    title: 'Scan or enter a code to hop in.',
    body: 'Friends scan the code, pick what they ordered, see their share, and mark themselves settled.',
    note: 'tapos na, walang drama',
    screen: 'scan-to-join',
    mood: 'celebrating',
    desktopPos: 'left-2 bottom-10',
    tilt: 'rotate-1',
  },
];

/**
 * Section 3 — "Three steps" Centered Stage:
 * Centered phone surrounded by the 3 step cards on curved connector lines (desktop).
 * Active step highlights and crossfades the phone screen; stacks cleanly on mobile.
 */
export function HowItWorksSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  const current = STEPS[activeIndex] ?? STEPS[0];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative overflow-x-clip bg-[var(--bg)] py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ReceiptLineHeader
          code="02"
          label="Splitting 3 ways"
          amount="₱0 awkwardness"
          className="mx-auto max-w-3xl"
        />

        {/* Centered Heading */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <h2
            id="how-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,5vw,3.6rem)] font-black leading-[1.03] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Three taps from receipt to settled.
          </h2>
          <p className="mt-3 text-base text-[var(--mute)] sm:text-lg">
            Tap any step around the phone to preview how Tako handles the table.
          </p>
        </div>

        {/* Centered Phone + Orbital Floating Step Cards (Desktop) */}
        <div className="relative mx-auto mt-12 max-w-5xl lg:mt-14 lg:min-h-[640px] lg:flex lg:items-center lg:justify-center">
          {/* Desktop curved connector lines joining the 3 step cards to the center phone */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 620"
            fill="none"
            className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
          >
            {/* Step 1 (top-left) -> phone */}
            <path
              d="M 290 120 C 350 120 370 190 400 210"
              stroke={activeIndex === 0 ? 'var(--cta-bg)' : 'var(--border)'}
              strokeWidth={activeIndex === 0 ? '3' : '2'}
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
            {/* Step 2 (top-right) -> phone */}
            <path
              d="M 710 210 C 650 210 630 250 600 270"
              stroke={activeIndex === 1 ? 'var(--cta-bg)' : 'var(--border)'}
              strokeWidth={activeIndex === 1 ? '3' : '2'}
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
            {/* Step 3 (bottom-left) -> phone */}
            <path
              d="M 295 490 C 350 490 370 430 400 410"
              stroke={activeIndex === 2 ? 'var(--cta-bg)' : 'var(--border)'}
              strokeWidth={activeIndex === 2 ? '3' : '2'}
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Phone + Reactive Tako Mood */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.mood}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, scale: 0.94, y: -4 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  <TakoMascot mood={current.mood} size={64} />
                </motion.div>
              </AnimatePresence>
              <span className="font-[family-name:var(--font-hand)] text-2xl font-bold text-[var(--coral-accent)]">
                {current.note}
              </span>
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

          {/* Desktop 3 Floating Step Cards around the phone */}
          {STEPS.map((step, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                aria-pressed={isActive}
                className={clsx(
                  'tako-press absolute z-20 hidden w-[278px] rounded-2xl border-2 p-5 text-left transition-[transform,border-color,background-color] duration-200 lg:block',
                  step.desktopPos,
                  step.tilt,
                  isActive
                    ? 'border-[#2B1B3D] bg-[var(--surface)] shadow-[var(--card-shadow)] ring-2 ring-[var(--cta-bg)]/40 dark:border-[var(--coral)]'
                    : 'border-[var(--border)] bg-[var(--surface)]/95 shadow-[var(--card-shadow-sm)] hover:border-[var(--coral)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase text-[var(--coral-accent)] tabular-nums">
                    {step.code} · {step.stepNum}
                  </span>
                  {isActive && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--cta-bg)]" aria-hidden="true" />
                  )}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-black leading-snug text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--mute)]">{step.body}</p>
              </button>
            );
          })}

          {/* Mobile Stacked Steps under the phone (no pinning) */}
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 lg:hidden">
            {STEPS.map((step, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-pressed={isActive}
                  className={clsx(
                    'tako-press w-full rounded-2xl border-2 p-4 text-left',
                    isActive
                      ? 'border-[#2B1B3D] bg-[var(--surface)] shadow-[var(--card-shadow-sm)] dark:border-[var(--coral)]'
                      : 'border-[var(--border)] bg-[var(--surface)]/80'
                  )}
                >
                  <span className="font-mono text-xs font-black uppercase text-[var(--coral-accent)] tabular-nums">
                    {step.code} · {step.stepNum}
                  </span>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-black text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--mute)]">{step.body}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
