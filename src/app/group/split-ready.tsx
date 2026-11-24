import Ionicons from '@expo/vector-icons/Ionicons';
import * as Brightness from 'expo-brightness';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { Easing, FadeIn, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { QRCodeCard } from '@/components/QRCodeCard';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { useToast } from '@/components/Toast';
import { Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { supabase } from '@/lib/supabase';
import type { Expense, Group, GroupMember } from '@/types/tako';

export default function SplitReadyScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { palette } = useTakoTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(Boolean(groupId));

  const prevBrightnessRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;

      activateKeepAwakeAsync('split-ready-qr').catch(() => {});

      Brightness.getBrightnessAsync()
        .then((curr) => {
          prevBrightnessRef.current = curr;
          return Brightness.setBrightnessAsync(0.95);
        })
        .catch(() => {});

      return () => {
        deactivateKeepAwake('split-ready-qr').catch(() => {});
        if (prevBrightnessRef.current !== null) {
          Brightness.setBrightnessAsync(prevBrightnessRef.current).catch(() => {});
        }
      };
    }, [])
  );

  useEffect(() => {
    if (!groupId) {
      return;
    }
    let cancelled = false;
    (async () => {
      if (userId) {
        const { snapshot } = await fetchAndCacheSnapshot(userId);
        if (cancelled) return;
        const cachedGroup = snapshot.groups.find((g) => g.id === groupId);
        if (cachedGroup) {
          setGroup(cachedGroup);
          setMembers(
            snapshot.members
              .filter((m) => m.group_id === groupId)
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
          );
          setExpenses(snapshot.expenses.filter((e) => e.group_id === groupId));
          setLoading(false);
          return;
        }
      }
      if (groupId.startsWith('local_')) {
        setLoading(false);
        return;
      }
      const [gRes, mRes, eRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
        supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true }),
        supabase.from('expenses').select('*').eq('group_id', groupId),
      ]);
      if (cancelled) return;
      if (gRes.data) setGroup(gRes.data as Group);
      setMembers((mRes.data ?? []) as GroupMember[]);
      setExpenses((eRes.data ?? []) as Expense[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, userId]);

  // Realtime listener for friends joining live
  useEffect(() => {
    if (!groupId || groupId.startsWith('local_')) return;
    const channel = supabase
      .channel(`group-members-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const joined = payload.new as GroupMember;
          setMembers((prev) => {
            if (prev.some((m) => m.id === joined.id)) return prev;
            return [...prev, joined];
          });
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          showToast({ message: `${joined.name} joined!`, tone: 'success' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, showToast]);

  const totalCents = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [expenses]
  );

  const fullCode = group ? `TAKO-${group.invite_code}` : '';
  const joinUrl = fullCode ? `tako://join/${fullCode}` : '';

  const handleShare = async () => {
    if (!group) return;
    await Share.share({
      message: `Join "${group.name}" on Tako${totalCents > 0 ? ` (${formatPeso(totalCents)})` : ''}!\nTap to join: ${joinUrl}\nOr enter code: ${fullCode}`,
    }).catch(() => {});
  };

  if (loading || !group) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.coral} />
        </View>
      </SafeAreaView>
    );
  }

  const joinedMembers = members.filter((m) => m.user_id !== null);
  const displayBadges = (joinedMembers.length >= 2 ? joinedMembers : members.slice(0, 2));
  const joinedCount = Math.max(2, joinedMembers.length);
  const waitingCount = Math.max(0, members.length - joinedCount);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(`/group/${group.id}`);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.iconBtn}
          hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color="#FFF6EE" />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: TakoFonts.bold }]}>
          Split ready
        </Text>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share invite"
          style={styles.iconBtn}
          hitSlop={10}>
          <Ionicons name="share-outline" size={19} color="#FFF6EE" />
        </Pressable>
      </View>

      <View
        style={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}>
        <View style={styles.cardSection}>
          {/* Tako peeking cleanly over QR card */}
          <View style={styles.mascotPeek}>
            <TakoMascot state="peek" size={104} hidePeekCard interactive />
          </View>

          <Animated.View
            entering={
              reducedMotion
                ? undefined
                : FadeIn.duration(220).easing(Easing.out(Easing.cubic))
            }
            style={styles.qrWrap}>
            <QRCodeCard
              code={fullCode}
              joinUrl={joinUrl}
              groupName={group.name}
            />
          </Animated.View>

          {/* Joined pills below card */}
          <View style={styles.joinedRow}>
            <View style={styles.avatarStack}>
              {displayBadges.map((m, i) => (
                <View
                  key={m.id}
                  style={[
                    styles.miniAvatar,
                    { backgroundColor: m.color, marginLeft: i === 0 ? 0 : -6 },
                  ]}>
                  <Text style={[styles.miniInitial, { fontFamily: TakoFonts.black }]}>
                    {m.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.joinedText, { fontFamily: TakoFonts.regular }]}>
              {waitingCount > 0
                ? `${displayBadges.length} joined · waiting for ${waitingCount} more`
                : `${members.length} joined · ready to split`}
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            label="Share invite link"
            icon="share-outline"
            onPress={handleShare}
          />

          <SpringPressable
            onPress={() => router.replace(`/group/${group.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Done"
            style={styles.outlineBtn}>
            <Text style={[styles.outlineText, { fontFamily: TakoFonts.bold }]}>
              Done
            </Text>
          </SpringPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFF6EE',
    fontSize: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  cardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotPeek: {
    alignItems: 'center',
    marginBottom: -12,
    zIndex: 0,
  },
  qrWrap: {
    width: '100%',
    zIndex: 2,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2B1B3D',
  },
  miniInitial: {
    color: '#2B1B3D',
    fontSize: 12,
  },
  joinedText: {
    color: '#D5C7E8',
    fontSize: 13,
  },
  actions: {
    gap: 10,
    paddingTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    paddingVertical: 16,
  },
  primaryText: {
    fontSize: 15,
  },
  outlineBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,246,238,0.28)',
  },
  outlineText: {
    color: '#FFF6EE',
    fontSize: 15,
  },
});
