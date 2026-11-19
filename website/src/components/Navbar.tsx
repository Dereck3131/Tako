'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

function TakoOctopusMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Real Tako octopus mark from src/components/TakoMark.tsx */}
      <path
        d="M20 4C11.7 4 6 9.8 6 17.6c0 3.7 1.3 6.8 3.2 9.1-.8 2.2-1.8 4.2-1.8 5.5 0 1.8 1.5 3.1 3.2 2.6 1.5-.4 2.7-2.2 3.5-4.3.7 2.4 1.6 4.7 3.1 4.7s2.2-2.3 2.8-4.8c.6 2.5 1.3 4.8 2.8 4.8s2.4-2.3 3.1-4.7c.8 2.1 2 3.9 3.5 4.3 1.7.5 3.2-.8 3.2-2.6 0-1.3-1-3.3-1.8-5.5C32.7 24.4 34 21.3 34 17.6 34 9.8 28.3 4 20 4Z"
        fill="#FF7A8A"
      />
      <circle cx="15" cy="17.5" r="2.6" fill="#2B1B3D" />
      <circle cx="25" cy="17.5" r="2.6" fill="#2B1B3D" />
    </svg>
  );
}

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="tako-press inline-flex items-center gap-2 rounded-full py-1 pr-2"
          aria-label="Tako home"
        >
          <TakoOctopusMark size={32} />
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
