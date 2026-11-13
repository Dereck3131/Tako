import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Motion, Radii, Shadows, Spacing, TouchTarget, Typography } from '../../constants/theme';
import { Badge } from '../Badge';
import { MemojiAvatar, MemojiId, resolveAnimal } from '../MemojiAvatar';
import { TakoMascot } from '../TakoMascot';
import { formatMoney } from '../../services/currency';
import { RoomPrototypeMockData } from './mockData';

interface Props {
  data: RoomPrototypeMockData;
}

export function VariantCOrbit({ data }: Props) {
  const router = useRouter();
  const { room, members, items, myShareCents, totalSpendCents } = data;
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const RING_SIZE = 240;
  const CENTER = RING_SIZE / 2;
  const ORBIT_RADIUS = 88;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.roomSub}>Tako's Orbit Table · PIN {room.pinHash}</Text>
        </View>
        <Badge label="Orbit" variant="blue" />
      </View>

      {/* Orbit Arena */}
      <View style={styles.orbitArena}>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={ORBIT_RADIUS}
              fill="none"
              stroke={Colors.border}
              strokeWidth={1.5}
              strokeDasharray="4 6"
            />
          </Svg>

          {/* Central Tako Mascot */}
          <View style={styles.centerTakoBox}>
            <TakoMascot size={90} mood={totalSpendCents > 0 ? 'happy' : 'waiting'} />
          </View>

          {/* Orbiting Friends around the table */}
          {members.slice(0, 7).map((m, idx) => {
            const count = Math.min(8, members.length + 1);
            const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
            const x = CENTER + Math.cos(angle) * ORBIT_RADIUS;
            const y = CENTER + Math.sin(angle) * ORBIT_RADIUS;
            const isPaid = m.paymentStatus === 'paid' || m.paymentStatus === 'verified';

            return (
              <View
                key={m.id}
                style={[
                  styles.orbitAvatarWrap,
                  {
                    left: x - 20,
                    top: y - 20,
                  },
                ]}
              >
                <MemojiAvatar id={resolveAnimal(m.avatarUrl as MemojiId)} size={40} />
                {isPaid && <View style={styles.orbitPaidDot} />}
              </View>
            );
          })}

          {/* Plus seat for joining/inviting */}
          {(() => {
            const count = Math.min(8, members.length + 1);
            const plusIdx = Math.min(members.length, 7);
            const angle = (plusIdx / count) * Math.PI * 2 - Math.PI / 2;
            const x = CENTER + Math.cos(angle) * ORBIT_RADIUS;
            const y = CENTER + Math.sin(angle) * ORBIT_RADIUS;

            return (
              <Pressable
                onPress={() => router.push('/join')}
                style={({ pressed }) => [
                  styles.plusSeat,
                  { left: x - 18, top: y - 18 },
                  pressed && { transform: [{ scale: Motion.pressScale }] },
                ]}
              >
                <Text style={styles.plusSeatText}>+</Text>
              </Pressable>
            );
          })()}
        </View>

        {/* Total Spend Beneath Orbit Ring */}
        <View style={styles.orbitTotalBlock}>
          <Text style={styles.orbitSpendLabel}>CURRENT TOTAL</Text>
          <Text style={styles.orbitSpendValue} numberOfLines={1}>
            {formatMoney(totalSpendCents, 'PHP')}
          </Text>
        </View>
      </View>

      {/* Pull-Up Bottom Sheet for Receipt and Pay */}
      <View style={[styles.bottomSheet, sheetExpanded && styles.bottomSheetExpanded, Shadows.card]}>
        <Pressable
          onPress={() => setSheetExpanded(!sheetExpanded)}
          style={styles.sheetHandleArea}
        >
          <View style={styles.sheetHandleBar} />
          <View style={styles.sheetHeaderRow}>
            <View>
              <Text style={styles.sheetTitle}>Receipt ({items.length} dishes)</Text>
              <Text style={styles.sheetSub}>
                Your share: <Text style={styles.sheetShareBold}>{formatMoney(myShareCents, 'PHP')}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settle')}
              style={({ pressed }) => [
                styles.sheetPayBtn,
                pressed && { transform: [{ scale: Motion.pressScale }] },
              ]}
            >
              <Text style={styles.sheetPayBtnText}>Pay now</Text>
            </Pressable>
          </View>
        </Pressable>

        {sheetExpanded && (
          <View style={styles.expandedContent}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push('/claim')}
                style={styles.sheetItemRow}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sheetItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sheetItemMeta}>Added by {item.createdByName}</Text>
                </View>
                <Text style={styles.sheetItemPrice}>{formatMoney(item.priceCents, 'PHP')}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  orbitArena: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  ringWrap: {
    width: 240,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTakoBox: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitAvatarWrap: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  orbitPaidDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.mintProgress,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  plusSeat: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusSeatText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  orbitTotalBlock: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  orbitSpendLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  orbitSpendValue: {
    ...Typography.currencyHero,
    fontSize: 32,
    color: Colors.ink,
    marginTop: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: 10,
    paddingBottom: 28,
  },
  bottomSheetExpanded: {
    maxHeight: 360,
  },
  sheetHandleArea: {
    alignItems: 'center',
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  sheetHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  sheetSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sheetShareBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  sheetPayBtn: {
    height: TouchTarget.minSize,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandedContent: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: 8,
  },
  sheetItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  sheetItemMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sheetItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
