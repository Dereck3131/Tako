import {
  isProbablyOfflineError,
  makeLocalId,
  queueOfflineAction,
} from '@/lib/offlineStore';
import { splitEqually } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types/tako';
import {
  MAX_GROUP_MEMBERS,
  addExpenseSchema,
  normalizeInviteCode,
  profileNameSchema,
  receiptItemSchema,
  splitNameSchema,
  validateCustomAmountsSum,
  validateNewMemberName,
} from '@/lib/validation';

export function mapAuthError(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'No internet connection. Check your network and try again.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Try again.';
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'An account with this email already exists.';
  }
  return rawMessage;
}

export async function createSplitWithMembers(input: {
  userId: string;
  name: string;
  totalCents: number;
  splitMode: 'equal' | 'custom';
  people: { name: string; color: string; isMe?: boolean }[];
  paidByIdx: number;
  customCentsList?: number[];
}): Promise<{ ok: true; groupId: string; queuedOffline?: boolean } | { ok: false; error: string }> {
  const nameRes = splitNameSchema.safeParse(input.name);
  if (!nameRes.success) {
    return { ok: false, error: nameRes.error.issues[0]?.message ?? 'Invalid split name.' };
  }
  if (input.totalCents <= 0) {
    return { ok: false, error: 'Enter a bill total greater than ₱0.' };
  }
  if (input.people.length === 0 || input.people.length > MAX_GROUP_MEMBERS) {
    return { ok: false, error: `Splits must have 1–${MAX_GROUP_MEMBERS} people.` };
  }
  if (input.paidByIdx < 0 || input.paidByIdx >= input.people.length) {
    return { ok: false, error: 'Select a valid payer.' };
  }
  if (input.splitMode === 'custom') {
    const sumRes = validateCustomAmountsSum(input.totalCents, input.customCentsList ?? []);
    if (!sumRes.ok) {
      return { ok: false, error: sumRes.error };
    }
  }

  const queueSplitOffline = async () => {
    const localGroupId = makeLocalId('grp');
    const localMemberIds = input.people.map((_, idx) => makeLocalId(`mem_${idx}`));
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'create_split',
      localGroupId,
      localMemberIds,
      payload: {
        ...input,
        name: nameRes.data,
      },
    });
    return { ok: true as const, groupId: localGroupId, queuedOffline: true };
  };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return queueSplitOffline();
  }

  try {
    const { data: createdGroup, error: gErr } = await supabase
      .from('groups')
      .insert({
        name: nameRes.data,
        emoji: '🍜',
        created_by: input.userId,
      })
      .select()
      .single();

    if (gErr || !createdGroup) {
      if (isProbablyOfflineError(gErr?.message)) {
        return queueSplitOffline();
      }
      return { ok: false, error: mapAuthError(gErr?.message ?? 'Could not create split.') };
    }

  const { data: insertedMembers, error: mErr } = await supabase
    .from('group_members')
    .insert(
      input.people.map((p) => ({
        group_id: createdGroup.id,
        user_id: p.isMe ? input.userId : null,
        name: p.name,
        color: p.color,
      }))
    )
    .select();

  if (mErr || !insertedMembers) {
    return { ok: false, error: mapAuthError(mErr?.message ?? 'Could not add people.') };
  }

  const payer = insertedMembers[input.paidByIdx] ?? insertedMembers[0];
  const splitType = input.splitMode === 'custom' ? 'exact' : 'equal';
  const allIds = insertedMembers.map((m) => m.id);
  const splitRows =
    splitType === 'equal'
      ? splitEqually(input.totalCents, allIds)
      : insertedMembers.map((m, idx) => ({
          member_id: m.id,
          amount_cents: input.customCentsList?.[idx] ?? 0,
        }));

  const { data: exp, error: eErr } = await supabase
    .from('expenses')
    .insert({
      group_id: createdGroup.id,
      title: nameRes.data,
      amount_cents: input.totalCents,
      paid_by_member_id: payer.id,
      split_type: splitType,
      category: 'food',
    })
    .select()
    .single();

  if (eErr || !exp) {
    return { ok: false, error: mapAuthError(eErr?.message ?? 'Could not save expense.') };
  }

  const { error: sErr } = await supabase.from('expense_splits').insert(
    splitRows.map((r) => ({
      expense_id: exp.id,
      member_id: r.member_id,
      amount_cents: r.amount_cents,
    }))
  );

  if (sErr) {
    return { ok: false, error: mapAuthError(sErr.message) };
  }

  return { ok: true, groupId: createdGroup.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueSplitOffline();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function createItemizedSplit(input: {
  userId: string;
  groupId?: string;
  payerId?: string;
  splitName?: string;
  paidByIdx?: number;
  people?: { name: string; color: string; isMe?: boolean }[];
  items: { name: string; qty: number; unitCents: number }[];
}): Promise<{ ok: true; groupId: string; queuedOffline?: boolean } | { ok: false; error: string }> {
  if (input.items.length === 0) {
    return { ok: false, error: 'Add at least one item before continuing.' };
  }
  for (const item of input.items) {
    const parsed = receiptItemSchema.safeParse(item);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid item.' };
    }
  }

  const cleanName = splitNameSchema.safeParse(input.splitName ?? 'New split');
  const finalName = cleanName.success ? cleanName.data : 'New split';
  const peopleList = input.people?.length
    ? input.people
    : [{ name: 'You', color: '#FF7A8A', isMe: true }];

  const queueItemizedOffline = async () => {
    const localGroupId = input.groupId ? undefined : makeLocalId('grp');
    const localMemberIds = input.groupId
      ? undefined
      : peopleList.map((_, idx) => makeLocalId(`mem_${idx}`));
    const localExpenseIds = input.items.map((_, idx) => makeLocalId(`exp_${idx}`));
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'create_itemized_split',
      localGroupId,
      localMemberIds,
      localExpenseIds,
      payload: {
        userId: input.userId,
        groupId: input.groupId,
        payerId: input.payerId,
        splitName: finalName,
        paidByIdx: input.paidByIdx ?? 0,
        people: peopleList,
        items: input.items,
      },
    });
    return {
      ok: true as const,
      groupId: input.groupId ?? localGroupId!,
      queuedOffline: true,
    };
  };

  if (
    input.groupId?.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueItemizedOffline();
  }

  try {
    let targetGroupId = input.groupId;
    let memberIds: string[] = [];
    let paidBy = input.payerId;

    if (!targetGroupId) {
      const { data: createdGroup, error: gErr } = await supabase
        .from('groups')
        .insert({
          name: finalName,
          emoji: '🍜',
          created_by: input.userId,
        })
        .select()
        .single();

      if (gErr || !createdGroup) {
        if (isProbablyOfflineError(gErr?.message)) {
          return queueItemizedOffline();
        }
        return { ok: false, error: mapAuthError(gErr?.message ?? 'Could not create split.') };
      }
      targetGroupId = createdGroup.id;

      const { data: insertedMembers, error: mErr } = await supabase
        .from('group_members')
        .insert(
          peopleList.map((p) => ({
            group_id: createdGroup.id,
            user_id: p.isMe ? input.userId : null,
            name: p.name,
            color: p.color,
          }))
        )
        .select();

      if (mErr || !insertedMembers) {
        return { ok: false, error: mapAuthError(mErr?.message ?? 'Could not add people.') };
      }
      memberIds = insertedMembers.map((m) => m.id);
      const pIdx = input.paidByIdx ?? 0;
      paidBy = insertedMembers[pIdx]?.id ?? insertedMembers[0]?.id;
    } else {
      const { data: membersData, error: mErr } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', targetGroupId)
        .order('created_at', { ascending: true });
      if (mErr) {
        if (isProbablyOfflineError(mErr.message)) {
          return queueItemizedOffline();
        }
        return { ok: false, error: mapAuthError(mErr.message) };
      }
      memberIds = (membersData ?? []).map((m) => m.id);
      paidBy = paidBy || memberIds[0];
    }

    if (!targetGroupId || !paidBy || memberIds.length === 0) {
      return { ok: false, error: 'Could not resolve group members.' };
    }

    for (const item of input.items) {
      const lineCents = item.qty * item.unitCents;
      const displayTitle = item.qty > 1 ? `${item.name} ×${item.qty}` : item.name;
      const { data: exp, error: eErr } = await supabase
        .from('expenses')
        .insert({
          group_id: targetGroupId,
          title: displayTitle,
          amount_cents: lineCents,
          paid_by_member_id: paidBy,
          split_type: 'equal',
          category: 'food',
        })
        .select()
        .single();

      if (eErr || !exp) {
        return { ok: false, error: mapAuthError(eErr?.message ?? 'Could not save item.') };
      }

      const splitRows = splitEqually(lineCents, memberIds);
      await supabase.from('expense_splits').insert(
        splitRows.map((r) => ({
          expense_id: exp.id,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        }))
      );
    }

    return { ok: true, groupId: targetGroupId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueItemizedOffline();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function addSingleExpense(input: {
  userId?: string;
  groupId: string;
  title: string;
  amountCents: number;
  category: string;
  paidById: string;
  splitType: 'equal' | 'exact';
  includedIds: string[];
  exactSplits: { member_id: string; amount_cents: number }[];
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const parsed = addExpenseSchema.safeParse({
    title: input.title,
    amountCents: input.amountCents,
    category: input.category,
    paidById: input.paidById,
    splitType: input.splitType,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid expense.' };
  }

  let splitRows: { member_id: string; amount_cents: number }[] = [];
  if (input.splitType === 'equal') {
    if (input.includedIds.length === 0) {
      return { ok: false, error: 'Select at least one person to split this expense.' };
    }
    splitRows = splitEqually(input.amountCents, input.includedIds);
  } else {
    const sumCheck = validateCustomAmountsSum(
      input.amountCents,
      input.exactSplits.map((s) => s.amount_cents)
    );
    if (!sumCheck.ok) {
      return { ok: false, error: sumCheck.error };
    }
    splitRows = input.exactSplits;
  }

  const queueExpenseOffline = async () => {
    const uid =
      input.userId ?? (await supabase.auth.getSession()).data.session?.user?.id ?? '';
    if (!uid) {
      return { ok: false as const, error: 'No internet connection. Check your network and try again.' };
    }
    await queueOfflineAction(uid, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'add_expense',
      localExpenseId: makeLocalId('exp'),
      payload: {
        groupId: input.groupId,
        title: parsed.data.title,
        amountCents: parsed.data.amountCents,
        category: parsed.data.category,
        paidById: parsed.data.paidById,
        splitType: parsed.data.splitType,
        includedIds: input.includedIds,
        exactSplits: input.exactSplits,
      },
    });
    return { ok: true as const, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueExpenseOffline();
  }

  try {
    const { data: exp, error: expErr } = await supabase
      .from('expenses')
      .insert({
        group_id: input.groupId,
        title: parsed.data.title,
        amount_cents: parsed.data.amountCents,
        paid_by_member_id: parsed.data.paidById,
        split_type: parsed.data.splitType,
        category: parsed.data.category,
      })
      .select()
      .single();

    if (expErr || !exp) {
      if (isProbablyOfflineError(expErr?.message)) {
        return queueExpenseOffline();
      }
      return { ok: false, error: mapAuthError(expErr?.message ?? 'Failed to save expense.') };
    }

    const { error: splitErr } = await supabase.from('expense_splits').insert(
      splitRows.map((r) => ({
        expense_id: exp.id,
        member_id: r.member_id,
        amount_cents: r.amount_cents,
      }))
    );

    if (splitErr) {
      if (isProbablyOfflineError(splitErr.message)) {
        return queueExpenseOffline();
      }
      return { ok: false, error: mapAuthError(splitErr.message) };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueExpenseOffline();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function recordSettlement(input: {
  userId: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  note?: string | null;
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const queueSettlementOffline = async () => {
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'add_settlement',
      localSettlementId: makeLocalId('set'),
      payload: {
        groupId: input.groupId,
        fromMemberId: input.fromMemberId,
        toMemberId: input.toMemberId,
        amountCents: input.amountCents,
        note: input.note ?? null,
        createdBy: input.userId,
      },
    });
    return { ok: true as const, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueSettlementOffline();
  }

  try {
    const { error } = await supabase.from('settlements').insert({
      group_id: input.groupId,
      from_member_id: input.fromMemberId,
      to_member_id: input.toMemberId,
      amount_cents: input.amountCents,
      note: input.note ?? null,
      created_by: input.userId,
    });

    if (error) {
      if (isProbablyOfflineError(error.message)) {
        return queueSettlementOffline();
      }
      return { ok: false, error: mapAuthError(error.message) };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueSettlementOffline();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function updateSettlementNote(input: {
  settlementId: string;
  note: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    input.settlementId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return {
      ok: false,
      error: 'Reconnect to edit a saved payment record.',
    };
  }

  try {
    const { error } = await supabase
      .from('settlements')
      .update({ note: input.note })
      .eq('id', input.settlementId);

    if (error) {
      return { ok: false, error: mapAuthError(error.message) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function sendReminder(input: {
  groupId: string;
  fromUserId: string;
  toMemberId: string;
  toUserId: string | null;
  amountCents: number;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    input.groupId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return { ok: false, error: 'You are offline — reminder could not be saved.' };
  }

  try {
    const { error } = await supabase.from('reminders').insert({
      group_id: input.groupId,
      from_user_id: input.fromUserId,
      to_member_id: input.toMemberId,
      to_user_id: input.toUserId,
      amount_cents: input.amountCents,
      message: input.message,
    });
    if (error) {
      return { ok: false, error: mapAuthError(error.message) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function fetchActiveReminders(userId: string): Promise<Reminder[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('to_user_id', userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];
    return data as Reminder[];
  } catch {
    return [];
  }
}

export async function fetchAllReminders(userId: string): Promise<Reminder[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error || !data) return [];
    return data as Reminder[];
  } catch {
    return [];
  }
}

export async function dismissReminder(reminderId: string): Promise<void> {
  try {
    await supabase
      .from('reminders')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', reminderId);
  } catch {
    // ignore
  }
}

export async function addMemberAndRebalance(input: {
  userId?: string;
  groupId: string;
  rawName: string;
  existingNames: string[];
  existingMemberIds: string[];
  color: string;
  equalExpenses: { id: string; amount_cents: number }[];
}): Promise<{ ok: true; memberName: string; queuedOffline?: boolean } | { ok: false; error: string }> {
  const check = validateNewMemberName(input.rawName, input.existingNames);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }

  const queueMemberOffline = async () => {
    const uid =
      input.userId ?? (await supabase.auth.getSession()).data.session?.user?.id ?? '';
    if (!uid) {
      return {
        ok: false as const,
        error: 'No internet connection. Check your network and try again.',
      };
    }
    await queueOfflineAction(uid, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'add_member',
      localMemberId: makeLocalId('mem'),
      payload: {
        groupId: input.groupId,
        name: check.name,
        color: input.color,
      },
    });
    return { ok: true as const, memberName: check.name, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueMemberOffline();
  }

  try {
    const { data: inserted, error } = await supabase
      .from('group_members')
      .insert({
        group_id: input.groupId,
        name: check.name,
        color: input.color,
      })
      .select()
      .single();

    if (error || !inserted) {
      if (isProbablyOfflineError(error?.message)) {
        return queueMemberOffline();
      }
      return { ok: false, error: mapAuthError(error?.message ?? 'Could not add friend.') };
    }

    const updatedIds = [...input.existingMemberIds, inserted.id];
    for (const exp of input.equalExpenses) {
      await supabase.from('expense_splits').delete().eq('expense_id', exp.id);
      const rows = splitEqually(exp.amount_cents, updatedIds);
      await supabase.from('expense_splits').insert(
        rows.map((r) => ({
          expense_id: exp.id,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        }))
      );
    }

    return { ok: true, memberName: check.name };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueMemberOffline();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function deleteGroup(input: {
  userId: string;
  groupId: string;
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const queueDelete = async () => {
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'delete_group',
      payload: { groupId: input.groupId },
    });
    return { ok: true as const, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueDelete();
  }

  try {
    const { error } = await supabase.from('groups').delete().eq('id', input.groupId);
    if (error) {
      if (isProbablyOfflineError(error.message)) {
        return queueDelete();
      }
      return { ok: false, error: mapAuthError(error.message) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueDelete();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function deleteExpense(input: {
  userId: string;
  groupId: string;
  expenseId: string;
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const queueDelete = async () => {
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'delete_expense',
      payload: { groupId: input.groupId, expenseId: input.expenseId },
    });
    return { ok: true as const, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    input.expenseId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueDelete();
  }

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', input.expenseId);
    if (error) {
      if (isProbablyOfflineError(error.message)) {
        return queueDelete();
      }
      return { ok: false, error: mapAuthError(error.message) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueDelete();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function unmarkMemberPaid(input: {
  userId: string;
  groupId: string;
  fromMemberId: string;
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const queueUnmark = async () => {
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'delete_settlement_by_member',
      payload: { groupId: input.groupId, fromMemberId: input.fromMemberId },
    });
    return { ok: true as const, queuedOffline: true };
  };

  if (
    input.groupId.startsWith('local_') ||
    input.fromMemberId.startsWith('local_') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)
  ) {
    return queueUnmark();
  }

  try {
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('group_id', input.groupId)
      .eq('from_member_id', input.fromMemberId);
    if (error) {
      if (isProbablyOfflineError(error.message)) {
        return queueUnmark();
      }
      return { ok: false, error: mapAuthError(error.message) };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueUnmark();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function saveItemClaims(input: {
  userId: string;
  groupId: string;
  items: { expenseId: string; amountCents: number; claimedBy: string[] }[];
  allPersonIds: string[];
}): Promise<{ ok: true; queuedOffline?: boolean } | { ok: false; error: string }> {
  const queueClaims = async () => {
    await queueOfflineAction(input.userId, {
      id: makeLocalId('act'),
      createdAt: new Date().toISOString(),
      type: 'update_item_claims',
      payload: {
        groupId: input.groupId,
        items: input.items,
        allPersonIds: input.allPersonIds,
      },
    });
    return { ok: true as const, queuedOffline: true };
  };

  const hasLocalIds =
    input.groupId.startsWith('local_') ||
    input.items.some((it) => it.expenseId.startsWith('local_')) ||
    input.allPersonIds.some((pid) => pid.startsWith('local_'));

  if (hasLocalIds || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return queueClaims();
  }

  try {
    const expenseIds = input.items.map((it) => it.expenseId);
    const { error: delErr } = await supabase
      .from('expense_splits')
      .delete()
      .in('expense_id', expenseIds);
    if (delErr) {
      if (isProbablyOfflineError(delErr.message)) {
        return queueClaims();
      }
      return { ok: false, error: mapAuthError(delErr.message) };
    }

    const newSplits: { expense_id: string; member_id: string; amount_cents: number }[] = [];
    for (const item of input.items) {
      const claimants = item.claimedBy.length > 0 ? item.claimedBy : input.allPersonIds;
      const rows = splitEqually(item.amountCents, claimants);
      for (const row of rows) {
        newSplits.push({
          expense_id: item.expenseId,
          member_id: row.member_id,
          amount_cents: row.amount_cents,
        });
      }
    }

    if (newSplits.length > 0) {
      const { error: insErr } = await supabase.from('expense_splits').insert(newSplits);
      if (insErr) {
        if (isProbablyOfflineError(insErr.message)) {
          return queueClaims();
        }
        return { ok: false, error: mapAuthError(insErr.message) };
      }
    }

    const hasCustomClaims = input.items.some(
      (it) => it.claimedBy.length > 0 && it.claimedBy.length < input.allPersonIds.length
    );
    if (hasCustomClaims && expenseIds.length > 0) {
      const { error: updErr } = await supabase
        .from('expenses')
        .update({ split_type: 'exact' })
        .in('id', expenseIds);
      if (updErr) {
        if (isProbablyOfflineError(updErr.message)) {
          return queueClaims();
        }
        return { ok: false, error: mapAuthError(updErr.message) };
      }
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isProbablyOfflineError(msg)) {
      return queueClaims();
    }
    return { ok: false, error: mapAuthError(msg) };
  }
}

export async function previewInviteByCode(rawInput: string): Promise<
  | {
      ok: true;
      preview: {
        id: string;
        name: string;
        invite_code: string;
        total_cents: number;
        item_count: number;
        member_count: number;
        paid_by: string;
        members: { id?: string; name: string; color: string; is_placeholder?: boolean; is_me?: boolean }[];
      };
    }
  | {
      ok: false;
      reason: 'invalid_format' | 'non_tako_qr' | 'not_found' | 'full' | 'network';
      error: string;
    }
> {
  const normalized = normalizeInviteCode(rawInput);
  if (!normalized.ok) {
    return { ok: false, reason: normalized.reason, error: normalized.error };
  }

  const { data, error } = await supabase.rpc('preview_group_by_code', {
    p_code: normalized.code,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      return {
        ok: false,
        reason: 'network',
        error: 'No internet connection. Check your network and try again.',
      };
    }
    return { ok: false, reason: 'not_found', error: 'No split found for that code.' };
  }

  if (!data) {
    return { ok: false, reason: 'not_found', error: 'No split found for that code.' };
  }

  const row = data as {
    id: string;
    name: string;
    invite_code: string;
    total_cents: number;
    item_count: number;
    member_count: number;
    paid_by: string;
    members: { id?: string; name: string; color: string; is_placeholder?: boolean; is_me?: boolean }[];
  };

  const alreadyMember = row.members?.some((m) => m.is_me);
  const hasPlaceholder = row.members?.some((m) => m.is_placeholder);
  if (!alreadyMember && !hasPlaceholder && row.member_count >= MAX_GROUP_MEMBERS) {
    return {
      ok: false,
      reason: 'full',
      error: `This split already has the maximum ${MAX_GROUP_MEMBERS} people.`,
    };
  }

  return { ok: true, preview: row };
}

export function validateProfileName(raw: string) {
  return profileNameSchema.safeParse(raw);
}
