import React from 'react';
import { ViewStyle } from 'react-native';
import { Item, ItemShare, RoomMember } from '../types/database';
import { AppLanguage, t } from '../constants/i18n';
import { Tako, TakoLookAt, TakoState } from './Tako';

export type TakoMood =
  | 'waiting'
  | 'happy'
  | 'counting'
  | 'empty_pockets'
  | 'celebrating';

interface TakoMascotProps {
  size?: number;
  mood?: TakoMood | TakoState;
  hideLegs?: boolean;
  peekIn?: boolean;
  lookAt?: TakoLookAt | null;
  wiggleKey?: number;
  inkSquirtKey?: number;
  interactive?: boolean;
  onPress?: () => void;
  isActive?: boolean;
  style?: ViewStyle;
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

export function TakoMascot({
  size = 120,
  mood = 'happy',
  hideLegs = false,
  peekIn = false,
  lookAt = null,
  wiggleKey = 0,
  inkSquirtKey = 0,
  interactive = false,
  onPress,
  isActive = true,
  style,
}: TakoMascotProps) {
  return (
    <Tako
      state={mood}
      size={size}
      hideLegs={hideLegs}
      peekIn={peekIn}
      lookAt={lookAt}
      wiggleKey={wiggleKey}
      inkSquirtKey={inkSquirtKey}
      interactive={interactive}
      onPress={onPress}
      isActive={isActive}
      style={style}
    />
  );
}
