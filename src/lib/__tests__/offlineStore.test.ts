/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  type OfflineSnapshot,
  type StorageLike,
  isProbablyOfflineError,
  mergeServerWithOutbox,
  queueOfflineAction,
  readOfflineSnapshot,
  readOutbox,
  writeOutbox,
} from '../offlineStore';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => {
      map.set(k, v);
    },
    removeItem: async (k) => {
      map.delete(k);
    },
  };
}

test('queueOfflineAction persists split, expense, and settlement into snapshot and outbox', async () => {
  const storage = createMemoryStorage();
  const userId = 'user-1';

  await queueOfflineAction(
    userId,
    {
      id: 'act-1',
      createdAt: '2026-11-18T12:00:00.000Z',
      type: 'create_split',
      localGroupId: 'local_grp_1',
      localMemberIds: ['local_mem_0', 'local_mem_1'],
      payload: {
        userId,
        name: 'Ramen Night',
        totalCents: 10_000,
        splitMode: 'equal',
        people: [
          { name: 'You', color: '#FF7A8A', isMe: true },
          { name: 'Mika', color: '#2EC4B6' },
        ],
        paidByIdx: 0,
      },
    },
    storage
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-2',
      createdAt: '2026-11-18T12:01:00.000Z',
      type: 'add_expense',
      localExpenseId: 'local_exp_2',
      payload: {
        groupId: 'local_grp_1',
        title: 'Gyoza',
        amountCents: 3_000,
        category: 'food',
        paidById: 'local_mem_0',
        splitType: 'equal',
        includedIds: ['local_mem_0', 'local_mem_1'],
        exactSplits: [],
      },
    },
    storage
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-3',
      createdAt: '2026-11-18T12:02:00.000Z',
      type: 'add_settlement',
      localSettlementId: 'local_set_3',
      payload: {
        groupId: 'local_grp_1',
        fromMemberId: 'local_mem_1',
        toMemberId: 'local_mem_0',
        amountCents: 6_500,
        note: null,
        createdBy: userId,
      },
    },
    storage
  );

  const snapshot = await readOfflineSnapshot(userId, storage);
  const outbox = await readOutbox(userId, storage);

  assert.equal(outbox.length, 3);
  assert.equal(snapshot.groups.length, 1);
  assert.equal(snapshot.groups[0].id, 'local_grp_1');
  assert.equal(snapshot.members.length, 2);
  assert.equal(snapshot.expenses.length, 2);
  assert.equal(snapshot.splits.length, 4);
  assert.equal(snapshot.settlements.length, 1);
  assert.equal(snapshot.settlements[0].amount_cents, 6_500);

  await writeOutbox(userId, [], storage);
  assert.deepEqual(await readOutbox(userId, storage), []);
});

test('mergeServerWithOutbox preserves queued offline expenses on top of server state', () => {
  const serverSnapshot: OfflineSnapshot = {
    groups: [
      {
        id: 'grp-server-1',
        name: 'Dinner',
        emoji: '🍜',
        invite_code: 'ABC123',
        created_by: 'user-1',
        created_at: '2026-11-18T10:00:00.000Z',
      },
    ],
    members: [
      {
        id: 'mem-1',
        group_id: 'grp-server-1',
        user_id: 'user-1',
        name: 'You',
        color: '#FF7A8A',
        created_at: '2026-11-18T10:00:00.000Z',
      },
    ],
    expenses: [],
    splits: [],
    settlements: [],
    updatedAt: '2026-11-18T10:00:00.000Z',
  };

  const merged = mergeServerWithOutbox(serverSnapshot, [
    {
      id: 'act-exp',
      createdAt: '2026-11-18T12:05:00.000Z',
      type: 'add_expense',
      localExpenseId: 'local_exp_99',
      payload: {
        groupId: 'grp-server-1',
        title: 'Matcha',
        amountCents: 2_500,
        category: 'drinks',
        paidById: 'mem-1',
        splitType: 'equal',
        includedIds: ['mem-1'],
        exactSplits: [],
      },
    },
  ]);

  assert.equal(merged.expenses.length, 1);
  assert.equal(merged.expenses[0].title, 'Matcha');
  assert.equal(merged.splits[0].amount_cents, 2_500);
});

test('isProbablyOfflineError detects network and fetch failures', () => {
  assert.equal(isProbablyOfflineError('TypeError: Failed to fetch'), true);
  assert.equal(isProbablyOfflineError('Network request failed'), true);
  assert.equal(isProbablyOfflineError('Request timeout'), true);
  assert.equal(isProbablyOfflineError('Invalid password'), false);
});

test('delete_group cancels local group actions and delete_expense handles local vs server expenses', async () => {
  const storage = createMemoryStorage();
  const userId = 'user-1';

  await queueOfflineAction(
    userId,
    {
      id: 'act-1',
      createdAt: '2026-11-18T12:00:00.000Z',
      type: 'create_split',
      localGroupId: 'local_grp_1',
      localMemberIds: ['local_mem_0', 'local_mem_1'],
      payload: {
        userId,
        name: 'Coffee',
        totalCents: 4_000,
        splitMode: 'equal',
        people: [
          { name: 'You', color: '#FF7A8A', isMe: true },
          { name: 'Ken', color: '#2EC4B6' },
        ],
        paidByIdx: 0,
      },
    },
    storage
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-2',
      createdAt: '2026-11-18T12:01:00.000Z',
      type: 'add_expense',
      localExpenseId: 'local_exp_1',
      payload: {
        groupId: 'local_grp_1',
        title: 'Pastry',
        amountCents: 1_500,
        category: 'food',
        paidById: 'local_mem_0',
        splitType: 'equal',
        includedIds: ['local_mem_0', 'local_mem_1'],
        exactSplits: [],
      },
    },
    storage
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-3',
      createdAt: '2026-11-18T12:02:00.000Z',
      type: 'delete_expense',
      payload: { groupId: 'local_grp_1', expenseId: 'local_exp_1' },
    },
    storage
  );

  let outbox = await readOutbox(userId, storage);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].type, 'create_split');

  await queueOfflineAction(
    userId,
    {
      id: 'act-4',
      createdAt: '2026-11-18T12:03:00.000Z',
      type: 'delete_group',
      payload: { groupId: 'local_grp_1' },
    },
    storage
  );

  outbox = await readOutbox(userId, storage);
  const snap = await readOfflineSnapshot(userId, storage);
  assert.equal(outbox.length, 0);
  assert.equal(snap.groups.length, 0);
  assert.equal(snap.members.length, 0);
  assert.equal(snap.expenses.length, 0);
  assert.equal(snap.splits.length, 0);
});

test('add_member rebalances equal splits and create_itemized_split + update_item_claims work offline', async () => {
  const storage = createMemoryStorage();
  const userId = 'user-1';

  await queueOfflineAction(
    userId,
    {
      id: 'act-itemized',
      createdAt: '2026-11-18T13:00:00.000Z',
      type: 'create_itemized_split',
      localGroupId: 'local_grp_2',
      localMemberIds: ['local_m_1', 'local_m_2'],
      localExpenseIds: ['local_e_1', 'local_e_2'],
      payload: {
        userId,
        splitName: 'Izakaya',
        paidByIdx: 0,
        people: [
          { name: 'You', color: '#FF7A8A', isMe: true },
          { name: 'Bea', color: '#2EC4B6' },
        ],
        items: [
          { name: 'Ramen', qty: 1, unitCents: 3_000 },
          { name: 'Green Tea', qty: 2, unitCents: 500 },
        ],
      },
    },
    storage
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-add-mem',
      createdAt: '2026-11-18T13:01:00.000Z',
      type: 'add_member',
      localMemberId: 'local_m_3',
      payload: { groupId: 'local_grp_2', name: 'Carlos', color: '#B9A5E8' },
    },
    storage
  );

  let snap = await readOfflineSnapshot(userId, storage);
  assert.equal(snap.members.length, 3);
  assert.equal(snap.expenses.length, 2);
  // 3,000 split among 3 = 1,000 each; 1,000 split among 3 = 334, 333, 333
  const ramenSplits = snap.splits.filter((s) => s.expense_id === 'local_e_1');
  assert.equal(ramenSplits.length, 3);
  assert.deepEqual(
    ramenSplits.map((s) => s.amount_cents),
    [1_000, 1_000, 1_000]
  );

  await queueOfflineAction(
    userId,
    {
      id: 'act-claims',
      createdAt: '2026-11-18T13:02:00.000Z',
      type: 'update_item_claims',
      payload: {
        groupId: 'local_grp_2',
        items: [
          { expenseId: 'local_e_1', amountCents: 3_000, claimedBy: ['local_m_1'] },
          {
            expenseId: 'local_e_2',
            amountCents: 1_000,
            claimedBy: ['local_m_1', 'local_m_2', 'local_m_3'],
          },
        ],
        allPersonIds: ['local_m_1', 'local_m_2', 'local_m_3'],
      },
    },
    storage
  );

  snap = await readOfflineSnapshot(userId, storage);
  const updatedRamen = snap.expenses.find((e) => e.id === 'local_e_1');
  assert.equal(updatedRamen?.split_type, 'exact');
  const updatedRamenSplits = snap.splits.filter((s) => s.expense_id === 'local_e_1');
  assert.equal(updatedRamenSplits.length, 1);
  assert.equal(updatedRamenSplits[0].member_id, 'local_m_1');
  assert.equal(updatedRamenSplits[0].amount_cents, 3_000);
});
