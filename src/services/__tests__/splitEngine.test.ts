import {
  calculateItemCents,
  splitEqualCents,
  rebalanceSliders,
  calculateMemberSettlement,
} from '../splitEngine';

describe('TabTogether Split Engine Precision Math', () => {
  test('TC-1.1: Clean equal split of $210.00 across 4 people equals $52.50 each', () => {
    const totalCents = 21000;
    const memberIds = ['alex', 'bob', 'charlie', 'dana'];
    const results = splitEqualCents(totalCents, memberIds);

    expect(results).toHaveLength(4);
    results.forEach((r) => {
      expect(r.cents).toBe(5250); // $52.50
    });

    const sum = results.reduce((acc, r) => acc + r.cents, 0);
    expect(sum).toBe(21000);
  });

  test('TC-1.2: Uneven division of $100.00 split 3 ways handles penny remainder', () => {
    const totalCents = 10000;
    const shares = [
      { memberId: 'a', basisPoints: 3334 },
      { memberId: 'b', basisPoints: 3333 },
      { memberId: 'c', basisPoints: 3333 },
    ];
    const results = calculateItemCents(totalCents, shares);

    expect(results.find((r) => r.memberId === 'a')?.cents).toBe(3334);
    expect(results.find((r) => r.memberId === 'b')?.cents).toBe(3333);
    expect(results.find((r) => r.memberId === 'c')?.cents).toBe(3333);

    const sum = results.reduce((acc, r) => acc + r.cents, 0);
    expect(sum).toBe(10000); // Exactly $100.00
  });

  test('TC-2.1: Rebalancing slider maintains 10000 basis points sum', () => {
    const current = [
      { memberId: 'you', basisPoints: 2500, isLocked: false },
      { memberId: 'mia', basisPoints: 2500, isLocked: false },
      { memberId: 'jonas', basisPoints: 2500, isLocked: false },
      { memberId: 'aly', basisPoints: 2500, isLocked: false },
    ];

    // You drag your slider to 55% (5500 bps)
    const rebalanced = rebalanceSliders(current, 'you', 5500);
    const sum = rebalanced.reduce((acc, r) => acc + r.basisPoints, 0);

    expect(rebalanced.find((r) => r.memberId === 'you')?.basisPoints).toBe(5500);
    expect(sum).toBe(10000);
  });

  test('TC-3.1: Proportional Tax & Tip Apportionment', () => {
    // Alex had $80 food, Sam had $40 food. Subtotal = $120. Tax = 10%, Tip = 18%.
    const alex = calculateMemberSettlement(8000, 12000, 1000, 1800);
    const sam = calculateMemberSettlement(4000, 12000, 1000, 1800);

    expect(alex.foodCents).toBe(8000);
    expect(alex.taxCents).toBe(800);
    expect(alex.tipCents).toBe(1440);
    expect(alex.totalCents).toBe(10240); // $102.40

    expect(sam.foodCents).toBe(4000);
    expect(sam.taxCents).toBe(400);
    expect(sam.tipCents).toBe(720);
    expect(sam.totalCents).toBe(5120); // $51.20

    expect(alex.totalCents + sam.totalCents).toBe(15360); // $153.60
  });
});
