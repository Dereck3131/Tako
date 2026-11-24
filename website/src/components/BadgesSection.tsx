'use client';

import clsx from 'clsx';
import { Trophy } from 'lucide-react';
import React, { useState } from 'react';

import { ReceiptLineHeader } from './ReceiptThread';

type BadgeId =
  | 'on-time-streak'
  | 'speed-settler'
  | 'zero-nudge'
  | 'host-most'
  | 'full-table'
  | 'clean-slate';

interface WebBadge {
  id: BadgeId;
  title: string;
  description: string;
  bg: string;
  glyph: string;
  progress: string;
  tiers: string;
}

function buildScallopPath(lobes = 14, rOuter = 47.5, rInner = 42.5): string {
  const cx = 50;
  const cy = 50;
  const steps = lobes * 2;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i * Math.PI * 2) / steps - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const m = mid(curr, next);
    d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

const SCALLOP_PATH = buildScallopPath();

const BADGES: WebBadge[] = [
  {
    id: 'on-time-streak',
    title: 'On-time streak',
    description: 'Settle within 24h without a reminder',
    bg: '#FF9F43',
    glyph: '#FFFFFF',
    progress: '1/5',
    tiers: 'Streak counter',
  },
  {
    id: 'speed-settler',
    title: 'Speed Settler',
    description: 'Record a payment within 1 hour of a split',
    bg: '#FFD15C',
    glyph: '#2B1B3D',
    progress: '0/1',
    tiers: '1 → 5 → 15',
  },
  {
    id: 'zero-nudge',
    title: 'Zero-Nudge Pro',
    description: 'Settle splits without getting a reminder',
    bg: '#BFA8EC',
    glyph: '#2B1B3D',
    progress: '1/3',
    tiers: '3 → 10 → 25',
  },
  {
    id: 'host-most',
    title: 'Host with the Most',
    description: 'Host splits where everyone paid',
    bg: '#FF7A8A',
    glyph: '#FFFFFF',
    progress: '1/3',
    tiers: '3 → 10 → 25',
  },
  {
    id: 'full-table',
    title: 'Full Table',
    description: 'Split a bill with 5 or more friends',
    bg: '#26C2B5',
    glyph: '#FFFFFF',
    progress: '0/1',
    tiers: '1 → 3 → 10',
  },
  {
    id: 'clean-slate',
    title: 'Clean Slate',
    description: 'Have ₱0 owed across all your splits',
    bg: '#46C99B',
    glyph: '#FFFFFF',
    progress: '0/1',
    tiers: '1 → 5 → 15',
  },
];

function BadgeMedalSvg({ badge, unlocked }: { badge: WebBadge; unlocked: boolean }) {
  const fillBg = unlocked ? badge.bg : 'var(--surface-alt)';
  const ringStroke = unlocked ? 'rgba(255,255,255,0.45)' : 'var(--border)';
  const shineStroke = unlocked ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.6)';
  const glyphColor = unlocked ? badge.glyph : 'var(--mute)';

  const renderGlyph = () => {
    if (badge.id === 'on-time-streak') {
      const p =
        'M50 31 C50 31 61 42.5 61 52.5 C61 59.4 56.1 65 50 65 C43.9 65 39 59.4 39 52.5 C39 48.2 41.2 44.3 43.2 41.8 C43.6 45 45.8 46.8 47.4 45.2 C48.8 43.8 48.2 37.5 50 31 Z';
      return unlocked ? (
        <path d={p} fill={glyphColor} />
      ) : (
        <path d={p} fill="none" stroke={glyphColor} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      );
    }
    if (badge.id === 'speed-settler') {
      const p = 'M53.5 31 L37 52.5 H48.5 L46 69 L63 47.5 H51.5 Z';
      return unlocked ? (
        <path d={p} fill={glyphColor} stroke={glyphColor} strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path d={p} fill="none" stroke={glyphColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      );
    }
    if (badge.id === 'zero-nudge') {
      const big = 'M45.5 33 L49.3 43.7 L60 47.5 L49.3 51.3 L45.5 62 L41.7 51.3 L31 47.5 L41.7 43.7 Z';
      const small = 'M61.5 53 L63.5 58.2 L68.5 60 L63.5 61.8 L61.5 67 L59.5 61.8 L54.5 60 L59.5 58.2 Z';
      return unlocked ? (
        <>
          <path d={big} fill={glyphColor} stroke={glyphColor} strokeWidth="1.5" strokeLinejoin="round" />
          <path d={small} fill={glyphColor} stroke={glyphColor} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d={big} fill="none" stroke={glyphColor} strokeWidth="3.2" strokeLinejoin="round" />
          <path d={small} fill="none" stroke={glyphColor} strokeWidth="2.6" strokeLinejoin="round" />
        </>
      );
    }
    if (badge.id === 'host-most') {
      const p = 'M33 61 L31 41 L42 48.5 L50 36.5 L58 48.5 L69 41 L67 61 Z';
      return unlocked ? (
        <path d={p} fill={glyphColor} stroke={glyphColor} strokeWidth="2" strokeLinejoin="round" />
      ) : (
        <path d={p} fill="none" stroke={glyphColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      );
    }
    if (badge.id === 'full-table') {
      return (
        <>
          <circle cx="43" cy="43" r="5.8" fill="none" stroke={glyphColor} strokeWidth="3.6" />
          <circle cx="57" cy="43" r="5.8" fill="none" stroke={glyphColor} strokeWidth="3.6" />
          <path d="M32 62 C32 55.2 36.8 51.5 43 51.5 C49.2 51.5 54 55.2 54 62" fill="none" stroke={glyphColor} strokeWidth="3.6" strokeLinecap="round" />
          <path d="M46 62 C46 55.2 50.8 51.5 57 51.5 C63.2 51.5 68 55.2 68 62" fill="none" stroke={glyphColor} strokeWidth="3.6" strokeLinecap="round" />
        </>
      );
    }
    return (
      <>
        <path d="M35.5 52 L44.5 61 L63.5 40.5" fill="none" stroke={glyphColor} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 35.5 V42.5 M60.5 39 H67.5" fill="none" stroke={glyphColor} strokeWidth="3.2" strokeLinecap="round" />
      </>
    );
  };

  return (
    <svg width="76" height="76" viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <path d={SCALLOP_PATH} fill={fillBg} />
      <circle cx="50" cy="50" r="34.5" fill="none" stroke={ringStroke} strokeWidth="2.6" />
      <path d="M24.5 41 A27 27 0 0 1 41 24.5" fill="none" stroke={shineStroke} strokeWidth="3.4" strokeLinecap="round" />
      {renderGlyph()}
    </svg>
  );
}

export function BadgesSection() {
  const [showUnlocked, setShowUnlocked] = useState(true);

  return (
    <section id="badges" className="bg-[var(--bg)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ReceiptLineHeader code="04" label="STREAKS & BADGES" amount="6 MEDALS" />

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-[var(--ink)] sm:text-4xl">
              Settle fast. Earn medals.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--mute)]">
              No nagging needed. Tako rewards on-time streaks, levels every badge from Bronze to Silver to Gold, and unlocks a glowing <strong className="font-bold text-[var(--ink)]">Tako Legend</strong> ring at 5/5.
            </p>
          </div>

          <div
            role="group"
            aria-label="Preview badge state"
            className="inline-flex self-start rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
          >
            <button
              type="button"
              onClick={() => setShowUnlocked(true)}
              className={clsx(
                'tako-press rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors',
                showUnlocked
                  ? 'bg-[var(--ink)] text-[var(--bg)]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              Unlocked
            </button>
            <button
              type="button"
              onClick={() => setShowUnlocked(false)}
              className={clsx(
                'tako-press rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors',
                !showUnlocked
                  ? 'bg-[var(--ink)] text-[var(--bg)]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              Locked
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <BadgeMedalSvg badge={badge} unlocked={showUnlocked} />
              <div className="min-w-0 flex-1">
                <h3 className="font-[family-name:var(--font-display)] text-base font-black text-[var(--ink)]">
                  {badge.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--mute)]">
                  {badge.description}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  {showUnlocked ? (
                    <span className="inline-flex items-center rounded-full bg-[#E2F8F5] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0F766E] dark:bg-[#19353B] dark:text-[#2EC4B6]">
                      Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--mute)]">
                      {badge.progress}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-[var(--mute)]">
                    {badge.tiers}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tako Legend 5/5 Callout */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[#FFC857]/60 bg-[#2B1B3D] p-6 text-[#FFF6EE] sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF3B0] via-[#FFC857] to-[#F59E0B] p-[3px] shadow-[0_0_20px_rgba(245,158,11,0.45)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#2B1B3D]">
                <Trophy className="h-6 w-6 text-[#FFC857]" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#FFC857]">
                5/5 Badges Complete
              </p>
              <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-lg font-black">
                Unlock the Tako Legend Gold Avatar Ring
              </h3>
              <p className="mt-0.5 text-sm text-[#FFF6EE]/75">
                Shows up on your Profile, Home header, and next to your name in every split room.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-[#FBEAE0] px-3 py-1 text-[#9A4A1C]">Bronze</span>
            <span className="rounded-full bg-[#ECEFF4] px-3 py-1 text-[#475569]">Silver</span>
            <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[#B45309]">Gold</span>
          </div>
        </div>
      </div>
    </section>
  );
}
