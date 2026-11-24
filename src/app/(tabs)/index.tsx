import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegendAvatarFrame } from '@/components/LegendAvatarFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SplitRowSkeleton } from '@/components/Skeleton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { useToast } from '@/components/Toast';
import { MemberPalette, Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { computeUserAwards, isLegendPreviewEnabled } from '@/lib/awards';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { computeMemberBalances } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import { deleteGroup, dismissReminder, fetchActiveReminders, fetchAllReminders } from '@/lib/takoData';
import type { Group, GroupMember, Reminder } from '@/types/tako';

function isReminderPreview(): boolean {
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('reminderPreview') === '1';
  }
  return false;
}

const PREVIEW_REMINDER: Reminder = {
  id: 'preview-reminder',
  group_id: 'preview',
  from_user_id: 'preview',
  to_member_id: 'preview',
  to_user_id: 'preview',
  amount_cents: 65000,
  message: 'Frederick reminded you: ₱650 for Ramen',
  dismissed_at: null,
  created_at: new Date().toISOString(),
};

interface GroupSummary {
  group: Group;
  members: GroupMember[];
  totalSpentCents: number;
  myBalanceCents: number;
}

export default function SplitsHomeScreen() {
  const { palette, isDark } = useTakoTheme();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const [summaries, setSummaries] = useState<GroupSummary[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isUserLegend, setIsUserLegend] = useState(false);
  const previewDismissedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const [{ snapshot, fromCache, pendingCount: pending, syncedCount }, activeReminders, allReminders] =
      await Promise.all([
        fetchAndCacheSnapshot(user.id),
        fetchActiveReminders(user.id),
        fetchAllReminders(user.id),
      ]);

    const awards = computeUserAwards({
      userId: user.id,
      groups: snapshot.groups,
      members: snapshot.members,
      expenses: snapshot.expenses,
      splits: snapshot.splits,
      settlements: snapshot.settlements,
      reminders: allReminders,
    });
    setIsUserLegend(awards.isLegend || isLegendPreviewEnabled());

    setReminders(
      activeReminders.length > 0
        ? activeReminders
        : isReminderPreview() && !previewDismissedRef.current
          ? [
              {
                ...PREVIEW_REMINDER,
                group_id: snapshot.groups[0]?.id ?? 'preview',
              },
            ]
          : []
    );
    setIsOffline(fromCache);
    setPendingCount(pending);
    if (syncedCount > 0) {
      showToast({
        message: `Synced ${syncedCount} offline ${syncedCount === 1 ? 'change' : 'changes'}`,
      });
    }

    const { groups, members: allMembers, expenses: allExpenses, splits: allSplits, settlements: allSettlements } =
      snapshot;

    if (groups.length === 0) {
      setSummaries([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextSummaries: GroupSummary[] = [];
    const emptyGroupIds: string[] = [];

    for (const g of groups) {
      const members = allMembers.filter((m) => m.group_id === g.id);
      const expenses = allExpenses.filter((e) => e.group_id === g.id);
      const expIdSet = new Set(expenses.map((e) => e.id));
      const splits = allSplits.filter((s) => expIdSet.has(s.expense_id));
      const settlements = allSettlements.filter((st) => st.group_id === g.id);

      const balances = computeMemberBalances(members, expenses, splits, settlements);
      const myMember = members.find((m) => m.user_id === user.id);
      const myBalanceCents = myMember ? (balances[myMember.id] ?? 0) : 0;
      const totalSpentCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

      // Clean up incomplete 0-expense splits that were abandoned before items were saved
      if (expenses.length === 0 && g.created_by === user.id && !g.id.startsWith('local_')) {
        emptyGroupIds.push(g.id);
        continue;
      }

      nextSummaries.push({
        group: g,
        members,
        totalSpentCents,
        myBalanceCents,
      });
    }

    if (emptyGroupIds.length > 0 && !fromCache) {
      supabase
        .from('groups')
        .delete()
        .in('id', emptyGroupIds)
        .then(() => {});
    }

    setSummaries(nextSummaries);
    setLoading(false);
    setRefreshing(false);
  }, [user, showToast]);

  const handleDeleteGroup = async (group: Group) => {
    if (!user) return;
    const prev = summaries;
    setSummaries((curr) => curr.filter((s) => s.group.id !== group.id));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const res = await deleteGroup({ userId: user.id, groupId: group.id });
    if (!res.ok) {
      setSummaries(prev);
      showToast({ message: res.error, tone: 'error' });
      return;
    }
    showToast({
      message: res.queuedOffline
        ? `Deleted "${group.name}" (queued to sync)`
        : `Deleted "${group.name}"`,
    });
  };

  const handleDismissReminder = async (reminderId: string) => {
    setReminders((curr) => curr.filter((r) => r.id !== reminderId));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (reminderId === 'preview-reminder') {
      previewDismissedRef.current = true;
    } else {
      await dismissReminder(reminderId);
    }
  };

  const renderReminderBanner = () => {
    const active = reminders[0];
    if (!active) return null;
    const extraCount = reminders.length - 1;
    return (
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.duration(220)}
        style={[
          styles.reminderCard,
          {
            backgroundColor: palette.goldSoft,
            borderColor: palette.gold,
          },
          cardElevation,
        ]}>
        <View style={styles.reminderMascot}>
          <TakoMascot state="wave" size={64} interactive={false} />
        </View>
        <View style={styles.reminderBody}>
          <View style={styles.reminderTopRow}>
            <Text style={[styles.reminderEyebrow, { color: palette.amber, fontFamily: TakoFonts.black }]}>
              TAKO REMINDER{extraCount > 0 ? ` · +${extraCount} MORE` : ''}
            </Text>
            <Pressable
              onPress={() => handleDismissReminder(active.id)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss reminder"
              hitSlop={8}
              style={styles.reminderDismissBtn}>
              <Ionicons name="close" size={16} color={palette.mute} />
            </Pressable>
          </View>
          <Text
            style={[styles.reminderText, { color: palette.ink, fontFamily: TakoFonts.bold }]}
            numberOfLines={2}>
            {active.message || `Friendly nudge: ${formatPeso(active.amount_cents)} due`}
          </Text>
          <View style={styles.reminderActions}>
            <SpringPressable
              onPress={() => {
                handleDismissReminder(active.id);
                router.push(`/group/${active.group_id}`);
              }}
              accessibilityRole="button"
              accessibilityLabel="Open split to settle"
              style={[styles.reminderOpenBtn, { backgroundColor: palette.chipOn }]}>
              <Text style={[styles.reminderOpenText, { color: palette.chipOnInk, fontFamily: TakoFonts.bold }]}>
                Open split
              </Text>
            </SpringPressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const initial = (profile?.display_name || user?.email || 'Y').trim().charAt(0).toUpperCase();

  const cardElevation = getCardElevation(isDark);

  const renderTopHeader = () => (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <TakoMascot state="idle" size={38} interactive={false} />
        <Text style={[styles.wordmark, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          tako
        </Text>
      </View>

      <LegendAvatarFrame active={isUserLegend} size={40} ringThickness={3} gap={2}>
        <SpringPressable
          onPress={() => router.navigate('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={[
            styles.avatarBtn,
            {
              backgroundColor: profile?.avatar_color || palette.coralSoft,
              borderColor: isUserLegend ? 'transparent' : palette.coral,
              borderWidth: isUserLegend ? 0 : 1.5,
            },
            !isUserLegend && cardElevation,
          ]}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarImg}
              contentFit="cover"
              accessibilityLabel="Profile picture"
            />
          ) : (
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? palette.ink : palette.plum, fontFamily: TakoFonts.black },
              ]}>
              {initial}
            </Text>
          )}
        </SpringPressable>
      </LegendAvatarFrame>
      {(isOffline || pendingCount > 0) && (
        <View
          accessibilityRole="text"
          style={[
            styles.offlinePill,
            { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
          ]}>
          <Ionicons
            name={isOffline ? 'cloud-offline-outline' : 'cloud-upload-outline'}
            size={14}
            color={palette.ink}
          />
          <Text style={[styles.offlinePillText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
            {isOffline
              ? pendingCount > 0
                ? `Offline · ${pendingCount} queued`
                : 'Offline · Saved splits'
              : `${pendingCount} queued · Pull to sync`}
          </Text>
        </View>
      )}
    </View>
  );

  // Empty State: Grouped hero + mascot + CTAs
  if (!loading && summaries.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <View
          style={[
            styles.emptyScreenWrap,
            { paddingBottom: Math.max(insets.bottom, 16) + 88 },
          ]}>
          {renderTopHeader()}

          <View style={styles.emptyCenter}>
            <TakoMascot state="sleep" size={138} interactive />
            <Text style={[styles.emptyHeroTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              No splits yet
            </Text>
            <Text style={[styles.emptyHeroSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Scan a friend’s QR to join, or start one yourself.
            </Text>

            <View style={styles.emptyEntryActions}>
              <PrimaryButton
                label="New split"
                icon="add"
                onPress={() => router.push('/group/new-split')}
                style={{ flex: 1 }}
              />

              <SpringPressable
                onPress={() => router.push('/(tabs)/scan')}
                accessibilityRole="button"
                accessibilityLabel="Scan to join"
                style={[
                  styles.emptyOutlineBtn,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                  cardElevation,
                ]}>
                <Ionicons name="qr-code-outline" size={18} color={palette.ink} />
                <Text style={[styles.emptyOutlineText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Scan to join
                </Text>
              </SpringPressable>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const renderSplitCard = ({
    item,
    index: idx,
  }: {
    item: GroupSummary;
    index: number;
  }) => {
    const { group, members, totalSpentCents, myBalanceCents } = item;
    const badgeLetter = group.name.trim().charAt(0).toUpperCase() || 'T';
    const isOwe = myBalanceCents < -1;
    const isOwed = myBalanceCents > 1;
    const badgeBg = isOwe ? palette.coralSoft : palette.tealSoft;
    const avatarBg = idx % 3 === 0 ? palette.coralSoft : palette.tealSoft;
    const displayAmt = isOwe || isOwed ? Math.abs(myBalanceCents) : totalSpentCents;

    return (
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeInDown.delay(Math.min(idx, 5) * 40).duration(220)
        }>
        <Swipeable
          overshootRight={false}
          renderRightActions={() => (
            <Pressable
              onPress={() => handleDeleteGroup(group)}
              style={[styles.swipeAction, { backgroundColor: palette.destructive }]}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.swipeText, { fontFamily: TakoFonts.bold }]}>Delete</Text>
            </Pressable>
          )}>
          <SpringPressable
            onPress={() => router.push(`/group/${group.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open split ${group.name}`}
            style={[
              styles.splitCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            <View style={[styles.letterBadge, { backgroundColor: avatarBg }]}>
              <Text style={[styles.letterText, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {badgeLetter}
              </Text>
            </View>

            <View style={styles.splitInfo}>
              <Text
                style={[styles.splitName, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                numberOfLines={1}>
                {group.name}
              </Text>
              <Text
                style={[styles.splitMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                numberOfLines={1}>
                {members.length} {members.length === 1 ? 'person' : 'people'} · {formatPeso(totalSpentCents)}
              </Text>
            </View>

            <View style={styles.splitRight}>
              <Text style={[styles.splitAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {formatPeso(displayAmt)}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isOwe ? palette.coralAccent : palette.teal,
                      fontFamily: TakoFonts.bold,
                    },
                  ]}>
                  {isOwe ? 'You owe' : isOwed ? "You're owed" : 'Settled'}
                </Text>
              </View>
            </View>
          </SpringPressable>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <FlatList
        data={loading ? [] : summaries}
        keyExtractor={(item) => item.group.id}
        renderItem={renderSplitCard}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGroups();
            }}
            tintColor={palette.coralAccent}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {renderTopHeader()}
            {renderReminderBanner()}

            {/* Dark Plum Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: palette.plum }]}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroCopy}>
                  <Text style={[styles.heroTitle, { fontFamily: TakoFonts.black }]}>
                    Split bills,{'\n'}not friendships
                  </Text>
                  <Text style={[styles.heroSub, { fontFamily: TakoFonts.regular }]}>
                    Share a QR. Everyone joins.
                  </Text>
                </View>
                <View style={styles.heroMascotWrap}>
                  <TakoMascot state="idle" size={112} interactive />
                </View>
              </View>

              <View style={styles.heroActions}>
                <SpringPressable
                  onPress={() => router.push('/group/new-split')}
                  style={[styles.heroPrimaryBtn, { backgroundColor: palette.ctaBg }]}>
                  <Ionicons name="add" size={18} color={palette.ctaInk} />
                  <Text style={[styles.heroPrimaryText, { color: palette.ctaInk, fontFamily: TakoFonts.bold }]}>
                    New split
                  </Text>
                </SpringPressable>

                <SpringPressable
                  onPress={() => router.push('/(tabs)/scan')}
                  style={styles.heroOutlineBtn}>
                  <Ionicons name="qr-code-outline" size={16} color="#FFF6EE" />
                  <Text style={[styles.heroOutlineText, { fontFamily: TakoFonts.bold }]}>
                    Scan to join
                  </Text>
                </SpringPressable>
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Active splits
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/activity')} hitSlop={10}>
                <Text style={[styles.seeAll, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                  See all
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.list}>
              <SplitRowSkeleton />
              <SplitRowSkeleton />
              <SplitRowSkeleton />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const _keepMemberPalette = MemberPalette;
void _keepMemberPalette;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 112,
  },
  headerStack: {
    gap: 18,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1.4,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 15,
  },
  heroCard: {
    borderRadius: Radii.xl,
    padding: 20,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: 6,
    paddingRight: 8,
  },
  heroTitle: {
    color: '#FFF6EE',
    fontSize: 23,
    lineHeight: 28,
  },
  heroSub: {
    color: '#D5C7E8',
    fontSize: 13,
  },
  heroMascotWrap: {
    marginRight: -6,
    marginVertical: -8,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  heroPrimaryText: {
    fontSize: 14,
  },
  heroOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,246,238,0.28)',
  },
  heroOutlineText: {
    color: '#FFF6EE',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAll: {
    fontSize: 14,
  },
  emptyScreenWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  emptyHeroTitle: {
    fontSize: 24,
    marginTop: 4,
  },
  emptyHeroSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyEntryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  emptyOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 52,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  emptyOutlineText: {
    fontSize: 15,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: Radii.xl,
    marginLeft: 8,
    gap: 2,
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  list: {
    gap: 12,
  },
  splitCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  letterBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 16,
  },
  splitInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  splitName: {
    fontSize: 16,
  },
  splitMeta: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  splitRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  splitAmt: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 11,
  },
  offlinePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  offlinePillText: {
    fontSize: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  reminderMascot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBody: {
    flex: 1,
    gap: 6,
  },
  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderEyebrow: {
    fontSize: 11,
    letterSpacing: 0.9,
  },
  reminderDismissBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reminderOpenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  reminderOpenText: {
    fontSize: 12,
  },
});
