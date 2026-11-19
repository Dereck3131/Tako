'use client';

import { Menu, Moon, Sun, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
] as const;

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
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll, trap focus, and close on Escape while mobile bottom sheet is open
  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const triggerBtn = menuBtnRef.current;

    const sheet = sheetRef.current;
    const focusables = sheet
      ? (Array.from(
          sheet.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[])
      : [];

    // Focus first interactive element inside the sheet
    const raf = requestAnimationFrame(() => {
      focusables[0]?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      triggerBtn?.focus();
    };
  }, [menuOpen]);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[var(--border)]/70 bg-[var(--bg)]/85 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-8">
          <a
            href="#top"
            className="tako-press inline-flex min-h-11 items-center gap-2 rounded-full py-1 pr-2"
            aria-label="Tako home"
          >
            <TakoOctopusMark size={36} />
            <span className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-[var(--ink)]">
              tako
            </span>
          </a>

          {/* Desktop nav links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm font-semibold text-[var(--mute)] md:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center transition-colors duration-150 hover:text-[var(--ink)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="tako-press inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
            >
              {mounted ? (
                isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4" />
              )}
            </button>

            <a
              href="#download"
              className="tako-press inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[var(--cta-bg)] px-4 text-sm font-bold text-[var(--cta-ink)]"
            >
              Get Tako
            </a>

            {/* Mobile bottom-sheet menu trigger */}
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-sheet"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="tako-press inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom-Sheet Navigation Menu */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
            {/* Backdrop */}
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            />

            {/* Spring Bottom Sheet */}
            <motion.div
              ref={sheetRef}
              id="mobile-nav-sheet"
              initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
              animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
              transition={
                reducedMotion
                  ? { duration: 0.15 }
                  : { type: 'spring', duration: 0.36, bounce: 0.12 }
              }
              style={{
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
              }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface)] px-5 pt-3 shadow-2xl"
            >
              {/* Drag handle pill */}
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--border)]"
              />

              <div className="mb-3 flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-base font-black text-[var(--ink)]">
                  Explore Tako
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="tako-press inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--ink)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav aria-label="Mobile navigation" className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="tako-press flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-bold text-[var(--ink)] active:bg-[var(--surface-alt)]"
                  >
                    <span>{link.label}</span>
                  </a>
                ))}
              </nav>

              <div className="mt-4 border-t border-[var(--border)]/70 pt-4">
                <a
                  href="#download"
                  onClick={() => setMenuOpen(false)}
                  className="tako-press flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--cta-bg)] px-6 text-base font-bold text-[var(--cta-ink)]"
                >
                  Download Tako for Android
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
