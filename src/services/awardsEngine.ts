import { Item, ItemShare, RoomMember } from '../types/database';
import { CurrencyCode, formatMoney } from './currency';

export interface BillAward {
  id: string;
  title: string;
  rule: string;
  winnerId: string;
  winnerName: string;
  winnerAvatarKey: string;
  detail: string;
}

export interface GenerateAwardsInput {
  members: RoomMember[];
  items: Item[];
  shares: Record<string, ItemShare[]>;
  adjustmentCountByMember: Record<string, number>;
  currency: CurrencyCode;
  optOutAwards: boolean;
  hideAmounts: boolean;
}

/**
 * Generates 3 to 5 playful, non-embarrassing awards from real room data.
 * Plain-logic rules:
 * 1. Fries Thief: highest share/cents on any item matching "fries".
 * 2. Dessert Hunter: highest share/cents on any item matching dessert/cake/ice cream/halo-halo.
 * 3. Big Spender: largest totalOwedCents among members.
 * 4. Last to Pay: latest paidAt timestamp among settled members.
 * 5. Peacekeeper: fewest slider adjustments (>= 0) among active members.
 */
export function generateBillAwards({
  members,
  items,
  shares,
  adjustmentCountByMember,
  currency,
  optOutAwards,
  hideAmounts,
}: GenerateAwardsInput): BillAward[] {
  if (members.length === 0) return [];

  const displayMemberName = (m: RoomMember) =>
    optOutAwards && m.userId === 'user-you' ? 'Mystery Friend' : m.displayName;

  const findTopForKeyword = (pattern: RegExp): { member: RoomMember; cents: number } | null => {
    const totals = new Map<string, number>();
    for (const item of items) {
      if (!pattern.test(item.title)) continue;
      for (const sh of shares[item.id] || []) {
        totals.set(sh.memberId, (totals.get(sh.memberId) ?? 0) + sh.allocatedCents);
      }
    }
    let best: { member: RoomMember; cents: number } | null = null;
    for (const m of members) {
      const cents = totals.get(m.id) ?? 0;
      if (cents > 0 && (!best || cents > best.cents)) {
        best = { member: m, cents };
      }
    }
    return best;
  };

  const awards: BillAward[] = [];

  // 1. Fries Thief
  const friesWinner = findTopForKeyword(/fries|chips|potato/i);
  if (friesWinner) {
    awards.push({
      id: 'award-fries-thief',
      title: 'Fries Thief',
      rule: 'Claimed the biggest share of fries',
      winnerId: friesWinner.member.id,
      winnerName: displayMemberName(friesWinner.member),
      winnerAvatarKey: friesWinner.member.displayName.toLowerCase(),
      detail: hideAmounts ? 'Top fries share' : formatMoney(friesWinner.cents, currency),
    });
  }

  // 2. Dessert Hunter
  const dessertWinner = findTopForKeyword(/dessert|cake|ice|halo|sweet|coffee/i);
  if (dessertWinner) {
    awards.push({
      id: 'award-dessert-hunter',
      title: 'Dessert Hunter',
      rule: 'Claimed the most sweets & drinks',
      winnerId: dessertWinner.member.id,
      winnerName: displayMemberName(dessertWinner.member),
      winnerAvatarKey: dessertWinner.member.displayName.toLowerCase(),
      detail: hideAmounts ? 'Sweetest tooth' : formatMoney(dessertWinner.cents, currency),
    });
  }

  // 3. Big Spender
  const sortedBySpend = [...members].sort((a, b) => b.totalOwedCents - a.totalOwedCents);
  if (sortedBySpend[0] && sortedBySpend[0].totalOwedCents > 0) {
    const m = sortedBySpend[0];
    awards.push({
      id: 'award-big-spender',
      title: 'Big Spender',
      rule: 'Carried the largest total share',
      winnerId: m.id,
      winnerName: displayMemberName(m),
      winnerAvatarKey: m.displayName.toLowerCase(),
      detail: hideAmounts ? 'Biggest plate' : formatMoney(m.totalOwedCents, currency),
    });
  }

  // 4. Last to Pay
  const paidWithTime = members
    .filter((m) => m.paidAt)
    .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());
  if (paidWithTime[0]) {
    const m = paidWithTime[0];
    awards.push({
      id: 'award-last-to-pay',
      title: 'Last to Pay',
      rule: 'Fashionably late to the pot',
      winnerId: m.id,
      winnerName: displayMemberName(m),
      winnerAvatarKey: m.displayName.toLowerCase(),
      detail: 'Finished the tab',
    });
  }

  // 5. Peacekeeper
  const peacekeeper = [...members].sort(
    (a, b) => (adjustmentCountByMember[a.id] ?? 0) - (adjustmentCountByMember[b.id] ?? 0)
  )[0];
  if (peacekeeper) {
    const count = adjustmentCountByMember[peacekeeper.id] ?? 0;
    awards.push({
      id: 'award-peacekeeper',
      title: 'Peacekeeper',
      rule: 'Fewest slider tweaks needed',
      winnerId: peacekeeper.id,
      winnerName: displayMemberName(peacekeeper),
      winnerAvatarKey: peacekeeper.displayName.toLowerCase(),
      detail: `${count} tweak${count === 1 ? '' : 's'}`,
    });
  }

  return awards.slice(0, 5);
}
