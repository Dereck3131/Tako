'use client';

import Image from 'next/image';
import React, { useState } from 'react';

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
  sad: 'Tako the coral octopus looking overwhelmed holding a calculator',
  peeking: 'Tako the coral octopus peeking playfully over the edge',
  celebrating: 'Tako the coral octopus celebrating with arms raised',
};

/**
 * Renders the user-supplied mascot from `/public/mascot/{mood}.png` (or `.svg`),
 * falling back seamlessly to Tako's built-in vector mascot so the site never shows a broken image.
 */
export function TakoMascot({
  mood = 'happy',
  size = 120,
  className,
  alt,
  priority = false,
}: TakoMascotProps) {
  const [srcStage, setSrcStage] = useState<'png' | 'svg' | 'vector'>('png');
  const label = alt ?? DEFAULT_ALTS[mood];

  if (srcStage !== 'vector') {
    const src = `/mascot/${mood}.${srcStage}`;
    return (
      <div
        className={className}
        style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
      >
        <Image
          src={src}
          alt={label}
          width={size}
          height={size}
          priority={priority}
          unoptimized={srcStage === 'svg'}
          className="h-full w-full object-contain select-none"
          onError={() => setSrcStage((prev) => (prev === 'png' ? 'svg' : 'vector'))}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        {/* Soft drop shadow */}
        {mood !== 'peeking' && (
          <ellipse cx="60" cy="108" rx="30" ry="6" fill="rgba(43, 27, 61, 0.14)" />
        )}

        {/* Side celebrating tentacles */}
        {mood === 'celebrating' && (
          <>
            <path
              d="M28 66C16 58 12 44 18 35"
              stroke="#FF7A8A"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M92 66C104 58 108 44 102 35"
              stroke="#FF7A8A"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Sparkle accents */}
            <circle cx="14" cy="24" r="3.5" fill="#FFC857" />
            <circle cx="106" cy="22" r="3" fill="#2EC4B6" />
            <circle cx="96" cy="14" r="2.5" fill="#B9A5E8" />
          </>
        )}

        {/* Main octopus body & lower tentacles */}
        {mood === 'peeking' ? (
          <>
            <path
              d="M24 72C24 44 40 28 60 28C80 28 96 44 96 72V92H24V72Z"
              fill="#FF7A8A"
            />
            {/* Little paws resting on the edge */}
            <ellipse cx="34" cy="92" rx="10" ry="7" fill="#F0627A" />
            <ellipse cx="86" cy="92" rx="10" ry="7" fill="#F0627A" />
          </>
        ) : (
          <>
            <path
              d="M24 60C24 37.9 40.1 20 60 20C79.9 20 96 37.9 96 60V83C96 90.2 90.5 96 84 96C78.8 96 75 91.9 75 86.5C75 91.9 71 96 65.5 96C61.2 96 58 92.6 58 88C58 92.6 54.8 96 50.5 96C45 96 41 91.9 41 86.5C41 91.9 37.2 96 32 96C26 96 24 90.2 24 83V60Z"
              fill="#FF7A8A"
            />
            {/* Subtle highlight on dome */}
            <path
              d="M39 36C44 30 51 27 58 27"
              stroke="rgba(255, 246, 238, 0.42)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Blush cheeks */}
        <ellipse
          cx="37"
          cy={mood === 'peeking' ? '72' : '68'}
          rx="6.5"
          ry="4"
          fill="#F0627A"
          opacity="0.7"
        />
        <ellipse
          cx="83"
          cy={mood === 'peeking' ? '72' : '68'}
          rx="6.5"
          ry="4"
          fill="#F0627A"
          opacity="0.7"
        />

        {/* Eyes */}
        {mood === 'celebrating' ? (
          <>
            <path
              d="M41 59C43 54 49 54 51 59"
              stroke="#2B1B3D"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
            <path
              d="M69 59C71 54 77 54 79 59"
              stroke="#2B1B3D"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <ellipse
              cx="46"
              cy={mood === 'peeking' ? '62' : '58'}
              rx="7.2"
              ry="8"
              fill="#FFF6EE"
            />
            <ellipse
              cx="74"
              cy={mood === 'peeking' ? '62' : '58'}
              rx="7.2"
              ry="8"
              fill="#FFF6EE"
            />
            <circle
              cx={mood === 'sad' ? '45' : '47.5'}
              cy={mood === 'peeking' ? '63' : mood === 'sad' ? '60' : '58.5'}
              r="4.2"
              fill="#2B1B3D"
            />
            <circle
              cx={mood === 'sad' ? '75' : '75.5'}
              cy={mood === 'peeking' ? '63' : mood === 'sad' ? '60' : '58.5'}
              r="4.2"
              fill="#2B1B3D"
            />
            <circle
              cx="49"
              cy={mood === 'peeking' ? '60.5' : '56.5'}
              r="1.5"
              fill="#FFFFFF"
            />
            <circle
              cx="77"
              cy={mood === 'peeking' ? '60.5' : '56.5'}
              r="1.5"
              fill="#FFFFFF"
            />
          </>
        )}

        {/* Worried brows for sad mood */}
        {mood === 'sad' && (
          <>
            <path
              d="M39 48L49 45"
              stroke="#2B1B3D"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M81 48L71 45"
              stroke="#2B1B3D"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Mouth */}
        {mood === 'sad' ? (
          <path
            d="M53 73C56 69.5 64 69.5 67 73"
            stroke="#2B1B3D"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ) : mood === 'celebrating' ? (
          <path
            d="M51 67C54 75 66 75 69 67Z"
            fill="#2B1B3D"
          />
        ) : (
          <path
            d={
              mood === 'peeking'
                ? 'M54 72C57 75.5 63 75.5 66 72'
                : 'M53 68C56.5 72.5 63.5 72.5 67 68'
            }
            stroke="#2B1B3D"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        )}

        {/* Tiny calculator held by sad Tako */}
        {mood === 'sad' && (
          <g transform="translate(76, 72) rotate(10)">
            <rect
              x="0"
              y="0"
              width="24"
              height="30"
              rx="5"
              fill="#2B1B3D"
              stroke="#FFF6EE"
              strokeWidth="2"
            />
            <rect x="4" y="4" width="16" height="7" rx="2" fill="#2EC4B6" />
            <circle cx="7" cy="16" r="1.8" fill="#FFF6EE" />
            <circle cx="12" cy="16" r="1.8" fill="#FFF6EE" />
            <circle cx="17" cy="16" r="1.8" fill="#FF7A8A" />
            <circle cx="7" cy="22" r="1.8" fill="#FFF6EE" />
            <circle cx="12" cy="22" r="1.8" fill="#FFF6EE" />
            <circle cx="17" cy="22" r="1.8" fill="#FFC857" />
          </g>
        )}
      </svg>
    </div>
  );
}
