import { create } from 'zustand';
import { Room, RoomMember, Item, ItemShare, ActivityEvent } from '../types/database';
import { rebalanceSliders, calculateItemCents } from '../services/splitEngine';

interface RoomState {
  currentRoom: Room;
  members: RoomMember[];
  items: Item[];
  shares: Record<string, ItemShare[]>; // itemId -> ItemShare[]
  activities: ActivityEvent[];
  myUserId: string;
  selectedAnimal: 'bear' | 'fox' | 'panda' | 'frog' | 'cat';

  // Actions
  updateSliderShare: (itemId: string, memberId: string, targetBps: number) => void;
  markMemberPaid: (memberId: string) => void;
  addItem: (title: string, priceCents: number, quantity?: number) => void;
  setSelectedAnimal: (animal: 'bear' | 'fox' | 'panda' | 'frog' | 'cat') => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  myUserId: 'user-you',
  selectedAnimal: 'bear',
  currentRoom: {
    id: 'room-0412',
    title: 'Friday Night Dinner',
    pinHash: '4821',
    qrSlug: 'DINE-4821',
    hostId: 'user-you',
    status: 'active',
    taxRateBps: 8875,
    tipRateBps: 1800,
    currency: 'USD',
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
    const { shares, items } = get();
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
    });
  },

  markMemberPaid: (memberId) => {
    const { members, activities } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? { ...m, paymentStatus: 'paid' as const, paidAt: new Date().toISOString() }
        : m
    );

    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      roomId: member.roomId,
      actorId: member.userId,
      actorName: member.displayName,
      actorAvatar: member.displayName.toLowerCase(),
      title: `${member.displayName} paid $${(member.totalOwedCents / 100).toFixed(2)}`,
      badge: { label: 'Paid', variant: 'emerald' },
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
}));
