import {
  formatMoney,
  calculatePHBillBreakdown,
  roundSharesToNearestPeso,
} from '../currency';

describe('currency & PH bill breakdown', () => {
  it('formats PHP currency with peso sign and thousands separator', () => {
    expect(formatMoney(125000, 'PHP')).toBe('₱1,250.00');
    expect(formatMoney(5250, 'PHP')).toBe('₱52.50');
    expect(formatMoney(125000, 'PHP', { hidden: true })).toBe('₱•••');
    expect(formatMoney(5250, 'USD')).toBe('$52.50');
  });

  it('calculates PH Service Charge (10%) and VAT (12%) accurately in centavos', () => {
    const breakdown = calculatePHBillBreakdown(100000, 1000, 1200);
    expect(breakdown.subtotalCents).toBe(100000);
    expect(breakdown.serviceChargeCents).toBe(10000);
    expect(breakdown.vatCents).toBe(12000);
    expect(breakdown.totalCents).toBe(122000);
  });

  it('rounds shares to nearest peso while preserving exact total via largest share', () => {
    const adjusted = roundSharesToNearestPeso([
      { memberId: 'a', cents: 4033 }, // ₱40.33 -> ₱40.00
      { memberId: 'b', cents: 3033 }, // ₱30.33 -> ₱30.00
      { memberId: 'c', cents: 3034 }, // ₱30.34 -> ₱30.00
    ]);
    // Total is 10100 centavos (₱101.00). Rounded sum = 10000. Diff +100 goes to largest ('a').
    const totalAfter = adjusted.reduce((sum, x) => sum + x.roundedCents, 0);
    expect(totalAfter).toBe(10100);
    expect(adjusted.find((x) => x.memberId === 'a')?.roundedCents).toBe(4100);
  });
});
