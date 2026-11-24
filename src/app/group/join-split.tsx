import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

interface PreviewMember {
  id?: string;
  name: string;
  color: string;
  is_placeholder?: boolean;
  is_me?: boolean;
}

export default function JoinSplitScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    name?: string;
    totalCents?: string;
    itemCount?: string;
    memberCount?: string;
    paidBy?: string;
    membersJson?: string;
  }>();
  const { palette, isDark } = useTakoTheme();
  const { profile, user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cardElevation = getCardElevation(isDark);

  const myDisplayName = (profile?.display_name || user?.email?.split('@')[0] || 'Friend').trim();

  const code = params.code || '';
  const splitName = params.name || 'Split';
  const totalCents = parseInt(params.totalCents ?? '0', 10) || 0;
  const itemCount = parseInt(params.itemCount ?? '1', 10) || 1;
  const memberCount = parseInt(params.memberCount ?? '1', 10) || 1;
  const hostName = params.paidBy || 'Host';

  const parsedMembers: PreviewMember[] = useMemo(() => {
    if (!params.membersJson) return [];
    try {
      return JSON.parse(params.membersJson) as PreviewMember[];
    } catch {
      return [];
    }
  }, [params.membersJson]);

  const placeholders = useMemo(
    () => parsedMembers.filter((m) => m.is_placeholder && m.id),
    [parsedMembers]
  );

  const alreadyJoinedMe = useMemo(
    () => parsedMembers.find((m) => m.is_me),
    [parsedMembers]
  );

  const defaultClaimId = useMemo(() => {
    const match = placeholders.find(
      (p) => p.name.trim().toLowerCase() === myDisplayName.toLowerCase()
    );
    return match?.id ?? null;
  }, [placeholders, myDisplayName]);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(defaultClaimId);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveMemberCount = useMemo(() => {
    if (alreadyJoinedMe || selectedClaimId) {
      return Math.max(1, memberCount);
    }
    return Math.max(1, memberCount + 1);
  }, [alreadyJoinedMe, selectedClaimId, memberCount]);

  const shareCents = Math.round(totalCents / effectiveMemberCount);

  const handleConfirmJoin = async () => {
    setError(null);
    setJoining(true);

    const { data: joinedGroupId, error: joinErr } = await supabase.rpc('join_group_by_code', {
      p_code: code,
      p_member_name: myDisplayName,
      p_claim_member_id: selectedClaimId,
    });

    if (joinErr || !joinedGroupId) {
      setError(joinErr?.message ?? 'Could not join split.');
      setJoining(false);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setJoining(false);
    if (itemCount > 1) {
      router.replace({
        pathname: '/group/who-had-what',
        params: {
          groupId: String(joinedGroupId),
          splitName,
          hostName,
          fromJoin: '1',
        },
      });
    } else {
      router.replace(`/group/${String(joinedGroupId)}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <SpringPressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </SpringPressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Join split
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View
        style={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, 20) + 8 },
        ]}>
        <ScrollView
          contentContainerStyle={styles.centerStack}
          showsVerticalScrollIndicator={false}>
          <View style={styles.mascotPeek}>
            <TakoMascot state="wave" size={108} interactive />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            <Text style={[styles.invitedBy, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              {hostName} invited you to
            </Text>
            <Text style={[styles.splitTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {splitName}
            </Text>

            {/* 3 Colored Info Pills */}
            <View style={styles.pillsRow}>
              <View style={[styles.infoPill, { backgroundColor: palette.coralSoft }]}>
                <Text style={[styles.infoPillText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                  {effectiveMemberCount} people
                </Text>
              </View>
              <View style={[styles.infoPill, { backgroundColor: palette.tealSoft }]}>
                <Text style={[styles.infoPillText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={[styles.infoPill, { backgroundColor: palette.lavenderSoft }]}>
                <Text style={[styles.infoPillText, { color: isDark ? palette.ink : palette.plum, fontFamily: TakoFonts.bold }]}>
                  {formatPeso(totalCents)}
                </Text>
              </View>
            </View>

            {/* Overlapping Member Avatars */}
            {parsedMembers.length > 0 && (
              <View style={styles.membersRow}>
                <View style={styles.avatarStack}>
                  {parsedMembers.slice(0, 5).map((m, idx) => (
                    <View
                      key={`${m.name}-${idx}`}
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: m.color || '#FF7A8A',
                          marginLeft: idx === 0 ? 0 : -8,
                          borderColor: palette.surface,
                        },
                      ]}>
                      <Text style={[styles.avatarText, { fontFamily: TakoFonts.black }]}>
                        {m.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.membersText, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                  {parsedMembers.map((m) => m.name).join(', ')}
                </Text>
              </View>
            )}

            {/* Placeholder Claim Selector (if host pre-added friends manually) */}
            {!alreadyJoinedMe && placeholders.length > 0 && (
              <View style={[styles.claimSection, { borderColor: palette.border }]}>
                <Text style={[styles.claimTitle, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  ARE YOU ONE OF THESE FRIENDS?
                </Text>
                <View style={styles.claimChipsWrap}>
                  {placeholders.map((p) => {
                    const active = selectedClaimId === p.id;
                    return (
                      <SpringPressable
                        key={p.id}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                          setSelectedClaimId(p.id ?? null);
                        }}
                        style={[
                          styles.claimChip,
                          {
                            backgroundColor: active ? palette.plum : palette.chip,
                          },
                        ]}>
                        <View style={[styles.claimDot, { backgroundColor: p.color }]} />
                        <Text
                          style={[
                            styles.claimChipText,
                            {
                              color: active ? '#FFF6EE' : palette.ink,
                              fontFamily: TakoFonts.bold,
                            },
                          ]}>
                          I’m {p.name}
                        </Text>
                        {active && <Ionicons name="checkmark" size={14} color="#FFF6EE" />}
                      </SpringPressable>
                    );
                  })}

                  <SpringPressable
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync().catch(() => {});
                      }
                      setSelectedClaimId(null);
                    }}
                    style={[
                      styles.claimChip,
                      {
                        backgroundColor: selectedClaimId === null ? palette.plum : palette.chip,
                      },
                    ]}>
                    <Ionicons
                      name="person-add-outline"
                      size={13}
                      color={selectedClaimId === null ? '#FFF6EE' : palette.ink}
                    />
                    <Text
                      style={[
                        styles.claimChipText,
                        {
                          color: selectedClaimId === null ? '#FFF6EE' : palette.ink,
                          fontFamily: TakoFonts.bold,
                        },
                      ]}>
                      Join as {myDisplayName} (new)
                    </Text>
                  </SpringPressable>
                </View>
              </View>
            )}

            {/* Your share box */}
            <View style={[styles.shareBox, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.shareLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Estimated equal share
              </Text>
              <Text style={[styles.shareAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {formatPeso(shareCents)}
              </Text>
            </View>

            {error && (
              <Text style={{ color: palette.coralAccent, fontFamily: TakoFonts.bold, fontSize: 13 }}>
                {error}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <PrimaryButton
            label={
              alreadyJoinedMe
                ? 'Open split'
                : selectedClaimId
                  ? `Join as ${placeholders.find((p) => p.id === selectedClaimId)?.name ?? myDisplayName}`
                  : 'Join split'
            }
            onPress={handleConfirmJoin}
            loading={joining}
          />

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={styles.notNowBtn}>
            <Text style={[styles.notNowText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              Not now
            </Text>
          </Pressable>
        </View>
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  centerStack: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mascotPeek: {
    marginBottom: -22,
    zIndex: 0,
  },
  card: {
    width: '100%',
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  invitedBy: { fontSize: 13 },
  splitTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginTop: -4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  infoPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  infoPillText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    maxWidth: '100%',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2B1B3D',
    fontSize: 11,
  },
  membersText: { fontSize: 13, flexShrink: 1 },
  claimSection: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  claimTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  claimChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  claimChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: Radii.pill,
  },
  claimDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  claimChipText: {
    fontSize: 13,
  },
  shareBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: 4,
  },
  shareLabel: { fontSize: 13 },
  shareAmt: {
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  bottomActions: {
    gap: 10,
    paddingTop: 8,
  },
  notNowBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  notNowText: { fontSize: 14 },
});
