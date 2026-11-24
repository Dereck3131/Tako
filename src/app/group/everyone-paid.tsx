import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { findFirstSettlerMemberId } from '@/lib/awards';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { playSound } from '@/lib/sounds';
import { computeMemberBalances, computeSimplifiedDebts } from '@/lib/split';
import { recordSettlement } from '@/lib/takoData';
import type { Expense, ExpenseSplit, Group, GroupMember, Settlement } from '@/types/tako';

const CONFETTI_PIECES = [
  { x: -96, y: -56, rot: -28, color: '#D92D4B', size: 10, delay: 0 },
  { x: -64, y: -88, rot: 20, color: '#2EC4B6', size: 8, delay: 40 },
  { x: -28, y: -96, rot: -15, color: '#FFC857', size: 9, delay: 60 },
  { x: 24, y: -94, rot: 35, color: '#FF7A8A', size: 10, delay: 20 },
  { x: 66, y: -84, rot: -22, color: '#B9A5E8', size: 9, delay: 50 },
  { x: 96, y: -52, rot: 30, color: '#2EC4B6', size: 8, delay: 70 },
  { x: -82, y: 12, rot: 45, color: '#FFC857', size: 8, delay: 90 },
  { x: 84, y: 16, rot: -40, color: '#D92D4B', size: 9, delay: 80 },
];

function ConfettiPiece({
  piece,
  reducedMotion,
}: {
  piece: (typeof CONFETTI_PIECES)[number];
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
    );
  }, [piece.delay, progress, reducedMotion]);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3),
      transform: [
        { translateX: piece.x * t },
        { translateY: piece.y * t + 18 * t * t },
        { rotate: `${piece.rot * t}deg` },
        { scale: 0.7 + 0.3 * t },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.size * 0.65,
          borderRadius: 2.5,
          backgroundColor: piece.color,
        },
        animStyle,
      ]}
    />
  );
}

export default function EveryonePaidScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const cardElevation = getCardElevation(isDark);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    playSound('celebrate');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (!groupId || !userId) {
      return;
    }
    let cancelled = false;
    fetchAndCacheSnapshot(userId).then(({ snapshot }) => {
      if (cancelled) return;
      const foundGroup = snapshot.groups.find((g) => g.id === groupId) ?? null;
      const foundMembers = snapshot.members
        .filter((m) => m.group_id === groupId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const foundExpenses = snapshot.expenses.filter((e) => e.group_id === groupId);
      const expIdSet = new Set(foundExpenses.map((e) => e.id));
      const foundSplits = snapshot.splits.filter((s) => expIdSet.has(s.expense_id));
      const foundSettlements = snapshot.settlements.filter((st) => st.group_id === groupId);

      if (foundGroup) setGroup(foundGroup);
      setMembers(foundMembers);
      setExpenses(foundExpenses);
      setSplits(foundSplits);
      setSettlements(foundSettlements);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, userId]);

  const totalCents = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses]
  );

  const perPersonCents = useMemo(() => {
    const count = Math.max(1, members.length);
    return Math.round(totalCents / count);
  }, [members.length, totalCents]);

  const memberShareMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const sp of splits) {
      map.set(sp.member_id, (map.get(sp.member_id) ?? 0) + sp.amount_cents);
    }
    return map;
  }, [splits]);

  const hostMemberId = expenses[0]?.paid_by_member_id ?? members[0]?.id;
  const firstSettlerId = useMemo(
    () => findFirstSettlerMemberId({ members, settlements, hostMemberId }),
    [members, settlements, hostMemberId]
  );
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const remainingDebts = useMemo(() => {
    if (!groupId || members.length === 0 || expenses.length === 0) return [];
    const balances = computeMemberBalances(members, expenses, splits, settlements);
    return computeSimplifiedDebts(members, balances);
  }, [groupId, members, expenses, splits, settlements]);

  const confirmCloseAndSettle = async () => {
    if (closing) return;
    setClosing(true);
    setShowCloseConfirm(false);
    if (userId && groupId && remainingDebts.length > 0) {
      for (const d of remainingDebts) {
        await recordSettlement({
          userId,
          groupId,
          fromMemberId: d.from.id,
          toMemberId: d.to.id,
          amountCents: d.amountCents,
          note: 'Closed split',
        });
      }
    }
    setClosing(false);
    router.replace('/(tabs)');
  };

  const handleCloseSplit = () => {
    if (closing) return;
    if (remainingDebts.length > 0) {
      setShowCloseConfirm(true);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleShareSummary = async () => {
    const name = group?.name ?? 'Split';
    await Share.share({
      message: `Everyone paid for "${name}" on Tako! Total collected: ${formatPeso(totalCents)} (${members.length} of ${members.length} paid).`,
    }).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.coral} />
        </View>
      </SafeAreaView>
    );
  }

  const displayMembers = members;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}>
        <View style={styles.heroWrap}>
          <View style={styles.celebrateStage}>
            {CONFETTI_PIECES.map((piece, idx) => (
              <ConfettiPiece key={idx} piece={piece} reducedMotion={Boolean(reducedMotion)} />
            ))}
            <TakoMascot state="celebrate" size={140} interactive />
          </View>
          <Text style={[styles.title, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Everyone paid!
          </Text>
          <Text style={[styles.subtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
            {group?.name ?? 'Your split'} is fully collected.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardElevation,
          ]}>
          <View style={[styles.cardHeader, { borderBottomColor: palette.border }]}>
            <Text style={[styles.collectedTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {formatPeso(totalCents)} collected
            </Text>
            <View style={[styles.paidBadge, { backgroundColor: palette.tealSoft }]}>
              <Text style={[styles.paidBadgeText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                {displayMembers.length} of {displayMembers.length} paid
              </Text>
            </View>
          </View>

          {displayMembers.map((m, idx) => {
            const isHost = hostMemberId ? m.id === hostMemberId : idx === 0;
            const label = isHost && !m.name.includes('host') ? `${m.name} (host)` : m.name;
            const shareCents = memberShareMap.get(m.id) ?? (splits.length === 0 ? perPersonCents : 0);
            const memberSettlement = settlements.find((s) => s.from_member_id === m.id);
            const paymentCaption = isHost
              ? 'Paid upfront'
              : memberSettlement?.note || 'Recorded';
            return (
              <View
                key={m.id}
                style={[
                  styles.memberRow,
                  idx < displayMembers.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: palette.border,
                  },
                ]}>
                <View style={styles.memberLeft}>
                  <View style={[styles.avatar, { backgroundColor: m.color }]}>
                    <Text style={[styles.avatarText, { fontFamily: TakoFonts.black }]}>
                      {m.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text
                        style={[styles.memberName, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                        numberOfLines={1}>
                        {label}
                      </Text>
                      {firstSettlerId === m.id && (
                        <View style={[styles.firstCrownPill, { backgroundColor: palette.goldSoft }]}>
                          <Ionicons name="trophy" size={10} color={palette.amber} />
                          <Text
                            style={[
                              styles.firstCrownText,
                              { color: palette.amber, fontFamily: TakoFonts.bold },
                            ]}>
                            First to settle
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.memberPaymentNote, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                      numberOfLines={1}>
                      {paymentCaption}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberRight}>
                  <Text style={[styles.memberAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                    {formatPeso(shareCents)}
                  </Text>
                  <View style={[styles.checkCircle, { backgroundColor: palette.coral }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={closing ? 'Closing...' : 'Close split'}
            onPress={handleCloseSplit}
            loading={closing}
            accessibilityLabel="Close split"
          />

          <SpringPressable
            onPress={handleShareSummary}
            accessibilityRole="button"
            accessibilityLabel="Share summary"
            style={[
              styles.secondaryBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            <Ionicons name="share-outline" size={17} color={palette.ink} />
            <Text style={[styles.secondaryText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Share summary
            </Text>
          </SpringPressable>
        </View>
      </ScrollView>

      <Modal
        visible={showCloseConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCloseConfirm(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCloseConfirm(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}
            onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Unpaid balances remaining
            </Text>
            <Text style={[styles.modalBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Some members still owe balances. Close split and mark all remaining balances as settled?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCloseConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={[styles.modalCancelBtn, { borderColor: palette.border }]}>
                <Text style={[styles.modalBtnText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmCloseAndSettle}
                accessibilityRole="button"
                accessibilityLabel="Close split"
                style={[styles.modalConfirmBtn, { backgroundColor: palette.ctaBg }]}>
                <Text style={[styles.modalBtnText, { color: palette.ctaInk, fontFamily: TakoFonts.bold }]}>
                  Close split
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: 'space-between',
    gap: 22,
  },
  heroWrap: {
    alignItems: 'center',
    gap: 6,
  },
  celebrateStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.05)' },
  }),
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  collectedTitle: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  paidBadgeText: {
    fontSize: 11,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  memberLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  firstCrownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  firstCrownText: {
    fontSize: 10,
  },
  memberPaymentNote: {
    fontSize: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2B1B3D',
    fontSize: 12,
  },
  memberName: {
    fontSize: 14,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberAmt: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: Radii.pill,
    minHeight: 52,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 50,
    paddingVertical: 14,
  },
  secondaryText: {
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 20, 36, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
  },
});
