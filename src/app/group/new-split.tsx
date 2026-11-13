import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

import { MemberPalette, Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { splitEqually } from '@/lib/split';
import { supabase } from '@/lib/supabase';

const ANIMAL_AVATARS = ['🐙', '🐱', '🐶', '🦊', '🐻', '🐼', '🐸', '🐰'] as const;

export default function NewSplitScreen() {
  const { palette, isDark } = useTakoTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'You';

  const [amountText, setAmountText] = useState('');
  const [name, setName] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'items' | 'custom'>('equal');
  const [people, setPeople] = useState<{ name: string; color: string; avatar?: string; isMe?: boolean }[]>([
    { name: myName, color: MemberPalette[0], avatar: '🐙', isMe: true },
  ]);
  const [paidByIdx, setPaidByIdx] = useState(0);
  const [currency, setCurrency] = useState<'PHP ₱' | 'USD $'>('PHP ₱');
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [itemEntries, setItemEntries] = useState<{ id: string; title: string; amount: string; ownerIdx: number }[]>([
    { id: '1', title: '', amount: '', ownerIdx: 0 },
  ]);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(ANIMAL_AVATARS[1]);
  const [recentFriends, setRecentFriends] = useState<string[]>([]);
  const [inviteLater, setInviteLater] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('group_members')
      .select('name, user_id')
      .neq('user_id', user.id)
      .limit(20)
      .then(({ data }) => {
        if (!data) return;
        const unique = Array.from(
          new Set(data.map((r) => (r.name ?? '').trim()).filter(Boolean))
        ).slice(0, 8);
        setRecentFriends(unique);
      });
  }, [user]);

  const totalCents = useMemo(() => {
    const parsed = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountText]);

  const perPersonCents = useMemo(() => {
    if (totalCents <= 0 || people.length === 0) return 0;
    return Math.round(totalCents / people.length);
  }, [totalCents, people.length]);

  const perPersonShareCents = useMemo(() => {
    if (people.length === 0) return [];
    if (splitMode === 'custom') {
      return people.map((_, idx) => {
        const v = parseFloat((customAmounts[idx] ?? '').replace(/[^0-9.]/g, ''));
        return Number.isNaN(v) || v < 0 ? 0 : Math.round(v * 100);
      });
    }
    if (splitMode === 'items') {
      const totals = people.map(() => 0);
      for (const item of itemEntries) {
        const v = parseFloat(item.amount.replace(/[^0-9.]/g, ''));
        if (!Number.isNaN(v) && v > 0 && totals[item.ownerIdx] !== undefined) {
          totals[item.ownerIdx] += Math.round(v * 100);
        }
      }
      return totals;
    }
    const equal = splitEqually(
      totalCents,
      people.map((_, idx) => String(idx))
    );
    return equal.map((r) => r.amount_cents);
  }, [customAmounts, itemEntries, people, splitMode, totalCents]);

  const addPersonWithName = (personName: string, avatar?: string) => {
    const trimmed = personName.trim();
    if (!trimmed) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const color = MemberPalette[people.length % MemberPalette.length];
    const chosenAvatar = avatar ?? ANIMAL_AVATARS[(people.length + 1) % ANIMAL_AVATARS.length];
    setPeople((prev) => [...prev, { name: trimmed, color, avatar: chosenAvatar }]);
    setNewPersonName('');
    setSelectedAvatar(ANIMAL_AVATARS[(people.length + 2) % ANIMAL_AVATARS.length]);
    setShowAddPerson(false);
  };

  const handleAddPerson = () => {
    addPersonWithName(newPersonName, selectedAvatar);
  };

  const canCreate =
    totalCents > 0 &&
    name.trim().length > 0 &&
    (people.length >= 2 || inviteLater) &&
    !saving;

  const amountFontSize = useMemo(() => {
    const len = amountText.length;
    if (len > 10) return 26;
    if (len > 7) return 34;
    return 44;
  }, [amountText.length]);

  const currencySymbol = currency === 'USD $' ? '$' : '₱';

  const handleCreate = async () => {
    setError(null);
    if (!user) return;
    if (!name.trim()) {
      setError('Enter a name for this split.');
      return;
    }

    setSaving(true);
    const { data: createdGroup, error: gErr } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        emoji: '🍜',
        created_by: user.id,
      })
      .select()
      .single();

    if (gErr || !createdGroup) {
      setError(gErr?.message ?? 'Could not create split.');
      setSaving(false);
      return;
    }

    const { data: insertedMembers, error: mErr } = await supabase
      .from('group_members')
      .insert(
        people.map((p) => ({
          group_id: createdGroup.id,
          user_id: p.isMe ? user.id : null,
          name: p.name,
          color: p.color,
        }))
      )
      .select();

    if (mErr || !insertedMembers) {
      setError(mErr?.message ?? 'Could not add people.');
      setSaving(false);
      return;
    }

    // If an amount was entered, create the initial expense
    if (totalCents > 0 && insertedMembers.length > 0) {
      const payer = insertedMembers[paidByIdx] ?? insertedMembers[0];
      const splitType = splitMode === 'equal' ? 'equal' : 'exact';

      let splitRows: { member_id: string; amount_cents: number }[] = [];
      if (splitType === 'equal') {
        splitRows = splitEqually(
          totalCents,
          insertedMembers.map((m) => m.id)
        );
      } else {
        const computedSum = perPersonShareCents.reduce((s, c) => s + c, 0);
        if (Math.abs(computedSum - totalCents) > 1) {
          splitRows = splitEqually(
            totalCents,
            insertedMembers.map((m) => m.id)
          );
        } else {
          splitRows = insertedMembers.map((m, idx) => ({
            member_id: m.id,
            amount_cents: perPersonShareCents[idx] ?? 0,
          }));
        }
      }

      const { data: exp } = await supabase
        .from('expenses')
        .insert({
          group_id: createdGroup.id,
          title: name.trim(),
          amount_cents: totalCents,
          paid_by_member_id: payer.id,
          split_type: splitType,
          category: 'food',
        })
        .select()
        .single();

      if (exp) {
        await supabase.from('expense_splits').insert(
          splitRows.map((r) => ({
            expense_id: exp.id,
            member_id: r.member_id,
            amount_cents: r.amount_cents,
          }))
        );
      }
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setSaving(false);
    router.replace({
      pathname: '/group/split-ready',
      params: { groupId: createdGroup.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
            Cancel
          </Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          New split
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Total Bill Hero */}
          <View style={styles.totalHero}>
            <Text style={[styles.totalLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              Total bill
            </Text>
            <View style={styles.amountRow}>
              <Text
                style={[
                  styles.pesoSign,
                  {
                    color: amountText.length > 0 ? palette.ink : palette.mute,
                    fontFamily: TakoFonts.black,
                    fontSize: Math.max(24, amountFontSize - 6),
                  },
                ]}>
                {currencySymbol}
              </Text>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0"
                placeholderTextColor={palette.mute}
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
                style={[
                  styles.amountInput,
                  {
                    color: palette.ink,
                    fontFamily: TakoFonts.black,
                    fontSize: amountFontSize,
                  },
                ]}
              />
            </View>
          </View>

          {/* Details Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              !isDark && styles.lightCardShadow,
            ]}>
            <View style={[styles.cardRow, { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ramen Ya dinner"
                placeholderTextColor={palette.mute}
                style={[styles.rowInput, { color: palette.ink, fontFamily: TakoFonts.bold }]}
              />
            </View>

            <Pressable
              onPress={() => setPaidByIdx((i) => (i + 1) % people.length)}
              accessibilityRole="button"
              accessibilityLabel="Change who paid"
              style={[styles.cardRow, { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Paid by
              </Text>
              <View style={[styles.rowPill, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.rowVal, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  {people[paidByIdx]?.isMe ? 'You' : people[paidByIdx]?.name}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={palette.mute} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setCurrency((c) => (c === 'PHP ₱' ? 'USD $' : 'PHP ₱'))}
              accessibilityRole="button"
              accessibilityLabel="Change currency"
              style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Currency
              </Text>
              <View style={[styles.rowPill, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.rowVal, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  {currency}
                </Text>
                <Ionicons name="chevron-forward" size={15} color={palette.mute} />
              </View>
            </Pressable>
          </View>

          {/* Split Segmented Control */}
          <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Split
          </Text>
          <View style={[styles.segment, { backgroundColor: palette.chip }]}>
            {(
              [
                { key: 'equal', label: 'Equally' },
                { key: 'items', label: 'By items' },
                { key: 'custom', label: 'Custom' },
              ] as const
            ).map((opt) => {
              const active = splitMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSplitMode(opt.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.segBtn,
                    active && { backgroundColor: palette.chipOn },
                  ]}>
                  <Text
                    style={[
                      styles.segText,
                      {
                        color: active ? palette.chipOnInk : palette.ink,
                        fontFamily: TakoFonts.bold,
                      },
                    ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* People */}
          <View style={styles.peopleHeader}>
            <Text style={[styles.sectionTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              People
            </Text>
            <Text style={[styles.peopleMeta, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              {people.length} · {formatPeso(perPersonCents)} each
            </Text>
          </View>

          <View style={styles.peopleRow}>
            {people.map((p, idx) => {
              const shareCents = perPersonShareCents[idx] ?? 0;
              return (
                <View key={`${p.name}-${idx}`} style={styles.personWrap}>
                  <View style={[styles.personCircle, { backgroundColor: p.color }]}>
                    <Text style={[styles.personInitial, { fontFamily: TakoFonts.black }]}>
                      {p.avatar ?? (p.isMe ? 'Y' : p.name.charAt(0).toUpperCase())}
                    </Text>
                  </View>
                  <Text
                    style={[styles.personName, { color: palette.ink, fontFamily: TakoFonts.bold }]}
                    numberOfLines={1}>
                    {p.isMe ? 'You' : p.name}
                  </Text>
                  <Text
                    style={[styles.personShare, { color: palette.mute, fontFamily: TakoFonts.bold }]}
                    numberOfLines={1}>
                    {formatPeso(shareCents)}
                  </Text>
                </View>
              );
            })}

            <Pressable
              onPress={() => setShowAddPerson(true)}
              accessibilityRole="button"
              accessibilityLabel="Add person"
              style={styles.personWrap}>
              <View style={[styles.addCircle, { borderColor: palette.border }]}>
                <Ionicons name="add" size={20} color={palette.ink} />
              </View>
              <Text style={[styles.personName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Add
              </Text>
            </Pressable>

            {people.length < 2 && (
              <Pressable
                onPress={() => setInviteLater((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: inviteLater }}
                style={[
                  styles.inviteLaterChip,
                  {
                    backgroundColor: inviteLater ? palette.coralSoft : palette.chip,
                    borderColor: inviteLater ? palette.coralAccent : palette.border,
                  },
                ]}>
                <Ionicons
                  name={inviteLater ? 'checkmark-circle' : 'qr-code-outline'}
                  size={16}
                  color={inviteLater ? palette.coralAccent : palette.ink}
                />
                <Text
                  style={[
                    styles.inviteLaterText,
                    {
                      color: inviteLater ? palette.coralAccent : palette.ink,
                      fontFamily: TakoFonts.bold,
                    },
                  ]}>
                  Invite via QR later
                </Text>
              </Pressable>
            )}
          </View>

          {splitMode === 'items' && (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border, padding: 14, gap: 10 },
              ]}>
              {itemEntries.map((item, idx) => (
                <View key={item.id} style={styles.itemRow}>
                  <TextInput
                    value={item.title}
                    onChangeText={(txt) =>
                      setItemEntries((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, title: txt } : it))
                      )
                    }
                    placeholder="Item (e.g. Gyoza)"
                    placeholderTextColor={palette.mute}
                    style={[
                      styles.itemTitleInput,
                      { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
                    ]}
                  />
                  <Pressable
                    onPress={() =>
                      setItemEntries((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, ownerIdx: (it.ownerIdx + 1) % people.length } : it
                        )
                      )
                    }
                    style={[styles.ownerChip, { backgroundColor: palette.chip }]}>
                    <Text style={[styles.ownerChipText, { color: palette.ink, fontFamily: TakoFonts.bold }]} numberOfLines={1}>
                      {people[item.ownerIdx]?.isMe ? 'You' : (people[item.ownerIdx]?.name ?? 'You')}
                    </Text>
                  </Pressable>
                  <TextInput
                    value={item.amount}
                    onChangeText={(txt) =>
                      setItemEntries((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, amount: txt } : it))
                      )
                    }
                    placeholder="0"
                    placeholderTextColor={palette.mute}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    style={[
                      styles.customInput,
                      { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.bold },
                    ]}
                  />
                </View>
              ))}
              <Pressable
                onPress={() =>
                  setItemEntries((prev) => [
                    ...prev,
                    { id: String(Date.now()), title: '', amount: '', ownerIdx: 0 },
                  ])
                }
                style={[styles.addItemBtn, { borderColor: palette.border }]}>
                <Ionicons name="add" size={16} color={palette.ink} />
                <Text style={[styles.addItemText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Add item
                </Text>
              </Pressable>
            </View>
          )}

          {splitMode === 'custom' && (
            <View
              style={[
                styles.card,
                { backgroundColor: palette.surface, borderColor: palette.border, padding: 14, gap: 10 },
              ]}>
              {people.map((p, idx) => (
                <View key={`custom-${idx}`} style={styles.customRow}>
                  <Text style={[styles.customName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                    {p.isMe ? 'You' : p.name}
                  </Text>
                  <TextInput
                    value={customAmounts[idx] ?? ''}
                    onChangeText={(txt) =>
                      setCustomAmounts((prev) => ({ ...prev, [idx]: txt }))
                    }
                    placeholder="0"
                    placeholderTextColor={palette.mute}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    style={[
                      styles.customInput,
                      { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.bold },
                    ]}
                  />
                </View>
              ))}
            </View>
          )}

          {error && (
            <Text style={[styles.errorText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: palette.bg,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopColor: palette.border,
            },
          ]}>
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate}
            accessibilityRole="button"
            accessibilityLabel="Create split and get QR"
            accessibilityState={{ disabled: !canCreate }}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: canCreate ? palette.coral : palette.chip },
              pressed && canCreate && { opacity: 0.9, transform: [{ scale: 0.985 }] },
            ]}>
            {saving ? (
              <ActivityIndicator color={palette.plum} />
            ) : (
              <>
                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color={canCreate ? palette.plum : palette.mute}
                />
                <Text
                  style={[
                    styles.ctaText,
                    {
                      color: canCreate ? palette.plum : palette.mute,
                      fontFamily: TakoFonts.bold,
                    },
                  ]}>
                  {totalCents <= 0
                    ? 'Enter an amount'
                    : !name.trim()
                      ? 'Name this split'
                      : people.length < 2 && !inviteLater
                        ? 'Add a friend or tap Invite later'
                        : 'Create split & get QR'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Add Person Bottom Sheet Picker */}
      <Modal
        visible={showAddPerson}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddPerson(false)}>
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
                Add Friend
              </Text>
              <Pressable
                onPress={() => setShowAddPerson(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            {/* Animal Avatar Picker */}
            <View style={styles.avatarRow}>
              {ANIMAL_AVATARS.map((emo) => {
                const active = selectedAvatar === emo;
                return (
                  <Pressable
                    key={emo}
                    onPress={() => setSelectedAvatar(emo)}
                    style={[
                      styles.avatarChoice,
                      {
                        backgroundColor: active ? palette.coralSoft : palette.surfaceAlt,
                        borderColor: active ? palette.coralAccent : 'transparent',
                      },
                    ]}>
                    <Text style={styles.avatarEmoji}>{emo}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Recent Friends */}
            {recentFriends.length > 0 && (
              <View style={styles.recentWrap}>
                <Text style={[styles.recentLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Recent
                </Text>
                <View style={styles.recentChips}>
                  {recentFriends.map((friend) => (
                    <Pressable
                      key={friend}
                      onPress={() => addPersonWithName(friend)}
                      style={[styles.recentChip, { backgroundColor: palette.chip }]}>
                      <Ionicons name="add" size={14} color={palette.ink} />
                      <Text style={[styles.recentChipText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                        {friend}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              value={newPersonName}
              onChangeText={setNewPersonName}
              placeholder="Friend's name (e.g. Mia)"
              placeholderTextColor={palette.mute}
              autoFocus
              style={[
                styles.modalInput,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />

            <Pressable
              onPress={handleAddPerson}
              disabled={!newPersonName.trim()}
              style={[
                styles.ctaBtn,
                { backgroundColor: newPersonName.trim() ? palette.coral : palette.chip },
              ]}>
              <Text
                style={[
                  styles.ctaText,
                  {
                    color: newPersonName.trim() ? palette.plum : palette.mute,
                    fontFamily: TakoFonts.bold,
                  },
                ]}>
                Add to split
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancelBtn: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: { fontSize: 15 },
  topTitle: { fontSize: 17 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  totalHero: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  totalLabel: { fontSize: 13 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    maxWidth: '100%',
  },
  pesoSign: { fontSize: 38 },
  amountInput: {
    fontSize: 44,
    minWidth: 40,
    flexShrink: 1,
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lightCardShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.06)' },
  }),
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 54,
  },
  rowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  rowLabel: { fontSize: 15 },
  rowInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    marginLeft: 12,
  },
  rowVal: { fontSize: 15 },
  sectionTitle: { fontSize: 16 },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radii.pill,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  segText: { fontSize: 13 },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peopleMeta: { fontSize: 13 },
  peopleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  personWrap: {
    alignItems: 'center',
    gap: 3,
    width: 58,
  },
  personCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  personName: { fontSize: 11 },
  personShare: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  addCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customName: { fontSize: 14 },
  customInput: {
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90,
    textAlign: 'right',
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitleInput: {
    flex: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  ownerChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    maxWidth: 80,
  },
  ownerChipText: {
    fontSize: 12,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addItemText: {
    fontSize: 13,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  recentWrap: {
    gap: 6,
  },
  recentLabel: {
    fontSize: 12,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  recentChipText: {
    fontSize: 13,
  },
  inviteLaterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  inviteLaterText: {
    fontSize: 13,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16 },
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
  modalTitle: { fontSize: 20 },
  modalInput: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
});
