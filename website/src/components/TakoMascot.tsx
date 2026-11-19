'use client';

import React from 'react';

export type MascotMood = 'happy' | 'sad' | 'peeking' | 'celebrating';

interface TakoMascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

const DEFAULT_ALTS: Record<MascotMood, string> = {
  happy: 'Tako the coral octopus smiling happily',
  sad: 'Tako the coral octopus looking sad while holding a calculator',
  peeking: 'Tako the coral octopus peeking playfully over the edge',
  celebrating: 'Tako the coral octopus celebrating happily',
};

/**
 * Renders the EXACT real Tako octopus SVG from the mobile app (`src/components/TakoMascot.tsx`)
 * directly inline (zero wasted image fallback requests or layout shifts).
 */
export function TakoMascot({
  mood = 'happy',
  size = 120,
  className,
  alt,
}: TakoMascotProps) {
  const label = alt ?? DEFAULT_ALTS[mood];

  return (
    <div
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="-14 -8 152 146"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        {/* Soft ground shadow */}
        {mood !== 'peeking' && (
          <ellipse cx="62" cy="128" rx="40" ry="7" fill="rgba(43, 27, 61, 0.16)" />
        )}

        {/* Tentacles (exact geometry from src/components/TakoMascot.tsx) */}
        {mood === 'peeking' ? (
          <>
            <ellipse cx="18" cy="90" rx="11" ry="14" fill="#F0627A" />
            <ellipse cx="40" cy="92" rx="11" ry="14" fill="#F0627A" />
            <ellipse cx="62" cy="92" rx="11" ry="14" fill="#F0627A" />
            <ellipse cx="84" cy="92" rx="11" ry="14" fill="#F0627A" />
            <ellipse cx="106" cy="90" rx="11" ry="14" fill="#F0627A" />
          </>
        ) : (
          <>
            {/* Tentacle 1 */}
            <g transform={mood === 'celebrating' ? 'rotate(24 14 78)' : undefined}>
              <ellipse cx="14" cy="92" rx="12" ry="24" fill="#F0627A" />
              <circle cx="14" cy="98" r="4" fill="#FFB3BC" />
              <circle cx="14" cy="108" r="3.5" fill="#FFB3BC" />
            </g>
            {/* Tentacle 2 */}
            <g>
              <ellipse cx="38" cy="89" rx="12" ry="27" fill="#F0627A" />
              <circle cx="38" cy="98" r="4" fill="#FFB3BC" />
              <circle cx="38" cy="109" r="3.5" fill="#FFB3BC" />
            </g>
            {/* Tentacle 3 */}
            <g>
              <ellipse cx="62" cy="87" rx="12" ry="29" fill="#F0627A" />
              <circle cx="62" cy="98" r="4" fill="#FFB3BC" />
              <circle cx="62" cy="109" r="3.5" fill="#FFB3BC" />
            </g>
            {/* Tentacle 4 */}
            <g>
              <ellipse cx="86" cy="89" rx="12" ry="27" fill="#F0627A" />
              <circle cx="86" cy="98" r="4" fill="#FFB3BC" />
              <circle cx="86" cy="109" r="3.5" fill="#FFB3BC" />
            </g>
            {/* Tentacle 5 (raised when celebrating) */}
            <g transform={mood === 'celebrating' ? 'rotate(-28 110 78)' : undefined}>
              <ellipse cx="110" cy="92" rx="12" ry="24" fill="#F0627A" />
              <circle cx="110" cy="98" r="4" fill="#FFB3BC" />
              <circle cx="110" cy="108" r="3.5" fill="#FFB3BC" />
            </g>
          </>
        )}

        {/* Head (exact geometry from src/components/TakoMascot.tsx) */}
        <ellipse cx="62" cy="48" rx="52" ry="46" fill="#FF7A8A" />
        <ellipse cx="41" cy="18" rx="13" ry="6" fill="#FF9AA6" />

        {/* Eyes */}
        <ellipse cx="44" cy="52" rx="12" ry="14" fill="#FFFFFF" />
        <ellipse cx="46" cy="55" rx="5.5" ry="7.5" fill="#2B1B3D" />
        <circle cx="47.5" cy="52" r="2" fill="#FFFFFF" />

        <ellipse cx="80" cy="52" rx="12" ry="14" fill="#FFFFFF" />
        <ellipse cx="82" cy="55" rx="5.5" ry="7.5" fill="#2B1B3D" />
        <circle cx="83.5" cy="52" r="2" fill="#FFFFFF" />

        {/* Cheeks */}
        <ellipse cx="28" cy="72" rx="7.5" ry="4.5" fill="#FF9FAA" />
        <ellipse cx="96" cy="72" rx="7.5" ry="4.5" fill="#FF9FAA" />

        {/* Mood-specific expressions matching mobile app TakoMascot.tsx */}
        {mood === 'celebrating' ? (
          <path d="M53 71 Q62 90 71 71 Z" fill="#2B1B3D" />
        ) : mood === 'sad' ? (
          <>
            <path
              d="M34 39 Q42 35 49 38"
              fill="none"
              stroke="#2B1B3D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M75 38 Q82 35 90 39"
              fill="none"
              stroke="#2B1B3D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path d="M34 65 C34 65 30 71 34 74 C38 71 34 65 34 65 Z" fill="#6EC6FF" />
            <path
              d="M52 78 Q62 70 72 78"
              fill="none"
              stroke="#2B1B3D"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Tiny calculator held by sad Tako */}
            <g transform="translate(96, 68) rotate(12)">
              <rect
                x="0"
                y="0"
                width="26"
                height="32"
                rx="5"
                fill="#2B1B3D"
                stroke="#FFF6EE"
                strokeWidth="2"
              />
              <rect x="4" y="4" width="18" height="7" rx="2" fill="#2EC4B6" />
              <circle cx="7.5" cy="17" r="2" fill="#FFF6EE" />
              <circle cx="13" cy="17" r="2" fill="#FFF6EE" />
              <circle cx="18.5" cy="17" r="2" fill="#FF7A8A" />
              <circle cx="7.5" cy="24" r="2" fill="#FFF6EE" />
              <circle cx="13" cy="24" r="2" fill="#FFF6EE" />
              <circle cx="18.5" cy="24" r="2" fill="#FFC857" />
            </g>
          </>
        ) : (
          <path
            d="M52 72 Q62 82 72 72"
            fill="none"
            stroke="#2B1B3D"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}
