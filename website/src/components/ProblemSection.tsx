'use client';

import React from 'react';

import { ReceiptLineHeader } from './ReceiptThread';
import { TakoMascot } from './TakoMascot';

const RECEIPT_LINES = [
  { item: 'Tonkotsu Ramen ×2', price: '₱780.00' },
  { item: 'Gyoza (6 pcs)', price: '₱280.00' },
  { item: 'Chashu Rice Bowl ×2', price: '₱640.00' },
  { item: 'Karaage Platter', price: '₱420.00' },
  { item: 'Matcha Iced Tea ×4', price: '₱360.00' },
];

const CHOPPED_SHARES = [
  { name: 'You', amount: '₱620', bg: '#FF7A8A', ink: '#2B1B3D', rot: '-2deg' },
  { name: 'Mika', amount: '₱620', bg: '#FFC857', ink: '#2B1B3D', rot: '1.5deg' },
  { name: 'Ken', amount: '₱620', bg: '#2B1B3D', ink: '#FFF6EE', rot: '-1.5deg' },
  { name: 'Jules', amount: '₱620', bg: '#F5EFE2', ink: '#2B1B3D', rot: '2deg' },
];

/**
 * Section 2 — "The bill lands" Centered Stage:
 * Centered headline above, centered sample thermal receipt in the middle,
 * surrounded by 4 tilted annotation cards on curved connector lines.
 */
export function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="relative overflow-x-clip bg-[var(--bg)] py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ReceiptLineHeader
          code="01"
          label="The table silence"
          amount="₱2,480.00"
          className="mx-auto max-w-3xl"
        />

        {/* Centered Headline */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <h2
            id="problem-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,5.4vw,3.9rem)] font-black leading-[1.02] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            The bill lands. Everyone suddenly checks their phone.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--mute)] sm:text-lg">
            One person ends up typing into a calculator while the group chat goes quiet for three
            days.
          </p>
        </div>

        {/* Centered Receipt Stage with 4 tilted annotation cards around it on desktop */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          {/* Desktop Left-Top Annotation: mental math = sakit sa ulo + Sad Tako */}
          <div className="pointer-events-none absolute left-0 top-6 z-20 hidden items-center lg:flex">
            <div className="w-[230px] -rotate-2 rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-3.5 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <TakoMascot mood="sad" size={48} />
                <p className="font-[family-name:var(--font-hand)] text-2xl font-bold leading-tight text-[var(--coral-accent)]">
                  mental math = sakit sa ulo
                </p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--mute)]">
                Nobody has to play table treasurer after dinner.
              </p>
            </div>
            <svg width="78" height="44" viewBox="0 0 78 44" fill="none" aria-hidden="true" className="-ml-1 shrink-0">
              <path
                d="M2 22 C28 22 48 12 74 26"
                stroke="var(--coral-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Desktop Left-Bottom Annotation */}
          <div className="pointer-events-none absolute bottom-16 left-2 z-20 hidden items-center lg:flex">
            <div className="w-[216px] rotate-2 rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-3.5 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <p className="font-[family-name:var(--font-display)] text-sm font-black text-[var(--ink)]">
                Equal, by items, or custom
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--mute)]">
                Pick the split mode that fits the order.
              </p>
            </div>
            <svg width="84" height="44" viewBox="0 0 84 44" fill="none" aria-hidden="true" className="-ml-1 shrink-0">
              <path
                d="M2 24 C30 28 54 14 80 12"
                stroke="var(--coral-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Desktop Right-Top Annotation */}
          <div className="pointer-events-none absolute right-0 top-10 z-20 hidden items-center lg:flex">
            <svg width="78" height="44" viewBox="0 0 78 44" fill="none" aria-hidden="true" className="-mr-1 shrink-0">
              <path
                d="M76 22 C50 22 30 12 4 26"
                stroke="var(--coral-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
            <div className="w-[224px] rotate-2 rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-3.5 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <p className="font-[family-name:var(--font-hand)] text-2xl font-bold leading-tight text-[var(--coral-accent)]">
                &ldquo;sino nag-extra rice?&rdquo;
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--mute)]">
                Assign shared platters or solo bowls in seconds.
              </p>
            </div>
          </div>

          {/* Desktop Right-Bottom Annotation */}
          <div className="pointer-events-none absolute bottom-14 right-2 z-20 hidden items-center lg:flex">
            <svg width="84" height="44" viewBox="0 0 84 44" fill="none" aria-hidden="true" className="-mr-1 shrink-0">
              <path
                d="M82 24 C54 28 30 14 4 12"
                stroke="var(--coral-accent)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
            <div className="w-[216px] -rotate-2 rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-3.5 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <p className="font-[family-name:var(--font-display)] text-sm font-black text-[var(--ink)]">
                Clear shares, less drama
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--mute)]">
                Everyone sees who owes what right on their screen.
              </p>
            </div>
          </div>

          {/* Centered Sample Thermal Receipt */}
          <div className="relative z-10 mx-auto max-w-sm border-2 border-[#2B1B3D] bg-[#FFFDF8] p-6 text-[#2B1B3D] shadow-[var(--card-shadow)] -rotate-1">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#2B1B3D]/25 pb-3 font-mono">
              <span className="text-sm font-black uppercase tracking-wider">Barkada Dinner</span>
              <span className="text-xs font-bold text-[#574B66] tabular-nums">TBL 08 · 4 PAX</span>
            </div>

            <ul className="divide-y divide-dashed divide-[#2B1B3D]/20 py-2 font-mono">
              {RECEIPT_LINES.map((line) => (
                <li key={line.item} className="flex items-center justify-between py-2 text-sm">
                  <span>{line.item}</span>
                  <span className="font-bold tabular-nums">{line.price}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-baseline justify-between border-t-2 border-[#2B1B3D] pt-3">
              <span className="font-mono text-sm font-black uppercase tracking-wider">TOTAL</span>
              <span className="font-[family-name:var(--font-display)] text-3xl font-black text-[#D92D4B] tabular-nums">
                ₱2,480.00
              </span>
            </div>
          </div>

          {/* Torn Share Stubs centered beneath receipt */}
          <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {CHOPPED_SHARES.map((share) => (
              <div
                key={share.name}
                style={{
                  backgroundColor: share.bg,
                  color: share.ink,
                  transform: `rotate(${share.rot})`,
                }}
                className="border-2 border-[#2B1B3D] px-3 py-2.5 text-center shadow-[var(--card-shadow-sm)]"
              >
                <div className="font-mono text-[11px] font-bold uppercase">{share.name}</div>
                <div className="font-[family-name:var(--font-display)] text-lg font-black tabular-nums">
                  {share.amount}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Stacked Annotations (hidden on lg where desktop callouts show) */}
          <div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            <div className="rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-4 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <TakoMascot mood="sad" size={44} />
                <p className="font-[family-name:var(--font-hand)] text-xl font-bold leading-tight text-[var(--coral-accent)]">
                  mental math = sakit sa ulo
                </p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--mute)]">
                Nobody has to play table treasurer after dinner.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#2B1B3D] bg-[var(--surface)] p-4 text-left shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]">
              <p className="font-[family-name:var(--font-hand)] text-xl font-bold leading-tight text-[var(--coral-accent)]">
                &ldquo;sino nag-extra rice?&rdquo;
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--mute)]">
                Split equally, by receipt items, or custom amounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
