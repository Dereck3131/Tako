'use client';

import clsx from 'clsx';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import React from 'react';

/**
 * Subtle zigzag receipt-paper tear edge separating sections along "the bill".
 */
export function ReceiptDivider({
  topClass = 'bg-[var(--bg)]',
  fillColor = 'var(--cream-block)',
  flip = false,
}: {
  topClass?: string;
  fillColor?: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none relative w-full overflow-hidden leading-none', topClass)}
    >
      <svg
        viewBox="0 0 1200 18"
        preserveAspectRatio="none"
        className={clsx('block h-[14px] w-full sm:h-[18px]', flip && 'rotate-180')}
      >
        <path
          d="M0 18 L15 4 L30 18 L45 4 L60 18 L75 4 L90 18 L105 4 L120 18 L135 4 L150 18 L165 4 L180 18 L195 4 L210 18 L225 4 L240 18 L255 4 L270 18 L285 4 L300 18 L315 4 L330 18 L345 4 L360 18 L375 4 L390 18 L405 4 L420 18 L435 4 L450 18 L465 4 L480 18 L495 4 L510 18 L525 4 L540 18 L555 4 L570 18 L585 4 L600 18 L615 4 L630 18 L645 4 L660 18 L675 4 L690 18 L705 4 L720 18 L735 4 L750 18 L765 4 L780 18 L795 4 L810 18 L825 4 L840 18 L855 4 L870 18 L885 4 L900 18 L915 4 L930 18 L945 4 L960 18 L975 4 L990 18 L1005 4 L1020 18 L1035 4 L1050 18 L1065 4 L1080 18 L1095 4 L1110 18 L1125 4 L1140 18 L1155 4 L1170 18 L1185 4 L1200 18 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}

/**
 * Receipt line-item header: code + title + leader dots + right-aligned amount.
 * Keeps the page unified as one long bill without reading as an AI kicker.
 */
export function ReceiptLineHeader({
  code,
  label,
  amount,
  onDark = false,
  forceLight = false,
  className = '',
}: {
  code: string;
  label: string;
  amount: string;
  onDark?: boolean;
  forceLight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex items-baseline gap-2.5 font-mono text-xs font-bold uppercase tracking-[0.06em] sm:text-[13px]',
        onDark
          ? 'text-[#E3D5F5]'
          : forceLight
            ? 'text-[#574B66]'
            : 'text-[var(--mute)]',
        className
      )}
    >
      <span
        className={clsx(
          'shrink-0 tabular-nums',
          onDark
            ? 'text-[#FFC857]'
            : forceLight
              ? 'text-[#B91C3B]'
              : 'text-[var(--coral-accent)]'
        )}
      >
        {code}
      </span>
      <span className="shrink-0">{label}</span>
      <span
        aria-hidden="true"
        className={clsx(
          'min-w-[24px] flex-1 border-b-2 border-dotted -translate-y-1',
          onDark
            ? 'border-[#FFF6EE]/30'
            : forceLight
              ? 'border-[#D9D0BE]'
              : 'border-[var(--border)]'
        )}
      />
      <span
        className={clsx(
          'shrink-0 tabular-nums',
          onDark
            ? 'text-[#FFF6EE]'
            : forceLight
              ? 'text-[#2B1B3D]'
              : 'text-[var(--ink)]'
        )}
      >
        {amount}
      </span>
    </div>
  );
}

function DesktopScrollTakoTentacle() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 22 });

  const y = useTransform(smoothProgress, [0, 1], ['14vh', '76vh']);
  const rotate = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [-6, 4, -5, 5, -3]);
  const opacity = useTransform(smoothProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0.3]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ y, rotate, opacity }}
      className="pointer-events-none fixed right-0 top-0 z-30"
    >
      <svg
        width="68"
        height="48"
        viewBox="0 0 68 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Curled coral tentacle tip emerging from right edge and pointing left */}
        <path
          d="M68 12 C48 10 30 14 14 22 C4 27 4 36 14 36 C28 36 46 31 68 34 Z"
          fill="#F0627A"
          stroke="#2B1B3D"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="27" r="3.4" fill="#FFB3BC" />
        <circle cx="34" cy="25" r="3.8" fill="#FFB3BC" />
        <circle cx="48" cy="24" r="4" fill="#FFB3BC" />
      </svg>
    </motion.div>
  );
}

/**
 * Single coral Tako tentacle gliding down the right viewport edge on desktop,
 * pointing toward the active section along the receipt thread.
 * Transform & opacity only; never mounts scroll listeners on mobile or reduced motion.
 */
export function ScrollTakoTentacle() {
  const reducedMotion = useReducedMotion();
  const [isXl, setIsXl] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsXl(window.innerWidth >= 1280);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  if (reducedMotion || !isXl) return null;
  return <DesktopScrollTakoTentacle />;
}
