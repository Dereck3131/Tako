import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemberPalette, Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { splitEqually } from '@/lib/split';
import { supabase } from '@/lib/supabase';

export default function NewSplitScreen() {
  const { palette } = useTakoTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'You';

  const [amountText, setAmountText] = useState('');
  const [name, setName] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'items' | 'custom'>('equal');
  const [people, setPeople] = useState<{ name: string; color: string; isMe?: boolean }[]>([
    { name: myName, color: MemberPalette[0], isMe: true },
  ]);
  const [paidByIdx, setPaidByIdx] = useState(0);
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = useMemo(() => {
    const parsed = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountText]);

  const perPersonCents = useMemo(() => {
    if (totalCents <= 0 || people.length === 0) return 0;
    return Math.round(totalCents / people.length);
  }, [totalCents, people.length]);

  const handleAddPerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    const color = MemberPalette[people.length % MemberPalette.length];
    setPeople((prev) => [...prev, { name: trimmed, color }]);
    setNewPersonName('');
    setShowAddPerson(false);
  };

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
      const splitType = splitMode === 'custom' ? 'exact' : 'equal';

      let splitRows: { member_id: string; amount_cents: number }[] = [];
      if (splitType === 'equal') {
        splitRows = splitEqually(
          totalCents,
          insertedMembers.map((m) => m.id)
        );
      } else {
        const customSum = insertedMembers.reduce((sum, _m, idx) => {
          const v = parseFloat((customAmounts[idx] ?? '').replace(/[^0-9.]/g, ''));
          return sum + (Number.isNaN(v) || v < 0 ? 0 : Math.round(v * 100));
        }, 0);
        if (Math.abs(customSum - totalCents) > 1) {
          splitRows = splitEqually(
            totalCents,
            insertedMembers.map((m) => m.id)
          );
        } else {
          splitRows = insertedMembers.map((m, idx) => {
            const v = parseFloat((customAmounts[idx] ?? '').replace(/[^0-9.]/g, ''));
            return {
              member_id: m.id,
              amount_cents: Number.isNaN(v) || v < 0 ? 0 : Math.round(v * 100),
            };
          });
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.cancelText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
            Cancel
          </Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          New split
        </Text>
        <View style={{ width: 52 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <Text style={[styles.pesoSign, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                ₱
              </Text>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0"
                placeholderTextColor={palette.mute}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={[styles.amountInput, { color: palette.ink, fontFamily: TakoFonts.black }]}
              />
            </View>
          </View>

          {/* Details Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
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
              style={[styles.cardRow, { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Paid by
              </Text>
              <Text style={[styles.rowVal, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                {people[paidByIdx]?.isMe ? 'You' : people[paidByIdx]?.name}
              </Text>
            </Pressable>

            <View style={styles.cardRow}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Currency
              </Text>
              <Text style={[styles.rowVal, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                PHP ₱
              </Text>
            </View>
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
                  style={[
                    styles.segBtn,
                    active && { backgroundColor: palette.surface },
                  ]}>
                  <Text
                    style={[
                      styles.segText,
                      {
                        color: active ? palette.ink : palette.mute,
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
            {people.map((p, idx) => (
              <View key={`${p.name}-${idx}`} style={styles.personWrap}>
                <View style={[styles.personCircle, { backgroundColor: p.color }]}>
                  <Text style={[styles.personInitial, { fontFamily: TakoFonts.black }]}>
                    {p.isMe ? 'Y' : p.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[styles.personName, { color: palette.mute, fontFamily: TakoFonts.bold }]}
                  numberOfLines={1}>
                  {p.isMe ? 'You' : p.name}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => setShowAddPerson(true)}
              style={styles.personWrap}>
              <View style={[styles.addCircle, { borderColor: palette.border }]}>
                <Ionicons name="add" size={20} color={palette.mute} />
              </View>
              <Text style={[styles.personName, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Add
              </Text>
            </Pressable>
          </View>

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

        <View style={[styles.bottomBar, { backgroundColor: palette.bg }]}>
          <Pressable
            onPress={handleCreate}
            disabled={saving}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: palette.coral },
              pressed && { opacity: 0.9 },
            ]}>
            {saving ? (
              <ActivityIndicator color={palette.plum} />
            ) : (
              <>
                <Ionicons name="qr-code-outline" size={18} color={palette.plum} />
                <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                  Create split & get QR
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Add Person Modal */}
      <Modal
        visible={showAddPerson}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddPerson(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                Add Friend
              </Text>
              <Pressable onPress={() => setShowAddPerson(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

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
              style={[styles.ctaBtn, { backgroundColor: palette.coral }]}>
              <Text style={[styles.ctaText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Add
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
  cancelText: { fontSize: 15 },
  topTitle: { fontSize: 17 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 110,
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
  },
  pesoSign: { fontSize: 38 },
  amountInput: {
    fontSize: 44,
    minWidth: 90,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    gap: 4,
    width: 48,
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
    fontSize: 16,
  },
  personName: { fontSize: 11 },
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
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
