import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Expense, Group, GroupMember, Settlement } from '@/types/tako';

interface ActivityItem {
  id: string;
  groupId: string;
  icon: 'person-add-outline' | 'checkmark-outline' | 'receipt-outline';
  iconBg: 'teal' | 'coral' | 'lavender';
  title: string;
  subtitle: string;
  amountText?: string;
  amountPositive?: boolean;
  createdAt: string;
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

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    const { data: groupsData } = await supabase.from('groups').select('*');
    const groups = (groupsData ?? []) as Group[];
    if (groups.length === 0) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const groupIds = groups.map((g) => g.id);

    const [membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from('group_members').select('*').in('group_id', groupIds),
      supabase.from('expenses').select('*').in('group_id', groupIds).order('created_at', { ascending: false }).limit(30),
      supabase.from('settlements').select('*').in('group_id', groupIds).order('created_at', { ascending: false }).limit(30),
    ]);

    const members = (membersRes.data ?? []) as GroupMember[];
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const expenses = (expensesRes.data ?? []) as Expense[];
    const settlements = (settlementsRes.data ?? []) as Settlement[];

    const feed: ActivityItem[] = [];

    for (const exp of expenses) {
      const grp = groupMap.get(exp.group_id);
      const payer = memberMap.get(exp.paid_by_member_id);
      feed.push({
        id: `exp-${exp.id}`,
        groupId: exp.group_id,
        icon: 'receipt-outline',
        iconBg: 'coral',
        title: `${exp.title} added`,
        subtitle: `${grp?.name ?? 'Split'} · ${payer?.name ?? 'Someone'} · ${formatRelativeTime(exp.created_at)}`,
        amountText: formatPeso(exp.amount_cents),
        amountPositive: payer?.user_id === user.id,
        createdAt: exp.created_at,
      });
    }

    for (const st of settlements) {
      const grp = groupMap.get(st.group_id);
      const from = memberMap.get(st.from_member_id);
      const to = memberMap.get(st.to_member_id);
      const iPaid = from?.user_id === user.id;
      const iReceived = to?.user_id === user.id;
      feed.push({
        id: `st-${st.id}`,
        groupId: st.group_id,
        icon: 'checkmark-outline',
        iconBg: iPaid ? 'teal' : 'coral',
        title: iReceived
          ? `${from?.name ?? 'Someone'} paid you`
          : iPaid
            ? `You settled ${grp?.name ?? 'split'}`
            : `${from?.name ?? 'Someone'} paid ${to?.name ?? 'Someone'}`,
        subtitle: `${grp?.name ?? 'Split'} · ${formatRelativeTime(st.created_at)}`,
        amountText: `${iPaid ? '-' : '+'}${formatPeso(st.amount_cents)}`,
        amountPositive: !iPaid,
        createdAt: st.created_at,
      });
    }

    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(feed);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadActivity();
    }, [loadActivity])
  );

  const todayItems = items.filter((i) => isToday(i.createdAt));
  const earlierItems = items.filter((i) => !isToday(i.createdAt));

  const renderSection = (label: string, rows: ActivityItem[]) => {
    if (rows.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
          {label}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}>
          {rows.map((row, idx) => {
            const bg =
              row.iconBg === 'teal'
                ? palette.tealSoft
                : row.iconBg === 'lavender'
                  ? palette.lavenderSoft
                  : palette.coralSoft;
            return (
              <Pressable
                key={row.id}
                onPress={() => router.push(`/group/${row.groupId}`)}
                style={[
                  styles.row,
                  idx < rows.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: palette.border,
                  },
                ]}>
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
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
            );
          })}
        </View>
      </View>
    );
  };

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
        <Text style={[styles.pageTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Activity
        </Text>

        {loading ? (
          <View style={styles.skeletonList}>
            <SplitRowSkeleton />
            <SplitRowSkeleton />
            <SplitRowSkeleton />
          </View>
        ) : items.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              !isDark && styles.lightShadow,
            ]}>
            <TakoMascot state="think" size={110} interactive />
            <Text style={[styles.emptyTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              No activity yet
            </Text>
            <Text style={[styles.emptyText, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Expenses and settlements from your splits will appear here, like:
            </Text>

            <View
              style={[
                styles.exampleRow,
                { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: palette.coralSoft }]}>
                <Ionicons name="receipt-outline" size={18} color={palette.ink} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]} numberOfLines={1}>
                  Ramen Ya dinner added
                </Text>
                <Text style={[styles.rowSub, { color: palette.mute, fontFamily: TakoFonts.regular }]} numberOfLines={1}>
                  Barkada Dinner · You · Just now
                </Text>
              </View>
              <Text style={[styles.rowAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                ₱1,200
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/group/new-split')}
              accessibilityRole="button"
              accessibilityLabel="Create a split"
              style={({ pressed }) => [
                styles.emptyCta,
                { backgroundColor: palette.coral },
                pressed && { opacity: 0.9 },
              ]}>
              <Ionicons name="add" size={18} color={palette.plum} />
              <Text style={[styles.emptyCtaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Create a split
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {renderSection('TODAY', todayItems)}
            {renderSection('EARLIER', earlierItems)}
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
    paddingBottom: 112,
    gap: 18,
  },
  pageTitle: {
    fontSize: 30,
    letterSpacing: -0.6,
  },
  center: {
    paddingVertical: 56,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  lightShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.06)' },
  }),
  skeletonList: {
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    width: '100%',
    marginTop: 4,
    opacity: 0.85,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 22,
    minHeight: 46,
    borderRadius: Radii.pill,
  },
  emptyCtaText: {
    fontSize: 15,
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
