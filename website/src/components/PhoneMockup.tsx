'use client';

import clsx from 'clsx';
import React from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div
      className={clsx(
        'relative mx-auto w-[min(74vw,276px)] max-w-full sm:w-[276px] aspect-[9/19.2] rounded-[40px] sm:rounded-[42px] border-[7px] border-[#2B1B3D] bg-[#1B1424] p-1.5 shadow-[0_24px_60px_-16px_rgba(43,27,61,0.45)] dark:border-[#3A2C4D] dark:shadow-[0_28px_64px_-16px_rgba(0,0,0,0.7)]',
        className
      )}
    >
      {/* Top camera pill */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-3 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-[#120D19]"
      />
      {/* Screen surface */}
      <div className="relative h-full w-full overflow-hidden rounded-[32px] sm:rounded-[34px] bg-[var(--bg)]">
        {children}
      </div>
    </div>
  );
}
