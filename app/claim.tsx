import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import {
  Border,
  Colors,
  Motion,
  Radii,
  Shadows,
  Spacing,
  TouchTarget,
  Typography,
} from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { NeoButton, NeoCard } from '../src/components/NeoUI';
import { TicketCard } from '../src/components/TicketCard';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../src/components/MemojiAvatar';
import { BarcodeVector } from '../src/components/BarcodeVector';
import { StaggerItem } from '../src/components/MotionPrimitives';
import { useRoomStore } from '../src/store/roomStore';
import { TakoArmSplit } from '../src/components/TakoArmSplit';
import { rebalanceSliders } from '../src/services/splitEngine';
import { formatMoney } from '../src/services/currency';
import { t } from '../src/constants/i18n';
import { playSound, triggerHaptic } from '../src/services/feedbackEngine';

const RECEIPT_ITEMS = [
  { id: 'burgers', label: 'Burgers ×4', shortName: 'Burgers', priceCents: 12000 },
  { id: 'drinks', label: 'Drinks ×6', shortName: 'Drinks', priceCents: 6000 },
  { id: 'fries', label: 'Fries ×2', shortName: 'Fries', priceCents: 3000 },
];

export default function ClaimAndAdjustModal() {
  const router = useRouter();
  const { selectedAnimal, currency, language, roundToPeso } = useRoomStore();

  const [selectedItemId, setSelectedItemId] = useState('burgers');
  const [wiggleSignal, setWiggleSignal] = useState(0);
  const [isDraggingArm, setIsDraggingArm] = useState(false);
  const [shares, setShares] = useState<
    { id: MemojiId; name: string; basisPoints: number }[]
  >([
    { id: 'you', name: 'You', basisPoints: 2500 },
    { id: 'mia', name: 'Mia', basisPoints: 2500 },
    { id: 'jonas', name: 'Jonas', basisPoints: 2500 },
    { id: 'aly', name: 'Aly', basisPoints: 2500 },
  ]);

  const activeItem =
    RECEIPT_ITEMS.find((i) => i.id === selectedItemId) ?? RECEIPT_ITEMS[0];

  const handleArmChange = (memberId: string, targetBps: number) => {
    const rebalanced = rebalanceSliders(
      shares.map((s) => ({ memberId: s.id, basisPoints: s.basisPoints })),
      memberId,
      targetBps
    );
    setShares((prev) =>
      prev.map((s) => ({
        ...s,
        basisPoints: rebalanced.find((r) => r.memberId === s.id)?.basisPoints ?? s.basisPoints,
      }))
    );
  };

  const handleResetEven = () => {
    const evenBps = Math.floor(10000 / shares.length);
    const remainder = 10000 - evenBps * shares.length;
    setShares((prev) =>
      prev.map((s, idx) => ({
        ...s,
        basisPoints: evenBps + (idx === 0 ? remainder : 0),
      }))
    );
    setWiggleSignal((n) => n + 1);
  };

  const handleConfirm = () => {
    triggerHaptic('success');
    playSound('item_add_whoosh');
    setWiggleSignal((n) => n + 1);
    router.back();
  };

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          scrollEnabled={!isDraggingArm}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
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
              Claim & adjust
            </Text>
            <View style={{ width: TouchTarget.minSize }} />
          </View>

          {/* Receipt Ticket Card */}
          <StaggerItem index={0} distance={8}>
            <TicketCard
              style={{ marginTop: Spacing.lg }}
              topStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
              bottomStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
              childrenTop={
                <View>
                  <View style={styles.receiptMetaRow}>
                    <Text style={[styles.receiptMetaText, { flex: 1, minWidth: 0 }]} numberOfLines={1}>
                      RECEIPT · FRIDAY NIGHT DINNER
                    </Text>
                    <Text style={[styles.receiptMetaText, { flexShrink: 0 }]}>#0412</Text>
                  </View>

                  <View style={{ marginTop: 8, gap: 4 }}>
                    {RECEIPT_ITEMS.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => setSelectedItemId(item.id)}
                          style={({ pressed }) => [
                            styles.receiptItemRow,
                            isSelected && styles.receiptItemRowSelected,
                            pressed && { transform: [{ scale: Motion.pressScale }] },
                          ]}
                        >
                          <Text
                            style={[
                              styles.receiptItemLabel,
                              isSelected && { color: Colors.primary },
                            ]}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.receiptItemPrice,
                              isSelected && { color: Colors.primary },
                            ]}
                            numberOfLines={1}
                          >
                            {formatMoney(item.priceCents, currency, { roundToWhole: roundToPeso })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              }
              childrenBottom={
                <View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount} numberOfLines={1}>
                      {formatMoney(21000, currency, { roundToWhole: roundToPeso })}
                    </Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <BarcodeVector height={28} />
                  </View>
                </View>
              }
            />
          </StaggerItem>

          {/* Who's sharing header */}
          <View style={styles.sharingHeader}>
            <Text style={styles.sharingTitle} numberOfLines={1}>
              Who&apos;s sharing {activeItem.shortName}
            </Text>
            <Badge label="Live" variant="emerald" />
          </View>

          {/* Tako's Arms Interactive Radial Split */}
          <View style={{ marginTop: Spacing.sm }}>
            <TakoArmSplit
              itemTitle={activeItem.shortName}
              itemPriceCents={activeItem.priceCents}
              participants={shares.map((s) => ({
                id: s.id,
                avatarId: s.id === 'you' ? selectedAnimal : s.id,
                name: s.name,
                basisPoints: s.basisPoints,
              }))}
              currency={currency}
              language={language}
              roundToPeso={roundToPeso}
              wiggleSignal={wiggleSignal}
              onDragActiveChange={setIsDraggingArm}
              onChangeShare={handleArmChange}
              onResetEven={handleResetEven}
            />
          </View>

          {/* Bottom Confirm CTA */}
          <View style={{ marginTop: Spacing.xl }}>
            <NeoButton
              label={`${t(language, 'confirmSplit')} · ${formatMoney(activeItem.priceCents, currency, { roundToWhole: roundToPeso })}`}
              onPress={handleConfirm}
              backgroundColor={Colors.primary}
              textColor="#FFFFFF"
              height={54}
              fontSize={16}
            />
          </View>
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
    gap: Spacing.md,
  },
  backBtnBox: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
    flex: 1,
    textAlign: 'center',
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: 8,
  },
  receiptMetaText: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: TouchTarget.minSize,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  receiptItemRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  receiptItemLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  receiptItemPrice: {
    ...Typography.tabular,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalAmount: {
    ...Typography.currencyLg,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.ink,
  },
  sharingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  sharingTitle: {
    flex: 1,
    minWidth: 0,
    ...Typography.sectionTitle,
  },
  sliderCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sliderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarShrink: {
    flexShrink: 0,
  },
  memberName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  memberAmount: {
    ...Typography.currencyMd,
    fontSize: 17,
    color: Colors.ink,
    minWidth: 68,
    textAlign: 'right',
    flexShrink: 0,
  },
  sliderTrackWrap: {
    position: 'relative',
    height: TouchTarget.minSize,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
