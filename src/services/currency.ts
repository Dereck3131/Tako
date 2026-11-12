export type CurrencyCode = 'PHP' | 'USD';

export interface PesoRoundingAdjustment {
  memberId: string;
  originalCents: number;
  roundedCents: number;
  deltaCents: number;
}

export interface PHBillBreakdown {
  subtotalCents: number;
  serviceChargeCents: number;
  vatCents: number;
  totalCents: number;
  serviceChargeBps: number;
  vatBps: number;
}

/**
 * Formats integer centavos/cents into localized currency string.
 * Defaults to Philippine Peso (₱) with comma thousands separators.
 */
export function formatMoney(
  cents: number,
  currency: CurrencyCode = 'PHP',
  options?: { roundToWhole?: boolean; hidden?: boolean }
): string {
  if (options?.hidden) {
    return currency === 'PHP' ? '₱•••' : '$•••';
  }
  const symbol = currency === 'PHP' ? '₱' : '$';
  const sign = cents < 0 ? '-' : '';
  const absCents = Math.abs(Math.round(cents));
  const value = absCents / 100;

  if (options?.roundToWhole) {
    const rounded = Math.round(value);
    return `${sign}${symbol}${rounded.toLocaleString('en-PH')}`;
  }

  return `${sign}${symbol}${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculates Philippine restaurant bill breakdown:
 * Service Charge (default 10% = 1000 bps) + VAT (default 12% = 1200 bps) on subtotal.
 * Uses integer math and rounds half-up to nearest centavo.
 */
export function calculatePHBillBreakdown(
  subtotalCents: number,
  serviceChargeBps = 1000,
  vatBps = 1200
): PHBillBreakdown {
  const safeSubtotal = Math.max(0, Math.round(subtotalCents));
  const serviceChargeCents = Math.round((safeSubtotal * Math.max(0, serviceChargeBps)) / 10000);
  const vatCents = Math.round((safeSubtotal * Math.max(0, vatBps)) / 10000);
  return {
    subtotalCents: safeSubtotal,
    serviceChargeCents,
    vatCents,
    totalCents: safeSubtotal + serviceChargeCents + vatCents,
    serviceChargeBps,
    vatBps,
  };
}

/**
 * Optional "Round to nearest peso" helper that preserves exact bill total
 * by rounding each person's share to the nearest 100 centavos and assigning
 * any leftover centavos transparently to the largest share (or payer fallback).
 */
export function roundSharesToNearestPeso(
  allocations: { memberId: string; cents: number }[]
): PesoRoundingAdjustment[] {
  if (allocations.length === 0) return [];
  const totalCents = allocations.reduce((sum, a) => sum + a.cents, 0);
  const rounded = allocations.map((a) => ({
    memberId: a.memberId,
    originalCents: a.cents,
    roundedCents: Math.round(a.cents / 100) * 100,
  }));

  const roundedSum = rounded.reduce((sum, r) => sum + r.roundedCents, 0);
  const diff = totalCents - roundedSum;

  if (diff !== 0) {
    let largestIdx = 0;
    for (let i = 1; i < rounded.length; i++) {
      if (rounded[i].originalCents > rounded[largestIdx].originalCents) {
        largestIdx = i;
      }
    }
    rounded[largestIdx].roundedCents += diff;
  }

  return rounded.map((r) => ({
    ...r,
    deltaCents: r.roundedCents - r.originalCents,
  }));
}
