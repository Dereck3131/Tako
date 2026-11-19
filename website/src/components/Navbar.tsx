'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

function TakoOctopusMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-8 -6 140 132"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Real Tako octopus from the mobile app header (src/components/TakoMascot.tsx) */}
      <ellipse cx="14" cy="92" rx="12" ry="24" fill="#F0627A" />
      <circle cx="14" cy="100" r="4" fill="#FFB3BC" />
      <ellipse cx="38" cy="89" rx="12" ry="27" fill="#F0627A" />
      <circle cx="38" cy="100" r="4" fill="#FFB3BC" />
      <ellipse cx="62" cy="87" rx="12" ry="29" fill="#F0627A" />
      <circle cx="62" cy="100" r="4" fill="#FFB3BC" />
      <ellipse cx="86" cy="89" rx="12" ry="27" fill="#F0627A" />
      <circle cx="86" cy="100" r="4" fill="#FFB3BC" />
      <ellipse cx="110" cy="92" rx="12" ry="24" fill="#F0627A" />
      <circle cx="110" cy="100" r="4" fill="#FFB3BC" />
      {/* Main head + specular highlight */}
      <ellipse cx="62" cy="50" rx="52" ry="46" fill="#FF7A8A" />
      <ellipse cx="41" cy="20" rx="13" ry="6" fill="#FF9AA6" />
      {/* Eyes + pupils + shine */}
      <ellipse cx="44" cy="54" rx="12" ry="14" fill="#FFFFFF" />
      <ellipse cx="80" cy="54" rx="12" ry="14" fill="#FFFFFF" />
      <ellipse cx="46" cy="56" rx="5.5" ry="7.5" fill="#2B1B3D" />
      <circle cx="47.5" cy="53" r="2.2" fill="#FFFFFF" />
      <ellipse cx="82" cy="56" rx="5.5" ry="7.5" fill="#2B1B3D" />
      <circle cx="83.5" cy="53" r="2.2" fill="#FFFFFF" />
      {/* Rosy cheeks + smile */}
      <ellipse cx="28" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />
      <ellipse cx="96" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />
      <path
        d="M52 74 Q62 84 72 74"
        fill="none"
        stroke="#2B1B3D"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
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
          <TakoOctopusMark size={36} />
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
