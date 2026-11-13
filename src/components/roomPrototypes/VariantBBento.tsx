import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Motion, Radii, Shadows, Spacing, TouchTarget, Typography } from '../../constants/theme';
import { Badge } from '../Badge';
import { MemojiAvatar, MemojiId, resolveAnimal } from '../MemojiAvatar';
import { TakoMascot } from '../TakoMascot';
import { formatMoney } from '../../services/currency';
import { RoomPrototypeMockData } from './mockData';

interface Props {
  data: RoomPrototypeMockData;
}

export function VariantBBento({ data }: Props) {
  const router = useRouter();
  const { room, members, items, myShareCents, totalSpendCents, paidMembersCount } = data;
  const owingCount = members.filter((m) => m.totalOwedCents > 0).length || members.length;
  const paidPercent = owingCount > 0 ? Math.round((paidMembersCount / owingCount) * 100) : 0;
  const latestItem = items[0];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header bar */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.roomSub}>Real-time split table</Text>
        </View>
        <Badge label="Bento Grid" variant="blue" />
      </View>

      {/* Bento Grid Container */}
      <View style={styles.grid}>
        {/* Tile 1: Total Spend (Col span 2) with Tako peeking */}
        <View style={[styles.tile, styles.totalTile, Shadows.card]}>
          <View style={styles.totalHeader}>
            <View>
              <Text style={styles.tileLabel}>TOTAL BILL</Text>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatMoney(totalSpendCents, 'PHP')}
              </Text>
            </View>
            <View style={styles.takoBox}>
              <TakoMascot size={58} mood={totalSpendCents > 0 ? 'counting' : 'waiting'} />
            </View>
          </View>
          <View style={styles.totalFooter}>
            <Badge label="Real-time tab" variant="emerald" />
            <Text style={styles.totalFootText}>{items.length} dishes logged</Text>
          </View>
        </View>

        {/* Tile 2: Your Share + Pay Now (Col 1) */}
        <View style={[styles.tile, styles.shareTile, Shadows.cardSoft]}>
          <Text style={styles.tileLabel}>YOUR SHARE</Text>
          <Text style={styles.shareAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatMoney(myShareCents, 'PHP')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settle')}
            style={({ pressed }) => [
              styles.payBtn,
              pressed && { transform: [{ scale: Motion.pressScale }] },
            ]}
          >
            <Text style={styles.payBtnText}>Pay now →</Text>
          </Pressable>
        </View>

        {/* Tile 3: Paid Progress Gauge (Col 2) */}
        <View style={[styles.tile, styles.progressTile, Shadows.cardSoft]}>
          <Text style={styles.tileLabel}>SETTLED</Text>
          <View style={styles.progressNumberRow}>
            <Text style={styles.progressMainNumber}>{paidMembersCount}</Text>
            <Text style={styles.progressOf}>/{owingCount}</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${paidPercent}%` }]} />
          </View>
          <Text style={styles.progressCaption}>{paidPercent}% collected</Text>
        </View>

        {/* Tile 4: Who's in the room + Invite PIN (Col 1) */}
        <Pressable
          onPress={() => router.push('/join')}
          style={({ pressed }) => [
            styles.tile,
            styles.membersTile,
            Shadows.cardSoft,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <View style={styles.tileHeaderRow}>
            <Text style={styles.tileLabel}>ROOM ({members.length})</Text>
            <Badge label={`PIN ${room.pinHash}`} variant="amber" />
          </View>
          <View style={styles.avatarCluster}>
            {members.slice(0, 4).map((m, idx) => (
              <View key={m.id} style={[styles.overlapAvatar, { zIndex: 10 - idx, marginLeft: idx > 0 ? -10 : 0 }]}>
                <MemojiAvatar id={resolveAnimal(m.avatarUrl as MemojiId)} size={32} />
              </View>
            ))}
            {members.length > 4 && (
              <View style={[styles.overlapAvatar, styles.moreAvatar, { marginLeft: -10 }]}>
                <Text style={styles.moreAvatarText}>+{members.length - 4}</Text>
              </View>
            )}
          </View>
          <Text style={styles.invitePrompt}>Invite friends with QR →</Text>
        </Pressable>

        {/* Tile 5: Latest item / quick claim (Col 2) */}
        <Pressable
          onPress={() => router.push('/claim')}
          style={({ pressed }) => [
            styles.tile,
            styles.latestTile,
            Shadows.cardSoft,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <View style={styles.tileHeaderRow}>
            <Text style={styles.tileLabel}>LATEST DISH</Text>
            <Badge label="New" variant="emerald" />
          </View>
          {latestItem ? (
            <>
              <Text style={styles.latestTitle} numberOfLines={2}>
                {latestItem.title}
              </Text>
              <Text style={styles.latestPrice}>{formatMoney(latestItem.priceCents, 'PHP')}</Text>
              <Text style={styles.latestClaim}>Adjust split →</Text>
            </>
          ) : (
            <View style={styles.latestEmpty}>
              <Text style={styles.latestEmptyText}>No dishes yet</Text>
              <Text style={styles.latestClaim}>+ Add first dish</Text>
            </View>
          )}
        </Pressable>

        {/* Tile 6: Receipt Feed Quick Access (Col span 2) */}
        <View style={[styles.tile, styles.feedTile, Shadows.cardSoft]}>
          <View style={styles.tileHeaderRow}>
            <Text style={styles.tileLabel}>ALL RECEIPT ITEMS ({items.length})</Text>
            <Pressable onPress={() => router.push('/(tabs)/items')}>
              <Text style={styles.viewAllText}>View list →</Text>
            </Pressable>
          </View>
          {items.slice(0, 3).map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() => router.push('/claim')}
              style={[styles.feedItemRow, idx > 0 && styles.feedItemBorder]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.feedItemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.feedItemMeta}>Added by {item.createdByName}</Text>
              </View>
              <Text style={styles.feedItemPrice}>{formatMoney(item.priceCents, 'PHP')}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roomName: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.ink,
  },
  roomSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  totalTile: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  takoBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    ...Typography.currencyHero,
    fontSize: 34,
    color: Colors.ink,
    marginTop: 2,
  },
  totalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalFootText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  shareTile: {
    width: '48%',
    justifyContent: 'space-between',
    minHeight: 136,
  },
  shareAmount: {
    ...Typography.currencyMd,
    fontSize: 22,
    color: Colors.primary,
    marginTop: 4,
  },
  payBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressTile: {
    width: '48%',
    justifyContent: 'space-between',
    minHeight: 136,
  },
  progressNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  progressMainNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.ink,
  },
  progressOf: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceSubtle,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.mintProgress,
    borderRadius: 3,
  },
  progressCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  membersTile: {
    width: '48%',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  avatarCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  overlapAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  moreAvatar: {
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  invitePrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  latestTile: {
    width: '48%',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  latestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 4,
  },
  latestPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  latestClaim: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  latestEmpty: {
    paddingVertical: 10,
  },
  latestEmptyText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  feedTile: {
    width: '100%',
    marginTop: 4,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  feedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  feedItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  feedItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  feedItemMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  feedItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
