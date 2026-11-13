import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { Skeleton, SplitRowSkeleton } from '@/components/Skeleton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { useToast } from '@/components/Toast';
import { MemberPalette, Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { computeMemberBalances, computeSimplifiedDebts } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import type {
  Expense,
  ExpenseSplit,
  Group,
  GroupMember,
  Settlement,
  SimplifiedDebt,
} from '@/types/tako';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [settleTarget, setSettleTarget] = useState<SimplifiedDebt | null>(null);
  const [recipientHandle, setRecipientHandle] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    const [groupRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).maybeSingle(),
      supabase.from('group_members').select('*').eq('group_id', id).order('created_at', { ascending: true }),
      supabase.from('expenses').select('*').eq('group_id', id).order('created_at', { ascending: false }),
      supabase.from('settlements').select('*').eq('group_id', id).order('created_at', { ascending: false }),
    ]);

    if (groupRes.data) setGroup(groupRes.data as Group);
    setMembers((membersRes.data ?? []) as GroupMember[]);
    const exps = (expensesRes.data ?? []) as Expense[];
    setExpenses(exps);
    setSettlements((settlementsRes.data ?? []) as Settlement[]);

    if (exps.length > 0) {
      const splitsRes = await supabase
        .from('expense_splits')
        .select('*')
        .in('expense_id', exps.map((e) => e.id));
      setSplits((splitsRes.data ?? []) as ExpenseSplit[]);
    } else {
      setSplits([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [id]);

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
    () => members.find((m) => m.user_id === user?.id),
    [members, user?.id]
  );

  const myDebt = useMemo(() => {
    if (!myMember) return debts[0] ?? null;
    return debts.find((d) => d.from.id === myMember.id) ?? debts[0] ?? null;
  }, [debts, myMember]);

  const openSettleSheet = async (debt: SimplifiedDebt) => {
    setSettleTarget(debt);
    setRecipientHandle(null);
    if (debt.to.user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('payment_handle')
        .eq('id', debt.to.user_id)
        .maybeSingle();
      if (data?.payment_handle) {
        setRecipientHandle(data.payment_handle);
      }
    }
  };

  const handleSettleDebt = async (debt: SimplifiedDebt) => {
    if (!group) return;
    setSettling(true);
    const { data: inserted, error } = await supabase
      .from('settlements')
      .insert({
        group_id: group.id,
        from_member_id: debt.from.id,
        to_member_id: debt.to.id,
        amount_cents: debt.amountCents,
        note: 'Settled via Tako',
      })
      .select()
      .single();

    setSettling(false);
    setSettleTarget(null);

    if (!error && inserted) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 1800);
      await loadData();
      showToast({
        message: `${debt.from.name} paid ${debt.to.name} ${formatPeso(debt.amountCents)}`,
        tone: 'success',
        actionLabel: 'Undo',
        onAction: async () => {
          await supabase.from('settlements').delete().eq('id', inserted.id);
          await loadData();
        },
      });
    } else if (error) {
      showToast({ message: error.message, tone: 'error' });
    }
  };

  const handleCopyHandle = async () => {
    if (!recipientHandle) return;
    await Clipboard.setStringAsync(recipientHandle);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    showToast({ message: `Copied ${recipientHandle}`, tone: 'success' });
  };

  const handleOpenWallet = async (app: 'gcash' | 'maya') => {
    const url = app === 'gcash' ? 'gcash://' : 'maya://';
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url).catch(() => {});
    } else {
      showToast({
        message: `${app === 'gcash' ? 'GCash' : 'Maya'} app not detected — copy the account number instead.`,
      });
    }
  };

  const handleAddMember = async () => {
    if (!group || !newMemberName.trim()) return;
    setAddingMember(true);
    const color = MemberPalette[members.length % MemberPalette.length];
    await supabase.from('group_members').insert({
      group_id: group.id,
      name: newMemberName.trim(),
      color,
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setAddingMember(false);
    setNewMemberName('');
    setShowAddMember(false);
    await loadData();
  };

  const handleDeleteExpense = async (exp: Expense, skipConfirm = false) => {
    const doDelete = async () => {
      const prevExpenses = expenses;
      setExpenses((curr) => curr.filter((e) => e.id !== exp.id));
      const { error } = await supabase.from('expenses').delete().eq('id', exp.id);
      if (error) {
        setExpenses(prevExpenses);
        showToast({ message: error.message, tone: 'error' });
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      await loadData();
      showToast({ message: `Removed "${exp.title}"` });
    };

    if (skipConfirm || Platform.OS === 'web') {
      await doDelete();
      return;
    }

    Alert.alert('Delete item?', `Remove "${exp.title}" (${formatPeso(exp.amount_cents)})?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
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

  const cardShadow = isDark
    ? {}
    : Platform.select({
        ios: {
          shadowColor: '#2B1B3D',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 2 },
        web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.06)' },
      });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
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
        {/* Total Bill Card */}
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
                    { backgroundColor: m.color, marginLeft: idx === 0 ? 0 : -8, borderColor: palette.surface },
                  ]}>
                  <Text style={[styles.memberInitial, { fontFamily: TakoFonts.black }]}>
                    {m.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={() => setShowAddMember(true)}
                style={[styles.addCircle, { backgroundColor: palette.chip, borderColor: palette.surface }]}>
                <Ionicons name="add" size={14} color={palette.ink} />
              </Pressable>
            </View>
            <Text
              style={[styles.joinedMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}
              numberOfLines={1}>
              {members.length} joined · {formatPeso(perPersonCents)} each
            </Text>
          </View>
        </View>

        {/* Invite Friends QR Card */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/group/split-ready',
              params: { groupId: group.id },
            })
          }
          style={({ pressed }) => [
            styles.inviteCard,
            { backgroundColor: palette.coralSoft },
            pressed && { opacity: 0.9 },
          ]}>
          <View style={styles.qrPreviewBox}>
            <Ionicons name="qr-code" size={44} color={palette.plum} />
          </View>
          <View style={styles.inviteCopy}>
            <Text style={[styles.inviteTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Invite friends
            </Text>
            <Text style={[styles.inviteBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Show this QR so friends can join the split.
            </Text>
          </View>
        </Pressable>

        {/* Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Items
          </Text>
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
                expSplits.length >= members.length
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
                      onPress={() => handleDeleteExpense(exp, true)}
                      style={[styles.swipeDelete, { backgroundColor: palette.destructive }]}>
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    </Pressable>
                  )}>
                  <Pressable
                    onLongPress={() => handleDeleteExpense(exp)}
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

        {/* Settle Up Transfers */}
        {debts.length > 0 && (
          <View style={styles.settleSection}>
            <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Balances to settle
            </Text>
            <View
              style={[
                styles.itemsCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}>
              {debts.map((debt, idx) => (
                <View
                  key={`${debt.from.id}-${debt.to.id}-${idx}`}
                  style={[
                    styles.debtRow,
                    idx < debts.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    },
                  ]}>
                  <Text style={[styles.debtText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                    {debt.from.name}{' '}
                    <Text style={{ color: palette.mute, fontFamily: TakoFonts.regular }}>owes </Text>
                    {debt.to.name} · {formatPeso(debt.amountCents)}
                  </Text>
                  <Pressable
                    onPress={() => openSettleSheet(debt)}
                    style={[styles.miniSettleBtn, { backgroundColor: palette.tealSoft }]}>
                    <Text style={[styles.miniSettleText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                      Settle
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Primary CTA */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        {myDebt ? (
          <SpringPressable
            onPress={() => openSettleSheet(myDebt)}
            style={[styles.ctaBtn, { backgroundColor: palette.coral }]}>
            <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
              Settle up · {formatPeso(myDebt.amountCents)}
            </Text>
          </SpringPressable>
        ) : (
          <SpringPressable
            onPress={() =>
              router.push({
                pathname: '/group/add-expense',
                params: { groupId: group.id },
              })
            }
            style={[styles.ctaBtn, { backgroundColor: palette.coral }]}>
            <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
              + Add item
            </Text>
          </SpringPressable>
        )}
      </View>

      {showCelebrate && (
        <View style={styles.celebrateOverlay} pointerEvents="none">
          <TakoMascot state="celebrate" size={96} interactive={false} />
        </View>
      )}

      {/* Settle Up Bottom Sheet */}
      <Modal
        visible={!!settleTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setSettleTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 10,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Settle up
              </Text>
              <Pressable
                onPress={() => setSettleTarget(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            {settleTarget && (
              <>
                <View style={[styles.settleSummaryBox, { backgroundColor: palette.surfaceAlt }]}>
                  <Text style={[styles.settlePair, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                    {settleTarget.from.name} pays {settleTarget.to.name}
                  </Text>
                  <Text style={[styles.settleBigAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                    {formatPeso(settleTarget.amountCents)}
                  </Text>
                </View>

                {recipientHandle ? (
                  <Pressable
                    onPress={handleCopyHandle}
                    style={[
                      styles.copyHandleBtn,
                      { backgroundColor: palette.chip, borderColor: palette.border },
                    ]}>
                    <Ionicons name="copy-outline" size={18} color={palette.ink} />
                    <Text style={[styles.copyHandleText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      Copy account: {recipientHandle}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.noHandleNote, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                    No GCash/Maya number saved for {settleTarget.to.name}. Pay directly and mark settled below.
                  </Text>
                )}

                <View style={styles.walletRow}>
                  <Pressable
                    onPress={() => handleOpenWallet('gcash')}
                    style={[styles.walletBtn, { backgroundColor: palette.tealSoft }]}>
                    <Ionicons name="phone-portrait-outline" size={16} color={palette.teal} />
                    <Text style={[styles.walletText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                      Open GCash
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleOpenWallet('maya')}
                    style={[styles.walletBtn, { backgroundColor: palette.lavenderSoft }]}>
                    <Ionicons name="wallet-outline" size={16} color={palette.lavender} />
                    <Text style={[styles.walletText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      Open Maya
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleSettleDebt(settleTarget)}
                  disabled={settling}
                  style={[styles.ctaBtn, { backgroundColor: palette.coral }]}>
                  {settling ? (
                    <ActivityIndicator color={palette.plum} />
                  ) : (
                    <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                      Mark as settled
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

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
              onChangeText={setNewMemberName}
              placeholder="Friend's name"
              placeholderTextColor={palette.mute}
              autoFocus
              style={[
                styles.input,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />

            <Pressable
              onPress={handleAddMember}
              disabled={addingMember}
              style={[styles.ctaBtn, { backgroundColor: palette.coral }]}>
              {addingMember ? (
                <ActivityIndicator color={palette.plum} />
              ) : (
                <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                  Add to split
                </Text>
              )}
            </Pressable>
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
  totalAmount: { fontSize: 34, fontVariant: ['tabular-nums'] },
  membersSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
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
    color: '#FFFFFF',
    fontSize: 11,
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    marginLeft: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedMeta: { fontSize: 13, flexShrink: 1, fontVariant: ['tabular-nums'] },
  inviteCard: {
    borderRadius: Radii.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCopy: {
    flex: 1,
    gap: 3,
  },
  inviteTitle: { fontSize: 16 },
  inviteBody: { fontSize: 13, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: { fontSize: 18 },
  addLink: { fontSize: 14 },
  itemsCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  itemInfo: { flex: 1, flexShrink: 1, gap: 2 },
  itemTitle: { fontSize: 15 },
  itemSub: { fontSize: 12 },
  itemAmt: { fontSize: 15, fontVariant: ['tabular-nums'], flexShrink: 0 },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleSummaryBox: {
    borderRadius: Radii.xl,
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  settlePair: { fontSize: 13 },
  settleBigAmt: { fontSize: 32, fontVariant: ['tabular-nums'] },
  copyHandleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  copyHandleText: { fontSize: 14 },
  noHandleNote: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  walletRow: {
    flexDirection: 'row',
    gap: 10,
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: Radii.pill,
  },
  walletText: { fontSize: 14 },
  celebrateOverlay: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    zIndex: 50,
  },
  emptyFeedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settleSection: { gap: 10 },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  debtText: { fontSize: 14, flex: 1 },
  miniSettleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  miniSettleText: { fontSize: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  ctaBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
  emptyTitle: { fontSize: 20 },
  pillBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radii.pill,
  },
  pillBtnText: { fontSize: 14 },
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
  modalTitle: { fontSize: 20 },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
});
