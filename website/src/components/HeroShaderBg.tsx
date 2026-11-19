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

export function HeroShaderBg() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isDark = resolvedTheme === 'dark';

  const fallback = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: isDark
          ? 'radial-gradient(circle at 75% 30%, rgba(255, 122, 138, 0.24) 0%, rgba(43, 27, 61, 0.72) 48%, #1B1424 100%)'
          : 'radial-gradient(circle at 75% 30%, rgba(255, 122, 138, 0.22) 0%, rgba(185, 165, 232, 0.18) 45%, #FAFAF7 100%)',
      }}
    />
  );

  if (reducedMotion) {
    return (
      <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {fallback}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <WebGLErrorBoundary fallback={fallback}>
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isDark ? 0.55 : 0.34 }}
        >
          <ShaderGradientCanvas
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            pixelDensity={1}
            fov={45}
          >
            <ShaderGradient
              control="props"
              animate={inView ? 'on' : 'off'}
              type="plane"
              cDistance={32}
              cPolarAngle={120}
              cAzimuthAngle={180}
              cameraZoom={1}
              color1="#FF7A8A"
              color2={isDark ? '#D92D4B' : '#B9A5E8'}
              color3={isDark ? '#1B1424' : '#FAFAF7'}
              grain="off"
              brightness={isDark ? 0.95 : 1.15}
              wireframe={false}
              uSpeed={0.2}
              uStrength={1.6}
              uDensity={1.2}
              uFrequency={4.8}
            />
          </ShaderGradientCanvas>
        </div>
      </WebGLErrorBoundary>
      {/* Edge fade into page ground so Hero transitions cleanly into Section 2 */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
        }}
      />
    </div>
  );
}
