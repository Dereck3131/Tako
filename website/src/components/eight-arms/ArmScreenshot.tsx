'use client';

import { Smartphone } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import type { ArmScreenKey } from './armsData';

// Tiny neutral SVG blur placeholder for smooth lazy loading
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjMyIiBmaWxsPSIjMkIxQjNEIiBmaWxsLW9wYWNpdHk9IjAuMTgiLz48L3N2Zz4=';

function SingleScreenshotFrame({
  filename,
  alt,
  compact = false,
}: {
  filename: string;
  alt: string;
  compact?: boolean;
}) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
  }, [filename]);

  return (
    <div
      className={
        compact
          ? 'relative aspect-[9/18.5] w-full overflow-hidden rounded-[18px] border-[3px] border-[#2B1B3D] bg-[var(--surface-alt)] dark:border-[#3A2C4D]'
          : 'relative mx-auto aspect-[9/18.5] w-[148px] overflow-hidden rounded-[24px] border-[4px] border-[#2B1B3D] bg-[var(--surface-alt)] shadow-md dark:border-[#3A2C4D]'
      }
    >
      {!missing ? (
        <Image
          src={`/screens/${filename}`}
          alt={alt}
          fill
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          sizes={compact ? '120px' : '156px'}
          draggable={false}
          // Slight crop hides mobile status bar, Expo Go banner, and dev gear button
          className="pointer-events-none select-none object-cover object-top scale-[1.06] -translate-y-[2.5%]"
          onError={() => setMissing(true)}
        />
      ) : (
        /* TODO: Drop real screenshot into website/public/screens/{filename} */
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2.5 text-center">
          <Smartphone className="h-5 w-5 text-[var(--coral-accent)]" aria-hidden="true" />
          <span className="text-[10px] font-extrabold leading-tight text-[var(--ink)]">
            Screenshot slot
          </span>
          <code className="break-all rounded bg-[var(--surface)] px-1 py-0.5 text-[8.5px] text-[var(--mute)]">
            {filename}
          </code>
        </div>
      )}
    </div>
  );
}

interface ArmScreenshotProps {
  screen: ArmScreenKey;
  theme: 'light' | 'dark';
  alt: string;
}

export function ArmScreenshot({ screen, theme, alt }: ArmScreenshotProps) {
  if (screen === 'dark-light-pair') {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <SingleScreenshotFrame
          filename="new-split-light.png"
          alt="Tako New Split screen in light mode"
          compact
        />
        <SingleScreenshotFrame
          filename="new-split-dark.png"
          alt="Tako New Split screen in dark mode"
          compact
        />
      </div>
    );
  }

  return <SingleScreenshotFrame filename={`${screen}-${theme}.png`} alt={alt} />;
}
