import {
  type OfflineSnapshot,
  type OutboxAction,
  isProbablyOfflineError,
  mergeServerWithOutbox,
  readIdMap,
  readOfflineSnapshot,
  readOutbox,
  writeIdMap,
  writeOfflineSnapshot,
  writeOutbox,
} from '@/lib/offlineStore';
import { splitEqually } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseSplit, Group, GroupMember, Settlement } from '@/types/tako';

function resolveId(id: string, idMap: Record<string, string>): string {
  return idMap[id] ?? id;
}

/**
 * Replays queued offline mutations to Supabase in FIFO order.
 * Stops on the first network error so remaining items stay safely queued.
 */
export async function flushOutbox(userId: string): Promise<{
  syncedCount: number;
  remainingCount: number;
  hadNetworkError: boolean;
}> {
  const outbox = await readOutbox(userId);
  if (outbox.length === 0) {
    return { syncedCount: 0, remainingCount: 0, hadNetworkError: false };
  }

  const idMap = await readIdMap(userId);
  let syncedCount = 0;
  let remaining: OutboxAction[] = [];
  let hadNetworkError = false;

  for (let i = 0; i < outbox.length; i += 1) {
    const action = outbox[i];
    const result = await replayAction(action, idMap);

    if (result.status === 'network_error') {
      hadNetworkError = true;
      remaining = outbox.slice(i);
      break;
    }

    if (result.status === 'synced') {
      syncedCount += 1;
    }
    // If permanent validation/server error, drop item so it doesn't wedge the queue forever
  }

  await Promise.all([
    writeOutbox(userId, remaining),
    writeIdMap(userId, remaining.length === 0 ? {} : idMap),
  ]);

  return {
    syncedCount,
    remainingCount: remaining.length,
    hadNetworkError,
  };
}

async function replayAction(
  action: OutboxAction,
  idMap: Record<string, string>
): Promise<{ status: 'synced' | 'network_error' | 'dropped' }> {
  try {
    if (action.type === 'create_split') {
      const { payload, localGroupId, localMemberIds } = action;
      const { data: createdGroup, error: gErr } = await supabase
        .from('groups')
        .insert({
          name: payload.name,
          emoji: '🍜',
          created_by: payload.userId,
        })
        .select()
        .single();

      if (gErr || !createdGroup) {
        return isProbablyOfflineError(gErr?.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      idMap[localGroupId] = createdGroup.id;

      const { data: insertedMembers, error: mErr } = await supabase
        .from('group_members')
        .insert(
          payload.people.map((p) => ({
            group_id: createdGroup.id,
            user_id: p.isMe ? payload.userId : null,
            name: p.name,
            color: p.color,
          }))
        )
        .select();

      if (mErr || !insertedMembers) {
        return isProbablyOfflineError(mErr?.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      localMemberIds.forEach((localId, idx) => {
        if (insertedMembers[idx]?.id) {
          idMap[localId] = insertedMembers[idx].id;
        }
      });

      const payer = insertedMembers[payload.paidByIdx] ?? insertedMembers[0];
      const splitType = payload.splitMode === 'custom' ? 'exact' : 'equal';
      const allIds = insertedMembers.map((m) => m.id);
      const splitRows =
        splitType === 'equal'
          ? splitEqually(payload.totalCents, allIds)
          : insertedMembers.map((m, idx) => ({
              member_id: m.id,
              amount_cents: payload.customCentsList?.[idx] ?? 0,
            }));

      const { data: exp, error: eErr } = await supabase
        .from('expenses')
        .insert({
          group_id: createdGroup.id,
          title: payload.name,
          amount_cents: payload.totalCents,
          paid_by_member_id: payer.id,
          split_type: splitType,
          category: 'food',
        })
        .select()
        .single();

      if (eErr || !exp) {
        return isProbablyOfflineError(eErr?.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      const { error: sErr } = await supabase.from('expense_splits').insert(
        splitRows.map((r) => ({
          expense_id: exp.id,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        }))
      );

      if (sErr) {
        return isProbablyOfflineError(sErr.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      return { status: 'synced' };
    }

    if (action.type === 'add_expense') {
      const { payload } = action;
      const groupId = resolveId(payload.groupId, idMap);
      const paidById = resolveId(payload.paidById, idMap);
      const includedIds = payload.includedIds.map((id) => resolveId(id, idMap));
      const exactSplits = payload.exactSplits.map((s) => ({
        member_id: resolveId(s.member_id, idMap),
        amount_cents: s.amount_cents,
      }));

      const splitRows =
        payload.splitType === 'equal'
          ? splitEqually(payload.amountCents, includedIds)
          : exactSplits;

      const { data: exp, error: expErr } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          title: payload.title,
          amount_cents: payload.amountCents,
          paid_by_member_id: paidById,
          split_type: payload.splitType,
          category: payload.category,
        })
        .select()
        .single();

      if (expErr || !exp) {
        return isProbablyOfflineError(expErr?.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      idMap[action.localExpenseId] = exp.id;

      const { error: splitErr } = await supabase.from('expense_splits').insert(
        splitRows.map((r) => ({
          expense_id: exp.id,
          member_id: r.member_id,
          amount_cents: r.amount_cents,
        }))
      );

      if (splitErr) {
        return isProbablyOfflineError(splitErr.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      return { status: 'synced' };
    }

    if (action.type === 'add_settlement') {
      const { payload } = action;
      const { error } = await supabase.from('settlements').insert({
        group_id: resolveId(payload.groupId, idMap),
        from_member_id: resolveId(payload.fromMemberId, idMap),
        to_member_id: resolveId(payload.toMemberId, idMap),
        amount_cents: payload.amountCents,
        note: payload.note,
        created_by: payload.createdBy,
      });

      if (error) {
        return isProbablyOfflineError(error.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }
      return { status: 'synced' };
    }

    if (action.type === 'update_profile') {
      const { error } = await supabase
        .from('profiles')
        .update(action.payload.updates)
        .eq('id', action.payload.userId);
      if (error) {
        return isProbablyOfflineError(error.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }
      return { status: 'synced' };
    }

    if (action.type === 'delete_group') {
      const gid = resolveId(action.payload.groupId, idMap);
      if (gid.startsWith('local_')) {
        return { status: 'synced' };
      }
      const { error } = await supabase.from('groups').delete().eq('id', gid);
      if (error) {
        return isProbablyOfflineError(error.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }
      return { status: 'synced' };
    }

    if (action.type === 'delete_expense') {
      const eid = resolveId(action.payload.expenseId, idMap);
      if (eid.startsWith('local_')) {
        return { status: 'synced' };
      }
      const { error } = await supabase.from('expenses').delete().eq('id', eid);
      if (error) {
        return isProbablyOfflineError(error.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }
      return { status: 'synced' };
    }

    if (action.type === 'delete_settlement_by_member') {
      const gid = resolveId(action.payload.groupId, idMap);
      const mid = resolveId(action.payload.fromMemberId, idMap);
      if (gid.startsWith('local_') || mid.startsWith('local_')) {
        return { status: 'synced' };
      }
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('group_id', gid)
        .eq('from_member_id', mid);
      if (error) {
        return isProbablyOfflineError(error.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }
      return { status: 'synced' };
    }

    if (action.type === 'add_member') {
      const gid = resolveId(action.payload.groupId, idMap);
      const { data: inserted, error } = await supabase
        .from('group_members')
        .insert({
          group_id: gid,
          name: action.payload.name,
          color: action.payload.color,
        })
        .select()
        .single();

      if (error || !inserted) {
        return isProbablyOfflineError(error?.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      idMap[action.localMemberId] = inserted.id;

      const [membersRes, expensesRes] = await Promise.all([
        supabase
          .from('group_members')
          .select('id')
          .eq('group_id', gid)
          .order('created_at', { ascending: true }),
        supabase
          .from('expenses')
          .select('id, amount_cents')
          .eq('group_id', gid)
          .eq('split_type', 'equal'),
      ]);

      const memberIds = (membersRes.data ?? []).map((m) => m.id);
      const equalExpenses = expensesRes.data ?? [];
      if (memberIds.length > 0 && equalExpenses.length > 0) {
        for (const exp of equalExpenses) {
          await supabase.from('expense_splits').delete().eq('expense_id', exp.id);
          const rows = splitEqually(exp.amount_cents, memberIds);
          await supabase.from('expense_splits').insert(
            rows.map((r) => ({
              expense_id: exp.id,
              member_id: r.member_id,
              amount_cents: r.amount_cents,
            }))
          );
        }
      }

      return { status: 'synced' };
    }

    if (action.type === 'create_itemized_split') {
      const { payload, localGroupId, localMemberIds, localExpenseIds } = action;
      let targetGroupId = payload.groupId ? resolveId(payload.groupId, idMap) : undefined;
      let memberIds: string[] = [];
      let paidBy = payload.payerId ? resolveId(payload.payerId, idMap) : undefined;

      if (!targetGroupId && localGroupId) {
        const { data: createdGroup, error: gErr } = await supabase
          .from('groups')
          .insert({
            name: payload.splitName,
            emoji: '🍜',
            created_by: payload.userId,
          })
          .select()
          .single();

        if (gErr || !createdGroup) {
          return isProbablyOfflineError(gErr?.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }
        targetGroupId = createdGroup.id;
        idMap[localGroupId] = createdGroup.id;

        const peopleList = payload.people.length
          ? payload.people
          : [{ name: 'You', color: '#FF7A8A', isMe: true }];

        const { data: insertedMembers, error: mErr } = await supabase
          .from('group_members')
          .insert(
            peopleList.map((p) => ({
              group_id: createdGroup.id,
              user_id: p.isMe ? payload.userId : null,
              name: p.name,
              color: p.color,
            }))
          )
          .select();

        if (mErr || !insertedMembers) {
          return isProbablyOfflineError(mErr?.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }

        localMemberIds?.forEach((localId, idx) => {
          if (insertedMembers[idx]?.id) {
            idMap[localId] = insertedMembers[idx].id;
          }
        });

        memberIds = insertedMembers.map((m) => m.id);
        paidBy = insertedMembers[payload.paidByIdx]?.id ?? insertedMembers[0]?.id;
      } else if (targetGroupId) {
        const { data: membersData, error: mErr } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', targetGroupId)
          .order('created_at', { ascending: true });
        if (mErr) {
          return isProbablyOfflineError(mErr.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }
        memberIds = (membersData ?? []).map((m) => m.id);
        paidBy = paidBy || memberIds[0];
      }

      if (!targetGroupId || !paidBy || memberIds.length === 0) {
        return { status: 'dropped' };
      }

      for (let idx = 0; idx < payload.items.length; idx += 1) {
        const item = payload.items[idx];
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
          return isProbablyOfflineError(eErr?.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }

        if (localExpenseIds[idx]) {
          idMap[localExpenseIds[idx]] = exp.id;
        }

        const splitRows = splitEqually(lineCents, memberIds);
        const { error: sErr } = await supabase.from('expense_splits').insert(
          splitRows.map((r) => ({
            expense_id: exp.id,
            member_id: r.member_id,
            amount_cents: r.amount_cents,
          }))
        );
        if (sErr) {
          return isProbablyOfflineError(sErr.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }
      }

      return { status: 'synced' };
    }

    if (action.type === 'update_item_claims') {
      const expenseIds = action.payload.items.map((it) => resolveId(it.expenseId, idMap));
      const allPersonIds = action.payload.allPersonIds.map((pid) => resolveId(pid, idMap));

      const { error: delErr } = await supabase
        .from('expense_splits')
        .delete()
        .in('expense_id', expenseIds);
      if (delErr) {
        return isProbablyOfflineError(delErr.message)
          ? { status: 'network_error' }
          : { status: 'dropped' };
      }

      const newSplits: { expense_id: string; member_id: string; amount_cents: number }[] = [];
      for (const item of action.payload.items) {
        const eid = resolveId(item.expenseId, idMap);
        const rawClaimants = item.claimedBy.length > 0 ? item.claimedBy : action.payload.allPersonIds;
        const resolvedClaimants = rawClaimants.map((cid) => resolveId(cid, idMap));
        const rows = splitEqually(item.amountCents, resolvedClaimants);
        for (const row of rows) {
          newSplits.push({
            expense_id: eid,
            member_id: row.member_id,
            amount_cents: row.amount_cents,
          });
        }
      }

      if (newSplits.length > 0) {
        const { error: insErr } = await supabase.from('expense_splits').insert(newSplits);
        if (insErr) {
          return isProbablyOfflineError(insErr.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }
      }

      const hasCustomClaims = action.payload.items.some(
        (it) => it.claimedBy.length > 0 && it.claimedBy.length < allPersonIds.length
      );
      if (hasCustomClaims && expenseIds.length > 0) {
        const { error: updErr } = await supabase
          .from('expenses')
          .update({ split_type: 'exact' })
          .in('id', expenseIds);
        if (updErr) {
          return isProbablyOfflineError(updErr.message)
            ? { status: 'network_error' }
            : { status: 'dropped' };
        }
      }

      return { status: 'synced' };
    }

    return { status: 'dropped' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return isProbablyOfflineError(msg) ? { status: 'network_error' } : { status: 'dropped' };
  }
}

/**
 * Fetches the full user snapshot from Supabase (after flushing any queued writes)
 * and falls back seamlessly to the cached AsyncStorage snapshot when offline.
 */
export async function fetchAndCacheSnapshot(userId: string): Promise<{
  snapshot: OfflineSnapshot;
  fromCache: boolean;
  pendingCount: number;
  syncedCount: number;
}> {
  const flushRes = await flushOutbox(userId);
  const cached = await readOfflineSnapshot(userId);

  if (flushRes.hadNetworkError || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return {
      snapshot: cached,
      fromCache: true,
      pendingCount: flushRes.remainingCount,
      syncedCount: flushRes.syncedCount,
    };
  }

  try {
    const { data: groupsData, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (gErr || !groupsData) {
      return {
        snapshot: cached,
        fromCache: true,
        pendingCount: flushRes.remainingCount,
        syncedCount: flushRes.syncedCount,
      };
    }

    const groups = groupsData as Group[];
    if (groups.length === 0) {
      const outbox = await readOutbox(userId);
      const merged = mergeServerWithOutbox(
        {
          groups: [],
          members: [],
          expenses: [],
          splits: [],
          settlements: [],
          updatedAt: new Date().toISOString(),
        },
        outbox
      );
      await writeOfflineSnapshot(userId, merged);
      return {
        snapshot: merged,
        fromCache: false,
        pendingCount: outbox.length,
        syncedCount: flushRes.syncedCount,
      };
    }

    const groupIds = groups.map((g) => g.id);
    const [membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from('group_members').select('*').in('group_id', groupIds),
      supabase.from('expenses').select('*').in('group_id', groupIds),
      supabase.from('settlements').select('*').in('group_id', groupIds),
    ]);

    if (membersRes.error || expensesRes.error || settlementsRes.error) {
      return {
        snapshot: cached,
        fromCache: true,
        pendingCount: flushRes.remainingCount,
        syncedCount: flushRes.syncedCount,
      };
    }

    const allMembers = (membersRes.data ?? []) as GroupMember[];
    const allExpenses = (expensesRes.data ?? []) as Expense[];
    const allSettlements = (settlementsRes.data ?? []) as Settlement[];

    const expenseIds = allExpenses.map((e) => e.id);
    let allSplits: ExpenseSplit[] = [];
    if (expenseIds.length > 0) {
      const splitsRes = await supabase
        .from('expense_splits')
        .select('*')
        .in('expense_id', expenseIds);
      if (splitsRes.error) {
        return {
          snapshot: cached,
          fromCache: true,
          pendingCount: flushRes.remainingCount,
          syncedCount: flushRes.syncedCount,
        };
      }
      allSplits = (splitsRes.data ?? []) as ExpenseSplit[];
    }

    const outbox = await readOutbox(userId);
    const serverSnapshot: OfflineSnapshot = {
      groups,
      members: allMembers,
      expenses: allExpenses,
      splits: allSplits,
      settlements: allSettlements,
      updatedAt: new Date().toISOString(),
    };
    const merged = mergeServerWithOutbox(serverSnapshot, outbox);
    await writeOfflineSnapshot(userId, merged);

    return {
      snapshot: merged,
      fromCache: false,
      pendingCount: outbox.length,
      syncedCount: flushRes.syncedCount,
    };
  } catch {
    return {
      snapshot: cached,
      fromCache: true,
      pendingCount: flushRes.remainingCount,
      syncedCount: flushRes.syncedCount,
    };
  }
}
