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
          stroke="var(--gold)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
      )}
    </motion.g>
  );
}

/**
 * Section 6 — Small, dense detail band:
 * tight monospace centavo-remainder ledger beside the interactive isometric
 * hairline coin stack (no outer rounded card wrapper).
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
      aria-label="Exact centavo ledger detail"
      className="border-y-2 border-dashed border-[var(--border)] bg-[var(--bg)] py-12 sm:py-14"
    >
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-5 sm:px-8 lg:grid-cols-12"
      >
        {/* Left: Small dense editorial copy */}
        <div className="lg:col-span-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.02em] text-[var(--ink)] sm:text-2xl">
            Every centavo accounted for.
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--mute)]">
            Stored in integer centavos so uneven splits distribute remainders cleanly—no missing
            ₱0.01s at the end of the night.
          </p>
        </div>

        {/* Center: Dense tabular ledger proof */}
        <div className="border-y border-dashed border-[var(--border)] py-3 font-mono text-xs leading-relaxed text-[var(--ink)] lg:col-span-5 lg:border-x lg:border-y-0 lg:px-6">
          <div className="flex justify-between text-[var(--mute)]">
            <span>BILL_TOTAL (3 PAX)</span>
            <span className="font-bold text-[var(--ink)] tabular-nums">₱1,000.00</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span>SHARE_01 (+₱0.01 rem)</span>
            <span className="font-bold text-[var(--coral-accent)] tabular-nums">₱333.34</span>
          </div>
          <div className="flex justify-between">
            <span>SHARE_02</span>
            <span className="tabular-nums">₱333.33</span>
          </div>
          <div className="flex justify-between">
            <span>SHARE_03</span>
            <span className="tabular-nums">₱333.33</span>
          </div>
          <div className="mt-1.5 flex justify-between border-t border-dashed border-[var(--border)] pt-1.5 font-bold">
            <span>REMAINDER_DRIFT</span>
            <span className="tabular-nums">₱0.00</span>
          </div>
        </div>

        {/* Right: Isometric coin stack + folded receipt */}
        <div
          className="relative mx-auto h-36 w-48 shrink-0 select-none lg:col-span-3"
          role="img"
          aria-label="Isometric line drawing of stacked coins beside a folded receipt"
        >
          <svg
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full overflow-visible"
          >
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
              <path
                d="M54 74 L74 84 M54 88 L74 98 M54 102 L70 110"
                stroke="var(--ink)"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.55"
              />
            </motion.g>

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
    </section>
  );
}
