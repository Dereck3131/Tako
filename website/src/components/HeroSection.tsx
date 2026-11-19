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

import { HeroDownloadControls } from './HeroDownloadControls';
import { HeroReceiptEntrance } from './HeroReceiptEntrance';
import { HeroTako } from './HeroTako';
import { PhoneMockup } from './PhoneMockup';

const HeroShaderBg = dynamic(
  () => import('./HeroShaderBg').then((m) => m.HeroShaderBg),
  { ssr: false }
);

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
          sizes="(max-width: 768px) 240px, 276px"
          priority
          draggable={false}
          className="pointer-events-none select-none object-cover object-top scale-[1.06] -translate-y-[2.5%]"
          onError={() => setMissing(true)}
        />
      </div>
    );
  }

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
  const [isMobile, setIsMobile] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [shaderReady, setShaderReady] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const narrow = window.innerWidth < 768;
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      setIsMobile(narrow || coarse);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    // Safety fallback so desktop HeroShaderBg always mounts after entrance
    const fallbackTimer = window.setTimeout(() => setShaderReady(true), 4200);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  // Pause idle animations when hero leaves viewport or browser tab is hidden
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleEntranceComplete = useCallback(() => {
    setShaderReady(true);
  }, []);

  useEffect(() => {
    if (skipped || reducedMotion) {
      setShaderReady(true);
    }
  }, [skipped, reducedMotion]);

  // Any click, key press, or scroll skips straight to resting state
  useEffect(() => {
    if (skipped || reducedMotion) return;

    const skip = () => setSkipped(true);
    const onScroll = () => {
      if (window.scrollY > 12) skip();
    };

    window.addEventListener('pointerdown', skip, { passive: true, once: true });
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('scroll', onScroll);
    };
  }, [skipped, reducedMotion]);

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
  const idlePaused = !inView || tabHidden;

  // Desktop pointer-driven 3D phone tilt (max ~8deg) + Tako eye tracking (touch/scroll on mobile)
  const rawRotX = useMotionValue(0);
  const rawRotY = useMotionValue(0);
  const rotateX = useSpring(rawRotX, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(rawRotY, { stiffness: 120, damping: 18 });

  const eyeX = useMotionValue(0);
  const eyeY = useMotionValue(0);

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    eyeX.set(nx * 3.2);
    eyeY.set(ny * 2.2);
    if (e.pointerType === 'mouse' && !isMobile) {
      rawRotY.set(nx * 8);
      rawRotX.set(-ny * 6);
    }
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

  // On mobile, let Tako's eyes glance down gently as the visitor scrolls
  useEffect(() => {
    if (!isMobile || reducedMotion) return;
    return scrollYProgress.on('change', (v) => {
      eyeY.set(Math.min(2.6, v * 5.2));
    });
  }, [isMobile, reducedMotion, scrollYProgress, eyeY]);

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

  const sublineNode = (
    /* TODO: Confirm if offline auto-sync or marking paid offline should be mentioned here once verified */
    <p className="max-w-xl text-base leading-relaxed text-[var(--mute)] sm:text-lg lg:text-[1.15rem]">
      Share a QR, everyone hops in, and Tako does the peso math for your barkada dinners,
      roommates, and trips. No signal? The splitting still works.
    </p>
  );

  const controlsNode = <HeroDownloadControls />;

  // Pure feathered radial gradient (no blur-3xl filter pass)
  const glowNode = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[420px] sm:w-[420px] lg:h-[460px] lg:w-[460px]"
      style={{
        background:
          screenTheme === 'dark'
            ? 'radial-gradient(circle, rgba(255, 122, 138, 0.28) 0%, rgba(185, 165, 232, 0.12) 44%, transparent 72%)'
            : 'radial-gradient(circle, rgba(255, 122, 138, 0.24) 0%, rgba(255, 200, 87, 0.12) 48%, transparent 72%)',
      }}
    />
  );

  // Outer scroll-out wrappers live inside the slots so entrance motion NEVER collides with scroll MotionValues
  const takoNode = (
    <motion.div
      style={
        reducedMotion || isMobile
          ? undefined
          : {
              y: takoScrollY,
              rotate: takoScrollRotate,
              opacity: takoScrollOpacity,
            }
      }
      className="pointer-events-none absolute -left-6 -top-12 z-20 sm:-left-20 sm:-top-16 lg:-left-32 lg:-top-16"
    >
      <HeroTako eyeX={eyeX} eyeY={eyeY} paused={idlePaused} />
    </motion.div>
  );

  // Chips stay visible & tucked safely inside viewport on phones and orbit on desktop
  const chipNewSplitNode = (
    <motion.div
      style={reducedMotion || isMobile ? undefined : { y: chipTopY }}
      aria-hidden="true"
      className="pointer-events-none absolute -right-2 top-8 z-20 sm:-right-4 sm:top-12 lg:-right-10"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cta-bg)] text-white sm:h-6 sm:w-6">
          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
        New split
      </div>
    </motion.div>
  );

  const chipScanQrNode = (
    <motion.div
      style={reducedMotion || isMobile ? undefined : { y: chipBottomY }}
      aria-hidden="true"
      className="pointer-events-none absolute -left-2 bottom-10 z-20 sm:-left-6 sm:bottom-14 lg:-left-12"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--ink)] shadow-[var(--card-shadow)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--plum)] text-[#FFF6EE] sm:h-6 sm:w-6">
          <QrCode className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
        Scan QR
      </div>
    </motion.div>
  );

  // Desktop: pointer 3D tilt + scroll parallax. Mobile: gentle idle float (paused when off-screen/reducedMotion)
  const phoneNode = isMobile ? (
    <motion.div
      animate={reducedMotion || idlePaused ? { y: 0 } : { y: [0, -5, 0] }}
      transition={
        reducedMotion || idlePaused
          ? { duration: 0.2 }
          : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
      }
      className="relative z-10"
    >
      <PhoneMockup>
        <RealHeroAppScreen theme={screenTheme} />
      </PhoneMockup>
    </motion.div>
  ) : (
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

  return (
    <section
      id="top"
      ref={heroRef}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative flex min-h-[calc(100svh-4rem)] scroll-mt-16 items-center overflow-x-clip pt-6 pb-10 sm:min-h-[calc(100dvh-4rem)] sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-12"
    >
      {/* Frame-0 ambient gradient backdrop (also serves as zero-JS gradient on mobile phones) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            screenTheme === 'dark'
              ? 'radial-gradient(ellipse 85% 75% at 72% 38%, rgba(229, 64, 94, 0.28) 0%, rgba(125, 58, 140, 0.24) 46%, transparent 78%)'
              : 'radial-gradient(ellipse 90% 80% at 72% 34%, rgba(255, 166, 158, 0.34) 0%, rgba(255, 224, 210, 0.32) 48%, transparent 78%)',
        }}
      />

      {/* Lazy-loaded WebGL ShaderGradient on desktop only, mounted AFTER entrance settles */}
      {!isMobile && shaderReady && <HeroShaderBg />}

      {/* Scroll-out veil transitioning cleanly into the next section */}
      {!reducedMotion && !isMobile && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: hueShiftOpacity }}
          className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg)]"
        />
      )}

      <HeroReceiptEntrance
        skipped={skipped}
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        onEntranceComplete={handleEntranceComplete}
        subline={sublineNode}
        controls={controlsNode}
        phoneSlot={phoneNode}
        takoSlot={takoNode}
        chipNewSplitSlot={chipNewSplitNode}
        chipScanQrSlot={chipScanQrNode}
        glowSlot={glowNode}
      />
    </section>
  );
}
