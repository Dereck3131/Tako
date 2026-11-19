'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import { TakoMascot } from './TakoMascot';

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)]/70 bg-[var(--bg)]/85 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="tako-press inline-flex items-center gap-2 rounded-full py-1 pr-2"
          aria-label="Tako home"
        >
          <TakoMascot mood="happy" size={32} priority />
          <span className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-[var(--ink)]">
            tako
          </span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm font-semibold text-[var(--mute)] md:flex"
        >
          <a
            href="#how-it-works"
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            How it works
          </a>
          <a
            href="#features"
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            Features
          </a>
          <a
            href="#faq"
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="tako-press inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
          >
            {mounted ? (
              isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>
          <a
            href="#download"
            className="tako-press inline-flex h-10 items-center justify-center rounded-full bg-[var(--cta-bg)] px-4 text-sm font-bold text-[var(--cta-ink)]"
          >
            Get Tako
          </a>
        </div>
      </div>
    </header>
  );
}
