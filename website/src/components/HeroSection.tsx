'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import { AppScreen } from './AppScreen';
import { DownloadBlock } from './DownloadBlock';
import { PhoneMockup } from './PhoneMockup';
import { TakoMascot } from './TakoMascot';

const HeroShaderBg = dynamic(
  () => import('./HeroShaderBg').then((m) => m.HeroShaderBg),
  { ssr: false }
);

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const screenTheme: 'light' | 'dark' = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';

  // Spring-smoothed pointer tilt for desktop mouse users only
  const rawRotX = useMotionValue(0);
  const rawRotY = useMotionValue(0);
  const rotateX = useSpring(rawRotX, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(rawRotY, { stiffness: 120, damping: 18 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotY.set(relX * 10);
    rawRotX.set(-relY * 8);
  };

  const handlePointerLeave = () => {
    rawRotX.set(0);
    rawRotY.set(0);
  };

  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden py-12 sm:py-16 lg:py-20"
    >
      <HeroShaderBg />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
        {/* Left: Copy + Actions */}
        <div className="lg:col-span-7">
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.75rem)] font-black leading-[1.02] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Split bills, not friendships.
          </motion.h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT }}
            className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--mute)] sm:text-xl"
          >
            Share a QR, everyone hops in, and Tako does the peso math for barkada dinners,
            roommates, and road trips — even offline.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE_OUT }}
            className="mt-8"
          >
            <DownloadBlock variant="hero" surface="default" />
          </motion.div>
        </div>

        {/* Right: Floating Phone + Peeking Tako */}
        <div
          className="relative flex justify-center lg:col-span-5"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ perspective: 1000 }}
        >
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT }}
            style={reducedMotion ? undefined : { rotateX, rotateY }}
            className="relative pt-14"
          >
            {/* Peeking Tako perched over top edge of phone */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2">
              <TakoMascot mood="peeking" size={112} priority />
            </div>

            <PhoneMockup className="relative z-10">
              <AppScreen screen="splits-home" theme={screenTheme} priority />
            </PhoneMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
