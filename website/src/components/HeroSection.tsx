'use client';

import { Plus, QrCode, Smartphone } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import { HeroDownloadControls } from './HeroDownloadControls';
import { HeroTako } from './HeroTako';
import { PhoneMockup } from './PhoneMockup';

const HeroShaderBg = dynamic(
  () => import('./HeroShaderBg').then((m) => m.HeroShaderBg),
  { ssr: false }
);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const HEADLINE_WORDS = ['Split', 'bills,', 'not', 'friendships.'];

/**
 * Loads the real app screenshot `/public/screens/splits-home-{theme}.png`,
 * cropping slightly from the top so Expo Go status bar / dev toast chrome stays hidden.
 * When the real screenshot is not dropped in yet, renders an honest placeholder slot
 * instead of inventing fake UI or balances.
 */
function RealHeroAppScreen({ theme }: { theme: 'light' | 'dark' }) {
  const [missing, setMissing] = useState(false);

  // Reset error state if theme flips so both light and dark PNGs are checked independently
  useEffect(() => {
    setMissing(false);
  }, [theme]);

  if (!missing) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={`/screens/splits-home-${theme}.png`}
          alt="Tako app Splits home screen"
          fill
          sizes="(max-width: 768px) 260px, 300px"
          priority
          draggable={false}
          // Slight upward shift & scale crops out top status bar / Expo Go dev banner
          className="pointer-events-none select-none object-cover object-top scale-[1.06] -translate-y-[2.5%]"
          onError={() => setMissing(true)}
        />
      </div>
    );
  }

  // TODO: Drop your real screenshots into website/public/screens/splits-home-light.png and splits-home-dark.png
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--surface)] px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--coral-soft)] text-[var(--coral-accent)]">
        <Smartphone className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="font-[family-name:var(--font-display)] text-sm font-black text-[var(--ink)]">
        App screenshot slot
      </p>
      <p className="text-xs leading-relaxed text-[var(--mute)]">
        Drop <code className="rounded bg-[var(--surface-alt)] px-1 py-0.5 text-[10px]">splits-home-{theme}.png</code> into{' '}
        <code className="rounded bg-[var(--surface-alt)] px-1 py-0.5 text-[10px]">/public/screens</code>
      </p>
    </div>
  );
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  // Pointer-driven 3D phone tilt (max ~8deg) + Tako eye tracking
  const rawRotX = useMotionValue(0);
  const rawRotY = useMotionValue(0);
  const rotateX = useSpring(rawRotX, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(rawRotY, { stiffness: 120, damping: 18 });

  const eyeX = useMotionValue(0);
  const eyeY = useMotionValue(0);

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1..1
    rawRotY.set(nx * 8);
    rawRotX.set(-ny * 6);
    eyeX.set(nx * 3.2);
    eyeY.set(ny * 2.2);
  };

  const handleHeroPointerLeave = () => {
    rawRotX.set(0);
    rawRotY.set(0);
    eyeX.set(0);
    eyeY.set(0);
  };

  // Scroll-out choreography (strictly clamped so scrollY = 0 is always 100% resting state)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const phoneScrollY = useTransform(scrollYProgress, [0, 1], [0, -48], { clamp: true });
  const phoneScrollScale = useTransform(scrollYProgress, [0, 1], [1, 0.92], { clamp: true });
  const takoScrollY = useTransform(scrollYProgress, [0, 0.85], [0, 72], { clamp: true });
  const takoScrollRotate = useTransform(scrollYProgress, [0, 0.85], [0, -10], { clamp: true });
  const takoScrollOpacity = useTransform(scrollYProgress, [0, 0.18, 0.85], [1, 1, 0.2], {
    clamp: true,
  });
  const chipTopY = useTransform(scrollYProgress, [0, 1], [0, -64], { clamp: true });
  const chipBottomY = useTransform(scrollYProgress, [0, 1], [0, -28], { clamp: true });
  const hueShiftOpacity = useTransform(scrollYProgress, [0, 0.25, 1], [0, 0, 0.65], {
    clamp: true,
  });

  return (
    <section
      id="top"
      ref={heroRef}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative flex min-h-[calc(100dvh-4rem)] scroll-mt-16 items-center overflow-x-clip pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-12"
    >
      {/* Full-bleed ShaderGradient background behind all hero content */}
      <HeroShaderBg />

      {/* Subtle scroll-out hue veil transitioning into the next section */}
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: hueShiftOpacity }}
          className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg)]"
        />
      )}

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
        {/* Left: Headline, Subline, Primary CTA + Compact QR Pill */}
        <div className="lg:col-span-6">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.85rem)] font-black leading-[1.01] tracking-[-0.03em] text-[var(--ink)] text-balance">
            {HEADLINE_WORDS.map((word, idx) => (
              <motion.span
                key={word}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.42,
                  delay: reducedMotion ? 0 : idx * 0.055,
                  ease: EASE_OUT,
                }}
                className="mr-[0.22em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* TODO: Confirm if offline auto-sync or marking paid offline should be mentioned here once verified */}
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.21, ease: EASE_OUT }}
            className="mt-4 max-w-xl text-base leading-relaxed text-[var(--mute)] sm:text-lg lg:text-[1.15rem]"
          >
            Share a QR, everyone hops in, and Tako does the peso math for your barkada dinners,
            roommates, and trips. No signal? The splitting still works.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.27, ease: EASE_OUT }}
            className="mt-7"
          >
            <HeroDownloadControls />
          </motion.div>
        </div>

        {/* Right: Phone + Hero Tako peeking over top-left shoulder + verified app chips */}
        <div
          className="relative flex items-center justify-center pt-16 sm:pt-20 lg:col-span-6 lg:justify-end lg:pr-6 lg:pt-16"
          style={{ perspective: 1100 }}
        >
          {/* Subtle radial glow directly behind the phone */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[420px] sm:w-[420px]"
            style={{
              background:
                screenTheme === 'dark'
                  ? 'radial-gradient(circle, rgba(255, 122, 138, 0.32) 0%, rgba(185, 165, 232, 0.14) 52%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(255, 122, 138, 0.28) 0%, rgba(255, 200, 87, 0.14) 55%, transparent 74%)',
            }}
          />

          <div className="relative">
            {/* Hero Tako: Outer layer owns scroll-out transforms; inner layer owns mount entrance (prevents MotionValue/animate collision at scrollY = 0) */}
            <motion.div
              style={
                reducedMotion
                  ? undefined
                  : {
                      y: takoScrollY,
                      rotate: takoScrollRotate,
                      opacity: takoScrollOpacity,
                    }
              }
              className="pointer-events-none absolute -left-14 -top-16 z-20 sm:-left-24 sm:-top-20 lg:-left-32 lg:-top-16"
            >
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 36, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  reducedMotion
                    ? undefined
                    : { type: 'spring', duration: 0.58, bounce: 0.24, delay: 0.36 }
                }
              >
                <HeroTako eyeX={eyeX} eyeY={eyeY} />
              </motion.div>
            </motion.div>

            {/* Orbiting verified app action chip 1: New split */}
            <motion.div
              style={reducedMotion ? undefined : { y: chipTopY }}
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 top-12 z-20 hidden sm:block lg:-right-10"
            >
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.36, ease: EASE_OUT }}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cta-bg)] text-white">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                New split
              </motion.div>
            </motion.div>

            {/* Orbiting verified app action chip 2: Scan QR */}
            <motion.div
              style={reducedMotion ? undefined : { y: chipBottomY }}
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 bottom-14 z-20 hidden sm:block lg:-left-12"
            >
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.42, ease: EASE_OUT }}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--plum)] text-[#FFF6EE]">
                  <QrCode className="h-3.5 w-3.5" />
                </span>
                Scan QR
              </motion.div>
            </motion.div>

            {/* Tilting Phone Frame: outer layer owns scroll + 3D tilt, inner layer owns mount entrance */}
            <motion.div
              style={
                reducedMotion
                  ? undefined
                  : {
                      rotateX,
                      rotateY,
                      y: phoneScrollY,
                      scale: phoneScrollScale,
                    }
              }
              className="relative z-10"
            >
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.48, delay: 0.28, ease: EASE_OUT }}
              >
                <PhoneMockup>
                  <RealHeroAppScreen theme={screenTheme} />
                </PhoneMockup>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
