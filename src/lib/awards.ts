import type Ionicons from '@expo/vector-icons/Ionicons';
import type React from 'react';
import { Platform } from 'react-native';

import { computeMemberBalances } from '@/lib/split';
import type {
  Expense,
  ExpenseSplit,
  Group,
  GroupMember,
  Reminder,
  Settlement,
} from '@/types/tako';

const LEGEND_PREVIEW_KEY = 'tako_legend_preview_v1';

export function isLegendPreviewEnabled(): boolean {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }
  const param = new URLSearchParams(window.location.search).get('legendPreview');
  if (param === '1') {
    try {
      window.sessionStorage.setItem(LEGEND_PREVIEW_KEY, '1');
    } catch {
      // ignore
    }
    return true;
  }
  if (param === '0') {
    try {
      window.sessionStorage.removeItem(LEGEND_PREVIEW_KEY);
    } catch {
      // ignore
    }
    return false;
  }
  try {
    return window.sessionStorage.getItem(LEGEND_PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface TakoBadge {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: 'gold' | 'teal' | 'coral' | 'lavender';
  title: string;
  description: string;
  unlocked: boolean;
  tier: BadgeTier;
  progress: number;
  target: number;
}

export interface UserAwards {
  onTimeStreak: number;
  totalSettledSplits: number;
  unlockedCount: number;
  isLegend: boolean;
  badges: TakoBadge[];
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function resolveTier(
  count: number,
  thresholds: [number, number, number]
): { tier: BadgeTier; unlocked: boolean; progress: number; target: number } {
  const [bronze, silver, gold] = thresholds;
  if (count >= gold) {
    return { tier: 'gold', unlocked: true, progress: gold, target: gold };
  }
  if (count >= silver) {
    return { tier: 'silver', unlocked: true, progress: count, target: gold };
  }
  if (count >= bronze) {
    return { tier: 'bronze', unlocked: true, progress: count, target: silver };
  }
  return { tier: 'none', unlocked: false, progress: count, target: bronze };
}

export function computeUserAwards(input: {
  userId: string;
  groups: Group[];
  members: GroupMember[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
  reminders: Reminder[];
}): UserAwards {
  const { userId, groups, members, expenses, splits, settlements, reminders } = input;

  const remindedGroupIds = new Set(
    reminders.filter((r) => r.to_user_id === userId).map((r) => r.group_id)
  );

  // Sort groups newest-first to calculate current consecutive streak
  const sortedGroups = [...groups].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  let onTimeStreak = 0;
  let streakBroken = false;
  let totalSettledSplits = 0;
  let speedSettleCount = 0;
  let zeroNudgeSettledCount = 0;
  let hostedFullyPaidCount = 0;
  let fullTableCount = 0;
  let hasAnyUnpaidBalance = false;
  let activeSplitCount = 0;

  for (const group of sortedGroups) {
    const grpMembers = members.filter((m) => m.group_id === group.id);
    const grpExpenses = expenses.filter((e) => e.group_id === group.id);
    if (grpExpenses.length === 0) continue;
    activeSplitCount += 1;

    if (grpMembers.length >= 5) {
      fullTableCount += 1;
    }

    const expIdSet = new Set(grpExpenses.map((e) => e.id));
    const grpSplits = splits.filter((s) => expIdSet.has(s.expense_id));
    const grpSettlements = settlements.filter((st) => st.group_id === group.id);
    const balances = computeMemberBalances(grpMembers, grpExpenses, grpSplits, grpSettlements);

    const myMember = grpMembers.find((m) => m.user_id === userId);
    if (!myMember) continue;

    const myBalance = balances[myMember.id] ?? 0;
    if (myBalance < -1) {
      hasAnyUnpaidBalance = true;
    }

    const everyoneSettled = grpMembers.every((m) => (balances[m.id] ?? 0) >= -1);
    const isHost =
      group.created_by === userId || grpExpenses[0]?.paid_by_member_id === myMember.id;

    if (isHost && everyoneSettled) {
      hostedFullyPaidCount += 1;
    }

    const myOutgoingSettlements = grpSettlements
      .filter((st) => st.from_member_id === myMember.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const settledCleanly =
      myBalance >= -1 && (myOutgoingSettlements.length > 0 || (isHost && everyoneSettled));

    if (settledCleanly) {
      totalSettledSplits += 1;
      const wasReminded = remindedGroupIds.has(group.id);
      if (!wasReminded) {
        zeroNudgeSettledCount += 1;
      }

      const groupStartMs = new Date(group.created_at).getTime();
      const firstSettleMs = myOutgoingSettlements[0]
        ? new Date(myOutgoingSettlements[0].created_at).getTime()
        : groupStartMs;
      const elapsedMs = Math.max(0, firstSettleMs - groupStartMs);

      if (myOutgoingSettlements.length > 0 && elapsedMs <= ONE_HOUR_MS) {
        speedSettleCount += 1;
      }

      const isOnTime = !wasReminded && elapsedMs <= TWENTY_FOUR_HOURS_MS;
      if (!streakBroken) {
        if (isOnTime) {
          onTimeStreak += 1;
        } else {
          streakBroken = true;
        }
      }
    } else if (myBalance < -1 && !streakBroken) {
      streakBroken = true;
    }
  }

  const cleanSlateCount = activeSplitCount > 0 && !hasAnyUnpaidBalance ? Math.max(1, totalSettledSplits) : 0;

  const speedTier = resolveTier(speedSettleCount, [1, 5, 15]);
  const zeroNudgeTier = resolveTier(zeroNudgeSettledCount, [3, 10, 25]);
  const hostTier = resolveTier(hostedFullyPaidCount, [3, 10, 25]);
  const fullTableTier = resolveTier(fullTableCount, [1, 3, 10]);
  const cleanSlateTier = resolveTier(cleanSlateCount, [1, 5, 15]);

  const badges: TakoBadge[] = [
    {
      id: 'speed-settler',
      icon: 'flash-outline',
      tone: 'gold',
      title: 'Speed Settler',
      description: 'Record a payment within 1 hour of a split',
      ...speedTier,
    },
    {
      id: 'zero-nudge',
      icon: 'sparkles-outline',
      tone: 'teal',
      title: 'Zero-Nudge Pro',
      description: 'Settle splits without getting a reminder',
      ...zeroNudgeTier,
    },
    {
      id: 'host-most',
      icon: 'restaurant-outline',
      tone: 'coral',
      title: 'Host with the Most',
      description: 'Host splits where everyone paid',
      ...hostTier,
    },
    {
      id: 'full-table',
      icon: 'people-outline',
      tone: 'lavender',
      title: 'Full Table',
      description: 'Split a bill with 5 or more friends',
      ...fullTableTier,
    },
    {
      id: 'clean-slate',
      icon: 'checkmark-done-outline',
      tone: 'teal',
      title: 'Clean Slate',
      description: 'Have ₱0 owed across all your splits',
      ...cleanSlateTier,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return {
    onTimeStreak,
    totalSettledSplits,
    unlockedCount,
    isLegend: unlockedCount === badges.length,
    badges,
  };
}

export function findFirstSettlerMemberId(input: {
  members: GroupMember[];
  settlements: Settlement[];
  hostMemberId?: string;
}): string | null {
  const { members, settlements, hostMemberId } = input;
  const nonHostIds = new Set(
    members.filter((m) => m.id !== hostMemberId).map((m) => m.id)
  );
  const eligible = settlements
    .filter((st) => nonHostIds.has(st.from_member_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return eligible[0]?.from_member_id ?? null;
}
