import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { dismissReminder, fetchAllReminders } from '@/lib/takoData';

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

export default function AlertsScreen() {
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const bottomOffset = Math.max(insets.bottom, 14);

  const loadAlerts = useCallback(async () => {
    if (!user) return;
    const [{ snapshot }, reminders] = await Promise.all([
      fetchAndCacheSnapshot(user.id),
      fetchAllReminders(user.id),
    ]);
    const groups = snapshot.groups;
    if (groups.length === 0 && reminders.length === 0) {
      setAlertItems([]);
      return;
    }

    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const members = [...snapshot.members]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20);
    const memberMap = new Map(snapshot.members.map((m) => [m.id, m]));
    const settlements = [...snapshot.settlements]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20);

    const live: (AlertItem & { ts: number })[] = [];

    for (const rem of reminders) {
      const grp = groupMap.get(rem.group_id);
      const today = isToday(rem.created_at);
      const isUnread = !rem.dismissed_at;
      live.push({
        id: `rem-${rem.id}`,
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

    for (const st of settlements) {
      const grp = groupMap.get(st.group_id);
      const from = memberMap.get(st.from_member_id);
      const iReceived = memberMap.get(st.to_member_id)?.user_id === user.id;
      if (!iReceived) continue;
      const today = isToday(st.created_at);
      const notePrefix = st.note ? `${st.note} · ` : '';
      live.push({
        id: `st-${st.id}`,
        groupId: st.group_id,
        icon: 'checkmark-outline',
        iconBg: 'teal',
        title: `${from?.name ?? 'Friend'} paid you ${formatPeso(st.amount_cents)}`,
        subtitle: `${grp?.name ?? 'Split'} · ${notePrefix}${formatRelativeTime(st.created_at)}`,
        unread: today,
        section: today ? 'NEW' : 'EARLIER',
        ts: new Date(st.created_at).getTime(),
      });
    }

    for (const m of members) {
      if (m.user_id === user.id) continue;
      const grp = groupMap.get(m.group_id);
      if (grp?.created_by !== user.id) continue;
      const today = isToday(m.created_at);
      live.push({
        id: `mem-${m.id}`,
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

    live.sort((a, b) => b.ts - a.ts);
    setAlertItems(live);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    for (const item of alertItems) {
      if (item.unread && item.id.startsWith('rem-')) {
        dismissReminder(item.id.slice(4));
      }
    }
    setAlertItems((prev) => prev.map((a) => ({ ...a, unread: false })));
  };

  const cardShadow = getCardElevation(isDark);

  const getIconBg = (bg: 'teal' | 'coral' | 'lavender') =>
    bg === 'teal'
      ? palette.tealSoft
      : bg === 'lavender'
        ? palette.lavenderSoft
        : palette.coralSoft;

  const newAlertRows = alertItems.filter((a) => a.section === 'NEW');
  const earlierAlertRows = alertItems.filter((a) => a.section === 'EARLIER');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomOffset + 96 },
        ]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Ionicons name="chevron-back" size={20} color={palette.ink} />
            </Pressable>
            <Text style={[styles.pageTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              Alerts
            </Text>
          </View>

          {alertItems.length > 0 && (
            <Pressable onPress={handleMarkAllRead} hitSlop={10}>
              <Text style={[styles.markRead, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>

        {alertItems.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border, padding: 24 },
              cardShadow,
            ]}>
            <Text style={{ color: palette.mute, fontFamily: TakoFonts.regular, textAlign: 'center', fontSize: 14 }}>
              No alerts yet. When friends join or settle splits, you’ll see them here.
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
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 30,
    letterSpacing: -0.6,
  },
  markRead: {
    fontSize: 13,
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
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tabOuterWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 64,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  lightTabShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
    web: { boxShadow: '0 6px 20px rgba(43, 27, 61, 0.08)' },
  }),
  darkTabShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)' },
  }),
  tabItem: {
    flex: 1,
    height: 52,
    borderRadius: Radii.pill,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
});
