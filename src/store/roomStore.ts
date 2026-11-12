import { create } from 'zustand';
import { Room, RoomMember, Item, ItemShare, ActivityEvent, PaymentStatus, PaymentMethod } from '../types/database';
import { rebalanceSliders, calculateItemCents, splitEqualCents } from '../services/splitEngine';
import { CurrencyCode, formatMoney } from '../services/currency';
import { AppLanguage } from '../constants/i18n';

export const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface AppSettings {
  currency: CurrencyCode;
  language: AppLanguage;
  roundToPeso: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  muteNudges: boolean;
  optOutAwards: boolean;
  serviceChargeBps: number; // e.g. 1000 = 10%
  vatBps: number; // e.g. 1200 = 12%
}

interface RoomState extends AppSettings {
  currentRoom: Room;
  members: RoomMember[];
  items: Item[];
  shares: Record<string, ItemShare[]>; // itemId -> ItemShare[]
  activities: ActivityEvent[];
  myUserId: string;
  selectedAnimal: 'bear' | 'fox' | 'panda' | 'frog' | 'cat';
  lastNudgedAt: Record<string, number>;
  adjustmentCountByMember: Record<string, number>;

  // Actions
  updateSliderShare: (itemId: string, memberId: string, targetBps: number) => void;
  splitItemEvenly: (itemId: string) => void;
  markMemberPaid: (memberId: string, method?: PaymentMethod) => void;
  setPaymentStatus: (memberId: string, status: PaymentStatus, method?: PaymentMethod) => void;
  addItem: (title: string, priceCents: number, quantity?: number) => void;
  setSelectedAnimal: (animal: 'bear' | 'fox' | 'panda' | 'frog' | 'cat') => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  canNudgeMember: (memberId: string, now?: number) => boolean;
  nudgeMember: (memberId: string, now?: number) => { sent: boolean; reason?: 'muted' | 'cooldown' | 'not_found' };
}

export const useRoomStore = create<RoomState>((set, get) => ({
  myUserId: 'user-you',
  selectedAnimal: 'bear',
  currency: 'PHP',
  language: 'en',
  roundToPeso: false,
  soundEnabled: false,
  hapticsEnabled: true,
  muteNudges: false,
  optOutAwards: false,
  serviceChargeBps: 1000,
  vatBps: 1200,
  lastNudgedAt: {},
  adjustmentCountByMember: {
    'member-you': 2,
    'member-mia': 1,
    'member-jonas': 4,
    'member-aly': 0,
    'member-ken': 3,
  },
  currentRoom: {
    id: 'room-0412',
    title: 'Friday Night Dinner',
    pinHash: '4821',
    qrSlug: 'DINE-4821',
    hostId: 'user-you',
    status: 'active',
    taxRateBps: 1200,
    tipRateBps: 1000,
    currency: 'PHP',
    createdAt: new Date().toISOString(),
  },
  members: [
    {
      id: 'member-you',
      roomId: 'room-0412',
      userId: 'user-you',
      displayName: 'You',
      avatarUrl: 'you',
      role: 'host',
      paymentStatus: 'pending',
      connectionStatus: 'Connected',
      totalOwedCents: 5250,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'member-mia',
      roomId: 'room-0412',
      userId: 'user-mia',
      displayName: 'Mia',
      avatarUrl: 'mia',
      role: 'guest',
      paymentStatus: 'paid',
      connectionStatus: 'Live · Wi-Fi',
      totalOwedCents: 5250,
      joinedAt: new Date().toISOString(),
      paidAt: '2026-11-04T19:55:00Z',
    },
    {
      id: 'member-jonas',
      roomId: 'room-0412',
      userId: 'user-jonas',
      displayName: 'Jonas',
      avatarUrl: 'jonas',
      role: 'guest',
      paymentStatus: 'paid',
      connectionStatus: 'Live · 5G',
      totalOwedCents: 5250,
      joinedAt: new Date().toISOString(),
      paidAt: '2026-11-04T19:58:00Z',
    },
    {
      id: 'member-aly',
      roomId: 'room-0412',
      userId: 'user-aly',
      displayName: 'Aly',
      avatarUrl: 'aly',
      role: 'guest',
      paymentStatus: 'pending',
      connectionStatus: 'Joining…',
      totalOwedCents: 5250,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'member-ken',
      roomId: 'room-0412',
      userId: 'user-ken',
      displayName: 'Ken',
      avatarUrl: 'ken',
      role: 'guest',
      paymentStatus: 'pending',
      connectionStatus: 'Live · Wi-Fi',
      totalOwedCents: 0,
      joinedAt: new Date().toISOString(),
    },
  ],
  items: [
    {
      id: 'item-1',
      roomId: 'room-0412',
      createdBy: 'user-mia',
      createdByName: 'Mia',
      title: 'Truffle Burger ×2',
      priceCents: 3600,
      quantity: 2,
      version: 1,
      isNew: true,
      createdAt: 'just now',
    },
    {
      id: 'item-2',
      roomId: 'room-0412',
      createdBy: 'user-jonas',
      createdByName: 'Jonas',
      title: 'Garlic Fries',
      priceCents: 950,
      quantity: 1,
      version: 1,
      createdAt: '2m ago',
    },
    {
      id: 'item-3',
      roomId: 'room-0412',
      createdBy: 'user-aly',
      createdByName: 'Aly',
      title: 'Margherita Pizza',
      priceCents: 2400,
      quantity: 1,
      version: 1,
      createdAt: '5m ago',
    },
    {
      id: 'item-4',
      roomId: 'room-0412',
      createdBy: 'user-jonas',
      createdByName: 'Jonas',
      title: 'Iced Tea ×4',
      priceCents: 1800,
      quantity: 4,
      version: 1,
      createdAt: '7m ago',
    },
    {
      id: 'item-5',
      roomId: 'room-0412',
      createdBy: 'user-ken',
      createdByName: 'Ken',
      title: 'Tiramisu',
      priceCents: 1200,
      quantity: 1,
      version: 1,
      createdAt: '10m ago',
    },
  ],
  shares: {
    'item-1': [
      { id: 's1', itemId: 'item-1', memberId: 'member-you', basisPoints: 2500, allocatedCents: 900, isLocked: false, updatedAt: '' },
      { id: 's2', itemId: 'item-1', memberId: 'member-mia', basisPoints: 2500, allocatedCents: 900, isLocked: false, updatedAt: '' },
      { id: 's3', itemId: 'item-1', memberId: 'member-jonas', basisPoints: 2500, allocatedCents: 900, isLocked: false, updatedAt: '' },
      { id: 's4', itemId: 'item-1', memberId: 'member-aly', basisPoints: 2500, allocatedCents: 900, isLocked: false, updatedAt: '' },
    ],
  },
  activities: [
    {
      id: 'act-1',
      roomId: 'room-0412',
      actorId: 'user-jonas',
      actorName: 'Jonas',
      actorAvatar: 'jonas',
      title: 'Jonas paid $52.50',
      subtitle: 'Garlic Fries, Burgers, Drinks',
      badge: { label: 'Paid', variant: 'emerald' },
      relativeTime: '2m',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-2',
      roomId: 'room-0412',
      actorId: 'user-mia',
      actorName: 'Mia',
      actorAvatar: 'mia',
      title: 'Mia added Truffle Burger ×2',
      subtitle: '$36.00 · split 3 ways',
      relativeTime: '6m',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-3',
      roomId: 'room-0412',
      actorId: 'user-aly',
      actorName: 'Aly',
      actorAvatar: 'aly',
      title: 'Aly joined the room',
      subtitle: 'Connected on Wi-Fi',
      relativeTime: '9m',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-4',
      roomId: 'room-0412',
      actorId: 'user-you',
      actorName: 'You',
      actorAvatar: 'you',
      title: 'You set Burgers to 25%',
      subtitle: '$30.00 of $120.00',
      relativeTime: '12m',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-5',
      roomId: 'room-0412',
      actorId: 'user-ken',
      actorName: 'Ken',
      actorAvatar: 'ken',
      title: 'Ken is scanning the code',
      subtitle: 'Waiting to join',
      badge: { label: 'Joining', variant: 'amber' },
      relativeTime: '15m',
      createdAt: new Date().toISOString(),
    },
  ],

  updateSliderShare: (itemId, memberId, targetBps) => {
    const { shares, items, adjustmentCountByMember } = get();
    const item = items.find((i) => i.id === itemId);
    const currentShares = shares[itemId] || [];
    if (!item || currentShares.length === 0) return;

    const rebalanced = rebalanceSliders(currentShares, memberId, targetBps);
    const allocated = calculateItemCents(item.priceCents, rebalanced);

    const updatedShares = rebalanced.map((s) => ({
      ...s,
      allocatedCents: allocated.find((a) => a.memberId === s.memberId)?.cents || 0,
      updatedAt: new Date().toISOString(),
    })) as ItemShare[];

    set({
      shares: {
        ...shares,
        [itemId]: updatedShares,
      },
      adjustmentCountByMember: {
        ...adjustmentCountByMember,
        [memberId]: (adjustmentCountByMember[memberId] ?? 0) + 1,
      },
    });
  },

  splitItemEvenly: (itemId) => {
    const { shares, items } = get();
    const item = items.find((i) => i.id === itemId);
    const currentShares = shares[itemId] || [];
    if (!item || currentShares.length === 0) return;

    const even = splitEqualCents(
      item.priceCents,
      currentShares.map((s) => s.memberId)
    );
    const evenMap = new Map(even.map((e) => [e.memberId, e]));
    const updatedShares = currentShares.map((s) => {
      const alloc = evenMap.get(s.memberId);
      return {
        ...s,
        basisPoints: alloc?.basisPoints ?? s.basisPoints,
        allocatedCents: alloc?.cents ?? 0,
        updatedAt: new Date().toISOString(),
      };
    });

    set({
      shares: {
        ...shares,
        [itemId]: updatedShares,
      },
    });
  },

  markMemberPaid: (memberId, method) => {
    get().setPaymentStatus(memberId, 'paid', method);
  },

  setPaymentStatus: (memberId, status, method) => {
    const { members, activities, currency } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? {
            ...m,
            paymentStatus: status,
            paidAt: status === 'paid' ? new Date().toISOString() : m.paidAt,
          }
        : m
    );

    const methodLabel = method === 'gcash' ? ' via GCash' : method === 'maya' ? ' via Maya' : method === 'cash' ? ' in cash' : '';
    const amountLabel = formatMoney(member.totalOwedCents, currency);
    const title =
      status === 'paid'
        ? `${member.displayName} paid ${amountLabel}${methodLabel}`
        : status === 'failed'
        ? `${member.displayName}'s payment failed${methodLabel}`
        : status === 'refunded'
        ? `${member.displayName} was refunded ${amountLabel}`
        : `${member.displayName} payment pending`;

    const badge =
      status === 'paid'
        ? { label: 'Paid', variant: 'emerald' as const }
        : status === 'failed'
        ? { label: 'Failed', variant: 'amber' as const }
        : status === 'refunded'
        ? { label: 'Refunded', variant: 'amber' as const }
        : { label: 'Pending', variant: 'amber' as const };

    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      roomId: member.roomId,
      actorId: member.userId,
      actorName: member.displayName,
      actorAvatar: member.displayName.toLowerCase(),
      title,
      badge,
      relativeTime: 'just now',
      createdAt: new Date().toISOString(),
    };

    set({
      members: updatedMembers,
      activities: [newActivity, ...activities],
    });
  },

  addItem: (title, priceCents, quantity = 1) => {
    const { items, currentRoom } = get();
    const newItem: Item = {
      id: `item-${Date.now()}`,
      roomId: currentRoom.id,
      createdBy: 'user-you',
      createdByName: 'You',
      title,
      priceCents,
      quantity,
      version: 1,
      isNew: true,
      createdAt: 'just now',
    };

    set({
      items: [newItem, ...items],
    });
  },

  setSelectedAnimal: (animal) => {
    set({ selectedAnimal: animal });
  },

  setSetting: (key, value) => {
    if (key === 'currency') {
      const { currentRoom } = get();
      set({
        [key]: value,
        currentRoom: { ...currentRoom, currency: value as CurrencyCode },
      } as Partial<RoomState>);
      return;
    }
    set({ [key]: value } as Partial<RoomState>);
  },

  canNudgeMember: (memberId, now = Date.now()) => {
    const { muteNudges, lastNudgedAt } = get();
    if (muteNudges) return false;
    const prev = lastNudgedAt[memberId];
    if (!prev) return true;
    return now - prev >= NUDGE_COOLDOWN_MS;
  },

  nudgeMember: (memberId, now = Date.now()) => {
    const { muteNudges, lastNudgedAt, members, activities } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) return { sent: false, reason: 'not_found' };
    if (muteNudges) return { sent: false, reason: 'muted' };
    const prev = lastNudgedAt[memberId];
    if (prev && now - prev < NUDGE_COOLDOWN_MS) {
      return { sent: false, reason: 'cooldown' };
    }

    const newActivity: ActivityEvent = {
      id: `act-${now}`,
      roomId: member.roomId,
      actorId: 'user-you',
      actorName: 'You',
      actorAvatar: 'you',
      title: `Tako squirted playful ink at ${member.displayName}`,
      subtitle: 'Gentle 24h reminder',
      badge: { label: 'Nudged', variant: 'amber' },
      relativeTime: 'just now',
      createdAt: new Date(now).toISOString(),
    };

    set({
      lastNudgedAt: { ...lastNudgedAt, [memberId]: now },
      activities: [newActivity, ...activities],
    });
    return { sent: true };
  },
}));
