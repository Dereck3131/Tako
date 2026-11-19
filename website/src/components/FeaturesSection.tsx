'use client';

import clsx from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  MoveHorizontal,
  QrCode,
  SlidersHorizontal,
  SunMoon,
  UserRound,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import { ArmScreenshot } from './eight-arms/ArmScreenshot';
import { type ArmFeature, EIGHT_ARMS } from './eight-arms/armsData';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const ARM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'three-ways': SlidersHorizontal,
  'join-scan': QrCode,
  'peso-first': Coins,
  'payment-details': Wallet,
  'activity-history': Clock,
  'no-signal': WifiOff,
  'guest-mode': UserRound,
  'dark-light': SunMoon,
};

function getArmPath(arm: ArmFeature, curled: boolean): string {
  const mx = (arm.rootX + arm.padX) / 2;
  const my = (arm.rootY + arm.padY) / 2;
  // Gentle outward arc at rest; curls tighter toward viewer when active
  const bendX = arm.side === 'left' ? (curled ? -34 : -14) : curled ? 34 : 14;
  const bendY = arm.verticalSlot === 'top' ? (curled ? -42 : -22) : curled ? 36 : 18;
  return `M ${arm.rootX} ${arm.rootY} Q ${mx + bendX} ${my + bendY} ${arm.padX} ${arm.padY}`;
}

function getSuckerPoints(arm: ArmFeature): { x: number; y: number }[] {
  return [0.32, 0.56, 0.78].map((t) => {
    const mx = (arm.rootX + arm.padX) / 2 + (arm.side === 'left' ? -14 : 14);
    const my = (arm.rootY + arm.padY) / 2 + (arm.verticalSlot === 'top' ? -22 : 18);
    const inv = 1 - t;
    const x = inv * inv * arm.rootX + 2 * inv * t * mx + t * t * arm.padX;
    const y = inv * inv * arm.rootY + 2 * inv * t * my + t * t * arm.padY;
    return { x, y };
  });
}

export function FeaturesSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const armButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [reducedOpenId, setReducedOpenId] = useState<string | null>(EIGHT_ARMS[0].id);

  // Subtle spring-smoothed eyes for Tako
  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);
  const eyeX = useSpring(rawEyeX, { stiffness: 170, damping: 20 });
  const eyeY = useSpring(rawEyeY, { stiffness: 170, damping: 20 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pause idle sway/blink when section is off-screen or tab is hidden
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasEntered(true);
      },
      { threshold: 0.12 }
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

  const canIdleAnimate = inView && !tabHidden;

  // Active arm on desktop (open card wins over hover; hovering another arm switches smoothly)
  const activeId = openId ?? hoveredId;
  const activeArm = EIGHT_ARMS.find((a) => a.id === activeId) ?? null;
  const takoMood: 'idle' | 'curious' | 'happy' = openId
    ? 'happy'
    : hoveredId
      ? 'curious'
      : 'idle';

  // Drive Tako's eyes toward the active arm (desktop) or active card (mobile)
  useEffect(() => {
    if (reducedMotion) {
      rawEyeX.set(0);
      rawEyeY.set(0);
      return;
    }
    if (activeArm) {
      rawEyeX.set(activeArm.eyeDirX * 4.5);
      rawEyeY.set(activeArm.eyeDirY * 3.5);
    } else {
      const mArm = EIGHT_ARMS[mobileIndex];
      rawEyeX.set(mArm ? mArm.eyeDirX * 3 : 0);
      rawEyeY.set(1.5);
    }
  }, [activeArm, mobileIndex, rawEyeX, rawEyeY, reducedMotion]);

  // Close open desktop card on Escape or outside click
  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenId(null);
        setHoveredId(null);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setOpenId(null);
        setHoveredId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openId]);

  const handleArmKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % EIGHT_ARMS.length;
      armButtonRefs.current[next]?.focus();
      setOpenId(EIGHT_ARMS[next].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + EIGHT_ARMS.length) % EIGHT_ARMS.length;
      armButtonRefs.current[prev]?.focus();
      setOpenId(EIGHT_ARMS[prev].id);
    }
  };

  // Track mobile scroll-snap centered slide without fighting native browser scroll
  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    if (!hasSwiped) setHasSwiped(true);
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    if (closestIdx !== mobileIndex) {
      setMobileIndex(closestIdx);
    }
  };

  const scrollToMobileCard = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    setMobileIndex(idx);
    setHasSwiped(true);
    child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  // Reduced-motion fallback: static Tako above a clean 2-column grid with click-to-reveal screenshot
  if (reducedMotion) {
    return (
      <section
        id="features"
        ref={sectionRef}
        aria-labelledby="eight-arms-heading"
        className="border-t border-[var(--border)]/60 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="eight-arms-heading"
              className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)]"
            >
              Eight arms. Zero awkward math.
            </h2>
            <p className="mt-3 text-base text-[var(--mute)] sm:text-lg">
              Select any feature below to preview the real Tako screen.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EIGHT_ARMS.map((arm) => {
              const Icon = ARM_ICONS[arm.id] ?? SlidersHorizontal;
              const expanded = reducedOpenId === arm.id;
              return (
                <div
                  key={arm.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setReducedOpenId(expanded ? null : arm.id)}
                    className="flex w-full items-start gap-3.5 text-left"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--coral-soft)] text-[var(--coral-accent)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-display)] text-lg font-black text-[var(--ink)]">
                        {arm.title}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--mute)]">
                        {arm.description}
                      </span>
                      {arm.note && (
                        <span className="mt-1.5 inline-block rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 text-xs font-bold text-[var(--mute)]">
                          {arm.note}
                        </span>
                      )}
                    </span>
                  </button>
                  {expanded && (
                    <div className="mt-4 border-t border-[var(--border)]/60 pt-4">
                      <ArmScreenshot
                        screen={arm.screen}
                        theme={screenTheme}
                        alt={arm.screenAlt}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="features"
      ref={sectionRef}
      aria-labelledby="eight-arms-heading"
      className="relative overflow-x-clip border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="eight-arms-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.35rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Eight arms. Zero awkward math.
          </h2>
          <p className="mt-3 text-base text-[var(--mute)] sm:text-lg">
            Hover or tap any arm to see how Tako handles the table.
          </p>
        </div>

        {/* ============================================================
            DESKTOP INTERACTIVE RADIAL STAGE (>= 1024px)
           ============================================================ */}
        <div
          ref={stageRef}
          onMouseLeave={() => {
            setHoveredId(null);
            setOpenId(null);
          }}
          className="relative mx-auto mt-10 hidden h-[560px] w-full max-w-[1160px] select-none lg:block"
        >
          {/* SVG Layer: 8 radiating coral arms + center Tako head/body */}
          <svg
            viewBox="0 0 1000 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            {/* Soft radial halo behind Tako */}
            <circle cx="500" cy="296" r="142" fill="var(--coral-soft)" opacity="0.45" />

            {/* Eight radiating SVG arms */}
            {EIGHT_ARMS.map((arm, idx) => {
              const isActive = activeId === arm.id;
              const isDimmed = Boolean(activeId && !isActive);
              const d = getArmPath(arm, isActive);
              const suckers = getSuckerPoints(arm);

              return (
                <motion.g
                  key={arm.id}
                  style={{
                    transformOrigin: `${arm.rootX}px ${arm.rootY}px`,
                  }}
                  initial={{ opacity: 0, scale: 0.72 }}
                  animate={{
                    opacity: hasEntered ? (isDimmed ? 0.38 : 1) : 0,
                    scale: hasEntered ? (isActive ? 1.05 : 1) : 0.72,
                    rotate:
                      canIdleAnimate && !isActive && !activeId
                        ? [0, arm.side === 'left' ? -2.2 : 2.2, 0, arm.side === 'left' ? 1.8 : -1.8, 0]
                        : isActive
                          ? arm.side === 'left'
                            ? 4
                            : -4
                          : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.22, ease: EASE_OUT },
                    scale: { type: 'spring', duration: 0.5, bounce: 0.22, delay: hasEntered ? 0 : idx * 0.04 },
                    rotate:
                      canIdleAnimate && !isActive && !activeId
                        ? {
                            duration: 5.2,
                            delay: arm.swayDelay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                        : { type: 'spring', duration: 0.4, bounce: 0.2 },
                  }}
                >
                  <motion.path
                    d={d}
                    stroke={isActive ? '#FF7A8A' : '#F0627A'}
                    strokeWidth={isActive ? 24 : 20}
                    strokeLinecap="round"
                    transition={{ duration: 0.24, ease: EASE_OUT }}
                  />
                  {suckers.map((pt, sIdx) => (
                    <circle
                      key={sIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 4.4 : 3.6}
                      fill="#FFF6EE"
                      opacity="0.72"
                    />
                  ))}
                </motion.g>
              );
            })}

            {/* Center Tako Head & Body (matching hero mascot, clean without conflicting tentacles) */}
            <g>
              {/* Soft ground shadow under Tako */}
              <ellipse cx="500" cy="368" rx="64" ry="12" fill="rgba(43, 27, 61, 0.2)" />
              {/* Head dome */}
              <ellipse cx="500" cy="278" rx="76" ry="68" fill="#FF7A8A" />
              <ellipse cx="470" cy="236" rx="18" ry="8.5" fill="#FF9AA6" />

              {/* Blinking eyes + cursor/arm-tracking pupils */}
              <motion.g
                style={{ transformOrigin: '500px 282px' }}
                animate={
                  canIdleAnimate
                    ? {
                        scaleY: [1, 1, 1, 0.08, 1, 1],
                      }
                    : { scaleY: 1 }
                }
                transition={
                  canIdleAnimate
                    ? {
                        duration: 4.5,
                        times: [0, 0.8, 0.84, 0.87, 0.91, 1],
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : undefined
                }
              >
                <ellipse cx="474" cy="282" rx="17" ry="20" fill="#FFFFFF" />
                <ellipse cx="526" cy="282" rx="17" ry="20" fill="#FFFFFF" />
                <motion.g style={{ x: eyeX, y: eyeY }}>
                  <ellipse cx="476" cy="285" rx="8" ry="10.5" fill="#2B1B3D" />
                  <circle cx="478.5" cy="281" r="3" fill="#FFFFFF" />
                  <ellipse cx="528" cy="285" rx="8" ry="10.5" fill="#2B1B3D" />
                  <circle cx="530.5" cy="281" r="3" fill="#FFFFFF" />
                </motion.g>
              </motion.g>

              {/* Curious raised brow when hovering an arm */}
              {takoMood === 'curious' && (
                <path
                  d="M460 256 Q474 250 486 256"
                  stroke="#2B1B3D"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              )}

              {/* Cheeks */}
              <ellipse cx="450" cy="310" rx="11" ry="6.5" fill="#FF9FAA" />
              <ellipse cx="550" cy="310" rx="11" ry="6.5" fill="#FF9FAA" />

              {/* Reactive expression mouth */}
              {takoMood === 'happy' ? (
                <path d="M487 308 Q500 328 513 308 Z" fill="#2B1B3D" />
              ) : takoMood === 'curious' ? (
                <ellipse cx="500" cy="314" rx="5.5" ry="6.5" fill="#2B1B3D" />
              ) : (
                <path
                  d="M486 310 Q500 322 514 310"
                  stroke="#2B1B3D"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )}
            </g>
          </svg>

          {/* 8 Interactive Round Pad Buttons positioned over each arm tip */}
          {EIGHT_ARMS.map((arm, idx) => {
            const Icon = ARM_ICONS[arm.id] ?? SlidersHorizontal;
            const isActive = activeId === arm.id;
            const isDimmed = Boolean(activeId && !isActive);

            return (
              <div
                key={arm.id}
                style={{
                  left: `${(arm.padX / 1000) * 100}%`,
                  top: `${(arm.padY / 560) * 100}%`,
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              >
                <motion.button
                  ref={(el) => {
                    armButtonRefs.current[idx] = el;
                  }}
                  type="button"
                  aria-label={`${arm.title}: ${arm.description}`}
                  aria-expanded={openId === arm.id}
                  aria-controls={activeId === arm.id ? 'eight-arms-card' : undefined}
                  onMouseEnter={() => {
                    setHoveredId(arm.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredId((curr) => (curr === arm.id ? null : curr));
                  }}
                  onFocus={() => {
                    setHoveredId(arm.id);
                  }}
                  onBlur={() => {
                    setHoveredId((curr) => (curr === arm.id ? null : curr));
                  }}
                  onClick={() => {
                    setOpenId((curr) => (curr === arm.id ? null : arm.id));
                  }}
                  onKeyDown={(e) => handleArmKeyDown(e, idx)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: hasEntered ? (isDimmed ? 0.52 : 1) : 0,
                    scale: isActive ? 1.07 : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.2, delay: hasEntered ? 0 : 0.24 + idx * 0.03 },
                    scale: { type: 'spring', duration: 0.35, bounce: 0.2 },
                  }}
                  className={clsx(
                    'tako-press inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold shadow-sm',
                    isActive
                      ? 'border-[var(--cta-bg)] bg-[var(--cta-bg)] text-[var(--cta-ink)] shadow-[0_10px_24px_-8px_rgba(217,45,75,0.45)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--coral)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{arm.shortLabel}</span>
                </motion.button>
              </div>
            );
          })}

          {/* Pop-out Feature Card (never covers Tako's face, never overflows viewport) */}
          <AnimatePresence mode="popLayout">
            {activeArm && (
              <motion.div
                key={activeArm.id}
                id="eight-arms-card"
                role="region"
                aria-label={activeArm.title}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ type: 'spring', duration: 0.34, bounce: 0.16 }}
                className={clsx(
                  'absolute z-30 w-[268px] xl:w-[292px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--card-shadow)]',
                  activeArm.side === 'left' ? 'left-0 origin-right' : 'right-0 origin-left',
                  activeArm.verticalSlot === 'top' ? 'top-2' : 'bottom-2'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-black leading-snug text-[var(--ink)]">
                    {activeArm.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(null);
                      setHoveredId(null);
                    }}
                    aria-label="Close feature preview"
                    className="tako-press inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--mute)] hover:text-[var(--ink)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <ArmScreenshot
                  screen={activeArm.screen}
                  theme={screenTheme}
                  alt={activeArm.screenAlt}
                />

                <p className="mt-3 text-xs leading-relaxed text-[var(--mute)] sm:text-sm">
                  {activeArm.description}
                </p>

                {activeArm.note && (
                  <p className="mt-2 inline-flex rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-[11px] font-bold text-[var(--mute)]">
                    {activeArm.note}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ============================================================
            MOBILE / TABLET LAYOUT (< 1024px): SWIPEABLE HAND-OF-CARDS FAN
            Uses native CSS scroll-snap (pick-ui-library / mobile-native)
            so vertical page scroll is never blocked.
           ============================================================ */}
        <div className="mt-8 lg:hidden">
          {/* Compact reactive Tako above the swipeable fan */}
          <div className="mx-auto flex flex-col items-center">
            <svg
              viewBox="0 0 220 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-[112px] w-[190px] overflow-visible"
            >
              {/* 8 mini fan arms; active arm curls upward */}
              {EIGHT_ARMS.map((arm, idx) => {
                const isCurrent = idx === mobileIndex;
                const xEnd = 22 + idx * 25;
                const yEnd = isCurrent ? 92 : 114;
                return (
                  <motion.path
                    key={arm.id}
                    d={`M 110 74 Q ${(110 + xEnd) / 2} ${isCurrent ? 88 : 106} ${xEnd} ${yEnd}`}
                    stroke={isCurrent ? '#FF7A8A' : '#F0627A'}
                    strokeWidth={isCurrent ? 11 : 8}
                    strokeLinecap="round"
                    animate={{
                      opacity: isCurrent ? 1 : 0.55,
                    }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                  />
                );
              })}

              {/* Compact Tako head */}
              <ellipse cx="110" cy="54" rx="44" ry="38" fill="#FF7A8A" />
              <ellipse cx="92" cy="30" rx="10" ry="5" fill="#FF9AA6" />
              <ellipse cx="95" cy="56" rx="10" ry="12" fill="#FFFFFF" />
              <ellipse cx="125" cy="56" rx="10" ry="12" fill="#FFFFFF" />
              <motion.g style={{ x: eyeX, y: eyeY }}>
                <ellipse cx="96" cy="58" rx="4.8" ry="6.2" fill="#2B1B3D" />
                <circle cx="97.5" cy="55.5" r="1.7" fill="#FFFFFF" />
                <ellipse cx="126" cy="58" rx="4.8" ry="6.2" fill="#2B1B3D" />
                <circle cx="127.5" cy="55.5" r="1.7" fill="#FFFFFF" />
              </motion.g>
              <ellipse cx="81" cy="72" rx="6" ry="3.6" fill="#FF9FAA" />
              <ellipse cx="139" cy="72" rx="6" ry="3.6" fill="#FF9FAA" />
              <path
                d="M102 72 Q110 80 118 72"
                stroke="#2B1B3D"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>

            {/* First-view swipe hint */}
            <div
              className={clsx(
                'mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--mute)] transition-opacity duration-200',
                hasSwiped ? 'opacity-0' : 'opacity-100'
              )}
              aria-hidden={hasSwiped}
            >
              <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Swipe to explore</span>
            </div>
          </div>

          {/* Native horizontal scroll-snap fan */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="-mx-5 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[12%] pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-[22%]"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            {EIGHT_ARMS.map((arm, idx) => {
              const Icon = ARM_ICONS[arm.id] ?? SlidersHorizontal;
              const offset = idx - mobileIndex;
              const isCentered = offset === 0;
              const rotateDeg = offset < 0 ? -3 : offset > 0 ? 3 : 0;

              return (
                <article
                  key={arm.id}
                  onClick={() => !isCentered && scrollToMobileCard(idx)}
                  style={{
                    transform: `scale(${isCentered ? 1 : 0.92}) rotate(${rotateDeg}deg)`,
                    opacity: isCentered ? 1 : 0.9,
                    touchAction: 'pan-x pan-y',
                  }}
                  className="w-[76vw] max-w-[300px] shrink-0 snap-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] transition-[transform,opacity] duration-200 ease-[var(--ease-out)]"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--coral-soft)] text-[var(--coral-accent)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-black leading-tight text-[var(--ink)]">
                      {arm.title}
                    </h3>
                  </div>

                  <ArmScreenshot
                    screen={arm.screen}
                    theme={screenTheme}
                    alt={arm.screenAlt}
                  />

                  <p className="mt-3.5 text-base leading-relaxed text-[var(--mute)]">
                    {arm.description}
                  </p>

                  {arm.note && (
                    <p className="mt-2 inline-flex rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-xs font-bold text-[var(--ink)]">
                      {arm.note}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {/* Accessible Prev / 8 Dot Indicators / Next Controls (all >= 44px touch targets) */}
          <div className="mx-auto mt-2 flex max-w-[380px] items-center justify-center gap-1">
            <button
              type="button"
              onClick={() =>
                scrollToMobileCard((mobileIndex - 1 + EIGHT_ARMS.length) % EIGHT_ARMS.length)
              }
              aria-label="Previous feature"
              className="tako-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <div
              className="flex flex-1 items-center justify-center"
              role="tablist"
              aria-label="Choose a Tako feature"
            >
              {EIGHT_ARMS.map((arm, idx) => {
                const active = idx === mobileIndex;
                return (
                  <button
                    key={arm.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-current={active ? 'true' : undefined}
                    aria-label={`Show ${arm.title}`}
                    onClick={() => scrollToMobileCard(idx)}
                    className="tako-press inline-flex h-11 flex-1 max-w-[36px] items-center justify-center"
                  >
                    <span
                      className={clsx(
                        'block h-2 w-2 rounded-full transition-[transform,background-color] duration-200 ease-[var(--ease-out)]',
                        active ? 'scale-x-[2.2] bg-[var(--cta-bg)]' : 'scale-x-100 bg-[var(--border)]'
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollToMobileCard((mobileIndex + 1) % EIGHT_ARMS.length)}
              aria-label="Next feature"
              className="tako-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
