import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPeso } from '@/components/AnimatedPeso';
import { FieldError } from '@/components/FieldError';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { splitEqually } from '@/lib/split';
import { saveItemClaims } from '@/lib/takoData';
import type { Group } from '@/types/tako';

interface ClaimableItem {
  id: string;
  title: string;
  amountCents: number;
  claimedBy: string[];
}

interface PersonTab {
  id: string;
  name: string;
  initial: string;
  color: string;
  isMe?: boolean;
}

const FALLBACK_COLORS = ['#FF7A8A', '#2EC4B6', '#B9A5E8', '#F5D6BA', '#6C9BFF', '#FFC857'];

export default function WhoHadWhatScreen() {
  const { groupId, splitName, hostName, fromCreation, fromJoin } = useLocalSearchParams<{
    groupId?: string;
    splitName?: string;
    hostName?: string;
    fromCreation?: string;
    fromJoin?: string;
  }>();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cardElevation = getCardElevation(isDark);

  const [group, setGroup] = useState<Group | null>(null);
  const [people, setPeople] = useState<PersonTab[]>([]);
  const [activePersonId, setActivePersonId] = useState<string>('');
  const [hostMemberId, setHostMemberId] = useState<string>('');
  const [items, setItems] = useState<ClaimableItem[]>([]);
  const [hasDbExpenses, setHasDbExpenses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnassignedHighlight, setShowUnassignedHighlight] = useState(false);

  useEffect(() => {
    if (!groupId || !userId) return;
    let cancelled = false;
    fetchAndCacheSnapshot(userId).then(({ snapshot }) => {
      if (cancelled) return;
      const foundGroup = snapshot.groups.find((g) => g.id === groupId) ?? null;
      if (foundGroup) setGroup(foundGroup);

      const dbMembers = snapshot.members
        .filter((m) => m.group_id === groupId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const dbExpenses = snapshot.expenses
        .filter((e) => e.group_id === groupId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      if (dbMembers.length >= 1) {
        const payerId = dbExpenses[0]?.paid_by_member_id ?? dbMembers[0].id;
        setHostMemberId(payerId);

        const me = dbMembers.find((m) => m.user_id === userId) ?? dbMembers[dbMembers.length - 1];
        const sorted = [me, ...dbMembers.filter((m) => m.id !== me.id)];
        const mappedPeople: PersonTab[] = sorted.map((m, idx) => ({
          id: m.id,
          name: m.id === me.id ? `${m.name} (You)` : m.name,
          initial: m.id === me.id ? 'Y' : m.name.charAt(0).toUpperCase(),
          color: m.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
          isMe: m.id === me.id,
        }));
        setPeople(mappedPeople);
        setActivePersonId(mappedPeople[0].id);

        if (dbExpenses.length > 0) {
          setHasDbExpenses(true);
          const expIdSet = new Set(dbExpenses.map((e) => e.id));
          const dbSplits = snapshot.splits.filter((s) => expIdSet.has(s.expense_id));
          const allIds = mappedPeople.map((p) => p.id);

          setItems(
            dbExpenses.map((exp) => {
              const expSplits = dbSplits.filter(
                (s) => s.expense_id === exp.id && s.amount_cents > 0
              );
              return {
                id: exp.id,
                title: exp.title,
                amountCents: exp.amount_cents,
                claimedBy: expSplits.length > 0 ? expSplits.map((s) => s.member_id) : allIds,
              };
            })
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, userId]);

  const toggleItem = (itemId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.claimedBy.includes(activePersonId);
        return {
          ...item,
          claimedBy: has
            ? item.claimedBy.filter((id) => id !== activePersonId)
            : [...item.claimedBy, activePersonId],
        };
      })
    );
  };

  const myPersonId = people.find((p) => p.isMe)?.id ?? people[0]?.id ?? '';
  const activePerson = people.find((p) => p.id === activePersonId) ?? people[0];

  const { activeClaimedCount, activeShareCents, myShareCents } = useMemo(() => {
    let activeCount = 0;
    let activeCents = 0;
    let myCents = 0;
    for (const item of items) {
      const claimants = item.claimedBy.length > 0 ? item.claimedBy : people.map((p) => p.id);
      const rows = splitEqually(item.amountCents, claimants);
      const activeRow = rows.find((r) => r.member_id === activePersonId);
      if (item.claimedBy.includes(activePersonId) && activeRow) {
        activeCount += 1;
        activeCents += activeRow.amount_cents;
      }
      const myRow = rows.find((r) => r.member_id === myPersonId);
      if (item.claimedBy.includes(myPersonId) && myRow) {
        myCents += myRow.amount_cents;
      }
    }
    return {
      activeClaimedCount: activeCount,
      activeShareCents: activeCents,
      myShareCents: myCents,
    };
  }, [items, activePersonId, myPersonId, people]);

  const getItemSubtitle = (item: ClaimableItem): { text: string; isUnclaimed: boolean } => {
    if (item.claimedBy.length === 0) {
      return { text: 'Not claimed', isUnclaimed: true };
    }
    if (item.claimedBy.length >= people.length) {
      return { text: 'Shared by all', isUnclaimed: false };
    }
    if (item.claimedBy.length === 1 && item.claimedBy[0] === myPersonId) {
      return { text: 'Just you', isUnclaimed: false };
    }
    const otherNames = item.claimedBy
      .filter((id) => id !== myPersonId)
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean);
    if (item.claimedBy.includes(myPersonId) && otherNames.length > 0) {
      return { text: `Shared with ${otherNames.join(', ')}`, isUnclaimed: false };
    }
    const allNames = item.claimedBy
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean);
    return { text: allNames.join(', '), isUnclaimed: false };
  };

  const handleConfirm = async () => {
    if (saving) return;
    const hasUnassigned = items.some((it) => it.claimedBy.length === 0);
    if (hasUnassigned) {
      setShowUnassignedHighlight(true);
      setError('Assign every item to at least one person before continuing.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    setError(null);
    setShowUnassignedHighlight(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    if (groupId && hasDbExpenses && items.length > 0 && userId) {
      setSaving(true);
      const res = await saveItemClaims({
        userId,
        groupId,
        items: items.map((it) => ({
          expenseId: it.id,
          amountCents: it.amountCents,
          claimedBy: it.claimedBy,
        })),
        allPersonIds: people.map((p) => p.id),
      });
      setSaving(false);
      if (!res.ok) {
        setError(res.error);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
        return;
      }
    }

    if (fromCreation === '1') {
      router.replace({
        pathname: '/group/split-ready',
        params: { groupId: groupId ?? group?.id ?? '' },
      });
      return;
    }

    if (fromJoin === '1' && myPersonId && hostMemberId && myPersonId !== hostMemberId && myShareCents > 0) {
      const recipient =
        hostName ||
        people.find((p) => p.id === hostMemberId)?.name.replace(' (You)', '') ||
        'Host';
      router.replace({
        pathname: '/group/settle-up',
        params: {
          groupId: groupId ?? group?.id ?? '',
          amountCents: String(myShareCents),
          recipientName: recipient,
          splitName: group?.name ?? splitName ?? 'Split',
          fromMemberId: myPersonId,
          toMemberId: hostMemberId,
        },
      });
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/group/${groupId ?? group?.id ?? ''}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Who had what?
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.subtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
          Tap the items you had. Shared items split evenly.
        </Text>

        {/* Member Selector Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberChipsScroll}>
          {people.map((p) => {
            const selected = p.id === activePersonId;
            return (
              <SpringPressable
                key={p.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync().catch(() => {});
                  }
                  setActivePersonId(p.id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[
                  styles.memberChip,
                  {
                    backgroundColor: selected ? palette.plum : palette.surface,
                    borderColor: selected ? palette.plum : palette.border,
                  },
                  !selected && cardElevation,
                ]}>
                <View style={[styles.personCircle, { backgroundColor: p.color }]}>
                  <Text style={[styles.personInitial, { fontFamily: TakoFonts.black }]}>
                    {p.initial}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.memberChipName,
                    {
                      color: selected ? '#FFF6EE' : palette.ink,
                      fontFamily: TakoFonts.bold,
                    },
                  ]}>
                  {p.name}
                </Text>
              </SpringPressable>
            );
          })}
        </ScrollView>

        {/* Checkable Items Card */}
        {items.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border, padding: 20 },
            ]}>
            <Text style={{ color: palette.mute, fontFamily: TakoFonts.regular, textAlign: 'center', fontSize: 13 }}>
              No items found in this split yet.
            </Text>
          </View>
        ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardElevation,
          ]}>
          {items.map((item, idx) => {
            const checked = item.claimedBy.includes(activePersonId);
            const sub = getItemSubtitle(item);
            const isUnassignedError = showUnassignedHighlight && item.claimedBy.length === 0;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setError(null);
                  toggleItem(item.id);
                }}
                style={[
                  styles.itemRow,
                  isUnassignedError && { backgroundColor: palette.destructiveSoft },
                  idx < items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: palette.border,
                  },
                ]}>
                <View
                  style={[
                    styles.checkbox,
                    checked
                      ? { backgroundColor: palette.ctaBg, borderColor: palette.ctaBg }
                      : { borderColor: palette.border, backgroundColor: 'transparent' },
                  ]}>
                  {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      {
                        color: sub.isUnclaimed ? palette.coralAccent : palette.mute,
                        fontFamily: sub.isUnclaimed ? TakoFonts.bold : TakoFonts.regular,
                      },
                    ]}>
                    {sub.text}
                  </Text>
                </View>

                <Text style={[styles.itemAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                  {formatPeso(item.amountCents)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        )}

        {/* Dark Plum Summary Bar */}
        <View style={[styles.summaryBar, { backgroundColor: palette.plum }]}>
          <View>
            <Text style={[styles.summaryBarLabel, { fontFamily: TakoFonts.bold }]}>
              {activePerson?.isMe ? 'Your share' : `${activePerson?.name}’s share`}
            </Text>
            <Text style={[styles.summaryBarSub, { fontFamily: TakoFonts.regular }]}>
              {activeClaimedCount} {activeClaimedCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <AnimatedPeso
            cents={activeShareCents}
            style={[styles.summaryBarAmt, { fontFamily: TakoFonts.black }]}
          />
        </View>

        <FieldError message={error} />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        <PrimaryButton
          label={
            fromCreation === '1'
              ? 'Save & get QR code'
              : fromJoin === '1'
                ? 'Confirm & settle up'
                : 'Save item split'
          }
          onPress={handleConfirm}
          loading={saving}
          accessibilityLabel="Confirm item split"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  subtitle: {
    fontSize: 13,
  },
  memberChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 14,
    minHeight: 44,
    borderRadius: Radii.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
  personCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    color: '#2B1B3D',
    fontSize: 13,
  },
  memberChipName: {
    fontSize: 14,
    flexShrink: 1,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
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
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: Radii.xl,
  },
  summaryBarLabel: {
    color: '#FFF6EE',
    fontSize: 14,
  },
  summaryBarSub: {
    color: '#C7B8DB',
    fontSize: 12,
    marginTop: 2,
  },
  summaryBarAmt: {
    color: '#FFF6EE',
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ctaBtn: {
    borderRadius: Radii.pill,
    minHeight: 52,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
});
