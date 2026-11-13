import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QRCodeCard } from '@/components/QRCodeCard';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Group, GroupMember } from '@/types/tako';

export default function SplitReadyScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { palette } = useTakoTheme();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
      supabase.from('group_members').select('*').eq('group_id', groupId),
    ]).then(([gRes, mRes]) => {
      if (gRes.data) setGroup(gRes.data as Group);
      setMembers((mRes.data ?? []) as GroupMember[]);
      setLoading(false);
    });
  }, [groupId]);

  const handleShare = async () => {
    if (!group) return;
    await Share.share({
      message: `Join "${group.name}" on Tako! Code: TAKO-${group.invite_code}`,
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color="#FFF6EE" />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: TakoFonts.bold }]}>
          Split ready
        </Text>
        <Pressable onPress={handleShare} style={styles.iconBtn} hitSlop={10}>
          <Ionicons name="share-outline" size={20} color="#FFF6EE" />
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Tako peeking over QR card */}
        <View style={styles.mascotPeek}>
          <TakoMascot state="peek" size={110} hidePeekCard interactive />
        </View>

        <View style={styles.qrWrap}>
          <QRCodeCard
            code={`TAKO-${group.invite_code}`}
            groupName={group.name}
            emoji={group.emoji}
          />
        </View>

        {/* Joined pills */}
        <View style={styles.joinedRow}>
          <View style={styles.avatarStack}>
            {members.slice(0, 4).map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.miniAvatar,
                  { backgroundColor: m.color, marginLeft: i === 0 ? 0 : -8 },
                ]}>
                <Text style={[styles.miniInitial, { fontFamily: TakoFonts.black }]}>
                  {m.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.joinedText, { fontFamily: TakoFonts.regular }]}>
            {members.length} in split · share QR so others can join
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: palette.coral },
              pressed && { opacity: 0.9 },
            ]}>
            <Ionicons name="share-outline" size={18} color={palette.plum} />
            <Text style={[styles.primaryText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
              Share invite link
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace(`/group/${group.id}`)}
            style={({ pressed }) => [
              styles.outlineBtn,
              pressed && { opacity: 0.8 },
            ]}>
            <Text style={[styles.outlineText, { fontFamily: TakoFonts.bold }]}>
              Done
            </Text>
          </Pressable>
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    justifyContent: 'center',
    gap: 18,
  },
  mascotPeek: {
    alignItems: 'center',
    marginBottom: -20,
    zIndex: 0,
  },
  qrWrap: {
    zIndex: 2,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2B1B3D',
  },
  miniInitial: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  joinedText: {
    color: '#D5C7E8',
    fontSize: 13,
  },
  actions: {
    gap: 10,
    marginTop: 4,
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
    fontSize: 16,
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
    fontSize: 16,
  },
});
