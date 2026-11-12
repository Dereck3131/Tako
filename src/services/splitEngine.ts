/**
 * TabTogether Split Engine
 * Strict integer arithmetic in cents & basis points (1% = 100 bps).
 * Guaranteed to eliminate floating-point penny drift.
 */

export interface ShareAllocationInput {
  memberId: string;
  basisPoints: number; // 0 - 10000
  isLocked?: boolean;
}

export interface ShareAllocationResult {
  memberId: string;
  basisPoints: number;
  cents: number;
}

/**
 * Distributes item total cents across participants using the Largest Remainder Method (Hare-Niemeyer).
 * Assumes sum(basisPoints) === 10000 (100.00%).
 */
export function calculateItemCents(
  totalCents: number,
  shares: ShareAllocationInput[]
): ShareAllocationResult[] {
  if (shares.length === 0) return [];

  const totalBps = shares.reduce((acc, s) => acc + s.basisPoints, 0);
  if (totalBps === 0) {
    return shares.map((s) => ({ memberId: s.memberId, basisPoints: 0, cents: 0 }));
  }

  // 1. Raw shares & baseline integer floor
  const unrounded = shares.map((share) => {
    const rawCents = (totalCents * share.basisPoints) / 10000;
    const baseCents = Math.floor(rawCents);
    const remainder = rawCents - baseCents;
    return {
      memberId: share.memberId,
      basisPoints: share.basisPoints,
      baseCents,
      remainder,
    };
  });

  const allocatedSum = unrounded.reduce((sum, u) => sum + u.baseCents, 0);
  let leftoverCents = totalCents - allocatedSum;

  // 2. Sort by largest remainder descending
  const sortedByRemainder = [...unrounded].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    // Deterministic tie-breaking by memberId
    return a.memberId.localeCompare(b.memberId);
  });

  // 3. Allocate +1 cent to top leftover users
  const bonusSet = new Set<string>();
  for (let i = 0; i < leftoverCents && i < sortedByRemainder.length; i++) {
    bonusSet.add(sortedByRemainder[i].memberId);
  }

  return unrounded.map((u) => ({
    memberId: u.memberId,
    basisPoints: u.basisPoints,
    cents: u.baseCents + (bonusSet.has(u.memberId) ? 1 : 0),
  }));
}

/**
 * Equal split helper: divides total cents cleanly across N members.
 */
export function splitEqualCents(
  totalCents: number,
  memberIds: string[]
): ShareAllocationResult[] {
  if (memberIds.length === 0) return [];
  const n = memberIds.length;
  const baseBps = Math.floor(10000 / n);
  const leftoverBps = 10000 - baseBps * n;

  const shares: ShareAllocationInput[] = memberIds.map((id, index) => ({
    memberId: id,
    basisPoints: baseBps + (index < leftoverBps ? 1 : 0),
  }));

  return calculateItemCents(totalCents, shares);
}

/**
 * Rebalances percentages when one user moves their slider, preserving locked shares and ensuring sum === 10000.
 */
export function rebalanceSliders(
  currentShares: ShareAllocationInput[],
  draggedMemberId: string,
  targetBps: number
): ShareAllocationInput[] {
  const clampedTarget = Math.max(0, Math.min(10000, targetBps));
  const dragged = currentShares.find((s) => s.memberId === draggedMemberId);
  if (!dragged) return currentShares;

  const lockedShares = currentShares.filter(
    (s) => s.isLocked && s.memberId !== draggedMemberId
  );
  const lockedSum = lockedShares.reduce((sum, s) => sum + s.basisPoints, 0);

  // Maximum allowed for the dragged member cannot violate locked sum
  const maxPossible = 10000 - lockedSum;
  const finalDraggedBps = Math.min(clampedTarget, maxPossible);

  const delta = finalDraggedBps - dragged.basisPoints;
  const unlockedOthers = currentShares.filter(
    (s) => !s.isLocked && s.memberId !== draggedMemberId
  );

  const unlockedOthersSum = unlockedOthers.reduce((sum, s) => sum + s.basisPoints, 0);

  if (unlockedOthersSum === 0) {
    // If others are at 0, divide remainder evenly among unlocked
    const remainingToDistribute = 10000 - finalDraggedBps - lockedSum;
    const n = unlockedOthers.length;
    return currentShares.map((s) => {
      if (s.memberId === draggedMemberId) {
        return { ...s, basisPoints: finalDraggedBps };
      }
      if (s.isLocked) return s;
      return {
        ...s,
        basisPoints: n > 0 ? Math.floor(remainingToDistribute / n) : 0,
      };
    });
  }

  // Deduct delta proportionally from unlocked others
  let distributedSum = 0;
  const updatedOthers = unlockedOthers.map((s) => {
    const ratio = s.basisPoints / unlockedOthersSum;
    const deduction = Math.round(delta * ratio);
    const newBps = Math.max(0, s.basisPoints - deduction);
    distributedSum += newBps;
    return { ...s, basisPoints: newBps };
  });

  // Correct 1-bps drift from integer rounding
  const expectedOtherTotal = 10000 - finalDraggedBps - lockedSum;
  let drift = expectedOtherTotal - distributedSum;

  if (drift !== 0 && updatedOthers.length > 0) {
    updatedOthers[0].basisPoints = Math.max(0, updatedOthers[0].basisPoints + drift);
  }

  return currentShares.map((s) => {
    if (s.memberId === draggedMemberId) {
      return { ...s, basisPoints: finalDraggedBps };
    }
    const updated = updatedOthers.find((o) => o.memberId === s.memberId);
    return updated || s;
  });
}

/**
 * Calculates member's total settlement with proportional tax and tip.
 */
export function calculateMemberSettlement(
  memberFoodCents: number,
  totalFoodSubtotalCents: number,
  taxRateBps: number,
  tipRateBps: number
): {
  foodCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
} {
  if (totalFoodSubtotalCents <= 0 || memberFoodCents <= 0) {
    return { foodCents: 0, taxCents: 0, tipCents: 0, totalCents: 0 };
  }

  const ratio = memberFoodCents / totalFoodSubtotalCents;
  const totalTaxCents = Math.round((totalFoodSubtotalCents * taxRateBps) / 10000);
  const totalTipCents = Math.round((totalFoodSubtotalCents * tipRateBps) / 10000);

  const memberTaxCents = Math.round(totalTaxCents * ratio);
  const memberTipCents = Math.round(totalTipCents * ratio);

  return {
    foodCents: memberFoodCents,
    taxCents: memberTaxCents,
    tipCents: memberTipCents,
    totalCents: memberFoodCents + memberTaxCents + memberTipCents,
  };
}

export interface LargestRemainderAllocation {
  memberId: string;
  basisPoints: number;
  percent: number; // Whole integer percent; sums to 100 when totalBps > 0
  cents: number; // Integer centavos; sums to totalCents
}

/**
 * Allocates whole percentages and integer cents using the largest-remainder method
 * (Hamilton method) so displayed percentages always sum to 100 and centavos sum
 * to the exact item price.
 */
export function allocateSharesLargestRemainder(
  totalCents: number,
  shares: ShareAllocationInput[]
): LargestRemainderAllocation[] {
  if (shares.length === 0) return [];
  const totalBps = shares.reduce((sum, s) => sum + Math.max(0, s.basisPoints), 0);

  if (totalBps <= 0) {
    return shares.map((s) => ({
      memberId: s.memberId,
      basisPoints: 0,
      percent: 0,
      cents: 0,
    }));
  }

  // 1. Largest-remainder for whole percentages (sum === 100)
  const rawPct = shares.map((s, idx) => {
    const exact = (Math.max(0, s.basisPoints) / totalBps) * 100;
    const floorVal = Math.floor(exact);
    return {
      idx,
      floorVal,
      remainder: exact - floorVal,
    };
  });

  const pctFloorSum = rawPct.reduce((sum, p) => sum + p.floorVal, 0);
  const pctLeftover = 100 - pctFloorSum;
  const pctSorted = [...rawPct].sort((a, b) => b.remainder - a.remainder);
  const pctBonus = new Set<number>();
  for (let i = 0; i < pctLeftover && i < pctSorted.length; i++) {
    pctBonus.add(pctSorted[i].idx);
  }

  // 2. Largest-remainder for integer cents (sum === totalCents)
  const centsAlloc = calculateItemCents(totalCents, shares);
  const centsMap = new Map(centsAlloc.map((c) => [c.memberId, c.cents]));

  return shares.map((s, idx) => ({
    memberId: s.memberId,
    basisPoints: s.basisPoints,
    percent: rawPct[idx].floorVal + (pctBonus.has(idx) ? 1 : 0),
    cents: centsMap.get(s.memberId) ?? 0,
  }));
}
