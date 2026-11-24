import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense, ExpenseSplit, Group, GroupMember, Profile, Settlement } from '../types/tako';
import { splitEqually } from './split';

export interface OfflineSnapshot {
  groups: Group[];
  members: GroupMember[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
  updatedAt: string;
}

export type OutboxAction =
  | {
      id: string;
      createdAt: string;
      type: 'create_split';
      localGroupId: string;
      localMemberIds: string[];
      payload: {
        userId: string;
        name: string;
        totalCents: number;
        splitMode: 'equal' | 'custom';
        people: { name: string; color: string; isMe?: boolean }[];
        paidByIdx: number;
        customCentsList?: number[];
      };
    }
  | {
      id: string;
      createdAt: string;
      type: 'add_expense';
      localExpenseId: string;
      payload: {
        groupId: string;
        title: string;
        amountCents: number;
        category: string;
        paidById: string;
        splitType: 'equal' | 'exact';
        includedIds: string[];
        exactSplits: { member_id: string; amount_cents: number }[];
      };
    }
  | {
      id: string;
      createdAt: string;
      type: 'add_settlement';
      localSettlementId: string;
      payload: {
        groupId: string;
        fromMemberId: string;
        toMemberId: string;
        amountCents: number;
        note: string | null;
        createdBy: string;
      };
    }
  | {
      id: string;
      createdAt: string;
      type: 'update_profile';
      payload: {
        userId: string;
        updates: Partial<Pick<Profile, 'display_name' | 'avatar_color' | 'avatar_url'>>;
      };
    }
  | {
      id: string;
      createdAt: string;
      type: 'delete_group';
      payload: { groupId: string };
    }
  | {
      id: string;
      createdAt: string;
      type: 'delete_expense';
      payload: { groupId: string; expenseId: string };
    }
  | {
      id: string;
      createdAt: string;
      type: 'delete_settlement_by_member';
      payload: { groupId: string; fromMemberId: string };
    }
  | {
      id: string;
      createdAt: string;
      type: 'add_member';
      localMemberId: string;
      payload: { groupId: string; name: string; color: string };
    }
  | {
      id: string;
      createdAt: string;
      type: 'create_itemized_split';
      localGroupId?: string;
      localMemberIds?: string[];
      localExpenseIds: string[];
      payload: {
        userId: string;
        groupId?: string;
        payerId?: string;
        splitName: string;
        paidByIdx: number;
        people: { name: string; color: string; isMe?: boolean }[];
        items: { name: string; qty: number; unitCents: number }[];
      };
    }
  | {
      id: string;
      createdAt: string;
      type: 'update_item_claims';
      payload: {
        groupId: string;
        items: { expenseId: string; amountCents: number; claimedBy: string[] }[];
        allPersonIds: string[];
      };
    };

export interface StorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const EMPTY_SNAPSHOT: OfflineSnapshot = {
  groups: [],
  members: [],
  expenses: [],
  splits: [],
  settlements: [],
  updatedAt: '',
};

export function isProbablyOfflineError(rawMessage?: string | null): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  if (!rawMessage) return false;
  const lower = rawMessage.toLowerCase();
  return (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('internet') ||
    lower.includes('offline') ||
    lower.includes('econn')
  );
}

export function makeLocalId(prefix: string): string {
  return `local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, 'X');
}

function cacheKey(userId: string) {
  return `tako_cache_v1_${userId}`;
}

function outboxKey(userId: string) {
  return `tako_outbox_v1_${userId}`;
}

function idMapKey(userId: string) {
  return `tako_idmap_v1_${userId}`;
}

export async function readOfflineSnapshot(
  userId: string,
  storage: StorageLike = AsyncStorage
): Promise<OfflineSnapshot> {
  try {
    const raw = await storage.getItem(cacheKey(userId));
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw) as Partial<OfflineSnapshot>;
    return {
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      splits: Array.isArray(parsed.splits) ? parsed.splits : [],
      settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export async function writeOfflineSnapshot(
  userId: string,
  snapshot: OfflineSnapshot,
  storage: StorageLike = AsyncStorage
): Promise<void> {
  try {
    await storage.setItem(cacheKey(userId), JSON.stringify(snapshot));
  } catch {
    // ignore storage quota errors
  }
}

export async function readOutbox(
  userId: string,
  storage: StorageLike = AsyncStorage
): Promise<OutboxAction[]> {
  try {
    const raw = await storage.getItem(outboxKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutboxAction[]) : [];
  } catch {
    return [];
  }
}

export async function writeOutbox(
  userId: string,
  items: OutboxAction[],
  storage: StorageLike = AsyncStorage
): Promise<void> {
  try {
    if (items.length === 0) {
      await storage.removeItem(outboxKey(userId));
    } else {
      await storage.setItem(outboxKey(userId), JSON.stringify(items));
    }
  } catch {
    // ignore
  }
}

export async function readIdMap(
  userId: string,
  storage: StorageLike = AsyncStorage
): Promise<Record<string, string>> {
  try {
    const raw = await storage.getItem(idMapKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function writeIdMap(
  userId: string,
  map: Record<string, string>,
  storage: StorageLike = AsyncStorage
): Promise<void> {
  try {
    if (Object.keys(map).length === 0) {
      await storage.removeItem(idMapKey(userId));
    } else {
      await storage.setItem(idMapKey(userId), JSON.stringify(map));
    }
  } catch {
    // ignore
  }
}

/**
 * Applies an optimistic offline action to the local snapshot and appends it to the outbox.
 */
export async function queueOfflineAction(
  userId: string,
  action: OutboxAction,
  storage: StorageLike = AsyncStorage
): Promise<void> {
  const [snapshot, outbox] = await Promise.all([
    readOfflineSnapshot(userId, storage),
    readOutbox(userId, storage),
  ]);

  const next = applyActionToSnapshot(snapshot, action);
  let nextOutbox = outbox;

  if (action.type === 'delete_group' && action.payload.groupId.startsWith('local_')) {
    const gid = action.payload.groupId;
    nextOutbox = outbox.filter((a) => {
      if (a.type === 'create_split' && a.localGroupId === gid) return false;
      if (
        a.type === 'create_itemized_split' &&
        (a.localGroupId === gid || a.payload.groupId === gid)
      ) {
        return false;
      }
      if ('groupId' in a.payload && a.payload.groupId === gid) return false;
      return true;
    });
  } else if (action.type === 'delete_expense' && action.payload.expenseId.startsWith('local_')) {
    const eid = action.payload.expenseId;
    const hadAddExpense = outbox.some((a) => a.type === 'add_expense' && a.localExpenseId === eid);
    if (hadAddExpense) {
      nextOutbox = outbox.filter((a) => !(a.type === 'add_expense' && a.localExpenseId === eid));
    } else {
      nextOutbox = [...outbox, action];
    }
  } else {
    nextOutbox = [...outbox, action];
  }

  await Promise.all([
    writeOfflineSnapshot(userId, next, storage),
    writeOutbox(userId, nextOutbox, storage),
  ]);
}

/**
 * Pure reducer that applies an OutboxAction onto an OfflineSnapshot for instant optimistic UI.
 */
export function applyActionToSnapshot(
  snapshot: OfflineSnapshot,
  action: OutboxAction
): OfflineSnapshot {
  const now = action.createdAt || new Date().toISOString();

  if (action.type === 'create_split') {
    const { payload, localGroupId, localMemberIds } = action;
    const newGroup: Group = {
      id: localGroupId,
      name: payload.name,
      emoji: '🍜',
      invite_code: makeInviteCode(),
      created_by: payload.userId,
      created_at: now,
    };

    const newMembers: GroupMember[] = payload.people.map((p, idx) => ({
      id: localMemberIds[idx] ?? makeLocalId(`mem_${idx}`),
      group_id: localGroupId,
      user_id: p.isMe ? payload.userId : null,
      name: p.name,
      color: p.color,
      created_at: now,
    }));

    const payer = newMembers[payload.paidByIdx] ?? newMembers[0];
    const expId = makeLocalId('exp');
    const splitType = payload.splitMode === 'custom' ? 'exact' : 'equal';
    const newExpense: Expense = {
      id: expId,
      group_id: localGroupId,
      title: payload.name,
      amount_cents: payload.totalCents,
      paid_by_member_id: payer?.id ?? '',
      split_type: splitType,
      category: 'food',
      created_by: payload.userId,
      created_at: now,
    };

    const splitRows =
      splitType === 'equal'
        ? splitEqually(
            payload.totalCents,
            newMembers.map((m) => m.id)
          )
        : newMembers.map((m, idx) => ({
            member_id: m.id,
            amount_cents: payload.customCentsList?.[idx] ?? 0,
          }));

    const newSplits: ExpenseSplit[] = splitRows.map((r, idx) => ({
      id: makeLocalId(`spl_${idx}`),
      expense_id: expId,
      member_id: r.member_id,
      amount_cents: r.amount_cents,
    }));

    return {
      ...snapshot,
      groups: [newGroup, ...snapshot.groups],
      members: [...snapshot.members, ...newMembers],
      expenses: [newExpense, ...snapshot.expenses],
      splits: [...snapshot.splits, ...newSplits],
      updatedAt: now,
    };
  }

  if (action.type === 'add_expense') {
    const { payload, localExpenseId } = action;
    const newExpense: Expense = {
      id: localExpenseId,
      group_id: payload.groupId,
      title: payload.title,
      amount_cents: payload.amountCents,
      paid_by_member_id: payload.paidById,
      split_type: payload.splitType,
      category: payload.category,
      created_by: null,
      created_at: now,
    };

    const splitRows =
      payload.splitType === 'equal'
        ? splitEqually(payload.amountCents, payload.includedIds)
        : payload.exactSplits;

    const newSplits: ExpenseSplit[] = splitRows.map((r, idx) => ({
      id: makeLocalId(`spl_${idx}`),
      expense_id: localExpenseId,
      member_id: r.member_id,
      amount_cents: r.amount_cents,
    }));

    return {
      ...snapshot,
      expenses: [newExpense, ...snapshot.expenses],
      splits: [...snapshot.splits, ...newSplits],
      updatedAt: now,
    };
  }

  if (action.type === 'add_settlement') {
    const { payload, localSettlementId } = action;
    const newSettlement: Settlement = {
      id: localSettlementId,
      group_id: payload.groupId,
      from_member_id: payload.fromMemberId,
      to_member_id: payload.toMemberId,
      amount_cents: payload.amountCents,
      note: payload.note,
      created_by: payload.createdBy,
      created_at: now,
    };

    return {
      ...snapshot,
      settlements: [newSettlement, ...snapshot.settlements],
      updatedAt: now,
    };
  }

  if (action.type === 'delete_group') {
    const { groupId } = action.payload;
    const removedExpenseIds = new Set(
      snapshot.expenses.filter((e) => e.group_id === groupId).map((e) => e.id)
    );
    return {
      ...snapshot,
      groups: snapshot.groups.filter((g) => g.id !== groupId),
      members: snapshot.members.filter((m) => m.group_id !== groupId),
      expenses: snapshot.expenses.filter((e) => e.group_id !== groupId),
      splits: snapshot.splits.filter((s) => !removedExpenseIds.has(s.expense_id)),
      settlements: snapshot.settlements.filter((st) => st.group_id !== groupId),
      updatedAt: now,
    };
  }

  if (action.type === 'delete_expense') {
    const { expenseId } = action.payload;
    return {
      ...snapshot,
      expenses: snapshot.expenses.filter((e) => e.id !== expenseId),
      splits: snapshot.splits.filter((s) => s.expense_id !== expenseId),
      updatedAt: now,
    };
  }

  if (action.type === 'delete_settlement_by_member') {
    const { groupId, fromMemberId } = action.payload;
    return {
      ...snapshot,
      settlements: snapshot.settlements.filter(
        (s) => !(s.group_id === groupId && s.from_member_id === fromMemberId)
      ),
      updatedAt: now,
    };
  }

  if (action.type === 'add_member') {
    const { payload, localMemberId } = action;
    const newMember: GroupMember = {
      id: localMemberId,
      group_id: payload.groupId,
      user_id: null,
      name: payload.name,
      color: payload.color,
      created_at: now,
    };
    const nextMembers = [...snapshot.members, newMember];
    const groupMemberIds = nextMembers
      .filter((m) => m.group_id === payload.groupId)
      .map((m) => m.id);

    const equalExpenses = snapshot.expenses.filter(
      (e) => e.group_id === payload.groupId && e.split_type === 'equal'
    );
    const equalExpIds = new Set(equalExpenses.map((e) => e.id));
    const rebalancedSplits: ExpenseSplit[] = [];
    for (const exp of equalExpenses) {
      const rows = splitEqually(exp.amount_cents, groupMemberIds);
      rows.forEach((r, idx) => {
        rebalancedSplits.push({
          id: `${localMemberId}_spl_${exp.id}_${idx}`,
          expense_id: exp.id,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        });
      });
    }

    return {
      ...snapshot,
      members: nextMembers,
      splits: [
        ...snapshot.splits.filter((s) => !equalExpIds.has(s.expense_id)),
        ...rebalancedSplits,
      ],
      updatedAt: now,
    };
  }

  if (action.type === 'create_itemized_split') {
    const { payload, localGroupId, localMemberIds, localExpenseIds } = action;
    const createdNewGroup = !payload.groupId && Boolean(localGroupId);
    const targetGroupId = payload.groupId ?? localGroupId ?? makeLocalId('grp');

    let addedGroup: Group | null = null;
    let addedMembers: GroupMember[] = [];

    if (createdNewGroup) {
      addedGroup = {
        id: targetGroupId,
        name: payload.splitName,
        emoji: '🍜',
        invite_code: makeInviteCode(),
        created_by: payload.userId,
        created_at: now,
      };
      addedMembers = payload.people.map((p, idx) => ({
        id: localMemberIds?.[idx] ?? makeLocalId(`mem_${idx}`),
        group_id: targetGroupId,
        user_id: p.isMe ? payload.userId : null,
        name: p.name,
        color: p.color,
        created_at: now,
      }));
    }

    const groupMembers = createdNewGroup
      ? addedMembers
      : snapshot.members.filter((m) => m.group_id === targetGroupId);
    const memberIds = groupMembers.map((m) => m.id);
    const paidBy =
      payload.payerId ??
      groupMembers[payload.paidByIdx]?.id ??
      groupMembers[0]?.id ??
      '';

    const newExpenses: Expense[] = [];
    const newSplits: ExpenseSplit[] = [];

    payload.items.forEach((item, idx) => {
      const lineCents = item.qty * item.unitCents;
      const displayTitle = item.qty > 1 ? `${item.name} ×${item.qty}` : item.name;
      const expId = localExpenseIds[idx] ?? makeLocalId(`exp_${idx}`);
      newExpenses.push({
        id: expId,
        group_id: targetGroupId,
        title: displayTitle,
        amount_cents: lineCents,
        paid_by_member_id: paidBy,
        split_type: 'equal',
        category: 'food',
        created_by: payload.userId,
        created_at: now,
      });
      const rows = splitEqually(lineCents, memberIds);
      rows.forEach((r, sIdx) => {
        newSplits.push({
          id: `${expId}_spl_${sIdx}`,
          expense_id: expId,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        });
      });
    });

    return {
      ...snapshot,
      groups: addedGroup ? [addedGroup, ...snapshot.groups] : snapshot.groups,
      members: addedMembers.length > 0 ? [...snapshot.members, ...addedMembers] : snapshot.members,
      expenses: [...newExpenses, ...snapshot.expenses],
      splits: [...snapshot.splits, ...newSplits],
      updatedAt: now,
    };
  }

  if (action.type === 'update_item_claims') {
    const { items, allPersonIds } = action.payload;
    const expenseIds = new Set(items.map((it) => it.expenseId));
    const hasCustomClaims = items.some(
      (it) => it.claimedBy.length > 0 && it.claimedBy.length < allPersonIds.length
    );

    const newSplits: ExpenseSplit[] = [];
    for (const item of items) {
      const claimants = item.claimedBy.length > 0 ? item.claimedBy : allPersonIds;
      const rows = splitEqually(item.amountCents, claimants);
      rows.forEach((r, idx) => {
        newSplits.push({
          id: `${item.expenseId}_claim_${idx}`,
          expense_id: item.expenseId,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        });
      });
    }

    return {
      ...snapshot,
      expenses: hasCustomClaims
        ? snapshot.expenses.map((e) =>
            expenseIds.has(e.id) ? { ...e, split_type: 'exact' as const } : e
          )
        : snapshot.expenses,
      splits: [...snapshot.splits.filter((s) => !expenseIds.has(s.expense_id)), ...newSplits],
      updatedAt: now,
    };
  }

  return snapshot;
}

/**
 * Merges a fresh server snapshot with any still-pending local outbox actions
 * so queued offline items remain visible until synced.
 */
export function mergeServerWithOutbox(
  serverSnapshot: OfflineSnapshot,
  outbox: OutboxAction[]
): OfflineSnapshot {
  return outbox.reduce((acc, action) => applyActionToSnapshot(acc, action), serverSnapshot);
}
