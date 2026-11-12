import React from 'react';
import Svg, { Path, Ellipse, Circle, Rect } from 'react-native-svg';
import { Item, ItemShare, RoomMember } from '../types/database';
import { AppLanguage, t } from '../constants/i18n';

export type TakoMood =
  | 'waiting'
  | 'happy'
  | 'counting'
  | 'empty_pockets'
  | 'celebrating';

interface TakoMascotProps {
  size?: number;
  mood?: TakoMood;
}

/**
 * Derives Tako's current mood from live room state:
 * - celebrating: everyone who owes has paid
 * - empty_pockets: at least one payment failed or someone hasn't paid while others have
 * - counting: settlement in progress (some paid, some pending)
 * - happy: all items 100% claimed and everyone joined
 * - waiting: people still joining or items unclaimed
 */
export function getTakoMood(
  members: RoomMember[],
  items: Item[],
  shares: Record<string, ItemShare[]>
): TakoMood {
  const owingMembers = members.filter((m) => m.totalOwedCents > 0);
  const paidCount = owingMembers.filter(
    (m) => m.paymentStatus === 'paid' || m.paymentStatus === 'verified'
  ).length;
  const hasFailed = owingMembers.some((m) => m.paymentStatus === 'failed');

  if (owingMembers.length > 0 && paidCount === owingMembers.length) {
    return 'celebrating';
  }
  if (hasFailed) {
    return 'empty_pockets';
  }
  if (paidCount > 0 && paidCount < owingMembers.length) {
    return 'counting';
  }

  const allJoined = members.every((m) => m.connectionStatus !== 'Joining…');
  const allClaimed =
    items.length > 0 &&
    items.every((item) => {
      const itemShares = shares[item.id] || [];
      return itemShares.reduce((s, sh) => s + sh.basisPoints, 0) === 10000;
    });

  if (allJoined && allClaimed) {
    return 'happy';
  }
  return 'waiting';
}

export function getTakoMoodCopy(
  mood: TakoMood,
  lang: AppLanguage,
  paidCount: number,
  totalCount: number
): string {
  switch (mood) {
    case 'waiting':
      return t(lang, 'moodWaiting');
    case 'happy':
      return t(lang, 'moodHappy');
    case 'counting':
      return lang === 'tl'
        ? `${paidCount} sa ${totalCount} bayad na — ${t(lang, 'moodCounting')}`
        : `${paidCount} of ${totalCount} paid · ${t(lang, 'moodCounting')}`;
    case 'empty_pockets':
      return t(lang, 'moodEmptyPockets');
    case 'celebrating':
      return t(lang, 'moodCelebrating');
  }
}

export function TakoMascot({ size = 120, mood = 'happy' }: TakoMascotProps) {
  const isWaiting = mood === 'waiting';
  const isCounting = mood === 'counting';
  const isEmptyPockets = mood === 'empty_pockets';
  const isCelebrating = mood === 'celebrating';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Confetti accents for celebrating mood (existing palette only) */}
      {isCelebrating && (
        <>
          <Circle cx={18} cy={22} r={3.5} fill="#FFB400" />
          <Circle cx={102} cy={20} r={3.5} fill="#14B87A" />
          <Rect x={24} y={36} width={5} height={5} rx={1} fill="#2F65F6" transform="rotate(20 26 38)" />
          <Rect x={96} y={34} width={5} height={5} rx={1} fill="#FFB400" transform="rotate(-18 98 36)" />
          <Circle cx={60} cy={8} r={3} fill="#14B87A" />
        </>
      )}

      {/* Tentacle outlines (arms raised for happy/celebrating) */}
      <Path
        d={isCelebrating || mood === 'happy' ? 'M32 64C14 54 14 34 22 26' : 'M38 72C22 88 30 106 14 104'}
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M50 80C44 96 56 108 44 114"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d="M70 80C76 96 64 108 76 114"
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />
      <Path
        d={isCelebrating || mood === 'happy' ? 'M88 64C106 54 106 34 98 26' : 'M82 72C98 88 90 106 106 104'}
        fill="none"
        stroke="#14123A"
        strokeWidth={15}
        strokeLinecap="round"
      />

      {/* Tentacle inner fills */}
      <Path
        d={isCelebrating || mood === 'happy' ? 'M32 64C14 54 14 34 22 26' : 'M38 72C22 88 30 106 14 104'}
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M50 80C44 96 56 108 44 114"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M70 80C76 96 64 108 76 114"
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d={isCelebrating || mood === 'happy' ? 'M88 64C106 54 106 34 98 26' : 'M82 72C98 88 90 106 106 104'}
        fill="none"
        stroke="#2F65F6"
        strokeWidth={9}
        strokeLinecap="round"
      />

      {/* Head */}
      <Path
        d="M26 56C26 28 42 16 60 16S94 28 94 56C94 74 80 82 60 82S26 74 26 56Z"
        fill="#2F65F6"
        stroke="#14123A"
        strokeWidth={3.5}
      />

      {/* Highlight & freckles */}
      <Ellipse
        cx={45}
        cy={31}
        rx={8}
        ry={4}
        fill="#FFFFFF"
        opacity={0.35}
        transform="rotate(-25 45 31)"
      />
      <Circle cx={72} cy={27} r={3.5} fill="#FFB400" />
      <Circle cx={80} cy={38} r={2.5} fill="#FFB400" />

      {/* Eyes (half-closed for waiting) */}
      <Circle cx={47} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
      <Circle cx={73} cy={54} r={9} fill="#FFFFFF" stroke="#14123A" strokeWidth={3} />
      {isWaiting ? (
        <>
          <Path d="M39 54H55" stroke="#14123A" strokeWidth={3} strokeLinecap="round" />
          <Path d="M65 54H81" stroke="#14123A" strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={49} cy={55} r={4.2} fill="#14123A" />
          <Circle cx={75} cy={55} r={4.2} fill="#14123A" />
          <Circle cx={50.5} cy={53.5} r={1.4} fill="#FFFFFF" />
          <Circle cx={76.5} cy={53.5} r={1.4} fill="#FFFFFF" />
        </>
      )}

      {/* Blush & expression */}
      <Ellipse cx={35} cy={66} rx={5} ry={3} fill="#FF8FA3" />
      <Ellipse cx={85} cy={66} rx={5} ry={3} fill="#FF8FA3" />
      <Path
        d={isEmptyPockets ? 'M53 71Q60 65 67 71' : 'M53 67Q60 74 67 67'}
        fill="none"
        stroke="#14123A"
        strokeWidth={3.5}
        strokeLinecap="round"
      />

      {/* Counting mood: amber coin in hand */}
      {isCounting && (
        <>
          <Circle cx={99} cy={98} r={9} fill="#FFB400" stroke="#14123A" strokeWidth={2.5} />
          <Circle cx={99} cy={98} r={4} fill="none" stroke="#14123A" strokeWidth={1.8} />
        </>
      )}

      {/* Empty pockets mood: turned-out pocket flaps */}
      {isEmptyPockets && (
        <>
          <Path d="M16 94C10 92 8 98 13 102" fill="#FFFFFF" stroke="#14123A" strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M104 94C110 92 112 98 107 102" fill="#FFFFFF" stroke="#14123A" strokeWidth={2.2} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
