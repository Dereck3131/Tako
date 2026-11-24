'use client';

import clsx from 'clsx';
import { MoveHorizontal, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import { AppScreen } from './AppScreen';
import { PhoneMockup } from './PhoneMockup';
import { ReceiptLineHeader } from './ReceiptThread';

/**
 * Section 5 — "Day & night" Centered Stage:
 * Centered headline above, single centered phone with draggable light/dark divider,
 * flanked by "lunch sa BGC" and "2am inuman" handwritten notes.
 */
export function ThemeShowcaseSection() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragIntentRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const updateFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(0, Math.min(100, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startPointRef.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      draggingRef.current = true;
      dragIntentRef.current = 'horizontal';
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      updateFromClientX(e.clientX);
    } else {
      dragIntentRef.current = 'none';
      draggingRef.current = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && dragIntentRef.current === 'none') {
      const dx = Math.abs(e.clientX - startPointRef.current.x);
      const dy = Math.abs(e.clientY - startPointRef.current.y);
      if (dx > 8 && dx > dy * 1.2) {
        dragIntentRef.current = 'horizontal';
        draggingRef.current = true;
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore if capture not allowed
        }
      } else if (dy > 8) {
        dragIntentRef.current = 'vertical';
        return;
      }
    }
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
    dragIntentRef.current = 'none';
    setIsDragging(false);
  };

  const handleThemeSelect = (mode: 'light' | 'dark') => {
    setTheme(mode);
    setSplitPct(mode === 'light' ? 100 : 0);
  };

  return (
    <section
      aria-labelledby="theme-showcase-heading"
      className="relative overflow-x-clip bg-[var(--bg)] py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <ReceiptLineHeader
          code="04"
          label="Day & night"
          amount="2 themes"
          className="mx-auto max-w-3xl"
        />

        {/* Centered Headline */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <h2
            id="theme-showcase-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,5vw,3.6rem)] font-black leading-[1.03] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Warm cream by lunch. Deep plum by midnight.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--mute)] sm:text-lg">
            Drag the divider across the phone to compare both themes, or switch below to try it
            live.
          </p>
        </div>

        {/* Centered Phone Stage flanked by "lunch sa BGC" & "2am inuman" notes */}
        <div className="relative mx-auto mt-12 flex flex-col items-center">
          {/* Desktop Left Note: lunch sa BGC */}
          <div className="pointer-events-none absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center lg:flex">
            <div className="w-[180px] -rotate-2 rounded-2xl border-2 border-[#2B1B3D] bg-[#FFFDF8] px-4 py-3 text-left text-[#2B1B3D] shadow-[var(--card-shadow-sm)]">
              <p className="font-[family-name:var(--font-hand)] text-2xl font-bold leading-none text-[#B91C3B]">
                lunch sa BGC
              </p>
              <p className="mt-1 text-xs leading-snug text-[#574B66]">
                High-contrast warm cream for bright tables.
              </p>
            </div>
            <svg width="64" height="24" viewBox="0 0 64 24" fill="none" aria-hidden="true" className="-ml-1">
              <path d="M2 12 C22 12 40 6 60 12" stroke="var(--coral-accent)" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Desktop Right Note: 2am inuman */}
          <div className="pointer-events-none absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center lg:flex">
            <svg width="64" height="24" viewBox="0 0 64 24" fill="none" aria-hidden="true" className="-mr-1">
              <path d="M62 12 C42 12 24 6 4 12" stroke="var(--coral-accent)" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
            </svg>
            <div className="w-[180px] rotate-2 rounded-2xl border-2 border-[#433259] bg-[#1A1026] px-4 py-3 text-left text-[#FFF6EE] shadow-[var(--card-shadow-sm)]">
              <p className="font-[family-name:var(--font-hand)] text-2xl font-bold leading-none text-[#FFC857]">
                2am inuman
              </p>
              <p className="mt-1 text-xs leading-snug text-[#D2C4E3]">
                Deep plum dark mode that stays easy on the eyes.
              </p>
            </div>
          </div>

          <PhoneMockup>
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDragStart={(e) => e.preventDefault()}
              role="slider"
              aria-label="Compare light and dark theme screenshots"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(splitPct)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setSplitPct((p) => Math.max(0, p - 10));
                if (e.key === 'ArrowRight') setSplitPct((p) => Math.min(100, p + 10));
              }}
              className="relative h-full w-full cursor-ew-resize select-none touch-pan-y"
            >
              <div className="absolute inset-0">
                <AppScreen screen="splits-home" theme="dark" />
              </div>

              <div
                className={clsx(
                  'absolute inset-0',
                  !isDragging && 'transition-[clip-path] duration-300 ease-[var(--ease-out)]'
                )}
                style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
              >
                <AppScreen screen="splits-home" theme="light" />
              </div>

              <div
                aria-hidden="true"
                className={clsx(
                  'pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-[#FF7A8A]',
                  !isDragging && 'transition-[left,opacity] duration-300 ease-[var(--ease-out)]',
                  splitPct <= 1 || splitPct >= 99 ? 'opacity-0' : 'opacity-100'
                )}
                style={{ left: `${splitPct}%` }}
              >
                <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#2B1B3D] bg-[#E5405E] text-white shadow-[2px_2px_0px_#2B1B3D]">
                  <MoveHorizontal className="h-4 w-4" />
                </div>
              </div>
            </div>
          </PhoneMockup>

          {/* Mobile compact side notes */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 lg:hidden">
            <span className="font-[family-name:var(--font-hand)] text-xl font-bold text-[var(--coral-accent)]">
              ← lunch sa BGC
            </span>
            <span className="font-[family-name:var(--font-hand)] text-xl font-bold text-[var(--ink)]">
              2am inuman →
            </span>
          </div>

          {/* Centered Light / Dark Toggle */}
          <div
            role="group"
            aria-label="Preview and switch theme"
            className="mt-7 inline-flex rounded-full border-2 border-[#2B1B3D] bg-[var(--surface)] p-1 shadow-[var(--card-shadow-sm)] dark:border-[var(--border)]"
          >
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={clsx(
                'tako-press inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold',
                !isDark
                  ? 'bg-[#2B1B3D] text-[#FFF6EE]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              Light
            </button>
            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              className={clsx(
                'tako-press inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold',
                isDark
                  ? 'bg-[#FFF6EE] text-[#2B1B3D]'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
