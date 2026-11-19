'use client';

import { type MotionValue, motion, useReducedMotion, useSpring } from 'motion/react';
import Image from 'next/image';
import React, { useState } from 'react';

interface HeroTakoProps {
  /** Normalized cursor offset (-1 to 1) for subtle eye tracking */
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  /** Extra scroll-out wave boost */
  isScrollingOut?: boolean;
}

/**
 * Hero star mascot: loads `/public/mascot/happy.png` (or `.svg`) if supplied,
 * otherwise renders Tako's exact octopus character from the mobile app
 * (happy face, waving tentacle, receipt + peso coin in tentacles,
 * 4s float, occasional blink, periodic wave, and cursor-tracking eyes).
 */
export function HeroTako({ eyeX, eyeY }: HeroTakoProps) {
  const reducedMotion = useReducedMotion();
  const [srcStage, setSrcStage] = useState<'png' | 'svg' | 'vector'>('png');

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  if (srcStage !== 'vector') {
    const src = `/mascot/happy.${srcStage}`;
    return (
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative h-[220px] w-[220px] sm:h-[270px] sm:w-[270px] lg:h-[310px] lg:w-[310px] select-none"
      >
        <Image
          src={src}
          alt="Tako the coral octopus waving happily"
          fill
          sizes="(max-width: 640px) 220px, (max-width: 1024px) 270px, 310px"
          priority
          unoptimized={srcStage === 'svg'}
          className="object-contain drop-shadow-[0_18px_24px_rgba(43,27,61,0.28)]"
          onError={() => setSrcStage((prev) => (prev === 'png' ? 'svg' : 'vector'))}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
      transition={
        reducedMotion
          ? undefined
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
      }
      className="relative h-[220px] w-[220px] sm:h-[270px] sm:w-[270px] lg:h-[310px] lg:w-[310px] select-none"
      role="img"
      aria-label="Tako the coral octopus waving while holding a receipt and peso coin"
    >
      <svg
        viewBox="-26 -14 186 176"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible drop-shadow-[0_18px_22px_rgba(43,27,61,0.24)]"
      >
        {/* Soft ground shadow */}
        <ellipse cx="64" cy="144" rx="44" ry="8" fill="rgba(43, 27, 61, 0.22)" />

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
            reducedMotion
              ? undefined
              : {
                  rotate: [0, -18, 12, -14, 0, 0, 0, 0],
                }
          }
          transition={
            reducedMotion
              ? undefined
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
            reducedMotion
              ? undefined
              : {
                  scaleY: [1, 1, 1, 0.08, 1, 1],
                }
          }
          transition={
            reducedMotion
              ? undefined
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
