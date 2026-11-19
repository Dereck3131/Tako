'use client';

import { type MotionValue, motion, useReducedMotion, useSpring } from 'motion/react';
import React from 'react';

interface HeroTakoProps {
  /** Normalized cursor/scroll offset (-1 to 1) for subtle eye tracking */
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  /** Pause idle float/wave/blink when hero is off-screen or browser tab is hidden */
  paused?: boolean;
}

/**
 * Hero star mascot: renders Tako's exact octopus character from the mobile app
 * directly as an inline SVG (zero wasted image fallback requests, zero per-frame
 * CSS drop-shadow filter re-rasterization).
 */
export function HeroTako({ eyeX, eyeY, paused = false }: HeroTakoProps) {
  const reducedMotion = useReducedMotion();
  const stopIdle = Boolean(reducedMotion) || paused;

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  return (
    <motion.div
      animate={stopIdle ? { y: 0 } : { y: [0, -8, 0] }}
      transition={
        stopIdle
          ? { duration: 0.2 }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ willChange: stopIdle ? undefined : 'transform' }}
      className="relative h-[156px] w-[156px] sm:h-[240px] sm:w-[240px] lg:h-[310px] lg:w-[310px] select-none"
      role="img"
      aria-label="Tako the coral octopus waving while holding a receipt and peso coin"
    >
      <svg
        viewBox="-26 -14 186 176"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        {/* Soft static ground shadow (GPU-free replacement for animated drop-shadow filter) */}
        <ellipse cx="64" cy="144" rx="48" ry="10" fill="rgba(43, 27, 61, 0.14)" />
        <ellipse cx="64" cy="144" rx="34" ry="6" fill="rgba(43, 27, 61, 0.18)" />

        {/* Left tentacle holding a mini paper receipt */}
        <g transform="translate(-4, 6)">
          <ellipse cx="14" cy="92" rx="12" ry="25" fill="#F0627A" transform="rotate(18 14 92)" />
          <circle cx="10" cy="98" r="3.8" fill="#FFB3BC" />
          <circle cx="6" cy="108" r="3.2" fill="#FFB3BC" />
          {/* Mini receipt held in tentacle */}
          <g transform="translate(-16, 76) rotate(-14)">
            <rect
              x="0"
              y="0"
              width="24"
              height="31"
              rx="4"
              fill="#FFFDF9"
              stroke="#2B1B3D"
              strokeWidth="2.2"
            />
            <path d="M5 8H19M5 14H15M5 20H18" stroke="#2B1B3D" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <circle cx="17" cy="24" r="2.2" fill="#D92D4B" />
          </g>
        </g>

        {/* Inner lower tentacles */}
        <ellipse cx="38" cy="98" rx="12" ry="28" fill="#F0627A" transform="rotate(6 38 98)" />
        <circle cx="37" cy="106" r="4" fill="#FFB3BC" />
        <circle cx="36" cy="117" r="3.5" fill="#FFB3BC" />

        <ellipse cx="64" cy="97" rx="12" ry="29" fill="#F0627A" />
        <circle cx="64" cy="106" r="4" fill="#FFB3BC" />
        <circle cx="64" cy="117" r="3.5" fill="#FFB3BC" />

        {/* Right-inner tentacle holding a gold peso coin */}
        <g>
          <ellipse cx="90" cy="98" rx="12" ry="27" fill="#F0627A" transform="rotate(-10 90 98)" />
          <circle cx="91" cy="106" r="4" fill="#FFB3BC" />
          <circle cx="93" cy="117" r="3.5" fill="#FFB3BC" />
          {/* Gold Peso Coin */}
          <g transform="translate(92, 102) rotate(8)">
            <circle cx="12" cy="12" r="13" fill="#FFC857" stroke="#2B1B3D" strokeWidth="2.2" />
            <circle cx="12" cy="12" r="9.5" stroke="#E09F1F" strokeWidth="1.4" />
            <text
              x="12"
              y="16.5"
              textAnchor="middle"
              fill="#2B1B3D"
              fontSize="13"
              fontWeight="900"
              fontFamily="var(--font-display), sans-serif"
            >
              ₱
            </text>
          </g>
        </g>

        {/* Waving tentacle (periodic friendly wave every few seconds) */}
        <motion.g
          style={{ transformOrigin: '104px 78px' }}
          animate={
            stopIdle
              ? { rotate: 0 }
              : {
                  rotate: [0, -18, 12, -14, 0, 0, 0, 0],
                }
          }
          transition={
            stopIdle
              ? { duration: 0.2 }
              : {
                  duration: 4.6,
                  times: [0, 0.08, 0.16, 0.24, 0.34, 0.6, 0.85, 1],
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        >
          <path
            d="M102 74 C118 68 128 52 126 36 C125 28 114 28 112 36 C110 48 104 58 96 66 Z"
            fill="#F0627A"
          />
          <circle cx="118" cy="44" r="3.6" fill="#FFB3BC" />
          <circle cx="112" cy="55" r="3.4" fill="#FFB3BC" />
        </motion.g>

        {/* Main Octopus Head (exact geometry from src/components/TakoMascot.tsx) */}
        <ellipse cx="62" cy="50" rx="52" ry="46" fill="#FF7A8A" />
        <ellipse cx="41" cy="20" rx="13" ry="6" fill="#FF9AA6" />

        {/* Left & Right Eyes with occasional blink + subtle cursor-following pupils */}
        <motion.g
          style={{ transformOrigin: '62px 54px' }}
          animate={
            stopIdle
              ? { scaleY: 1 }
              : {
                  scaleY: [1, 1, 1, 0.08, 1, 1],
                }
          }
          transition={
            stopIdle
              ? { duration: 0.2 }
              : {
                  duration: 4.4,
                  times: [0, 0.78, 0.82, 0.85, 0.89, 1],
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        >
          {/* Left eye white */}
          <ellipse cx="44" cy="54" rx="12" ry="14" fill="#FFFFFF" />
          {/* Right eye white */}
          <ellipse cx="80" cy="54" rx="12" ry="14" fill="#FFFFFF" />

          {/* Cursor-following pupils */}
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="46" cy="57" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="47.5" cy="54" r="2.2" fill="#FFFFFF" />
            <ellipse cx="82" cy="57" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="83.5" cy="54" r="2.2" fill="#FFFFFF" />
          </motion.g>
        </motion.g>

        {/* Rosy cheeks */}
        <ellipse cx="28" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />
        <ellipse cx="96" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />

        {/* Happy smile */}
        <path
          d="M52 74 Q62 84 72 74"
          fill="none"
          stroke="#2B1B3D"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}
