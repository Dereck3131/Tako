'use client';

import clsx from 'clsx';
import { MoveHorizontal, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import { AppScreen } from './AppScreen';
import { PhoneMockup } from './PhoneMockup';

export function ThemeShowcaseSection() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Percentage (0-100) showing Light on the left and Dark on the right
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
      // On touch, defer capture until gesture is clearly horizontal so vertical page scroll never blocks
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
      className="border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2
            id="theme-showcase-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Warm cream by lunch. Deep plum by midnight.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--mute)] sm:text-lg">
            Drag the divider across the phone to compare both themes, or toggle the site theme to
            try it live.
          </p>

          <div
            role="group"
            aria-label="Preview and switch theme"
            className="mt-7 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-alt)] p-1"
          >
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={clsx(
                'tako-press inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold',
                !isDark
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
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
                'tako-press inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold',
                isDark
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                  : 'text-[var(--mute)] hover:text-[var(--ink)]'
              )}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </button>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-6">
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
              {/* Base layer: Dark theme screenshot */}
              <div className="absolute inset-0">
                <AppScreen screen="splits-home" theme="dark" />
              </div>

              {/* Clipped top layer: Light theme screenshot */}
              <div
                className={clsx(
                  'absolute inset-0',
                  !isDragging && 'transition-[clip-path] duration-300 ease-[var(--ease-out)]'
                )}
                style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
              >
                <AppScreen screen="splits-home" theme="light" />
              </div>

              {/* Divider line + handle (tucks away cleanly when fully covered at 0% or 100%) */}
              <div
                aria-hidden="true"
                className={clsx(
                  'pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-[var(--coral)]',
                  !isDragging && 'transition-[left,opacity] duration-300 ease-[var(--ease-out)]',
                  splitPct <= 1 || splitPct >= 99 ? 'opacity-0' : 'opacity-100'
                )}
                style={{ left: `${splitPct}%` }}
              >
                <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--cta-bg)] text-white shadow-md">
                  <MoveHorizontal className="h-4 w-4" />
                </div>
              </div>
            </div>
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}
