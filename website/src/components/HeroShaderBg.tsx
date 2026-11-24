'use client';

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function isLowEndOrMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrowViewport = window.innerWidth < 768;
  return cores <= 4 || mem <= 4 || Boolean(conn?.saveData) || coarsePointer || narrowViewport;
}

export function HeroShaderBg() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const [fadedIn, setFadedIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFadedIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compute = () => setUseStaticFallback(mq.matches || isLowEndOrMobileDevice());
    compute();
    mq.addEventListener('change', compute);
    return () => mq.removeEventListener('change', compute);
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.02 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isDark = resolvedTheme === 'dark';

  const staticGradient = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse 46% 58% at 75% 48%, rgba(235, 62, 94, 0.38) 0%, rgba(235, 62, 94, 0.12) 45%, transparent 74%), radial-gradient(ellipse 36% 52% at 96% 36%, rgba(142, 86, 204, 0.28) 0%, transparent 72%), #120B1C'
          : 'radial-gradient(ellipse 48% 58% at 75% 46%, rgba(255, 112, 130, 0.34) 0%, rgba(255, 166, 158, 0.14) 48%, transparent 76%), radial-gradient(ellipse 36% 52% at 96% 36%, rgba(154, 118, 214, 0.22) 0%, transparent 72%), #FAFAF7',
      }}
    />
  );

  if (useStaticFallback) {
    return (
      <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {staticGradient}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <WebGLErrorBoundary fallback={staticGradient}>
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: fadedIn ? (isDark ? 0.78 : 0.56) : 0 }}
        >
          <ShaderGradientCanvas
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            pixelDensity={0.75}
            fov={42}
          >
            <ShaderGradient
              control="props"
              animate={inView && !tabHidden ? 'on' : 'off'}
              type="waterPlane"
              cDistance={2.8}
              cPolarAngle={90}
              cAzimuthAngle={180}
              cameraZoom={1}
              color1={isDark ? '#E5405E' : '#FAFAF7'}
              color2={isDark ? '#6E328A' : '#FFD6C9'}
              color3={isDark ? '#120B1C' : '#FFA69E'}
              grain="off"
              brightness={isDark ? 1.02 : 1.08}
              wireframe={false}
              uSpeed={0.18}
              uStrength={1.8}
              uDensity={1.4}
              uFrequency={4.2}
            />
          </ShaderGradientCanvas>
        </div>
      </WebGLErrorBoundary>

      {/* Readability scrim keeps the left headline & subline completely clear of glow */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(18, 11, 28, 0.94) 0%, rgba(18, 11, 28, 0.78) 44%, rgba(18, 11, 28, 0.22) 72%, rgba(18, 11, 28, 0.14) 100%)'
            : 'linear-gradient(90deg, rgba(250, 250, 247, 0.95) 0%, rgba(250, 250, 247, 0.8) 44%, rgba(250, 250, 247, 0.22) 72%, rgba(250, 250, 247, 0.12) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-28"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
        }}
      />
    </div>
  );
}
