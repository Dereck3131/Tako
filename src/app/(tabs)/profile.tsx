import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TakoMascot } from '@/components/TakoMascot';
import { TakoSplash } from '@/components/TakoSplash';
import { Radii, TakoFonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme, type ThemePreference } from '@/context/ThemeContext';
import type { TakoState } from '@/types/tako';

const MASCOT_STATES: { key: TakoState; label: string }[] = [
  { key: 'idle', label: 'Idle' },
  { key: 'wave', label: 'Wave' },
  { key: 'celebrate', label: 'Celebrate' },
  { key: 'think', label: 'Think' },
  { key: 'coins', label: 'Split' },
  { key: 'peek', label: 'Peek' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'sad', label: 'Sad' },
];

export default function ProfileScreen() {
  const { palette, isDark, preference, setPreference } = useTakoTheme();
  const { profile, user, updateProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [editModal, setEditModal] = useState<'profile' | 'payment' | 'mascot' | null>(null);
  const [paymentLabel, setPaymentLabel] = useState('GCash');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [paymentHandle, setPaymentHandle] = useState(profile?.payment_handle ?? '');
  const [saving, setSaving] = useState(false);

  const [mascotState, setMascotState] = useState<TakoState>('idle');
  const [replaySplash, setReplaySplash] = useState(false);

  const initial = (profile?.display_name || user?.email || 'Y').trim().charAt(0).toUpperCase();

  const cycleAppearance = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(preference) + 1) % order.length];
    setPreference(next);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName.trim() || 'Tako Friend',
      payment_handle: paymentHandle.trim() || null,
    });
    setSaving(false);
    setEditModal(null);
  };

  const appearanceIcon =
    preference === 'light'
      ? 'sunny-outline'
      : preference === 'dark'
        ? 'moon-outline'
        : 'contrast-outline';

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
        ]}>
        <Text style={[styles.pageTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Profile
        </Text>

        {/* Guest Upgrade Banner */}
        {user?.is_anonymous && (
          <View
            style={[
              styles.guestBanner,
              { backgroundColor: palette.coralSoft, borderColor: palette.coral },
            ]}>
            <View style={styles.guestBannerCopy}>
              <Text style={[styles.guestBannerTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                You’re using a guest account
              </Text>
              <Text style={[styles.guestBannerSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Create an account so your splits are saved across devices.
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
              style={({ pressed }) => [
                styles.guestBannerBtn,
                { backgroundColor: palette.coralAccent },
                pressed && { opacity: 0.9 },
              ]}>
              <Text style={[styles.guestBannerBtnText, { fontFamily: TakoFonts.bold }]}>
                Sign up
              </Text>
            </Pressable>
          </View>
        )}

        {/* User Card */}
        <Pressable
          onPress={() => {
            setDisplayName(profile?.display_name ?? '');
            setEditModal('profile');
          }}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={[
            styles.userCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow,
          ]}>
          <View style={[styles.avatar, { backgroundColor: palette.coral }]}>
            <Text style={[styles.avatarText, { fontFamily: TakoFonts.black }]}>
              {initial}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: palette.ink, fontFamily: TakoFonts.bold }]} numberOfLines={1}>
              {profile?.display_name ?? 'Your name'}
            </Text>
            <Text style={[styles.userEmail, { color: palette.mute, fontFamily: TakoFonts.regular }]} numberOfLines={1}>
              {user?.is_anonymous ? 'Guest account' : (user?.email ?? 'you@email.com')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.mute} />
        </Pressable>

        {/* PAYMENT */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            PAYMENT
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardShadow,
            ]}>
            {(
              [
                { label: 'GCash', icon: 'phone-portrait-outline', bg: palette.tealSoft, color: palette.teal },
                { label: 'Maya', icon: 'wallet-outline', bg: palette.lavenderSoft, color: palette.lavender },
                { label: 'Bank accounts', icon: 'business-outline', bg: palette.coralSoft, color: palette.coralAccent },
              ] as const
            ).map((item, idx, arr) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setPaymentLabel(item.label);
                  setPaymentHandle(profile?.payment_handle ?? '');
                  setEditModal('payment');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Configure ${item.label}`}
                style={[
                  styles.row,
                  idx < arr.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: palette.border,
                  },
                ]}>
                <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={palette.mute} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* GENERAL */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            GENERAL
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardShadow,
            ]}>
            <Pressable
              onPress={cycleAppearance}
              accessibilityRole="button"
              accessibilityLabel={`Appearance: ${preference}`}
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: palette.lavenderSoft }]}>
                <Ionicons name={appearanceIcon} size={18} color={palette.ink} />
              </View>
              <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Appearance
              </Text>
              <Text style={[styles.rowValue, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                {preference.charAt(0).toUpperCase() + preference.slice(1)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={palette.mute} />
            </Pressable>

            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: palette.destructiveSoft }]}>
                <Ionicons name="log-out-outline" size={18} color={palette.destructive} />
              </View>
              <Text style={[styles.rowLabel, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                Sign out
              </Text>
              <Ionicons name="chevron-forward" size={18} color={palette.destructive} />
            </Pressable>
          </View>
        </View>

        {__DEV__ && (
          <Pressable
            onPress={() => setEditModal('mascot')}
            style={styles.devFooter}>
            <Text style={[styles.devFooterText, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Tako v1.0 · Mascot Playground
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Edit Name / Payment Modal */}
      <Modal
        visible={editModal === 'profile' || editModal === 'payment'}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {editModal === 'profile' ? 'Edit Profile' : paymentLabel}
              </Text>
              <Pressable onPress={() => setEditModal(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            {editModal === 'profile' ? (
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your display name"
                placeholderTextColor={palette.mute}
                style={[
                  styles.input,
                  { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
                ]}
              />
            ) : (
              <TextInput
                value={paymentHandle}
                onChangeText={setPaymentHandle}
                placeholder={`Enter your ${paymentLabel} number or handle`}
                placeholderTextColor={palette.mute}
                style={[
                  styles.input,
                  { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
                ]}
              />
            )}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: palette.coralAccent }]}>
              <Text style={[styles.saveBtnText, { fontFamily: TakoFonts.bold }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Tako Mascot Playground Modal */}
      <Modal
        visible={editModal === 'mascot'}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Tako Mascot
              </Text>
              <Pressable onPress={() => setEditModal(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TakoMascot state={mascotState} size={170} interactive />
            </View>

            <View style={[styles.ctl, { backgroundColor: palette.chip }]}>
              {MASCOT_STATES.map((item) => {
                const active = mascotState === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setMascotState(item.key)}
                    style={[styles.ctlBtn, active && { backgroundColor: palette.chipOn }]}>
                    <Text
                      style={[
                        styles.ctlText,
                        {
                          color: active ? palette.chipOnInk : palette.ink,
                          fontFamily: TakoFonts.bold,
                        },
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                setEditModal(null);
                setReplaySplash(true);
              }}
              style={[styles.saveBtn, { backgroundColor: palette.chip }]}>
              <Text style={[styles.replayText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Replay Intro Splash
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {replaySplash && <TakoSplash onFinish={() => setReplaySplash(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 112,
    gap: 20,
  },
  pageTitle: {
    fontSize: 30,
    letterSpacing: -0.6,
  },
  guestBanner: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestBannerCopy: {
    flex: 1,
    gap: 2,
  },
  guestBannerTitle: {
    fontSize: 14,
  },
  guestBannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  guestBannerBtn: {
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  devFooter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  devFooterText: {
    fontSize: 12,
  },
  userCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
  },
  userEmail: {
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
    minHeight: 54,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowValue: {
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    paddingBottom: 34,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
  },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  saveBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  replayText: {
    fontSize: 15,
  },
  ctl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
    borderRadius: Radii.xl,
  },
  ctlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  ctlText: {
    fontSize: 13,
  },
});
