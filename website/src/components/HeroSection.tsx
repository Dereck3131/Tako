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
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { EntranceCoin } from './hero-entrances/EntranceCoin';
import { EntranceInk } from './hero-entrances/EntranceInk';
import { EntrancePeek } from './hero-entrances/EntrancePeek';
import { EntranceReceipt } from './hero-entrances/EntranceReceipt';
import { HeroEntrancePicker } from './hero-entrances/HeroEntrancePicker';
import {
  ENTRANCE_VARIANTS,
  type EntranceSpeed,
  type EntranceVariantId,
} from './hero-entrances/types';
import { HeroDownloadControls } from './HeroDownloadControls';
import { HeroTako } from './HeroTako';
import { PhoneMockup } from './PhoneMockup';

const HeroShaderBg = dynamic(
  () => import('./HeroShaderBg').then((m) => m.HeroShaderBg),
  { ssr: false }
);

const STORAGE_KEY = 'tako_hero_proto_variant_v1';

function RealHeroAppScreen({ theme }: { theme: 'light' | 'dark' }) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
  }, [theme]);

  if (!missing) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        {/* TODO: Use /screens/splits-home-populated.png once added to website/public/screens/ */}
        <Image
          src={`/screens/splits-home-${theme}.png`}
          alt="Tako app Splits home screen"
          fill
          sizes="(max-width: 768px) 260px, 300px"
          priority
          draggable={false}
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
        Drop{' '}
        <code className="rounded bg-[var(--surface-alt)] px-1 py-0.5 text-[10px]">
          splits-home-{theme}.png
        </code>{' '}
        into{' '}
        <code className="rounded bg-[var(--surface-alt)] px-1 py-0.5 text-[10px]">
          /public/screens
        </code>
      </p>
    </div>
  );
}

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();
  const reducedMotion = Boolean(useReducedMotion());

  const [mounted, setMounted] = useState(false);
  const [shaderReady, setShaderReady] = useState(false);
  const [variant, setVariant] = useState<EntranceVariantId>('peek');
  // Always default playback speed to 1x on every load (never persisted)
  const [speed, setSpeed] = useState<EntranceSpeed>(1);
  const [playKey, setPlayKey] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [measuredSec, setMeasuredSec] = useState<number | null>(null);
  const playStartRef = useRef<number>(0);

  // Hydrate persisted variant choice ONLY (never speed) + defer shader after entrance starts
  useEffect(() => {
    setMounted(true);
    playStartRef.current = performance.now();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as EntranceVariantId | null;
      if (saved && ENTRANCE_VARIANTS.some((v) => v.id === saved)) {
        setVariant(saved);
        setPlayKey((k) => k + 1);
      }
    } catch {
      // localStorage blocked
    }
    const timer = window.setTimeout(() => setShaderReady(true), 140);
    return () => window.clearTimeout(timer);
  }, []);

  // Stamp exact start time whenever a play starts
  useEffect(() => {
    playStartRef.current = performance.now();
    setMeasuredSec(null);
  }, [variant, playKey, speed]);

  const handleEntranceComplete = useCallback(() => {
    const start = playStartRef.current;
    if (!start) return;
    const elapsed = (performance.now() - start) / 1000;
    setMeasuredSec(elapsed);
  }, []);

  const handleSelectVariant = useCallback((nextId: EntranceVariantId) => {
    setVariant(nextId);
    setSkipped(false);
    setMeasuredSec(null);
    setPlayKey((k) => k + 1);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextId);
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleReplay = useCallback(() => {
    setSkipped(false);
    setMeasuredSec(null);
    setPlayKey((k) => k + 1);
  }, []);

  const handleSpeedChange = useCallback((nextSpeed: EntranceSpeed) => {
    setSpeed(nextSpeed);
    setSkipped(false);
    setMeasuredSec(null);
    setPlayKey((k) => k + 1);
  }, []);

  // Any click, key press (except prototype picker shortcuts), or scroll skips straight to resting state
  useEffect(() => {
    if (skipped || reducedMotion) return;

    const skip = () => setSkipped(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key >= '1' && e.key <= '4') ||
        e.key === 'r' ||
        e.key === 'R' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        return;
      }
      skip();
    };
    const onScroll = () => {
      if (window.scrollY > 12) skip();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.proto-picker')) return;
      skip();
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [skipped, reducedMotion, playKey]);

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
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
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

  // Scroll-out choreography (strictly clamped so scrollY = 0 is ALWAYS resting state opacity 1)
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

  // Shared resting slots passed into each entrance variant
  const sublineNode = (
    /* TODO: Confirm if offline auto-sync or marking paid offline should be mentioned here once verified */
    <p className="max-w-xl text-base leading-relaxed text-[var(--mute)] sm:text-lg lg:text-[1.15rem]">
      Share a QR, everyone hops in, and Tako does the peso math for your barkada dinners,
      roommates, and trips. No signal? The splitting still works.
    </p>
  );

  const controlsNode = <HeroDownloadControls />;

  const glowNode = (
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
  );

  // Outer scroll-out wrappers live inside the slots so entrance motion NEVER collides with scroll MotionValues
  const takoNode = (
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
      <HeroTako eyeX={eyeX} eyeY={eyeY} />
    </motion.div>
  );

  const chipNewSplitNode = (
    <motion.div
      style={reducedMotion ? undefined : { y: chipTopY }}
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 top-12 z-20 hidden sm:block lg:-right-10"
    >
      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cta-bg)] text-white">
          <Plus className="h-3.5 w-3.5" />
        </span>
        New split
      </div>
    </motion.div>
  );

  const chipScanQrNode = (
    <motion.div
      style={reducedMotion ? undefined : { y: chipBottomY }}
      aria-hidden="true"
      className="pointer-events-none absolute -left-6 bottom-14 z-20 hidden sm:block lg:-left-12"
    >
      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--plum)] text-[#FFF6EE]">
          <QrCode className="h-3.5 w-3.5" />
        </span>
        Scan QR
      </div>
    </motion.div>
  );

  const phoneNode = (
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
      <PhoneMockup>
        <RealHeroAppScreen theme={screenTheme} />
      </PhoneMockup>
    </motion.div>
  );

  const sharedEntranceProps = {
    speed,
    skipped,
    reducedMotion,
    onEntranceComplete: handleEntranceComplete,
    subline: sublineNode,
    controls: controlsNode,
    phoneSlot: phoneNode,
    takoSlot: takoNode,
    chipNewSplitSlot: chipNewSplitNode,
    chipScanQrSlot: chipScanQrNode,
    glowSlot: glowNode,
  };

  return (
    <section
      id="top"
      ref={heroRef}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative flex min-h-[calc(100dvh-4rem)] scroll-mt-16 items-center overflow-x-clip pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-12"
    >
      {/* Frame-0 ambient gradient backdrop so background is immediately rich before ShaderGradient mounts */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            screenTheme === 'dark'
              ? 'radial-gradient(ellipse 80% 70% at 72% 40%, rgba(255, 122, 138, 0.16) 0%, rgba(185, 165, 232, 0.08) 45%, transparent 75%)'
              : 'radial-gradient(ellipse 80% 70% at 72% 40%, rgba(255, 122, 138, 0.14) 0%, rgba(255, 200, 87, 0.10) 45%, transparent 75%)',
        }}
      />

      {/* Lazy-loaded ShaderGradient mounted after entrance starts so LCP is never delayed */}
      {shaderReady && <HeroShaderBg />}

      {/* Scroll-out veil transitioning cleanly into the next section */}
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: hueShiftOpacity }}
          className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg)]"
        />
      )}

      {/* Keyed by variant + playKey so switching or pressing R replays from pre-entrance state */}
      <React.Fragment key={`${variant}-${playKey}`}>
        {variant === 'coin' && <EntranceCoin {...sharedEntranceProps} />}
        {variant === 'ink' && <EntranceInk {...sharedEntranceProps} />}
        {variant === 'peek' && <EntrancePeek {...sharedEntranceProps} />}
        {variant === 'receipt' && <EntranceReceipt {...sharedEntranceProps} />}
      </React.Fragment>

      {/* Dev-only (or ?proto=1) floating prototype picker */}
      <HeroEntrancePicker
        activeId={variant}
        speed={speed}
        measuredSec={measuredSec}
        onSelect={handleSelectVariant}
        onReplay={handleReplay}
        onSpeedChange={handleSpeedChange}
      />
    </section>
  );
}
