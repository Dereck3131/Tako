import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Motion, Radii, Shadows, Spacing, TouchTarget, Typography } from '../../constants/theme';
import { Badge } from '../Badge';
import { MemojiAvatar, MemojiId, resolveAnimal } from '../MemojiAvatar';
import { TakoMascot } from '../TakoMascot';
import { TicketCard } from '../TicketCard';
import { formatMoney } from '../../services/currency';
import { RoomPrototypeMockData } from './mockData';

interface Props {
  data: RoomPrototypeMockData;
}

export function VariantAFeed({ data }: Props) {
  const router = useRouter();
  const { room, members, items, myShareCents, totalSpendCents, paidMembersCount } = data;
  const owingCount = members.filter((m) => m.totalOwedCents > 0).length || members.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Minimal Header */}
        <View style={styles.topRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.title}
            </Text>
            <View style={styles.metaRow}>
              <Badge label={`${members.length} in the room`} variant="emerald" />
              <Badge label={`${paidMembersCount} of ${owingCount} paid`} variant="blue" />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invite with QR"
            onPress={() => router.push('/join')}
            style={({ pressed }) => [
              styles.qrPill,
              pressed && { transform: [{ scale: Motion.pressScale }] },
            ]}
          >
            <Text style={styles.qrPillText}>PIN {room.pinHash}</Text>
          </Pressable>
        </View>

        {/* Big Plain Total Spend (No heavy blue card) */}
        <View style={styles.spendBlock}>
          <Text style={styles.spendLabel}>TOTAL BILL</Text>
          <Text style={styles.spendValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatMoney(totalSpendCents, 'PHP')}
          </Text>
          <View style={styles.takoAside}>
            <TakoMascot size={38} mood={totalSpendCents > 0 ? 'counting' : 'waiting'} />
            <Text style={styles.takoAsideText}>
              {totalSpendCents > 0 ? 'Claims are live · update anytime' : 'Waiting for the first dish'}
            </Text>
          </View>
        </View>

        {/* Minimal People Strip */}
        <View style={styles.peopleStripWrap}>
          <Text style={styles.sectionHeader}>People</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
            {members.map((m) => {
              const avatarId = resolveAnimal(m.avatarUrl as MemojiId);
              const isPaid = m.paymentStatus === 'paid' || m.paymentStatus === 'verified';
              return (
                <View key={m.id} style={styles.personItem}>
                  <View style={styles.avatarWrap}>
                    <MemojiAvatar id={avatarId} size={42} />
                    {isPaid && <View style={styles.paidDot} />}
                  </View>
                  <Text style={styles.personName} numberOfLines={1}>
                    {m.displayName}
                  </Text>
                </View>
              );
            })}
            <Pressable
              onPress={() => router.push('/join')}
              style={({ pressed }) => [
                styles.addPersonBtn,
                pressed && { transform: [{ scale: Motion.pressScale }] },
              ]}
            >
              <Text style={styles.addPersonText}>+</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Live Receipt List */}
        <View style={styles.receiptSection}>
          <Text style={styles.sectionHeader}>Live receipt ({items.length})</Text>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <TakoMascot size={72} mood="waiting" />
              <Text style={styles.emptyTitle}>No items on the tab yet</Text>
              <Text style={styles.emptySub}>Tap the + button below to add your first dish.</Text>
            </View>
          ) : (
            items.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => router.push('/claim')}
                style={({ pressed }) => [
                  styles.itemCardWrap,
                  pressed && { transform: [{ scale: Motion.pressScale }] },
                ]}
              >
                <TicketCard
                  childrenTop={
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemSubtitle}>Added by {item.createdByName} · {item.createdAt}</Text>
                      </View>
                      <Text style={styles.itemPrice} numberOfLines={1}>
                        {formatMoney(item.priceCents, 'PHP')}
                      </Text>
                    </View>
                  }
                  childrenBottom={
                    <View style={styles.itemFooter}>
                      <Badge label={idx === 0 ? 'Claimed' : 'Tap to claim'} variant={idx === 0 ? 'emerald' : 'blue'} />
                      <Text style={styles.claimHint}>Split with friends →</Text>
                    </View>
                  }
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Dock: Your share + Pay now & Add item */}
      <View style={[styles.bottomDock, Shadows.card]}>
        <View style={styles.shareCol}>
          <Text style={styles.shareLabel}>Your share</Text>
          <Text style={styles.shareAmount} numberOfLines={1}>
            {formatMoney(myShareCents, 'PHP')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settle')}
          style={({ pressed }) => [
            styles.payPill,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <Text style={styles.payPillText}>Pay now</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/items')}
          style={({ pressed }) => [
            styles.addFab,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <Text style={styles.addFabText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  roomName: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  qrPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  spendBlock: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  spendLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  spendValue: {
    ...Typography.currencyHero,
    fontSize: 42,
    color: Colors.ink,
    marginTop: 2,
  },
  takoAside: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  takoAsideText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  peopleStripWrap: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    ...Typography.sectionTitle,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  personItem: {
    alignItems: 'center',
    width: 54,
  },
  avatarWrap: {
    position: 'relative',
  },
  paidDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.mintProgress,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  personName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 54,
  },
  addPersonBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPersonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  receiptSection: {
    marginTop: Spacing.lg,
  },
  itemCardWrap: {
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.currencyMd,
    fontSize: 16,
    color: Colors.ink,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimHint: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  shareCol: {
    flex: 1,
    minWidth: 0,
  },
  shareLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  shareAmount: {
    ...Typography.currencyMedium,
    fontSize: 18,
    color: Colors.ink,
  },
  payPill: {
    height: TouchTarget.minSize,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFabText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
});
