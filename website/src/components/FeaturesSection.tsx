'use client';

import clsx from 'clsx';
import {
  Calculator,
  Clock,
  Moon,
  QrCode,
  ReceiptText,
  UserRound,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import React from 'react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface FeatureCard {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  span?: string;
  tint: 'coral' | 'teal' | 'lavender' | 'gold';
}

// Only features verified in Tako's actual codebase are listed here.
// TODO: If multi-currency selection is added to Tako later, update the PHP card below.
const FEATURES: FeatureCard[] = [
  {
    title: 'Equally, by receipt items, or custom amounts',
    body: 'Split a bill evenly, list every dish so friends tap what they had, or type exact peso amounts per person.',
    icon: ReceiptText,
    span: 'md:col-span-2',
    tint: 'coral',
  },
  {
    title: 'QR + TAKO- code joining',
    body: 'Show a scannable QR at the table or share a 6-character code so friends hop right into the split.',
    icon: QrCode,
    tint: 'lavender',
  },
  {
    title: 'Philippine Peso (₱) centavo math',
    body: 'Built around integer centavos so uneven totals like ₱1,000 ÷ 3 never lose a single centavo.',
    icon: Calculator,
    tint: 'teal',
  },
  {
    title: 'Settle-up notes for GCash, Maya, bank & cash',
    body: 'Record how friends paid you back so everyone knows who already sent their share.',
    icon: Wallet,
    span: 'md:col-span-2',
    tint: 'gold',
  },
  {
    title: 'Works offline & auto-syncs',
    body: 'No signal inside the restaurant? Create splits, add expenses, and mark friends paid offline — Tako syncs when you reconnect.',
    icon: WifiOff,
    span: 'md:col-span-2',
    tint: 'teal',
  },
  {
    title: 'Guest mode included',
    body: 'Try Tako right away without creating an account, then sign up anytime to keep your history across devices.',
    icon: UserRound,
    tint: 'coral',
  },
  {
    title: 'Activity history',
    body: 'See every new expense, joined friend, and settlement in one chronological feed.',
    icon: Clock,
    tint: 'lavender',
  },
  {
    title: 'Dark & light mode',
    body: 'Follows your phone theme automatically, or flip between warm cream and deep plum anytime.',
    icon: Moon,
    span: 'md:col-span-2',
    tint: 'gold',
  },
];

const TINT_STYLES: Record<FeatureCard['tint'], string> = {
  coral: 'bg-[var(--coral-soft)] text-[var(--coral-accent)]',
  teal: 'bg-[var(--teal-soft)] text-[var(--teal)]',
  lavender: 'bg-[var(--lavender-soft)] text-[var(--lavender)]',
  gold: 'bg-[var(--gold-soft)] text-[var(--ink)]',
};

// Non-uniform delays (choreograph skill rule: avoid mechanical uniform metronome)
const STAGGER_DELAYS = [0, 0.06, 0.11, 0.14, 0.18, 0.21, 0.23, 0.25];

export function FeaturesSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Everything your barkada needs, nothing bloated.
          </h2>
          <p className="mt-3 text-base text-[var(--mute)] sm:text-lg">
            Built for real Philippine dinners, roommates, and weekend trips.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:mt-12">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.article
                key={feat.title}
                initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.38,
                  delay: reducedMotion ? 0 : STAGGER_DELAYS[idx] ?? 0.2,
                  ease: EASE_OUT,
                }}
                className={clsx(
                  'tako-lift rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6',
                  feat.span
                )}
              >
                <div
                  className={clsx(
                    'inline-flex h-11 w-11 items-center justify-center rounded-xl',
                    TINT_STYLES[feat.tint]
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.02em] text-[var(--ink)]">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mute)] sm:text-base">
                  {feat.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
