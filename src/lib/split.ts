import type {
  Expense,
  ExpenseSplit,
  GroupMember,
  Settlement,
  SimplifiedDebt,
} from '@/types/tako';

/**
 * Splits `totalCents` as evenly as possible across `memberIds`.
 * Any remainder cents are distributed 1 cent at a time to the first members
 * so the sum of returned splits always equals `totalCents`.
 */
export function splitEqually(
  totalCents: number,
  memberIds: string[]
): { member_id: string; amount_cents: number }[] {
  if (memberIds.length === 0) return [];
  const base = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents - base * memberIds.length;
  return memberIds.map((member_id, idx) => ({
    member_id,
    amount_cents: base + (idx < remainder ? 1 : 0),
  }));
}

/**
 * Computes each member's net balance in cents.
 * Positive = others owe this member.
 * Negative = this member owes others.
 */
export function computeMemberBalances(
  members: GroupMember[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  settlements: Settlement[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of members) {
    balances[m.id] = 0;
  }

  for (const exp of expenses) {
    if (balances[exp.paid_by_member_id] !== undefined) {
      balances[exp.paid_by_member_id] += exp.amount_cents;
    }
  }

  for (const sp of splits) {
    if (balances[sp.member_id] !== undefined) {
      balances[sp.member_id] -= sp.amount_cents;
    }
  }

  for (const st of settlements) {
    if (balances[st.from_member_id] !== undefined) {
      balances[st.from_member_id] += st.amount_cents;
    }
    if (balances[st.to_member_id] !== undefined) {
      balances[st.to_member_id] -= st.amount_cents;
    }
  }

  return balances;
}

/**
 * Greedy min-cash-flow simplification: settles all debts in the fewest transfers.
 */
export function computeSimplifiedDebts(
  members: GroupMember[],
  balances: Record<string, number>
): SimplifiedDebt[] {
  const memberById = new Map(members.map((m) => [m.id, m]));

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, bal] of Object.entries(balances)) {
    if (bal < -1) {
      debtors.push({ id, amount: -bal });
    } else if (bal > 1) {
      creditors.push({ id, amount: bal });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const result: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const transfer = Math.min(d.amount, c.amount);

    const from = memberById.get(d.id);
    const to = memberById.get(c.id);

    if (from && to && transfer > 0) {
      result.push({ from, to, amountCents: transfer });
    }

    d.amount -= transfer;
    c.amount -= transfer;

    if (d.amount <= 1) i++;
    if (c.amount <= 1) j++;
  }

  return result;
}
