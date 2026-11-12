export type RoomStatus = 'active' | 'settling' | 'settled' | 'archived';
export type MemberRole = 'host' | 'guest';
export type PaymentStatus = 'pending' | 'paid' | 'verified' | 'failed' | 'refunded';
export type PaymentMethod = 'gcash' | 'maya' | 'cash';

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string;
  paymentHandle?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  title: string;
  pinHash: string;
  qrSlug: string;
  hostId: string;
  status: RoomStatus;
  taxRateBps: number; // e.g. 8875 = 8.875%
  tipRateBps: number; // e.g. 1800 = 18.00%
  currency: string;
  createdAt: string;
  closedAt?: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  role: MemberRole;
  paymentStatus: PaymentStatus;
  connectionStatus: 'Live · Wi-Fi' | 'Live · 5G' | 'Connected' | 'Joining…';
  totalOwedCents: number;
  joinedAt: string;
  paidAt?: string;
}

export interface Item {
  id: string;
  roomId: string;
  createdBy: string;
  createdByName: string;
  title: string;
  priceCents: number;
  quantity: number;
  version: number;
  isNew?: boolean;
  createdAt: string;
}

export interface ItemShare {
  id: string;
  itemId: string;
  memberId: string;
  basisPoints: number; // 0 to 10000 (100.00%)
  allocatedCents: number;
  isLocked: boolean;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant: 'emerald' | 'amber';
  };
  relativeTime: string;
  createdAt: string;
}
