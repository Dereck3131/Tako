'use client';

import {
  animate,
  AnimatePresence,
  motion,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  QrCode,
  SlidersHorizontal,
  Smartphone,
  Wallet,
  WifiOff,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { HeroDownloadControls } from '@/components/HeroDownloadControls';
import { HeroTakoAuthentic } from '@/components/HeroTako';
import { APK_CONFIG } from '@/lib/config';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FeatureCardItem {
  id: string;
  title: string;
  meta: string;
  ctaLabel: string;
  href: string;
  accentBg: string;
  visual: React.ReactNode;
}

const HERO_CARDS: FeatureCardItem[] = [
  {
    id: 'split-modes',
    title: 'Split 3 ways',
    meta: 'Equal · Items · Custom',
    ctaLabel: 'Explore',
    href: '#features',
    accentBg: 'bg-[#FFF0F3] dark:bg-[#341C2B]',
    visual: (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between rounded-xl bg-white/95 px-2.5 py-1.5 shadow-[0_4px_12px_-6px_rgba(43,27,61,0.16)] dark:bg-[#1B1228]">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink)]">
            <SlidersHorizontal className="h-3 w-3 text-[#E5405E]" aria-hidden="true" />
            Equal
          </span>
          <span className="text-[11px] font-extrabold tabular-nums text-[#E5405E]">₱450</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/85 px-2.5 py-1.5 dark:bg-[#1B1228]/80">
          <span className="text-[11px] font-semibold text-[var(--mute)]">By items</span>
          <span className="text-[11px] font-bold tabular-nums text-[var(--ink)]">₱320</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/75 px-2.5 py-1.5 dark:bg-[#1B1228]/60">
          <span className="text-[11px] font-semibold text-[var(--mute)]">Custom</span>
          <span className="text-[11px] font-bold tabular-nums text-[var(--ink)]">₱280</span>
        </div>
      </div>
    ),
  },
  {
    id: 'join-qr',
    title: 'Join by QR',
    meta: 'Scan or invite code',
    ctaLabel: 'See how',
    href: '#how-it-works',
    accentBg: 'bg-[#F5F0FF] dark:bg-[#2A1D3D]',
    visual: (
      <div className="flex flex-col items-center justify-center gap-2 py-0.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2B1B3D] text-[#FFF6EE] shadow-[0_8px_18px_-8px_rgba(43,27,61,0.45)] dark:bg-[#FFF6EE] dark:text-[#2B1B3D]">
          <QrCode className="h-7 w-7" aria-hidden="true" />
        </div>
        <span className="rounded-full bg-white/95 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#2B1B3D] shadow-sm dark:bg-[#1B1228] dark:text-[#FFE082]">
          TAKO-4821
        </span>
      </div>
    ),
  },
  {
    id: 'offline',
    title: 'Works offline',
    meta: 'No signal needed',
    ctaLabel: 'Read FAQ',
    href: '#faq',
    accentBg: 'bg-[#FFF6E5] dark:bg-[#33271D]',
    visual: (
      <div className="flex flex-col items-start justify-between gap-2 py-0.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-[#D92D4B] shadow-sm dark:bg-[#1B1228] dark:text-[#FF9FAA]">
          <WifiOff className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="font-[family-name:var(--font-hand)] text-base font-bold leading-none text-[#2B1B3D] dark:text-[#FFE8B6]">
          kahit sa basement
        </p>
        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-[var(--mute)] dark:bg-[#1B1228]">
          Guest mode ready
        </span>
      </div>
    ),
  },
  {
    id: 'peso-first',
    title: 'Peso-first',
    meta: 'PHP (₱) · Exact centavos',
    ctaLabel: 'See math',
    href: '#features',
    accentBg: 'bg-[#EAF8F6] dark:bg-[#162E2C]',
    visual: (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between rounded-xl bg-white/95 px-2.5 py-1.5 shadow-[0_4px_12px_-6px_rgba(43,27,61,0.14)] dark:bg-[#1B1228]">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink)]">
            <Coins className="h-3 w-3 text-[#1D9B90]" aria-hidden="true" />
            ₱1,000 ÷ 3
          </span>
          <span className="text-[11px] font-extrabold tabular-nums text-[#1D9B90]">₱333.34</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-2.5 py-1.5 dark:bg-[#1B1228]/75">
          <span className="text-[11px] font-semibold text-[var(--mute)]">Remainder drift</span>
          <span className="font-mono text-[11px] font-bold tabular-nums text-[var(--ink)]">₱0.00</span>
        </div>
      </div>
    ),
  },
  {
    id: 'payment-details',
    title: 'Pay details',
    meta: 'GCash · Maya · Bank',
    ctaLabel: 'Explore',
    href: '#features',
    accentBg: 'bg-[#FFF1E8] dark:bg-[#33221C]',
    visual: (
      <div className="flex flex-col items-start gap-2 py-0.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-[#D92D4B] shadow-sm dark:bg-[#1B1228] dark:text-[#FF9FAA]">
          <Wallet className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-[#2B1B3D] shadow-xs dark:bg-[#1B1228] dark:text-[#FFF6EE]">
            GCash
          </span>
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-[#2B1B3D] dark:bg-[#1B1228] dark:text-[#FFF6EE]">
            Maya
          </span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[var(--mute)] dark:bg-[#1B1228]/80">
            Bank
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'activity-history',
    title: 'Activity log',
    meta: 'Expenses & settlements',
    ctaLabel: 'See more',
    href: '#features',
    accentBg: 'bg-[#F0F4FF] dark:bg-[#1E243B]',
    visual: (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between rounded-xl bg-white/95 px-2.5 py-1.5 shadow-[0_4px_12px_-6px_rgba(43,27,61,0.14)] dark:bg-[#1B1228]">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink)]">
            <Clock className="h-3 w-3 text-[#D92D4B]" aria-hidden="true" />
            Ramen Night
          </span>
          <span className="text-[10px] font-extrabold text-[#1D9B90]">Settled</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-2.5 py-1.5 dark:bg-[#1B1228]/75">
          <span className="text-[11px] font-semibold text-[var(--mute)]">Matcha Run</span>
          <span className="text-[11px] font-bold tabular-nums text-[var(--ink)]">₱360</span>
        </div>
      </div>
    ),
  },
];

const CARD_COUNT = HERO_CARDS.length;
const EXTENDED_CARDS = [
  { ...HERO_CARDS[CARD_COUNT - 1], slotKey: `clone-prev-${HERO_CARDS[CARD_COUNT - 1].id}` },
  ...HERO_CARDS.map((c) => ({ ...c, slotKey: c.id })),
  { ...HERO_CARDS[0], slotKey: `clone-next-0-${HERO_CARDS[0].id}` },
  { ...HERO_CARDS[1], slotKey: `clone-next-1-${HERO_CARDS[1].id}` },
];

const TAKO_QUIPS = [
  'hi barkada!',
  'split na!',
  'no mental math!',
  "scan mo 'to",
  'kahit offline!',
  'bayad na ba si jay?',
] as const;

const CLICK_BUBBLES = [
  { id: 'b1', x: -84, y: -112, size: 14, kind: 'bubble' as const, delay: 0 },
  { id: 'b2', x: -34, y: -138, size: 22, kind: 'peso' as const, delay: 0.04 },
  { id: 'b3', x: 38, y: -132, size: 12, kind: 'bubble' as const, delay: 0.07 },
  { id: 'b4', x: 92, y: -98, size: 20, kind: 'peso' as const, delay: 0.03 },
  { id: 'b5', x: -108, y: -48, size: 10, kind: 'bubble' as const, delay: 0.09 },
  { id: 'b6', x: 110, y: -40, size: 13, kind: 'bubble' as const, delay: 0.06 },
] as const;

export function HeroSection() {
  const reducedMotion = useReducedMotion();
  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);
  const eyeX = useSpring(rawEyeX, { stiffness: 220, damping: 26, mass: 0.5 });
  const eyeY = useSpring(rawEyeY, { stiffness: 220, damping: 26, mass: 0.5 });
  const [idlePaused, setIdlePaused] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isCarouselFocused, setIsCarouselFocused] = useState(false);
  const [takoTapCount, setTakoTapCount] = useState(0);
  const [showQuip, setShowQuip] = useState(false);
  const [clickBursts, setClickBursts] = useState<number[]>([]);

  const [takoScope, animateTako] = useAnimate();
  const burstTimersRef = useRef<number[]>([]);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Continuous GPU-composited sliding track state for the 2-up carousel
  const trackPosRef = useRef(1);
  const trackAnimRef = useRef<AnimationPlaybackControls | null>(null);
  const xPct = useMotionValue(-50);
  const trackX = useTransform(xPct, (v) => `${v}%`);

  const stepCarousel = useCallback(
    (delta: 1 | -1) => {
      trackAnimRef.current?.stop();

      // Normalize seamlessly if user clicks rapidly past clone boundaries
      if (delta === 1 && trackPosRef.current >= CARD_COUNT + 1) {
        trackPosRef.current -= CARD_COUNT;
        xPct.jump(xPct.get() + CARD_COUNT * 50);
      } else if (delta === -1 && trackPosRef.current <= 0) {
        trackPosRef.current += CARD_COUNT;
        xPct.jump(xPct.get() - CARD_COUNT * 50);
      }

      const nextPos = trackPosRef.current + delta;
      trackPosRef.current = nextPos;
      const normalizedIndex = (nextPos - 1 + CARD_COUNT) % CARD_COUNT;
      setCardIndex(normalizedIndex);

      if (reducedMotion) {
        const finalPos = normalizedIndex + 1;
        trackPosRef.current = finalPos;
        xPct.jump(-finalPos * 50);
        return;
      }

      trackAnimRef.current = animate(xPct, -nextPos * 50, {
        duration: 0.68,
        ease: EASE_OUT,
        onComplete: () => {
          if (trackPosRef.current === CARD_COUNT + 1) {
            trackPosRef.current = 1;
            xPct.jump(-50);
          } else if (trackPosRef.current === 0) {
            trackPosRef.current = CARD_COUNT;
            xPct.jump(-CARD_COUNT * 50);
          }
        },
      });
    },
    [reducedMotion, xPct]
  );

  useEffect(() => {
    const burstTimers = burstTimersRef.current;
    return () => {
      trackAnimRef.current?.stop();
      burstTimers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;

    const handleMove = (e: PointerEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.5;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.45)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45)));
      rawEyeX.set(nx * 2.2);
      rawEyeY.set(ny * 1.6);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [reducedMotion, rawEyeX, rawEyeY]);

  useEffect(() => {
    const onScroll = () => {
      setIdlePaused(window.scrollY > window.innerHeight * 0.85);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-advance the 2-up card carousel every 4.2s (pauses on hover, focus, scroll-away, or reduced motion)
  useEffect(() => {
    if (reducedMotion || idlePaused || isCarouselHovered || isCarouselFocused) return;
    const timer = window.setInterval(() => {
      stepCarousel(1);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [reducedMotion, idlePaused, isCarouselHovered, isCarouselFocused, stepCarousel]);

  const handlePrev = () => stepCarousel(-1);
  const handleNext = () => stepCarousel(1);

  const handleCarouselPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCarouselPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || e.pointerType === 'mouse') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      stepCarousel(dx < 0 ? 1 : -1);
    }
  };

  useEffect(() => {
    if (!showQuip) return;
    const timeout = window.setTimeout(() => setShowQuip(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [showQuip, takoTapCount]);

  const handleTakoClick = () => {
    const nextTap = takoTapCount + 1;
    setTakoTapCount(nextTap);
    setShowQuip(true);

    if (reducedMotion) return;

    // Smooth interruptible jelly-squish & joyful tilt (never remounts HeroTakoAuthentic)
    const tiltDir = nextTap % 2 === 0 ? -1 : 1;
    void animateTako(
      takoScope.current,
      {
        y: [0, 5, -16, -2, 0],
        scaleX: [1, 1.07, 0.95, 1.02, 1],
        scaleY: [1, 0.93, 1.06, 0.98, 1],
        rotate: [0, tiltDir * 3.5, -tiltDir * 2.2, 0],
      },
      { duration: 0.58, ease: EASE_OUT }
    );

    // Spawn a soft aquatic ripple + floating peso bubbles burst (supports rapid clicks)
    const burstId = Date.now() + nextTap;
    setClickBursts((prev) => [...prev.slice(-3), burstId]);
    const cleanupTimer = window.setTimeout(() => {
      setClickBursts((prev) => prev.filter((id) => id !== burstId));
    }, 950);
    burstTimersRef.current.push(cleanupTimer);
  };

  const activeQuip = TAKO_QUIPS[(Math.max(1, takoTapCount) - 1) % TAKO_QUIPS.length];

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100svh-64px)] w-full flex-col justify-between overflow-x-clip bg-gradient-to-b from-[#FFEAEF] via-[#FFF3F0] to-[#FFF8F2] px-4 pb-5 pt-2 dark:from-[#1B1228] dark:via-[#221531] dark:to-[#140E1D] sm:px-8 sm:pt-3 lg:px-10 lg:pb-8 lg:pt-4 xl:px-12"
    >
      {/* Subtle architectural studio grid maximizing the full viewport */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[linear-gradient(to_right,rgba(43,27,61,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(43,27,61,0.04)_1px,transparent_1px)] bg-[size:56px_56px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
        style={{
          maskImage: 'radial-gradient(ellipse 88% 82% at 50% 44%, #000 45%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 88% 82% at 50% 44%, #000 45%, transparent 100%)',
        }}
      />

      {/* Ambient radial coral glow behind center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[48%] -z-0 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl dark:opacity-20"
        style={{
          background:
            'radial-gradient(circle, rgba(255,122,138,0.28) 0%, rgba(255,179,188,0.12) 48%, transparent 72%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-between py-1 sm:justify-center sm:py-2">
        {/* 1. Full-Width Display Wordmark behind Tako's dome (MEWVERSE reference) */}
        <div className="relative flex w-full flex-col items-center select-none">
          <motion.div
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT }}
            className="w-full text-center font-[family-name:var(--font-display)] text-[clamp(4.75rem,25vw,16rem)] font-black leading-[0.8] tracking-[0.06em] text-white drop-shadow-[0_12px_32px_rgba(229,64,94,0.13)] dark:text-white/[0.11] dark:drop-shadow-none sm:text-[clamp(6.25rem,22vw,16rem)] lg:text-[clamp(5.2rem,17.5vw,16rem)] lg:tracking-[0.08em]"
          >
            TAKO
          </motion.div>

          {/* Flanking editorial sub-caption across the width */}
          <div className="mt-3 hidden w-full max-w-[820px] items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#2B1B3D]/55 dark:text-[#FFF6EE]/50 lg:flex">
            <span className="flex items-center gap-3">
              <span>Split the bill</span>
              <span className="inline-block h-px w-14 bg-current opacity-45" aria-hidden="true" />
            </span>
            <span className="flex items-center gap-3">
              <span className="inline-block h-px w-14 bg-current opacity-45" aria-hidden="true" />
              <span>Not friendships</span>
            </span>
          </div>
        </div>

        {/* 2. Full-Width 3-Column Stage: Left Info + CTA · Center HUGE Tako · Right 2-Up Card Deck + Switcher */}
        <div className="relative -mt-7 grid w-full grid-cols-1 items-center gap-5 sm:-mt-9 sm:gap-6 lg:-mt-12 lg:grid-cols-12 lg:gap-5 xl:-mt-16">
          {/* LEFT COLUMN (4 cols): Honest Release Pill + Headline + Copy + Primary CTA Row */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.1, ease: EASE_OUT }}
            className="order-2 flex flex-col items-center justify-center text-center lg:order-1 lg:col-span-4 lg:items-start lg:pt-12 lg:text-left"
          >
            {/* Compact frosted release pill (honest metadata) */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-3 py-1.5 shadow-[0_10px_24px_-12px_rgba(43,27,61,0.14)] backdrop-blur-md dark:border-white/12 dark:bg-white/[0.06] dark:shadow-none sm:gap-2.5 sm:px-3.5 sm:py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--cta-bg)] text-white sm:h-8 sm:w-8">
                <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              </span>
              <div className="text-left leading-tight">
                <p className="font-[family-name:var(--font-display)] text-xs font-black text-[var(--ink)] tabular-nums sm:text-sm">
                  Android v{APK_CONFIG.version}
                </p>
                <p className="text-[10px] font-semibold text-[var(--mute)] tabular-nums sm:text-[11px]">
                  {APK_CONFIG.sizeLabel} · {APK_CONFIG.platformLabel}
                </p>
              </div>
            </div>

            <h1
              id="hero-heading"
              className="mt-3 max-w-[14ch] font-[family-name:var(--font-display)] text-[clamp(1.85rem,7.4vw,2.45rem)] font-black leading-[1.04] tracking-[-0.025em] text-[var(--ink)] lg:mt-4 lg:max-w-[16ch] lg:text-[clamp(1.75rem,2.6vw,2.5rem)] lg:leading-[1.06]"
            >
              Split bills, not friendships.
            </h1>

            <p className="mt-2 max-w-[36ch] text-[13.5px] leading-relaxed text-[var(--mute)] sm:mt-2.5 sm:max-w-[38ch] sm:text-[15px]">
              Share a QR at the table or drop an invite code in chat. Split equally, by receipt
              items, or custom amounts—splitting works offline, too.
            </p>

            <div className="mt-4 w-full max-w-sm lg:mt-5 lg:w-auto lg:max-w-none">
              <HeroDownloadControls variant="inline" />
            </div>
          </motion.div>

          {/* CENTER COLUMN (4 cols): HUGE 100% Authentic Tako rising right into the giant wordmark */}
          <div className="relative order-1 flex items-center justify-center lg:order-2 lg:col-span-4">
            {/* Soft organic coral backdrop behind huge Tako */}
            <svg
              aria-hidden="true"
              viewBox="0 0 420 320"
              fill="none"
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[clamp(210px,34svh,300px)] w-[clamp(245px,42svh,350px)] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 opacity-85 dark:opacity-20 lg:h-[clamp(290px,54svh,480px)] lg:w-[clamp(330px,62svh,560px)] lg:max-w-none"
            >
              <path
                d="M66 210 C12 164 26 76 102 52 C164 32 214 10 284 28 C366 48 404 128 368 202 C334 270 250 298 168 274 C116 259 98 238 66 210 Z"
                fill="#FFD7DF"
              />
            </svg>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                reducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.65, bounce: 0.2 }
              }
              className="relative z-10"
            >
              {/* Floating barkada speech bubble on click (clean, emoji-free) */}
              <AnimatePresence mode="wait">
                {showQuip && (
                  <motion.div
                    key={`quip-${takoTapCount}`}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.95 }}
                    transition={
                      reducedMotion
                        ? { duration: 0.12 }
                        : { type: 'spring', stiffness: 360, damping: 26, mass: 0.8 }
                    }
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#2B1B3D]/10 bg-white/95 px-4 py-1.5 font-[family-name:var(--font-display)] text-sm font-extrabold text-[#2B1B3D] shadow-[0_12px_28px_-10px_rgba(43,27,61,0.22)] backdrop-blur-md dark:border-white/15 dark:bg-[#231733]/95 dark:text-[#FFF6EE]"
                  >
                    {activeQuip}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#2B1B3D]/10 bg-white/95 dark:border-white/15 dark:bg-[#231733]/95"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Soft aquatic ripple pulse & floating peso bubbles on click */}
              {!reducedMotion &&
                clickBursts.map((burstId) => (
                  <div
                    key={burstId}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0"
                  >
                    {/* Dual staggered expanding ripple rings */}
                    <motion.span
                      initial={{ opacity: 0.52, scale: 0.55 }}
                      animate={{ opacity: 0, scale: 1.38 }}
                      transition={{ duration: 0.78, ease: EASE_OUT }}
                      className="absolute -left-36 -top-36 h-72 w-72 rounded-full border-2 border-[#FF7A8A]/70 dark:border-[#FF9FAA]/50"
                    />
                    <motion.span
                      initial={{ opacity: 0.36, scale: 0.45 }}
                      animate={{ opacity: 0, scale: 1.2 }}
                      transition={{ duration: 0.72, delay: 0.08, ease: EASE_OUT }}
                      className="absolute -left-36 -top-36 h-72 w-72 rounded-full border border-[#FFD166]/70 dark:border-[#FFD166]/45"
                    />

                    {/* Rising translucent bubbles & peso tokens */}
                    {CLICK_BUBBLES.map((item) => (
                      <motion.span
                        key={`${burstId}-${item.id}`}
                        initial={{ opacity: 0, x: 0, y: -12, scale: 0.5 }}
                        animate={{
                          opacity: [0, 0.95, 0],
                          x: item.x,
                          y: item.y,
                          scale: [0.5, 1, 0.85],
                        }}
                        transition={{ duration: 0.86, delay: item.delay, ease: EASE_OUT }}
                        style={{ width: item.size, height: item.size }}
                        className={
                          item.kind === 'peso'
                            ? 'absolute -left-2.5 -top-2.5 flex items-center justify-center rounded-full border border-[#E09F1F]/50 bg-[#FFF4D4]/95 font-[family-name:var(--font-display)] text-[11px] font-black text-[#2B1B3D] shadow-xs dark:border-[#FFD166]/40 dark:bg-[#3A2B18]/95 dark:text-[#FFE082]'
                            : 'absolute -left-1.5 -top-1.5 rounded-full border border-[#FF7A8A]/50 bg-white/75 backdrop-blur-xs dark:border-[#FF9FAA]/40 dark:bg-white/15'
                        }
                      >
                        {item.kind === 'peso' ? '₱' : null}
                      </motion.span>
                    ))}
                  </div>
                ))}

              <motion.button
                type="button"
                onClick={handleTakoClick}
                aria-label="Tap Tako to say hi"
                whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                transition={{ duration: 0.14, ease: EASE_OUT }}
                className="tako-hover-scale group relative z-10 block cursor-pointer rounded-full bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-[#FF7A8A]/45"
              >
                <div ref={takoScope} style={{ transformOrigin: 'center bottom' }}>
                  <HeroTakoAuthentic
                    eyeX={eyeX}
                    eyeY={eyeY}
                    paused={idlePaused}
                    className="h-[clamp(205px,33svh,290px)] w-[clamp(220px,36svh,310px)] max-w-[76vw] lg:h-[clamp(280px,56svh,490px)] lg:w-[clamp(300px,60svh,520px)] lg:max-w-none"
                  />
                </div>
              </motion.button>
            </motion.div>
          </div>

          {/* RIGHT COLUMN (4 cols): 2 Side-by-Side White Feature Cards + Bottom Switcher (MEWVERSE reference) */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.14, ease: EASE_OUT }}
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            onFocusCapture={() => setIsCarouselFocused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setIsCarouselFocused(false);
              }
            }}
            className="order-3 flex flex-col justify-center gap-3.5 lg:col-span-4 lg:pt-12"
          >
            {/* 2-Up Continuous Sliding Card Deck (smooth GPU translateX track + touch swipe) */}
            <div
              onPointerDown={handleCarouselPointerDown}
              onPointerUp={handleCarouselPointerUp}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              className="relative -mx-1.5 -my-2 touch-pan-y overflow-hidden py-2 sm:-mx-[7px]"
            >
              <motion.div
                style={{ x: trackX }}
                className="flex will-change-transform"
              >
                {EXTENDED_CARDS.map((card, slotIdx) => {
                  const isClone = slotIdx === 0 || slotIdx > CARD_COUNT;
                  return (
                    <div
                      key={card.slotKey}
                      aria-hidden={isClone || undefined}
                      className="w-1/2 shrink-0 px-1.5 sm:px-[7px]"
                    >
                      <a
                        href={card.href}
                        tabIndex={isClone ? -1 : undefined}
                        className="tako-lift group flex h-full min-h-[204px] flex-col justify-between rounded-[20px] border border-white/90 bg-white/95 p-3 text-left shadow-[0_14px_34px_-14px_rgba(43,27,61,0.15)] backdrop-blur-md transition-colors hover:border-[#FF7A8A]/50 dark:border-white/12 dark:bg-[#221731]/95 dark:shadow-none dark:hover:border-white/25 sm:min-h-[224px] sm:rounded-[22px] sm:p-4 xl:min-h-[246px] xl:p-4.5"
                      >
                        <div>
                          <h2 className="font-[family-name:var(--font-display)] text-[15px] font-black leading-tight text-[var(--ink)] sm:text-base">
                            {card.title}
                          </h2>
                          <p className="mt-1 text-[11px] font-semibold text-[var(--mute)]">
                            {card.meta}
                          </p>
                        </div>

                        {/* Mini visual tile */}
                        <div className={`my-3 rounded-2xl p-2.5 ${card.accentBg}`}>
                          {card.visual}
                        </div>

                        <div>
                          <span className="inline-flex items-center rounded-full bg-[#FFE6EA] px-3 py-1 text-[11px] font-extrabold text-[#D92D4B] transition-colors group-hover:bg-[var(--cta-bg)] group-hover:text-white dark:bg-[#3B1E2E] dark:text-[#FF9FAA] dark:group-hover:bg-[var(--cta-bg)] dark:group-hover:text-white">
                            {card.ctaLabel}
                          </span>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Bottom Switcher Row (matching MEWVERSE caption + < > controls) */}
            <div className="flex items-center justify-between gap-3 px-0.5">
              <div className="text-left">
                <p className="text-xs font-bold leading-snug text-[var(--ink)]">
                  Explore what Tako handles
                </p>
                <p className="text-[11px] font-medium text-[var(--mute)] tabular-nums">
                  Card {(cardIndex % HERO_CARDS.length) + 1}–{((cardIndex + 1) % HERO_CARDS.length) + 1} of{' '}
                  {HERO_CARDS.length} · Guest mode included
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous feature card"
                  className="tako-press inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2B1B3D]/12 bg-white/80 text-[var(--ink)] shadow-sm backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:h-9 sm:w-9"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next feature card"
                  className="tako-press inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2B1B3D]/12 bg-white/80 text-[var(--ink)] shadow-sm backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:h-9 sm:w-9"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
