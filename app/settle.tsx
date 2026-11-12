import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Colors,
  Motion,
  Radii,
  Spacing,
  TouchTarget,
  Typography,
} from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { NeoButton, NeoCard } from '../src/components/NeoUI';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { TakoMascot, getTakoMood, getTakoMoodCopy } from '../src/components/TakoMascot';
import { SettlementHero } from '../src/components/SettlementHero';
import { StaggerItem } from '../src/components/MotionPrimitives';
import { useRoomStore } from '../src/store/roomStore';
import { calculatePHBillBreakdown, formatMoney } from '../src/services/currency';
import { t } from '../src/constants/i18n';
import { playSound, triggerHaptic } from '../src/services/feedbackEngine';
import { PaymentMethod } from '../src/types/database';

export default function SettleUpScreen() {
  const router = useRouter();
  const {
    currentRoom,
    members,
    items,
    shares,
    currency,
    language,
    roundToPeso,
    serviceChargeBps,
    vatBps,
    setPaymentStatus,
  } = useRoomStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const youMember = members.find((m) => m.id === 'member-you');
  const myStatus = youMember?.paymentStatus ?? 'pending';
  const hasPaidSelf = myStatus === 'paid' || myStatus === 'verified';

  const subtotalCents = 5250;
  const breakdown = calculatePHBillBreakdown(subtotalCents, serviceChargeBps, vatBps);

  const owingMembers = members.filter((m) => m.totalOwedCents > 0);
  const paidCount = owingMembers.filter(
    (m) => m.paymentStatus === 'paid' || m.paymentStatus === 'verified'
  ).length;
  const takoMood = getTakoMood(members, items, shares);
  const moodCopy = getTakoMoodCopy(takoMood, language, paidCount, owingMembers.length);

  const handlePayWithMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    triggerHaptic('success');
    playSound('pay_coin');
    setPaymentStatus('member-you', 'paid', method);
  };

  const handlePayNow = () => {
    handlePayWithMethod(selectedMethod);
  };

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <NeoCard
                onPress={() => router.back()}
                accessibilityLabel="Back"
                borderRadius={Radii.pill}
                contentStyle={styles.backBtnBox}
              >
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={Colors.ink}
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="m15 5-7 7 7 7" />
                </Svg>
              </NeoCard>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Settle up
              </Text>
            </View>
            <Badge label="4 in the room" variant="emerald" />
          </View>

          {/* YOUR PLATE Card */}
          <StaggerItem index={0} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.plateContent}
            >
              <Text style={styles.sectionLabel}>YOUR PLATE</Text>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Burgers
                  <Text style={styles.platePct}> 25% of {formatMoney(12000, currency, { roundToWhole: roundToPeso })}</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  {formatMoney(3000, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Drinks
                  <Text style={styles.platePct}> 25% of {formatMoney(6000, currency, { roundToWhole: roundToPeso })}</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  {formatMoney(1500, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Fries
                  <Text style={styles.platePct}> 25% of {formatMoney(3000, currency, { roundToWhole: roundToPeso })}</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  {formatMoney(750, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>

              {/* PH Service Charge & VAT breakdown */}
              <View style={[styles.plateRow, styles.taxDividerRow]}>
                <Text style={styles.platePct}>{t(language, 'serviceCharge')} ({serviceChargeBps / 100}%)</Text>
                <Text style={styles.platePrice}>
                  {formatMoney(breakdown.serviceChargeCents, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>
              <View style={styles.plateRow}>
                <Text style={styles.platePct}>{t(language, 'vat')}</Text>
                <Text style={styles.platePrice}>
                  {formatMoney(breakdown.vatCents, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>
              <View style={styles.plateRow}>
                <Text style={styles.plateItem}>{t(language, 'totalWithTax')}</Text>
                <Text style={styles.platePrice}>
                  {formatMoney(breakdown.totalCents, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>
            </NeoCard>
          </StaggerItem>

          {/* THE ROOM Card */}
          <StaggerItem index={1} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.roomContent}
            >
              <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>
                THE ROOM
              </Text>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="mia" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Mia
                </Text>
                <Badge label="Paid" variant="emerald" />
              </View>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="jonas" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Jonas
                </Text>
                <Badge label="Paid" variant="emerald" />
              </View>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="aly" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Aly
                </Text>
                <Badge
                  label={hasPaidSelf ? 'Paid' : 'Pending'}
                  variant={hasPaidSelf ? 'emerald' : 'amber'}
                />
              </View>
            </NeoCard>
          </StaggerItem>

          {/* Peeking Tako Mascot + Dark Navy Settlement Hero */}
          <StaggerItem index={2} distance={10}>
            <View style={styles.heroWrap}>
              <View style={styles.takoPeek} pointerEvents="none">
                <TakoMascot size={92} mood={takoMood} />
              </View>
              <SettlementHero
                amountCents={breakdown.totalCents}
                splitWays={4}
                roomTitle={currentRoom.title}
                onPayNow={handlePayNow}
                hasPaid={hasPaidSelf}
              />
            </View>
            <Text style={styles.moodCaption}>{moodCopy}</Text>
          </StaggerItem>

          {/* Local Payment Methods + States (pending | paid | failed | refunded) */}
          <StaggerItem index={3} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.methodsContent}
            >
              <View style={styles.methodsHeader}>
                <Text style={styles.sectionLabel}>PAYMENT OPTIONS</Text>
                <Badge
                  label={
                    myStatus === 'paid' || myStatus === 'verified'
                      ? t(language, 'paid')
                      : myStatus === 'failed'
                      ? t(language, 'failed')
                      : myStatus === 'refunded'
                      ? t(language, 'refunded')
                      : t(language, 'pending')
                  }
                  variant={
                    myStatus === 'paid' || myStatus === 'verified'
                      ? 'emerald'
                      : myStatus === 'refunded'
                      ? 'blue'
                      : 'amber'
                  }
                />
              </View>

              <View style={styles.methodsGrid}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePayWithMethod('gcash')}
                  style={({ pressed }) => [
                    styles.methodBtn,
                    selectedMethod === 'gcash' && styles.methodBtnActive,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.methodBtnText}>{t(language, 'payWithGCash')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePayWithMethod('maya')}
                  style={({ pressed }) => [
                    styles.methodBtn,
                    selectedMethod === 'maya' && styles.methodBtnActive,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.methodBtnText}>{t(language, 'payWithMaya')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePayWithMethod('cash')}
                  style={({ pressed }) => [
                    styles.methodBtn,
                    selectedMethod === 'cash' && styles.methodBtnActive,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                >
                  <Text style={styles.methodBtnText}>{t(language, 'markPaidCash')}</Text>
                </Pressable>
              </View>

              {hasPaidSelf && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    triggerHaptic('warning');
                    setPaymentStatus('member-you', 'refunded', selectedMethod);
                  }}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>{t(language, 'markRefunded')}</Text>
                </Pressable>
              )}

              <NeoButton
                label={t(language, 'viewRecap')}
                onPress={() => router.push('/recap')}
                backgroundColor={Colors.primaryLight}
                textColor={Colors.primary}
                borderColor="transparent"
                height={TouchTarget.minSize}
                fontSize={14}
              />
            </NeoCard>
          </StaggerItem>
        </ScrollView>
      </SafeAreaView>
    </DotGridBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtnBox: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.screenTitle,
    flex: 1,
    minWidth: 0,
  },
  plateContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 8,
  },
  sectionLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  plateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  plateItem: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  platePct: {
    fontWeight: '500',
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  platePrice: {
    ...Typography.currencyMd,
    fontSize: 16,
    color: Colors.ink,
    flexShrink: 0,
  },
  roomContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 10,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 8,
  },
  avatarShrink: {
    flexShrink: 0,
  },
  roomName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  taxDividerRow: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
  },
  moodCaption: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  methodsContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  methodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodsGrid: {
    gap: Spacing.sm,
  },
  methodBtn: {
    minHeight: TouchTarget.minSize,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  methodBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  methodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  secondaryAction: {
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heroWrap: {
    marginTop: 56,
    position: 'relative',
  },
  takoPeek: {
    position: 'absolute',
    right: 20,
    top: -58,
    zIndex: 0,
  },
});
