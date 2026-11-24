import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AVATAR_CROP_SIZE,
  AvatarCropModal,
} from '@/components/AvatarCropModal';
import { BadgeUnlockedModal } from '@/components/BadgeUnlockedModal';
import { FieldError } from '@/components/FieldError';
import { LegendAvatarFrame } from '@/components/LegendAvatarFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoBadgeEmblem } from '@/components/TakoBadgeEmblem';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme, type ThemePreference } from '@/context/ThemeContext';
import {
  computeUserAwards,
  isLegendPreviewEnabled,
  type BadgeTier,
  type TakoBadge,
  type UserAwards,
} from '@/lib/awards';
import {
  cropAndUploadAvatar,
  deleteAvatarFromStorage,
  pickAvatarAsset,
} from '@/lib/avatarUpload';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { getSoundEnabled, playSound, setSoundEnabled } from '@/lib/sounds';
import { fetchAllReminders, validateProfileName } from '@/lib/takoData';

const LEGEND_BADGE: TakoBadge = {
  id: 'tako-legend',
  icon: 'trophy-outline',
  tone: 'gold',
  title: 'Tako Legend',
  description: 'Unlocked all 5 Tako badges',
  unlocked: true,
  tier: 'gold',
  progress: 5,
  target: 5,
};

function getTierStyle(tier: BadgeTier, isDark: boolean) {
  if (tier === 'gold') {
    return {
      label: 'Gold',
      bg: isDark ? '#3D3014' : '#FEF3C7',
      fg: isDark ? '#FBBF24' : '#B45309',
    };
  }
  if (tier === 'silver') {
    return {
      label: 'Silver',
      bg: isDark ? '#2F3342' : '#ECEFF4',
      fg: isDark ? '#CBD5E1' : '#475569',
    };
  }
  return {
    label: 'Bronze',
    bg: isDark ? '#3B281E' : '#FBEAE0',
    fg: isDark ? '#FDBA74' : '#9A4A1C',
  };
}

export default function ProfileScreen() {
  const { palette, isDark, preference, setPreference } = useTakoTheme();
  const { profile, user, updateProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [editModal, setEditModal] = useState<'profile' | 'help' | 'signout' | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showAvatarView, setShowAvatarView] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropDraft, setCropDraft] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [awards, setAwards] = useState<UserAwards | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<TakoBadge | null>(null);
  const [soundsOn, setSoundsOn] = useState(true);

  const loadAwards = useCallback(async () => {
    if (!user?.id) return;
    const [{ snapshot }, reminders] = await Promise.all([
      fetchAndCacheSnapshot(user.id),
      fetchAllReminders(user.id),
    ]);
    let computed = computeUserAwards({
      userId: user.id,
      groups: snapshot.groups,
      members: snapshot.members,
      expenses: snapshot.expenses,
      splits: snapshot.splits,
      settlements: snapshot.settlements,
      reminders,
    });

    const previewOn = isLegendPreviewEnabled();
    if (previewOn && !computed.isLegend) {
      computed = {
        ...computed,
        onTimeStreak: Math.max(computed.onTimeStreak, 5),
        unlockedCount: computed.badges.length,
        isLegend: true,
        badges: computed.badges.map((b, idx) => ({
          ...b,
          unlocked: true,
          tier: idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze',
          progress: idx === 0 ? b.target : Math.max(b.progress, 3),
        })),
      };
    }

    setAwards(computed);

    if (computed.isLegend && !previewOn) {
      const seenKey = `tako_legend_celebrated_${user.id}`;
      const seen = await AsyncStorage.getItem(seenKey).catch(() => null);
      if (seen !== '1') {
        await AsyncStorage.setItem(seenKey, '1').catch(() => {});
        setCelebratingBadge(LEGEND_BADGE);
      }
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAwards();
      getSoundEnabled().then(setSoundsOn).catch(() => {});
    }, [loadAwards])
  );

  const toggleSoundEffects = async () => {
    const next = !soundsOn;
    setSoundsOn(next);
    await setSoundEnabled(next);
    if (next) {
      playSound('pop');
    }
  };

  const initial = (profile?.display_name || user?.email || 'Y').trim().charAt(0).toUpperCase();
  const avatarBg = profile?.avatar_color || palette.coral;

  const handlePickAvatar = async () => {
    if (!user?.id || uploadingAvatar) return;
    setAvatarError(null);
    const res = await pickAvatarAsset();
    if (res.ok) {
      setCropDraft({ uri: res.uri, width: res.width, height: res.height });
    } else if (!res.cancelled && res.error) {
      setAvatarError(res.error);
    }
  };

  const handleSaveCroppedAvatar = async (params: {
    naturalWidth: number;
    naturalHeight: number;
    zoom: number;
    panX: number;
    panY: number;
  }) => {
    if (!user?.id || !cropDraft || uploadingAvatar) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    const res = await cropAndUploadAvatar({
      userId: user.id,
      uri: cropDraft.uri,
      naturalWidth: params.naturalWidth,
      naturalHeight: params.naturalHeight,
      cropSize: AVATAR_CROP_SIZE,
      zoom: params.zoom,
      panX: params.panX,
      panY: params.panY,
    });
    if (res.ok) {
      const updateRes = await updateProfile({ avatar_url: res.publicUrl });
      if (updateRes.error) {
        setAvatarError(updateRes.error);
      } else {
        setCropDraft(null);
      }
    } else {
      setAvatarError(res.error);
      setCropDraft(null);
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || uploadingAvatar) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    await deleteAvatarFromStorage(user.id);
    const updateRes = await updateProfile({ avatar_url: null });
    if (updateRes.error) {
      setAvatarError(updateRes.error);
    }
    setUploadingAvatar(false);
  };

  const cycleAppearance = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(preference) + 1) % order.length];
    setPreference(next);
  };

  const handleSave = async () => {
    const parsed = validateProfileName(displayName);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? 'Display name must be 1–30 characters.');
      return;
    }
    setNameError(null);
    setSaving(true);
    await updateProfile({
      display_name: parsed.data,
    });
    setSaving(false);
    setEditModal(null);
  };

  const handleSignOut = async () => {
    if (isGuest) {
      setEditModal('signout');
      return;
    }
    await signOut();
  };

  const cardShadow = getCardElevation(isDark);
  const isGuest = Boolean(user?.is_anonymous);

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

        {/* User Card */}
        <View
          style={[
            styles.userCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow,
          ]}>
          <LegendAvatarFrame active={Boolean(awards?.isLegend)} size={54}>
            <Pressable
              onPress={() => setShowAvatarSheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Profile photo options"
              style={[styles.avatar, { backgroundColor: avatarBg }]}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  accessibilityLabel="Profile picture"
                />
              ) : (
                <Text style={[styles.avatarText, { fontFamily: TakoFonts.black }]}>
                  {initial}
                </Text>
              )}
            </Pressable>
          </LegendAvatarFrame>
          <Pressable
            onPress={() => {
              setDisplayName(profile?.display_name ?? '');
              setEditModal('profile');
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.userCardRight}>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: palette.ink, fontFamily: TakoFonts.bold }]} numberOfLines={1}>
                  {profile?.display_name ?? 'Your name'}
                </Text>
                {awards?.isLegend && (
                  <View style={[styles.legendPill, { backgroundColor: palette.goldSoft, borderColor: palette.gold }]}>
                    <Ionicons name="trophy" size={11} color={palette.amber} />
                    <Text style={[styles.legendPillText, { color: palette.amber, fontFamily: TakoFonts.black }]}>
                      Tako Legend
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.userEmail, { color: palette.mute, fontFamily: TakoFonts.regular }]} numberOfLines={1}>
                {user?.email ?? 'you@email.com'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.mute} />
          </Pressable>
        </View>

        {/* Guest Upgrade Prompt */}
        {isGuest && (
          <View
            style={[
              styles.guestPromptCard,
              { backgroundColor: palette.lavenderSoft, borderColor: palette.border },
            ]}>
            <View style={styles.guestPromptCopy}>
              <Text style={[styles.guestPromptTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Create an account to save your splits
              </Text>
              <Text
                style={[
                  styles.guestPromptSub,
                  { color: isDark ? palette.mute : palette.plum, fontFamily: TakoFonts.regular },
                ]}>
                You’re currently browsing as a guest. Sign up to keep your history across devices.
              </Text>
            </View>
            <PrimaryButton
              label="Create account"
              onPress={signOut}
              style={{ minHeight: 44, paddingVertical: 10 }}
            />
          </View>
        )}

        {/* STREAK & BADGES */}
        {awards && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              STREAK &amp; BADGES
            </Text>

            {awards.isLegend && (
              <View
                style={[
                  styles.legendBanner,
                  { backgroundColor: palette.plum },
                  cardShadow,
                ]}>
                <TakoMascot state="celebrate" size={62} interactive={false} />
                <View style={styles.legendBannerCopy}>
                  <Text style={[styles.legendBannerEyebrow, { color: palette.gold, fontFamily: TakoFonts.black }]}>
                    5/5 BADGES COMPLETE
                  </Text>
                  <Text style={[styles.legendBannerTitle, { fontFamily: TakoFonts.black }]}>
                    Tako Legend unlocked!
                  </Text>
                  <View style={styles.legendBannerActions}>
                    <SpringPressable
                      onPress={() => setCelebratingBadge(LEGEND_BADGE)}
                      accessibilityRole="button"
                      accessibilityLabel="Celebrate Tako Legend"
                      style={[styles.legendActionBtn, { backgroundColor: palette.coral }]}>
                      <Text style={[styles.legendActionText, { color: palette.plum, fontFamily: TakoFonts.black }]}>
                        Celebrate
                      </Text>
                    </SpringPressable>
                    <SpringPressable
                      onPress={() =>
                        Share.share({
                          message: `I unlocked Tako Legend (5/5 badges, ${awards.onTimeStreak} on-time streak) on Tako!`,
                        }).catch(() => {})
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Share Tako Legend"
                      style={styles.legendShareBtn}>
                      <Ionicons name="share-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.legendShareText, { fontFamily: TakoFonts.bold }]}>
                        Share
                      </Text>
                    </SpringPressable>
                  </View>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (awards.onTimeStreak > 0) {
                  setCelebratingBadge({
                    id: 'on-time-streak',
                    icon: 'flame-outline',
                    tone: 'gold',
                    title: 'On-time streak',
                    description: 'Settle within 24h without a reminder',
                    unlocked: true,
                    tier: awards.onTimeStreak >= 10 ? 'gold' : awards.onTimeStreak >= 5 ? 'silver' : 'bronze',
                    progress: awards.onTimeStreak,
                    target: 5,
                  });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="On-time split streak"
              style={[
                styles.streakCard,
                {
                  backgroundColor: palette.goldSoft,
                  borderColor: palette.gold,
                },
                cardShadow,
              ]}>
              <TakoBadgeEmblem
                id="on-time-streak"
                unlocked={awards.onTimeStreak > 0}
                isDark={isDark}
                size={64}
              />
              <View style={styles.streakCopy}>
                <Text style={[styles.streakTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                  {awards.onTimeStreak > 0
                    ? `${awards.onTimeStreak} on-time ${awards.onTimeStreak === 1 ? 'split' : 'splits'} streak`
                    : 'Start your on-time streak'}
                </Text>
                <Text style={[styles.streakSub, { color: isDark ? palette.mute : '#7D6A43', fontFamily: TakoFonts.regular }]}>
                  Settle within 24h without a reminder to keep it going.
                </Text>
              </View>
              <View style={[styles.streakCountPill, { backgroundColor: palette.surface }]}>
                <Text style={[styles.streakCountText, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                  {awards.unlockedCount}/{awards.badges.length}
                </Text>
              </View>
            </Pressable>

            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border },
                cardShadow,
              ]}>
              {awards.badges.map((badge, idx) => (
                <Pressable
                  key={badge.id}
                  onPress={() => {
                    if (badge.unlocked) {
                      setCelebratingBadge(badge);
                    }
                  }}
                  accessibilityRole={badge.unlocked ? 'button' : 'text'}
                  accessibilityLabel={badge.title}
                  style={[
                    styles.badgeListRow,
                    idx < awards.badges.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    },
                  ]}>
                  <TakoBadgeEmblem
                    id={badge.id}
                    unlocked={badge.unlocked}
                    isDark={isDark}
                    size={50}
                  />
                  <View style={styles.badgeListCopy}>
                    <View style={styles.badgeTitleRow}>
                      <Text
                        style={[
                          styles.badgeListTitle,
                          {
                            color: badge.unlocked ? palette.ink : palette.mute,
                            fontFamily: TakoFonts.black,
                          },
                        ]}>
                        {badge.title}
                      </Text>
                      {badge.unlocked && badge.tier !== 'none' && (() => {
                        const ts = getTierStyle(badge.tier, isDark);
                        return (
                          <View style={[styles.tierPill, { backgroundColor: ts.bg }]}>
                            <Text style={[styles.tierPillText, { color: ts.fg, fontFamily: TakoFonts.black }]}>
                              {ts.label}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <Text
                      style={[
                        styles.badgeListDesc,
                        { color: palette.mute, fontFamily: TakoFonts.regular },
                      ]}
                      numberOfLines={2}>
                      {badge.description}
                    </Text>
                  </View>
                  {badge.tier === 'gold' ? (
                    <View style={[styles.badgeUnlockedCircle, { backgroundColor: palette.goldSoft }]}>
                      <Ionicons name="checkmark" size={14} color={palette.amber} />
                    </View>
                  ) : badge.unlocked ? (
                    <View style={[styles.badgeChip, { backgroundColor: palette.tealSoft }]}>
                      <Text
                        style={[
                          styles.badgeProgressText,
                          { color: palette.teal, fontFamily: TakoFonts.bold },
                        ]}>
                        {badge.progress}/{badge.target}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badgeChip, { backgroundColor: palette.surfaceAlt }]}>
                      <Text
                        style={[
                          styles.badgeProgressText,
                          { color: palette.mute, fontFamily: TakoFonts.bold },
                        ]}>
                        {badge.progress}/{badge.target}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
              onPress={() => router.push('/alerts')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: palette.coralSoft }]}>
                <Ionicons name="notifications-outline" size={18} color={palette.ink} />
              </View>
              <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Notifications
              </Text>
              <Ionicons name="chevron-forward" size={18} color={palette.mute} />
            </Pressable>

            <Pressable
              onPress={toggleSoundEffects}
              accessibilityRole="switch"
              accessibilityState={{ checked: soundsOn }}
              accessibilityLabel="Sound effects"
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: palette.tealSoft }]}>
                <Ionicons
                  name={soundsOn ? 'volume-high-outline' : 'volume-mute-outline'}
                  size={18}
                  color={palette.ink}
                />
              </View>
              <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Sound effects
              </Text>
              <Text style={[styles.rowValue, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                {soundsOn ? 'On' : 'Off'}
              </Text>
            </Pressable>

            <Pressable
              onPress={cycleAppearance}
              accessibilityRole="button"
              accessibilityLabel={`Appearance: ${preference}`}
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}>
              <View style={[styles.iconBox, { backgroundColor: palette.lavenderSoft }]}>
                <Ionicons name="moon-outline" size={18} color={palette.ink} />
              </View>
              <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Appearance
              </Text>
              {preference !== 'system' && (
                <Text style={[styles.rowValue, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  {preference.charAt(0).toUpperCase() + preference.slice(1)}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={18} color={palette.mute} />
            </Pressable>

            <Pressable
              onPress={() => setEditModal('help')}
              accessibilityRole="button"
              accessibilityLabel="About Tako"
              style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: palette.tealSoft }]}>
                <Ionicons name="help-circle-outline" size={18} color={palette.ink} />
              </View>
              <Text style={[styles.rowLabel, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                About Tako
              </Text>
              <Ionicons name="chevron-forward" size={18} color={palette.mute} />
            </Pressable>
          </View>
        </View>

        {/* Quiet Sign Out */}
        <SpringPressable
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={[
            styles.signOutCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow,
          ]}>
          <Ionicons name="log-out-outline" size={18} color={palette.destructive} />
          <Text style={[styles.signOutText, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
            Sign out
          </Text>
        </SpringPressable>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModal === 'profile'}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 10,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Edit Profile
              </Text>
              <Pressable onPress={() => setEditModal(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <View style={styles.modalAvatarRow}>
              <Pressable
                onPress={handlePickAvatar}
                disabled={uploadingAvatar}
                accessibilityRole="button"
                accessibilityLabel="Upload profile picture"
                style={[styles.modalAvatarBtn, { backgroundColor: avatarBg }]}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={styles.modalAvatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={[styles.modalAvatarInitial, { fontFamily: TakoFonts.black }]}>
                    {initial}
                  </Text>
                )}
                <View style={[styles.modalAvatarBadge, { backgroundColor: palette.ink }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={palette.surface} />
                  ) : (
                    <Ionicons name="camera" size={14} color={palette.surface} />
                  )}
                </View>
              </Pressable>
              <View style={styles.photoActionRow}>
                <Pressable
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                  accessibilityRole="button"
                  accessibilityLabel={profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                  style={styles.changePhotoBtn}>
                  <Text style={[styles.changePhotoText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                    {uploadingAvatar
                      ? 'Uploading photo...'
                      : profile?.avatar_url
                        ? 'Change photo'
                        : 'Upload photo'}
                  </Text>
                </Pressable>
                {profile?.avatar_url && !uploadingAvatar && (
                  <Pressable
                    onPress={handleRemoveAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    style={styles.changePhotoBtn}>
                    <Text style={[styles.changePhotoText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      Remove
                    </Text>
                  </Pressable>
                )}
              </View>
              <FieldError message={avatarError} />
            </View>

            <TextInput
              value={displayName}
              onChangeText={(t) => {
                setDisplayName(t);
                if (nameError) setNameError(null);
              }}
              placeholder="Your display name"
              placeholderTextColor={palette.mute}
              maxLength={30}
              autoFocus
              onSubmitEditing={handleSave}
              style={[
                styles.input,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />
            <FieldError message={nameError} />

            <PrimaryButton
              label={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              loading={saving}
            />
          </View>
        </View>
      </Modal>

      {/* About Tako Modal */}
      <Modal
        visible={editModal === 'help'}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 10,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                About Tako
              </Text>
              <Pressable onPress={() => setEditModal(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <Text style={[styles.helpBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Tako helps you track shared bills and keep a clear record of who owes what. Share a QR or invite code so friends can join a split and mark settlements as paid.
            </Text>

            <Pressable
              onPress={() => setEditModal(null)}
              style={[styles.saveBtn, { backgroundColor: palette.coral }]}>
              <Text style={[styles.saveBtnText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Guest Sign Out Confirmation Modal */}
      <Modal
        visible={editModal === 'signout'}
        animationType="fade"
        transparent
        onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 10,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Sign out of guest session?
              </Text>
              <Pressable onPress={() => setEditModal(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <Text style={[styles.helpBody, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              You&apos;re signed in as a guest. Signing out may lose access to your splits.
            </Text>

            <PrimaryButton
              label="Sign out"
              onPress={async () => {
                setEditModal(null);
                await signOut();
              }}
            />

            <Pressable
              onPress={() => setEditModal(null)}
              style={[styles.saveBtn, { backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.saveBtnText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AvatarCropModal
        visible={Boolean(cropDraft)}
        uri={cropDraft?.uri ?? ''}
        naturalWidth={cropDraft?.width ?? 1}
        naturalHeight={cropDraft?.height ?? 1}
        saving={uploadingAvatar}
        onCancel={() => setCropDraft(null)}
        onSave={handleSaveCroppedAvatar}
      />

      {/* Avatar Options Action Sheet (matches VaultFlow) */}
      <Modal
        visible={showAvatarSheet}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAvatarSheet(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowAvatarSheet(false)}
            accessibilityLabel="Close profile photo menu"
          />
          <View
            style={[
              styles.sheetCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 10,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Profile photo
              </Text>
              <Pressable onPress={() => setShowAvatarSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            {profile?.avatar_url && (
              <Pressable
                onPress={() => {
                  setShowAvatarSheet(false);
                  setShowAvatarView(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="View profile photo"
                style={[styles.sheetOptionRow, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="eye-outline" size={20} color={palette.ink} />
                <Text style={[styles.sheetOptionText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  View profile photo
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setShowAvatarSheet(false);
                handlePickAvatar();
              }}
              accessibilityRole="button"
              accessibilityLabel="Upload new photo"
              style={[styles.sheetOptionRow, { backgroundColor: palette.surfaceAlt }]}>
              <Ionicons name="camera-outline" size={20} color={palette.ink} />
              <Text style={[styles.sheetOptionText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Upload new photo
              </Text>
            </Pressable>

            {profile?.avatar_url && (
              <Pressable
                onPress={() => {
                  setShowAvatarSheet(false);
                  handleRemoveAvatar();
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove current photo"
                style={[styles.sheetOptionRow, { backgroundColor: palette.destructiveSoft }]}>
                <Ionicons name="trash-outline" size={20} color={palette.destructive} />
                <Text style={[styles.sheetOptionText, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                  Remove current photo
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* View Full Profile Photo Modal */}
      <Modal
        visible={showAvatarView}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAvatarView(false)}>
        <View style={styles.viewPhotoBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowAvatarView(false)}
            accessibilityLabel="Close full profile photo"
          />
          <View
            style={[styles.viewPhotoCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Profile Photo
              </Text>
              <Pressable onPress={() => setShowAvatarView(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            {profile?.avatar_url && (
              <View style={[styles.viewPhotoFrame, { backgroundColor: palette.plum }]}>
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.viewPhotoImg}
                  contentFit="contain"
                  accessibilityLabel="Full profile photo"
                />
              </View>
            )}

            <PrimaryButton
              label="Change Photo"
              onPress={() => {
                setShowAvatarView(false);
                handlePickAvatar();
              }}
            />
          </View>
        </View>
      </Modal>

      <BadgeUnlockedModal
        badge={celebratingBadge}
        onClose={() => setCelebratingBadge(null)}
      />
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
  userCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  legendPillText: {
    fontSize: 10.5,
  },
  legendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xl,
    padding: 14,
    gap: 12,
  },
  legendBannerCopy: {
    flex: 1,
    gap: 4,
  },
  legendBannerEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.1,
  },
  legendBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  legendBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  legendActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  legendActionText: {
    fontSize: 12,
  },
  legendShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  legendShareText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  tierPillText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  streakCopy: {
    flex: 1,
    gap: 3,
  },
  streakTitle: {
    fontSize: 16,
  },
  streakSub: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  streakCountPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  streakCountText: {
    fontSize: 12,
  },
  badgeListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 14,
  },
  badgeListCopy: {
    flex: 1,
    gap: 2,
  },
  badgeListTitle: {
    fontSize: 15,
  },
  badgeListDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  badgeUnlockedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  badgeProgressText: {
    fontSize: 12,
  },
  userCardRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarText: {
    color: '#2B1B3D',
    fontSize: 22,
  },
  modalAvatarRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalAvatarBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  modalAvatarInitial: {
    color: '#2B1B3D',
    fontSize: 32,
  },
  modalAvatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  changePhotoBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  changePhotoText: {
    fontSize: 14,
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
  signOutCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    minHeight: 50,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestPromptCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  guestPromptCopy: {
    gap: 4,
  },
  guestPromptTitle: {
    fontSize: 15,
  },
  guestPromptSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  signOutText: {
    fontSize: 15,
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
  helpBody: {
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 15,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
  },
  sheetOptionText: {
    fontSize: 15,
  },
  viewPhotoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 20, 36, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  viewPhotoCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  viewPhotoFrame: {
    width: '100%',
    height: 260,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPhotoImg: {
    width: '100%',
    height: '100%',
  },
});
