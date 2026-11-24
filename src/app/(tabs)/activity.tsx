import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplitRowSkeleton } from '@/components/Skeleton';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { fetchAllReminders } from '@/lib/takoData';
import type { Expense } from '@/types/tako';

interface FeedItem {
  id: string;
  groupId?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: 'teal' | 'coral' | 'lavender';
  title: string;
  subtitle: string;
  amountText?: string;
  section: 'TODAY' | 'YESTERDAY';
}

interface AlertItem {
  id: string;
  groupId?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: 'teal' | 'coral' | 'lavender';
  title: string;
  subtitle: string;
  unread?: boolean;
  section: 'NEW' | 'EARLIER';
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function ActivityScreen() {
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();

  const [overrideMode, setMode] = useState<'activity' | 'alerts' | null>(null);
  const mode: 'activity' | 'alerts' =
    overrideMode ?? (params.view === 'alerts' ? 'alerts' : 'activity');
  const [activityItems, setActivityItems] = useState<FeedItem[]>([]);
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [{ snapshot }, reminders] = await Promise.all([
      fetchAndCacheSnapshot(user.id),
      fetchAllReminders(user.id),
    ]);
    const { groups, members, expenses, settlements } = snapshot;

    if (groups.length === 0) {
      setActivityItems([]);
      setAlertItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const liveFeed: (FeedItem & { ts: number })[] = [];
    const liveAlerts: (AlertItem & { ts: number })[] = [];

    for (const rem of reminders) {
      const grp = groupMap.get(rem.group_id);
      const today = isToday(rem.created_at);
      const isUnread = !rem.dismissed_at;
      liveAlerts.push({
        id: `al-rem-${rem.id}`,
        groupId: rem.group_id,
        icon: 'notifications-outline',
        iconBg: 'coral',
        title: rem.message || `Reminder: ${formatPeso(rem.amount_cents)} due`,
        subtitle: `${grp?.name ?? 'Split'} · ${formatRelativeTime(rem.created_at)}`,
        unread: isUnread,
        section: isUnread && today ? 'NEW' : 'EARLIER',
        ts: new Date(rem.created_at).getTime(),
      });
    }

    for (const m of members) {
      if (m.user_id === user.id) continue;
      const grp = groupMap.get(m.group_id);
      const today = isToday(m.created_at);
      liveFeed.push({
        id: `mem-${m.id}`,
        groupId: m.group_id,
        icon: 'person-outline',
        iconBg: 'lavender',
        title: `${m.name} joined ${grp?.name ?? 'split'}`,
        subtitle: formatRelativeTime(m.created_at),
        section: today ? 'TODAY' : 'YESTERDAY',
        ts: new Date(m.created_at).getTime(),
      });
      liveAlerts.push({
        id: `al-mem-${m.id}`,
        groupId: m.group_id,
        icon: 'person-outline',
        iconBg: 'lavender',
        title: `${m.name} joined ${grp?.name ?? 'split'}`,
        subtitle: formatRelativeTime(m.created_at),
        unread: today,
        section: today ? 'NEW' : 'EARLIER',
        ts: new Date(m.created_at).getTime(),
      });
    }

    for (const st of settlements) {
      const grp = groupMap.get(st.group_id);
      const from = memberMap.get(st.from_member_id);
      const to = memberMap.get(st.to_member_id);
      const iPaid = from?.user_id === user.id;
      const iReceived = to?.user_id === user.id;
      const today = isToday(st.created_at);
      const notePrefix = st.note ? `${st.note} · ` : '';
      liveFeed.push({
        id: `st-${st.id}`,
        groupId: st.group_id,
        icon: 'checkmark-outline',
        iconBg: 'teal',
        title: iReceived
          ? `${from?.name ?? 'Friend'} paid you`
          : iPaid
            ? `You settled ${grp?.name ?? 'split'}`
            : `${from?.name ?? 'Friend'} paid ${to?.name ?? 'Friend'}`,
        subtitle: iPaid
          ? `${notePrefix}${formatRelativeTime(st.created_at)}`
          : `${grp?.name ?? 'Split'} · ${notePrefix}${formatRelativeTime(st.created_at)}`,
        amountText: `${iPaid ? '−' : '+'}${formatPeso(st.amount_cents)}`,
        section: today ? 'TODAY' : 'YESTERDAY',
        ts: new Date(st.created_at).getTime(),
      });
      liveAlerts.push({
        id: `al-st-${st.id}`,
        groupId: st.group_id,
        icon: 'checkmark-outline',
        iconBg: 'teal',
        title: iReceived
          ? `${from?.name ?? 'Friend'} paid you ${formatPeso(st.amount_cents)}`
          : `${grp?.name ?? 'Split'} settled (${formatPeso(st.amount_cents)})`,
        subtitle: `${grp?.name ?? 'Split'} · ${formatRelativeTime(st.created_at)}`,
        unread: today,
        section: today ? 'NEW' : 'EARLIER',
        ts: new Date(st.created_at).getTime(),
      });
    }

    // Group repeated expense items per split into one clean summary row
    const expensesByGroup = new Map<string, Expense[]>();
    for (const exp of expenses) {
      const arr = expensesByGroup.get(exp.group_id) ?? [];
      arr.push(exp);
      expensesByGroup.set(exp.group_id, arr);
    }

    for (const [gid, grpExpenses] of expensesByGroup.entries()) {
      const grp = groupMap.get(gid);
      const latest = grpExpenses[0];
      const today = isToday(latest.created_at);
      const totalAdded = grpExpenses.reduce((s, e) => s + e.amount_cents, 0);
      liveFeed.push({
        id: `exp-grp-${gid}`,
        groupId: gid,
        icon: 'receipt-outline',
        iconBg: 'coral',
        title: `${grp?.name ?? latest.title} updated`,
        subtitle:
          grpExpenses.length === 1
            ? `${formatRelativeTime(latest.created_at)} · ${latest.title}`
            : `${formatRelativeTime(latest.created_at)} · ${grpExpenses.length} items added`,
        amountText: formatPeso(totalAdded),
        section: today ? 'TODAY' : 'YESTERDAY',
        ts: new Date(latest.created_at).getTime(),
      });
    }

    liveFeed.sort((a, b) => b.ts - a.ts);
    liveAlerts.sort((a, b) => b.ts - a.ts);
    setActivityItems(liveFeed);
    setAlertItems(liveAlerts);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [loadActivity])
  );

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setAlertItems((prev) => prev.map((a) => ({ ...a, unread: false })));
  };

  const unreadCount = alertItems.filter((a) => a.unread).length;

  const cardShadow = getCardElevation(isDark);

  const getIconBg = (bg: 'teal' | 'coral' | 'lavender') =>
    bg === 'teal'
      ? palette.tealSoft
      : bg === 'lavender'
        ? palette.lavenderSoft
        : palette.coralSoft;

  const todayRows = activityItems.filter((i) => i.section === 'TODAY');
  const yesterdayRows = activityItems.filter((i) => i.section === 'YESTERDAY');

  const newAlertRows = alertItems.filter((a) => a.section === 'NEW');
  const earlierAlertRows = alertItems.filter((a) => a.section === 'EARLIER');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
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
              loadActivity();
            }}
            tintColor={palette.coralAccent}
          />
        }>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            {mode === 'alerts' ? 'Alerts' : 'Activity'}
          </Text>

          <View style={styles.headerRight}>
            {mode === 'alerts' ? (
              <>
                <Pressable onPress={handleMarkAllRead} hitSlop={10}>
                  <Text style={[styles.markRead, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                    Mark all read
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('activity')}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Activity"
                  style={[styles.modePill, { backgroundColor: palette.chip }]}>
                  <Ionicons name="time-outline" size={16} color={palette.ink} />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/alerts')}
                accessibilityRole="button"
                accessibilityLabel="Open Alerts"
                style={[styles.modePill, { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 }]}>
                <Ionicons name="notifications-outline" size={17} color={palette.ink} />
                <Text style={[styles.modePillText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Alerts
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.unreadDot, { backgroundColor: palette.coral }]} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            <SplitRowSkeleton />
            <SplitRowSkeleton />
            <SplitRowSkeleton />
          </View>
        ) : mode === 'activity' ? (
          activityItems.length === 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border, padding: 24 },
                cardShadow,
              ]}>
              <Text style={{ color: palette.mute, fontFamily: TakoFonts.regular, textAlign: 'center', fontSize: 14 }}>
                No activity yet. Create or join a split to see updates here.
              </Text>
            </View>
          ) : (
          <>
            {todayRows.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  TODAY
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    cardShadow,
                  ]}>
                  {todayRows.map((row, idx) => (
                    <Pressable
                      key={row.id}
                      onPress={() => row.groupId && router.push(`/group/${row.groupId}`)}
                      style={[
                        styles.row,
                        idx < todayRows.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: palette.border,
                        },
                      ]}>
                      <View style={[styles.iconBox, { backgroundColor: getIconBg(row.iconBg) }]}>
                        <Ionicons name={row.icon} size={18} color={palette.ink} />
                      </View>
                      <View style={styles.rowInfo}>
                        <Text
                          style={[styles.rowTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                          numberOfLines={1}>
                          {row.title}
                        </Text>
                        <Text
                          style={[styles.rowSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                          numberOfLines={1}>
                          {row.subtitle}
                        </Text>
                      </View>
                      {row.amountText && (
                        <Text
                          style={[
                            styles.rowAmt,
                            { color: palette.ink, fontFamily: TakoFonts.black },
                          ]}>
                          {row.amountText}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {yesterdayRows.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  YESTERDAY
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    cardShadow,
                  ]}>
                  {yesterdayRows.map((row, idx) => (
                    <Pressable
                      key={row.id}
                      onPress={() => row.groupId && router.push(`/group/${row.groupId}`)}
                      style={[
                        styles.row,
                        idx < yesterdayRows.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: palette.border,
                        },
                      ]}>
                      <View style={[styles.iconBox, { backgroundColor: getIconBg(row.iconBg) }]}>
                        <Ionicons name={row.icon} size={18} color={palette.ink} />
                      </View>
                      <View style={styles.rowInfo}>
                        <Text
                          style={[styles.rowTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                          numberOfLines={1}>
                          {row.title}
                        </Text>
                        <Text
                          style={[styles.rowSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                          numberOfLines={1}>
                          {row.subtitle}
                        </Text>
                      </View>
                      {row.amountText && (
                        <Text
                          style={[
                            styles.rowAmt,
                            { color: palette.ink, fontFamily: TakoFonts.black },
                          ]}>
                          {row.amountText}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
          )
        ) : (
          alertItems.length === 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border, padding: 24 },
                cardShadow,
              ]}>
              <Text style={{ color: palette.mute, fontFamily: TakoFonts.regular, textAlign: 'center', fontSize: 14 }}>
                No alerts yet.
              </Text>
            </View>
          ) : (
          <>
            {newAlertRows.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  NEW
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    cardShadow,
                  ]}>
                  {newAlertRows.map((row, idx) => (
                    <Pressable
                      key={row.id}
                      onPress={() => {
                        setAlertItems((prev) =>
                          prev.map((a) => (a.id === row.id ? { ...a, unread: false } : a))
                        );
                        if (row.groupId) router.push(`/group/${row.groupId}`);
                      }}
                      style={[
                        styles.row,
                        idx < newAlertRows.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: palette.border,
                        },
                      ]}>
                      <View style={[styles.iconBox, { backgroundColor: getIconBg(row.iconBg) }]}>
                        <Ionicons name={row.icon} size={18} color={palette.ink} />
                      </View>
                      <View style={styles.rowInfo}>
                        <Text
                          style={[styles.rowTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                          numberOfLines={1}>
                          {row.title}
                        </Text>
                        <Text
                          style={[styles.rowSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                          numberOfLines={1}>
                          {row.subtitle}
                        </Text>
                      </View>
                      {row.unread && (
                        <View style={[styles.unreadDot, { backgroundColor: palette.coral }]} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {earlierAlertRows.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  EARLIER
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    cardShadow,
                  ]}>
                  {earlierAlertRows.map((row, idx) => (
                    <Pressable
                      key={row.id}
                      onPress={() => row.groupId && router.push(`/group/${row.groupId}`)}
                      style={[
                        styles.row,
                        idx < earlierAlertRows.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: palette.border,
                        },
                      ]}>
                      <View style={[styles.iconBox, { backgroundColor: getIconBg(row.iconBg) }]}>
                        <Ionicons name={row.icon} size={18} color={palette.ink} />
                      </View>
                      <View style={styles.rowInfo}>
                        <Text
                          style={[styles.rowTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                          numberOfLines={1}>
                          {row.title}
                        </Text>
                        <Text
                          style={[styles.rowSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}
                          numberOfLines={1}>
                          {row.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 112,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 30,
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markRead: {
    fontSize: 13,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  modePillText: {
    fontSize: 12,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  skeletonList: {
    gap: 12,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.1,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
  },
  rowSub: {
    fontSize: 12,
  },
  rowAmt: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
});
