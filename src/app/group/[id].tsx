import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPeso } from '@/components/AnimatedPeso';
import { FieldError } from '@/components/FieldError';
import { LegendAvatarFrame } from '@/components/LegendAvatarFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton, SplitRowSkeleton } from '@/components/Skeleton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { useToast } from '@/components/Toast';
import { MemberPalette, Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { computeUserAwards, isLegendPreviewEnabled } from '@/lib/awards';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { playSound } from '@/lib/sounds';
import { computeMemberBalances, computeSimplifiedDebts } from '@/lib/split';
import {
  addMemberAndRebalance,
  deleteExpense,
  fetchAllReminders,
  sendReminder,
  unmarkMemberPaid,
} from '@/lib/takoData';
import type {
  Expense,
  ExpenseSplit,
  Group,
  GroupMember,
  Settlement,
} from '@/types/tako';

export default function GroupDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<'items' | 'people'>(
    tab === 'people' ? 'people' : 'items'
  );
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isUserLegend, setIsUserLegend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const payingMemberRef = useRef<Set<string>>(new Set());
  const remindCooldownRef = useRef<Record<string, number>>({});

  const loadData = useCallback(async () => {
    if (!id || !user?.id) return;

    const [{ snapshot }, reminders] = await Promise.all([
      fetchAndCacheSnapshot(user.id),
      fetchAllReminders(user.id),
    ]);
    const awards = computeUserAwards({
      userId: user.id,
      groups: snapshot.groups,
      members: snapshot.members,
      expenses: snapshot.expenses,
      splits: snapshot.splits,
      settlements: snapshot.settlements,
      reminders,
    });
    setIsUserLegend(awards.isLegend || isLegendPreviewEnabled());
    const foundGroup = snapshot.groups.find((g) => g.id === id) ?? null;
    const foundMembers = snapshot.members
      .filter((m) => m.group_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const foundExpenses = snapshot.expenses
      .filter((e) => e.group_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const expIdSet = new Set(foundExpenses.map((e) => e.id));
    const foundSplits = snapshot.splits.filter((s) => expIdSet.has(s.expense_id));
    const foundSettlements = snapshot.settlements
      .filter((st) => st.group_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (foundGroup) setGroup(foundGroup);
    setMembers(foundMembers);
    setExpenses(foundExpenses);
    setSplits(foundSplits);
    setSettlements(foundSettlements);

    setLoading(false);
    setRefreshing(false);
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const balances = useMemo(
    () => computeMemberBalances(members, expenses, splits, settlements),
    [members, expenses, splits, settlements]
  );

  const debts = useMemo(
    () => computeSimplifiedDebts(members, balances),
    [members, balances]
  );

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const totalSpentCents = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses]
  );

  const perPersonCents = useMemo(() => {
    if (members.length === 0 || totalSpentCents === 0) return 0;
    return Math.round(totalSpentCents / members.length);
  }, [members.length, totalSpentCents]);

  const myMember = useMemo(
    () => members.find((m) => m.user_id === user?.id) ?? members[members.length - 1],
    [members, user?.id]
  );

  const myDebt = useMemo(() => {
    if (!myMember) return null;
    return debts.find((d) => d.from.id === myMember.id) ?? null;
  }, [debts, myMember]);

  const hostMember = useMemo(() => {
    if (expenses.length > 0) {
      const payer = memberMap.get(expenses[0].paid_by_member_id);
      if (payer) return payer;
    }
    return members[0] ?? null;
  }, [expenses, memberMap, members]);

  const memberShareMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const sp of splits) {
      map.set(sp.member_id, (map.get(sp.member_id) ?? 0) + sp.amount_cents);
    }
    return map;
  }, [splits]);

  // Compute each member's payment status for the Collect / People view (Screen C6)
  const peopleStatus = useMemo(() => {
    return members.map((m, idx) => {
      const isHost = hostMember ? m.id === hostMember.id : idx === 0;
      const memberSettlement = settlements.find((s) => s.from_member_id === m.id);
      const netBalance = balances[m.id] ?? 0;
      const shareCents = memberShareMap.get(m.id) ?? (splits.length === 0 ? perPersonCents : 0);
      const isPaid = isHost || !!memberSettlement || netBalance >= -1;

      let subtitle = `${formatPeso(shareCents)} · due`;
      if (isHost) {
        subtitle = `${formatPeso(shareCents)} · paid upfront`;
      } else if (memberSettlement) {
        subtitle = `${formatPeso(shareCents)} · ${memberSettlement.note || 'Recorded'}`;
      } else if (isPaid) {
        subtitle = `${formatPeso(shareCents)} · settled`;
      } else if (m.user_id !== user?.id) {
        subtitle = `${formatPeso(shareCents)} · hasn't paid yet`;
      }

      return {
        member: m,
        isHost,
        isPaid,
        settlement: memberSettlement ?? null,
        shareCents,
        owedCents: netBalance < -1 ? -netBalance : 0,
        subtitle,
      };
    });
  }, [balances, hostMember, memberShareMap, members, perPersonCents, settlements, splits.length, user?.id]);

  const collectedCents = useMemo(() => {
    if (totalSpentCents <= 0) return 0;
    const paidShares = peopleStatus
      .filter((p) => p.isPaid)
      .reduce((sum, p) => sum + p.shareCents, 0);
    return Math.min(totalSpentCents, paidShares);
  }, [peopleStatus, totalSpentCents]);

  const progressRatio = useMemo(() => {
    if (totalSpentCents <= 0) return 0;
    return Math.min(1, Math.max(0, collectedCents / totalSpentCents));
  }, [collectedCents, totalSpentCents]);

  const firstPendingPerson = useMemo(
    () => peopleStatus.find((p) => !p.isPaid && p.member.user_id !== user?.id) ?? peopleStatus.find((p) => !p.isPaid),
    [peopleStatus, user?.id]
  );

  const handleMarkMemberPaid = (member: GroupMember, owedCents: number) => {
    if (!group || !hostMember || !user || member.id === hostMember.id) return;
    if (owedCents <= 0) {
      showToast({ message: 'Nothing is owed for this member.' });
      return;
    }

    router.push({
      pathname: '/group/settle-up',
      params: {
        groupId: group.id,
        amountCents: String(owedCents),
        payerName: member.name,
        recipientName: hostMember.name,
        splitName: group.name,
        fromMemberId: member.id,
        toMemberId: hostMember.id,
        returnToGroup: '1',
      },
    });
  };

  const handleUnmarkMemberPaid = async (member: GroupMember) => {
    if (!group || !hostMember || !user || member.id === hostMember.id) return;
    if (payingMemberRef.current.has(member.id)) return;
    payingMemberRef.current.add(member.id);
    const res = await unmarkMemberPaid({
      userId: user.id,
      groupId: group.id,
      fromMemberId: member.id,
    });
    payingMemberRef.current.delete(member.id);

    if (!res.ok) {
      showToast({ message: res.error, tone: 'error' });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    await loadData();
    showToast({ message: `Marked ${member.name} as unpaid` });
  };

  const handleRemind = async (member: GroupMember, owedCents: number) => {
    if (!group || !user) return;
    const now = Date.now();
    const lastTs = remindCooldownRef.current[member.id] ?? 0;
    const cooldownMs = 60 * 60 * 1000;
    if (now - lastTs < cooldownMs) {
      const minsLeft = Math.max(1, Math.ceil((cooldownMs - (now - lastTs)) / 60_000));
      showToast({
        message: `You already reminded ${member.name} recently. Try again in ${minsLeft}m.`,
      });
      return;
    }

    const senderName =
      hostMember?.name ||
      members.find((m) => m.user_id === user.id)?.name ||
      'A friend';
    const amountText = formatPeso(owedCents);
    const inAppMessage = `${senderName} reminded you: ${amountText} for ${group.name}`;
    const shareMessage = `Hey ${member.name}! Quick Tako reminder: your share for "${group.name}" is ${amountText}. Check or join with code ${group.invite_code}.`;

    remindCooldownRef.current[member.id] = now;
    playSound('nudge');

    // 1. Save in-app reminder in Supabase so Tako notifies them on their Home & Alerts tabs
    const res = await sendReminder({
      groupId: group.id,
      fromUserId: user.id,
      toMemberId: member.id,
      toUserId: member.user_id,
      amountCents: owedCents,
      message: inAppMessage,
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await Share.share({ message: shareMessage }).catch(() => {});
      showToast({
        message: res.ok
          ? `Reminded ${member.name} in Tako`
          : `Opened share reminder for ${member.name}`,
        tone: 'success',
      });
      return;
    }

    // Web: copy pre-filled reminder text to clipboard if available
    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareMessage);
        copied = true;
      } catch {
        copied = false;
      }
    }

    showToast({
      message:
        res.ok && copied
          ? `Reminded ${member.name} in Tako & copied message`
          : res.ok
            ? `Reminded ${member.name} in Tako`
            : copied
              ? `Copied reminder message for ${member.name}`
              : `Reminder ready for ${member.name}`,
      tone: 'success',
    });
  };

  const handleAddMember = async () => {
    if (!group || addingMember) return;
    setAddMemberError(null);
    setAddingMember(true);
    const color = MemberPalette[members.length % MemberPalette.length];
    const res = await addMemberAndRebalance({
      userId: user?.id,
      groupId: group.id,
      rawName: newMemberName,
      existingNames: members.map((m) => m.name),
      existingMemberIds: members.map((m) => m.id),
      color,
      equalExpenses: expenses
        .filter((e) => e.split_type === 'equal')
        .map((e) => ({ id: e.id, amount_cents: e.amount_cents })),
    });
    setAddingMember(false);

    if (!res.ok) {
      setAddMemberError(res.error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setNewMemberName('');
    setShowAddMember(false);
    await loadData();
  };

  const handleDeleteExpense = async (exp: Expense) => {
    if (!group || !user) return;
    const prevExpenses = expenses;
    setExpenses((curr) => curr.filter((e) => e.id !== exp.id));
    const res = await deleteExpense({
      userId: user.id,
      groupId: group.id,
      expenseId: exp.id,
    });
    if (!res.ok) {
      setExpenses(prevExpenses);
      showToast({ message: res.error, tone: 'error' });
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    await loadData();
    showToast({
      message: res.queuedOffline
        ? `Removed "${exp.title}" (queued to sync)`
        : `Removed "${exp.title}"`,
    });
  };

  const handleShareCode = async () => {
    if (!group) return;
    await Share.share({
      message: `Join "${group.name}" on Tako! Code: TAKO-${group.invite_code}`,
    }).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <View style={styles.skeletonPage}>
          <Skeleton height={44} borderRadius={Radii.lg} />
          <Skeleton height={124} borderRadius={Radii.xl} />
          <Skeleton height={86} borderRadius={Radii.xl} />
          <SplitRowSkeleton />
          <SplitRowSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <View style={styles.center}>
          <TakoMascot state="think" size={140} />
          <Text style={[styles.emptyTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Split not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.pillBtn, { backgroundColor: palette.chip }]}>
            <Text style={[styles.pillBtnText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const cardShadow = getCardElevation(isDark);

  const settleAmountCents = myDebt?.amountCents ?? 0;
  const settleRecipientName = myDebt?.to.name || hostMember?.name || 'Host';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </Pressable>

        <Text
          style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}
          numberOfLines={1}>
          {group.name}
        </Text>

        <Pressable
          onPress={handleShareCode}
          accessibilityRole="button"
          accessibilityLabel="Share split code"
          style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="share-outline" size={18} color={palette.ink} />
        </Pressable>
      </View>

      {/* Mode Switcher between Screen C5 (Items) and Screen C6 (People / Collect) */}
      <View style={styles.modeSwitchWrap}>
        <SegmentedControl
          options={[
            { key: 'items', label: 'Items & split' },
            {
              key: 'people',
              label: `Collected (${peopleStatus.filter((p) => p.isPaid).length}/${members.length})`,
            },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={palette.coralAccent}
          />
        }>
        {viewMode === 'items' ? (
          <>
            {/* Screen C5: Total Bill Card */}
            <View
              style={[
                styles.totalCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
                cardShadow,
              ]}>
              <Text style={[styles.totalLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Total bill
              </Text>
              <AnimatedPeso
                cents={totalSpentCents}
                style={[styles.totalAmount, { color: palette.ink, fontFamily: TakoFonts.black }]}
              />

              <View style={styles.membersSummaryRow}>
                <View style={styles.avatarStack}>
                  {members.slice(0, 5).map((m, idx) => (
                    <View
                      key={m.id}
                      style={[
                        styles.memberCircle,
                        {
                          backgroundColor: m.color,
                          marginLeft: idx === 0 ? 0 : -8,
                          borderColor: palette.surface,
                        },
                      ]}>
                      <Text style={[styles.memberInitial, { fontFamily: TakoFonts.black }]}>
                        {m.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                  <SpringPressable
                    onPress={() => setShowAddMember(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add friend"
                    style={[styles.addFriendChip, { backgroundColor: palette.coralSoft }]}>
                    <Ionicons name="add" size={14} color={palette.coralAccent} />
                    <Text style={[styles.addFriendChipText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                      Add
                    </Text>
                  </SpringPressable>
                </View>
                <Text
                  style={[styles.joinedMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                  numberOfLines={1}>
                  {members.length} joined · {formatPeso(perPersonCents)} each
                </Text>
              </View>
            </View>

            {/* Invite Friends QR Card (shown only when bottom CTA is Settle up, to avoid duplicate QR buttons) */}
            {myDebt && settleAmountCents > 0 && (
              <SpringPressable
                onPress={() =>
                  router.push({
                    pathname: '/group/split-ready',
                    params: { groupId: group.id },
                  })
                }
                style={[styles.inviteCard, { backgroundColor: palette.coralSoft }]}>
                <View style={styles.qrPreviewBox}>
                  <Ionicons name="qr-code" size={42} color={palette.plum} />
                </View>
                <View style={styles.inviteCopy}>
                  <Text style={[styles.inviteTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                    Invite friends
                  </Text>
                  <Text style={[styles.inviteBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                    Show this QR so friends can join the split.
                  </Text>
                </View>
              </SpringPressable>
            )}

            {/* Items Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Items
              </Text>
              <View style={styles.sectionHeaderActions}>
                <Pressable
                  onPress={() => {
                    if (settlements.length > 0) {
                      showToast({
                        message: 'Note: editing items will recalculate balances for existing payments.',
                      });
                    }
                    router.push({
                      pathname: '/group/who-had-what',
                      params: { groupId: group.id },
                    });
                  }}>
                  <Text style={[styles.addLink, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                    Who had what?
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/group/add-expense',
                      params: { groupId: group.id },
                    })
                  }>
                  <Text style={[styles.addLink, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                    + Add item
                  </Text>
                </Pressable>
              </View>
            </View>

            {expenses.length === 0 ? (
              <View
                style={[
                  styles.itemsCard,
                  { backgroundColor: palette.surface, borderColor: palette.border, padding: 20 },
                ]}>
                <Text style={[styles.emptyFeedText, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                  No items yet. Tap “+ Add item” above to log an expense.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.itemsCard,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                  cardShadow,
                ]}>
                {expenses.map((exp, idx) => {
                  const payer = memberMap.get(exp.paid_by_member_id);
                  const expSplits = splits.filter((s) => s.expense_id === exp.id);
                  const splitNames =
                    expSplits.length >= members.length || expSplits.length === 0
                      ? 'Shared by all'
                      : expSplits
                          .map((s) => memberMap.get(s.member_id)?.name)
                          .filter(Boolean)
                          .join(', ') || `Paid by ${payer?.name ?? 'Someone'}`;

                  return (
                    <Swipeable
                      key={exp.id}
                      overshootRight={false}
                      renderRightActions={() => (
                        <Pressable
                          onPress={() => handleDeleteExpense(exp)}
                          style={[styles.swipeDelete, { backgroundColor: palette.destructive }]}>
                          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                        </Pressable>
                      )}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/group/who-had-what',
                            params: { groupId: group.id },
                          })
                        }
                        style={[
                          styles.itemRow,
                          { backgroundColor: palette.surface },
                          idx < expenses.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                          },
                        ]}>
                        <View style={styles.itemInfo}>
                          <Text
                            style={[styles.itemTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                            numberOfLines={1}>
                            {exp.title}
                          </Text>
                          <Text
                            style={[styles.itemSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                            numberOfLines={1}>
                            {splitNames}
                          </Text>
                        </View>
                        <Text style={[styles.itemAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                          {formatPeso(exp.amount_cents)}
                        </Text>
                      </Pressable>
                    </Swipeable>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Screen C6: Collected Progress Card */}
            <View
              style={[
                styles.totalCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
                cardShadow,
              ]}>
              <Text style={[styles.totalLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Collected
              </Text>
              <View style={styles.collectedAmtRow}>
                <Text style={[styles.totalAmount, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                  {formatPeso(collectedCents)}
                </Text>
                <Text style={[styles.collectedOf, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                  of {formatPeso(totalSpentCents)}
                </Text>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: palette.coralSoft }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: palette.coral,
                      width: `${Math.max(8, Math.round(progressRatio * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* PEOPLE Section */}
            <Text style={[styles.peopleSectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              PEOPLE
            </Text>

            <View
              style={[
                styles.itemsCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
                cardShadow,
              ]}>
              {peopleStatus.map((row, idx) => {
                const displayName = row.isHost ? `${row.member.name} (host)` : row.member.name;
                const showLegend = isUserLegend && row.member.user_id === user?.id;
                return (
                  <View
                    key={row.member.id}
                    style={[
                      styles.personStatusRow,
                      idx < peopleStatus.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: palette.border,
                      },
                    ]}>
                    <LegendAvatarFrame active={showLegend} size={38} ringThickness={2.5} gap={2}>
                      <View
                        style={[
                          styles.personAvatar,
                          { backgroundColor: row.member.color },
                        ]}>
                        <Text style={[styles.personAvatarText, { fontFamily: TakoFonts.black }]}>
                          {row.member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </LegendAvatarFrame>

                    <View style={styles.itemInfo}>
                      <View style={styles.personNameRow}>
                        <Text
                          style={[styles.itemTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                          numberOfLines={1}>
                          {displayName}
                        </Text>
                        {showLegend && (
                          <View
                            style={[
                              styles.legendTag,
                              { backgroundColor: palette.goldSoft, borderColor: palette.gold },
                            ]}>
                            <Ionicons name="trophy" size={10} color={palette.amber} />
                            <Text
                              style={[
                                styles.legendTagText,
                                { color: palette.amber, fontFamily: TakoFonts.black },
                              ]}>
                              Tako Legend
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.itemSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                        numberOfLines={1}>
                        {row.subtitle}
                      </Text>
                    </View>

                    {row.isHost ? (
                      <View style={[styles.statusBadge, { backgroundColor: palette.tealSoft }]}>
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: palette.teal, fontFamily: TakoFonts.bold },
                          ]}>
                          Paid
                        </Text>
                      </View>
                    ) : row.isPaid ? (
                      <SpringPressable
                        onPress={() => {
                          if (row.settlement && group && hostMember) {
                            router.push({
                              pathname: '/group/settle-up',
                              params: {
                                groupId: group.id,
                                amountCents: String(row.settlement.amount_cents || row.shareCents),
                                payerName: row.member.name,
                                recipientName: hostMember.name,
                                splitName: group.name,
                                fromMemberId: row.member.id,
                                toMemberId: hostMember.id,
                                returnToGroup: '1',
                                settlementId: row.settlement.id,
                                existingNote: row.settlement.note ?? '',
                              },
                            });
                          } else {
                            handleUnmarkMemberPaid(row.member);
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`View or edit ${row.member.name}'s payment record`}
                        style={[
                          styles.paidActionBtn,
                          {
                            backgroundColor: palette.tealSoft,
                            borderColor: palette.teal,
                            borderWidth: 1,
                          },
                        ]}>
                        <Ionicons name="checkmark" size={14} color={palette.teal} />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: palette.teal, fontFamily: TakoFonts.bold },
                          ]}>
                          Paid
                        </Text>
                      </SpringPressable>
                    ) : (
                      <SpringPressable
                        onPress={() => handleMarkMemberPaid(row.member, row.owedCents)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${row.member.name} as paid`}
                        style={[styles.paidActionBtn, { backgroundColor: palette.ctaBg }]}>
                        <Ionicons name="checkmark-circle-outline" size={15} color={palette.ctaInk} />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: palette.ctaInk, fontFamily: TakoFonts.bold },
                          ]}>
                          Mark paid
                        </Text>
                      </SpringPressable>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Primary CTA */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        {viewMode === 'people' ? (
          firstPendingPerson ? (
            <PrimaryButton
              label={`Remind ${firstPendingPerson.member.name}`}
              icon="notifications-outline"
              onPress={() => handleRemind(firstPendingPerson.member, firstPendingPerson.owedCents)}
            />
          ) : (
            <PrimaryButton
              label="Everyone paid! View summary"
              onPress={() =>
                router.push({
                  pathname: '/group/everyone-paid',
                  params: { groupId: group.id },
                })
              }
            />
          )
        ) : myDebt && settleAmountCents > 0 ? (
          <PrimaryButton
            label={`Settle up · ${formatPeso(settleAmountCents)}`}
            onPress={() =>
              router.push({
                pathname: '/group/settle-up',
                params: {
                  groupId: group.id,
                  amountCents: String(settleAmountCents),
                  recipientName: settleRecipientName,
                  splitName: group.name,
                  fromMemberId: myDebt.from.id,
                  toMemberId: myDebt.to.id,
                },
              })
            }
          />
        ) : (
          <PrimaryButton
            label="Share QR to invite"
            icon="qr-code-outline"
            onPress={() =>
              router.push({
                pathname: '/group/split-ready',
                params: { groupId: group.id },
              })
            }
          />
        )}
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMember(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Add Friend
              </Text>
              <Pressable onPress={() => setShowAddMember(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <TextInput
              value={newMemberName}
              onChangeText={(t) => {
                setNewMemberName(t);
                if (addMemberError) setAddMemberError(null);
              }}
              placeholder="Friend's name"
              placeholderTextColor={palette.mute}
              maxLength={30}
              autoFocus
              onSubmitEditing={handleAddMember}
              style={[
                styles.input,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />
            <FieldError message={addMemberError} />

            <PrimaryButton
              label="Add to split"
              onPress={handleAddMember}
              loading={addingMember}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonPage: {
    padding: 20,
    gap: 14,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    paddingHorizontal: 10,
  },
  modeSwitchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modeSegment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radii.pill,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  modeBtnActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#2B1B3D',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(43, 27, 61, 0.08)' },
    }),
  },
  modeBtnText: {
    fontSize: 13,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 104,
    gap: 16,
  },
  totalCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  totalLabel: { fontSize: 13 },
  totalAmount: { fontSize: 32, fontVariant: ['tabular-nums'] },
  collectedAmtRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  collectedOf: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  membersSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    color: '#2B1B3D',
    fontSize: 11,
  },
  addFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: Radii.pill,
    marginLeft: 6,
  },
  addFriendChipText: {
    fontSize: 12,
  },
  joinedMeta: {
    flex: 1,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  inviteCard: {
    borderRadius: Radii.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrPreviewBox: {
    width: 60,
    height: 60,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCopy: {
    flex: 1,
    gap: 2,
  },
  inviteTitle: {
    fontSize: 15,
  },
  inviteBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
  },
  peopleSectionLabel: {
    fontSize: 12,
    letterSpacing: 1.1,
    marginTop: 4,
  },
  addLink: {
    fontSize: 13,
  },
  itemsCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyFeedText: {
    fontSize: 14,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  personStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  legendTagText: {
    fontSize: 10,
  },
  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    color: '#2B1B3D',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  paidActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: Radii.pill,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  swipeDelete: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
  },
  itemSub: {
    fontSize: 12,
  },
  itemAmt: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
  },
  pillBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  pillBtnText: {
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    paddingBottom: 34,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
  },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
});
