export type TakoState =
  | 'idle'
  | 'wave'
  | 'celebrate'
  | 'think'
  | 'coins'
  | 'peek'
  | 'sleep'
  | 'sad';

export interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
  payment_handle: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  name: string;
  color: string;
  created_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount_cents: number;
  paid_by_member_id: string;
  split_type: 'equal' | 'exact';
  category: string;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount_cents: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_member_id: string;
  to_member_id: string;
  amount_cents: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SimplifiedDebt {
  from: GroupMember;
  to: GroupMember;
  amountCents: number;
}
