import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Colors } from '../constants/theme';
import { useReducedMotion } from './MotionPrimitives';

/**
 * Signature Moment #1 (Phase 4):
 * Subtle, low-speed animated shader gradient for ONE hero balance card only.
 * Falls back to a static layered cobalt gradient on native, low-end devices,
 * or when prefers-reduced-motion is enabled.
 */
export function HeroShaderBackground() {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || reducedMotion || typeof window === 'undefined') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect low-end devices (<= 2 cores) with static fallback
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    if (cores <= 2) return;

    let rafId = 0;
    let start = performance.now();

    const render = (now: number) => {
      const t = ((now - start) / 1000) * 0.2; // low uSpeed = 0.2
      const w = canvas.width;
      const h = canvas.height;

      const x1 = w * (0.2 + 0.15 * Math.sin(t * 0.9));
      const y1 = h * (0.2 + 0.15 * Math.cos(t * 0.7));
      const grad = ctx.createRadialGradient(x1, y1, w * 0.05, w * 0.6, h * 0.6, w * 0.95);
      grad.addColorStop(0, '#4B7EFF');
      grad.addColorStop(0.5, Colors.primary);
      grad.addColorStop(1, '#1C47CC');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Static fallback (always rendered underneath for native, reduced-motion, and instant first paint) */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="heroCobaltGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#4679FF" />
            <Stop offset="55%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor="#1E4AD4" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroCobaltGrad)" />
      </Svg>

      {Platform.OS === 'web' && !reducedMotion && (
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.72,
            pointerEvents: 'none',
          }}
        />
      )}
    </View>
  );
}
