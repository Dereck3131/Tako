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

function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || mem <= 4;
}

export function HeroShaderBg() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const [fadedIn, setFadedIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFadedIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compute = () => setUseStaticFallback(mq.matches || isLowEndDevice());
    compute();
    mq.addEventListener('change', compute);
    return () => mq.removeEventListener('change', compute);
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
          ? 'radial-gradient(ellipse 85% 75% at 72% 38%, rgba(229, 64, 94, 0.34) 0%, rgba(125, 58, 140, 0.32) 42%, #1B1424 100%)'
          : 'radial-gradient(ellipse 90% 80% at 74% 34%, rgba(255, 166, 158, 0.42) 0%, rgba(255, 224, 210, 0.48) 46%, #FAFAF7 100%)',
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
          style={{ opacity: fadedIn ? (isDark ? 0.82 : 0.62) : 0 }}
        >
          <ShaderGradientCanvas
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            pixelDensity={0.75}
            fov={42}
          >
            <ShaderGradient
              control="props"
              animate={inView ? 'on' : 'off'}
              type="waterPlane"
              cDistance={2.8}
              cPolarAngle={90}
              cAzimuthAngle={180}
              cameraZoom={1}
              color1={isDark ? '#E5405E' : '#FAFAF7'}
              color2={isDark ? '#7B368E' : '#FFD8CC'}
              color3={isDark ? '#1B1424' : '#FFB0A0'}
              grain="off"
              brightness={isDark ? 1.05 : 1.12}
              wireframe={false}
              uSpeed={0.18}
              uStrength={1.8}
              uDensity={1.4}
              uFrequency={4.2}
            />
          </ShaderGradientCanvas>
        </div>
      </WebGLErrorBoundary>

      {/* Soft readability scrim on the text side + smooth bottom blend into page bg */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(27, 20, 36, 0.72) 0%, rgba(27, 20, 36, 0.35) 55%, rgba(27, 20, 36, 0.15) 100%)'
            : 'linear-gradient(90deg, rgba(250, 250, 247, 0.78) 0%, rgba(250, 250, 247, 0.42) 55%, rgba(250, 250, 247, 0.12) 100%)',
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
