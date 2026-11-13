import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TakoMascot } from '@/components/TakoMascot';
import { MemberPalette, Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { computeMemberBalances } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import type { Expense, ExpenseSplit, Group, GroupMember, Settlement } from '@/types/tako';

interface GroupSummary {
  group: Group;
  members: GroupMember[];
  totalSpentCents: number;
  myBalanceCents: number;
}

export default function SplitsHomeScreen() {
  const { palette } = useTakoTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [summaries, setSummaries] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const { data: groupsData, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !groupsData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const groups = groupsData as Group[];
    if (groups.length === 0) {
      setSummaries([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const groupIds = groups.map((g) => g.id);

    const [membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from('group_members').select('*').in('group_id', groupIds),
      supabase.from('expenses').select('*').in('group_id', groupIds),
      supabase.from('settlements').select('*').in('group_id', groupIds),
    ]);

    const allMembers = (membersRes.data ?? []) as GroupMember[];
    const allExpenses = (expensesRes.data ?? []) as Expense[];
    const allSettlements = (settlementsRes.data ?? []) as Settlement[];

    const expenseIds = allExpenses.map((e) => e.id);
    let allSplits: ExpenseSplit[] = [];
    if (expenseIds.length > 0) {
      const splitsRes = await supabase
        .from('expense_splits')
        .select('*')
        .in('expense_id', expenseIds);
      allSplits = (splitsRes.data ?? []) as ExpenseSplit[];
    }

    const nextSummaries: GroupSummary[] = groups.map((g) => {
      const members = allMembers.filter((m) => m.group_id === g.id);
      const expenses = allExpenses.filter((e) => e.group_id === g.id);
      const expIdSet = new Set(expenses.map((e) => e.id));
      const splits = allSplits.filter((s) => expIdSet.has(s.expense_id));
      const settlements = allSettlements.filter((st) => st.group_id === g.id);

      const balances = computeMemberBalances(members, expenses, splits, settlements);
      const myMember = members.find((m) => m.user_id === user.id);
      const myBalanceCents = myMember ? (balances[myMember.id] ?? 0) : 0;
      const totalSpentCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

      return {
        group: g,
        members,
        totalSpentCents,
        myBalanceCents,
      };
    });

    setSummaries(nextSummaries);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const initial = (profile?.display_name || user?.email || 'A').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGroups();
            }}
            tintColor={palette.coralAccent}
          />
        }>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <TakoMascot state="idle" size={38} interactive={false} />
            <Text style={[styles.wordmark, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              tako
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.avatarBtn, { backgroundColor: palette.coralSoft }]}>
            <Text style={[styles.avatarText, { color: palette.plum, fontFamily: TakoFonts.black }]}>
              {initial}
            </Text>
          </Pressable>
        </View>

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
            <Pressable
              onPress={() => router.push('/group/new-split')}
              style={({ pressed }) => [
                styles.heroPrimaryBtn,
                { backgroundColor: palette.coral },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}>
              <Ionicons name="add" size={18} color={palette.plum} />
              <Text style={[styles.heroPrimaryText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                New split
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/scan')}
              style={({ pressed }) => [
                styles.heroOutlineBtn,
                pressed && { opacity: 0.8 },
              ]}>
              <Ionicons name="qr-code-outline" size={16} color="#FFF6EE" />
              <Text style={[styles.heroOutlineText, { fontFamily: TakoFonts.bold }]}>
                Scan to join
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Active splits
          </Text>
          {summaries.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/activity')}>
              <Text style={[styles.seeAll, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                See all
              </Text>
            </Pressable>
          )}
        </View>

        {/* Splits List */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={palette.coralAccent} />
          </View>
        ) : summaries.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}>
            <TakoMascot state="sad" size={116} interactive />
            <Text style={[styles.emptyTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              No active splits yet
            </Text>
            <Text style={[styles.emptyBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Tap “+ New split” above to create a bill and get a QR code, or “Scan to join” to hop into a friend’s split.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {summaries.map(({ group, members, totalSpentCents, myBalanceCents }, idx) => {
              const badgeLetter = group.name.trim().charAt(0).toUpperCase() || 'T';
              const isOwe = myBalanceCents < -1;
              const isOwed = myBalanceCents > 1;
              const badgeBg = isOwe
                ? palette.coralSoft
                : isOwed
                  ? palette.tealSoft
                  : palette.tealSoft;
              const avatarBg =
                idx % 2 === 0 ? palette.coralSoft : palette.tealSoft;
              const displayAmt = Math.abs(myBalanceCents) <= 1 ? 0 : Math.abs(myBalanceCents);

              return (
                <Pressable
                  key={group.id}
                  onPress={() => router.push(`/group/${group.id}`)}
                  style={({ pressed }) => [
                    styles.splitCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 },
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
                    <Text style={[styles.splitMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
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
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    gap: 18,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
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
  centerState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 2,
  },
  splitName: {
    fontSize: 16,
  },
  splitMeta: {
    fontSize: 13,
  },
  splitRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  splitAmt: {
    fontSize: 16,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 11,
  },
});
