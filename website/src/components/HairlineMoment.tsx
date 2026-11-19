'use client';

import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import React from 'react';

function IsometricCoin({
  layer,
  isTop,
  sx,
  sy,
  reducedMotion,
}: {
  layer: number;
  isTop: boolean;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  reducedMotion: boolean | null;
}) {
  const cy = 128 - layer * 16;
  const factor = layer * 0.34;
  const x = useTransform(sx, (v) => v * factor);
  const y = useTransform(sy, (v) => v * factor * 0.75);

  return (
    <motion.g style={reducedMotion ? undefined : { x, y }}>
      <path
        d={`M142 ${cy} V${cy + 9} C142 ${cy + 20} 206 ${cy + 20} 206 ${cy + 9} V${cy}`}
        stroke={isTop ? 'var(--cta-bg)' : 'var(--ink)'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--bg)"
      />
      <ellipse
        cx="174"
        cy={cy}
        rx="32"
        ry="14"
        stroke={isTop ? 'var(--cta-bg)' : 'var(--ink)'}
        strokeWidth="1.6"
        fill="var(--surface)"
      />
      {isTop && (
        <ellipse
          cx="174"
          cy={cy}
          rx="22"
          ry="9"
          stroke="var(--coral)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      )}
    </motion.g>
  );
}

/**
 * Interactive isometric line figure inspired by `hairline-create`:
 * an isometric peso coin stack beside a folded receipt, drawn in clean
 * single-weight strokes (silhouette + one coral highlight stroke).
 * Answers mouse pointers with spring physics; stays in a composed static
 * rest pose on touch devices and when `prefers-reduced-motion` is enabled.
 */
export function HairlineMoment() {
  const reducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sx = useSpring(rawX, { stiffness: 110, damping: 16 });
  const sy = useSpring(rawY, { stiffness: 110, damping: 16 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(nx * 14);
    rawY.set(ny * 10);
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const coinLayers = [0, 1, 2, 3];

  return (
    <section
      aria-label="Isometric coin stack interactive accent"
      className="border-t border-[var(--border)]/60 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative flex flex-col items-center justify-between gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)]/55 px-6 py-10 sm:flex-row sm:px-10"
        >
          <div className="max-w-md text-center sm:text-left">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.02em] text-[var(--ink)] sm:text-3xl">
              Every centavo accounted for.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--mute)] sm:text-base">
              Uneven splits distribute remainder centavos cleanly — no rounding headaches, no
              missing ₱1s at the end of the night.
            </p>
          </div>

          <div
            className="relative h-44 w-56 shrink-0 select-none"
            role="img"
            aria-label="Isometric line drawing of stacked coins beside a folded receipt"
          >
            <svg
              viewBox="0 0 240 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full overflow-visible"
            >
              {/* Isometric folded receipt prism */}
              <motion.g style={reducedMotion ? undefined : { x: sx, y: sy }}>
                <path
                  d="M28 118 L76 92 L126 118 L78 144 Z"
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  opacity="0.35"
                />
                <path
                  d="M42 52 L88 28 L132 50 L86 74 Z"
                  stroke="var(--ink)"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M42 52 V106 L86 128 V74"
                  stroke="var(--ink)"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M132 50 V104 L86 128"
                  stroke="var(--ink)"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                {/* Receipt linework creases */}
                <path
                  d="M54 74 L74 84 M54 88 L74 98 M54 102 L70 110"
                  stroke="var(--ink)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </motion.g>

              {/* Stacked isometric coins that riffle with depth toward cursor */}
              {coinLayers.map((layer) => (
                <IsometricCoin
                  key={layer}
                  layer={layer}
                  isTop={layer === coinLayers.length - 1}
                  sx={sx}
                  sy={sy}
                  reducedMotion={reducedMotion}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
