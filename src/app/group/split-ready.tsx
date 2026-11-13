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
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { QRCodeCard } from '@/components/QRCodeCard';
import { Skeleton } from '@/components/Skeleton';
import { TakoMascot } from '@/components/TakoMascot';
import { useToast } from '@/components/Toast';
import { Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Expense, Group, GroupMember, TakoState } from '@/types/tako';

function generateInviteDigits(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function SplitReadyScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { palette, isDark } = useTakoTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [mascotState, setMascotState] = useState<TakoState>('celebrate');

  const prevBrightnessRef = useRef<number | null>(null);
  const pulseOpacity = useSharedValue(1);

  // One-shot celebration on arrival, then settle to idle
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    const timer = setTimeout(() => setMascotState('idle'), 1600);
    return () => clearTimeout(timer);
  }, []);

  // Subtle pulse for "Waiting for friends" empty state
  useEffect(() => {
    if (reducedMotion) return;
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulseOpacity, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : pulseOpacity.value,
  }));

  // Boost screen brightness & keep screen awake while focused
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

  const loadSplit = useCallback(async (showSpinner = false) => {
    if (!groupId) {
      setErrorMsg('Missing split ID.');
      setLoading(false);
      return;
    }
    if (showSpinner) {
      setErrorMsg(null);
      setLoading(true);
    }

    try {
      const [gRes, mRes, eRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
        supabase.from('group_members').select('*').eq('group_id', groupId).order('created_at', { ascending: true }),
        supabase.from('expenses').select('*').eq('group_id', groupId),
      ]);

      if (gRes.error || !gRes.data) {
        setErrorMsg(gRes.error?.message ?? 'Could not load split details.');
      } else {
        setErrorMsg(null);
        setGroup(gRes.data as Group);
        setMembers((mRes.data ?? []) as GroupMember[]);
        setExpenses((eRes.data ?? []) as Expense[]);
      }
    } catch {
      setErrorMsg('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadSplit(false));
  }, [loadSplit]);

  // Realtime listener for friends joining live
  useEffect(() => {
    if (!groupId) return;
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

  const perPersonCents = useMemo(() => {
    if (members.length === 0 || totalCents === 0) return 0;
    return Math.round(totalCents / members.length);
  }, [members.length, totalCents]);

  const paidByName = useMemo(() => {
    const firstExp = expenses[0];
    if (!firstExp) return members[0]?.name ?? 'You';
    return members.find((m) => m.id === firstExp.paid_by_member_id)?.name ?? 'You';
  }, [expenses, members]);

  const fullCode = group ? `TAKO-${group.invite_code}` : '';
  const joinUrl = fullCode ? `tako://join/${fullCode}` : '';

  const handleShare = async () => {
    if (!group) return;
    await Share.share({
      message: `Join "${group.name}" on Tako (${formatPeso(totalCents)})!\nTap to join: ${joinUrl}\nOr enter code: ${fullCode}`,
    }).catch(() => {});
  };

  const handleRegenerateCode = async () => {
    if (!group) return;
    setRegenerating(true);
    const nextDigits = generateInviteDigits();
    const { data, error } = await supabase
      .from('groups')
      .update({ invite_code: nextDigits })
      .eq('id', group.id)
      .select()
      .single();

    setRegenerating(false);
    if (error || !data) {
      showToast({ message: error?.message ?? 'Could not regenerate code.', tone: 'error' });
      return;
    }
    setGroup(data as Group);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    showToast({ message: `New code: TAKO-${nextDigits}`, tone: 'success' });
  };

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <Skeleton height={44} borderRadius={Radii.lg} />
          <Skeleton height={116} borderRadius={Radii.xl} />
          <Skeleton height={300} borderRadius={Radii.xl} />
          <Text style={[styles.loadingHint, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Generating your split QR...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !group) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <View style={styles.errorCenter}>
          <TakoMascot state="think" size={120} />
          <Text style={[styles.errorTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Couldn’t load split QR
          </Text>
          <Text style={[styles.errorSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
            {errorMsg ?? 'Something went wrong.'}
          </Text>
          <View style={styles.errorBtns}>
            <Pressable
              onPress={() => loadSplit(true)}
              style={[styles.primaryBtn, { backgroundColor: palette.coral, paddingHorizontal: 28 }]}>
              <Text style={[styles.primaryText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Retry
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={[styles.secondaryBtn, { borderColor: palette.border, paddingHorizontal: 24 }]}>
              <Text style={[styles.secondaryText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Go back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="close" size={20} color={palette.ink} />
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Split created
        </Text>
        <View style={styles.headerMascot}>
          <TakoMascot state={mascotState} size={46} interactive={false} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow,
          ]}>
          <View style={styles.summaryTop}>
            <Text
              style={[styles.summaryName, { color: palette.ink, fontFamily: TakoFonts.black }]}
              numberOfLines={2}>
              {group.name}
            </Text>
            <Text style={[styles.summaryAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {formatPeso(totalCents)}
            </Text>
          </View>
          <Text style={[styles.summaryMeta, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Paid by {paidByName} · {formatPeso(perPersonCents)} each ({members.length}{' '}
            {members.length === 1 ? 'person' : 'people'})
          </Text>
        </View>

        {/* QR Card */}
        <QRCodeCard
          code={fullCode}
          joinUrl={joinUrl}
          groupName={group.name}
          onRegenerate={handleRegenerateCode}
          regenerating={regenerating}
        />

        {/* Waiting for friends */}
        <View
          style={[
            styles.waitingCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow,
          ]}>
          <View style={styles.waitingHeader}>
            <Text style={[styles.waitingTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              In this split ({members.length})
            </Text>
            {members.length <= 1 && (
              <Animated.View style={[styles.waitingPill, { backgroundColor: palette.coralSoft }, pulseStyle]}>
                <View style={[styles.pulseDot, { backgroundColor: palette.coralAccent }]} />
                <Text style={[styles.waitingPillText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                  Waiting for friends
                </Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.avatarGrid}>
            {members.map((m, idx) => (
              <Animated.View
                key={m.id}
                entering={
                  reducedMotion
                    ? undefined
                    : FadeInUp.delay(Math.min(idx, 10) * 45).springify()
                }
                style={styles.memberChip}>
                <View style={[styles.miniAvatar, { backgroundColor: m.color }]}>
                  <Text style={[styles.miniInitial, { fontFamily: TakoFonts.black }]}>
                    {m.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[styles.memberChipName, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                  numberOfLines={1}>
                  {m.name}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: palette.bg,
            borderTopColor: palette.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share invite link"
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: palette.coral },
            pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
          ]}>
          <Ionicons name="share-outline" size={18} color={palette.plum} />
          <Text style={[styles.primaryText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
            Share link
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace(`/group/${group.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Done"
          style={({ pressed }) => [
            styles.secondaryBtn,
            { backgroundColor: palette.surface, borderColor: palette.border },
            pressed && { opacity: 0.85 },
          ]}>
          <Text style={[styles.secondaryText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
            Done
          </Text>
        </Pressable>
      </View>

      {regenerating && (
        <View style={styles.regenOverlay} pointerEvents="none">
          <ActivityIndicator color={palette.coralAccent} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  loadingHint: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: { fontSize: 20 },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
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
  topTitle: {
    fontSize: 18,
  },
  headerMascot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 16,
  },
  summaryCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 23,
  },
  summaryAmt: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  summaryMeta: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  waitingCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  waitingTitle: {
    fontSize: 14,
  },
  waitingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  waitingPillText: {
    fontSize: 11,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    maxWidth: 150,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  miniInitial: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  memberChipName: {
    fontSize: 13,
    flexShrink: 1,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: Radii.pill,
  },
  primaryText: {
    fontSize: 16,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 15,
  },
  regenOverlay: {
    position: 'absolute',
    top: 16,
    right: 70,
  },
});
