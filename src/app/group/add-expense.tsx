import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { splitEqually } from '@/lib/split';
import { supabase } from '@/lib/supabase';
import type { GroupMember } from '@/types/tako';

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍜' },
  { key: 'drinks', label: 'Drinks', emoji: '🍻' },
  { key: 'ride', label: 'Ride', emoji: '🚕' },
  { key: 'stay', label: 'Stay', emoji: '🏨' },
  { key: 'other', label: 'Other', emoji: '🧾' },
] as const;

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { palette } = useTakoTheme();
  const { user } = useAuth();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string>('food');
  const [paidById, setPaidById] = useState<string>('');
  const [splitType, setSplitType] = useState<'equal' | 'exact'>('equal');
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as GroupMember[];
        setMembers(list);
        const me = list.find((m) => m.user_id === user?.id) ?? list[0];
        if (me) setPaidById(me.id);
        setIncludedIds(list.map((m) => m.id));
        setLoading(false);
      });
  }, [groupId, user?.id]);

  const totalCents = useMemo(() => {
    const parsed = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountText]);

  const exactSumCents = useMemo(() => {
    return members.reduce((sum, m) => {
      const val = parseFloat((exactAmounts[m.id] ?? '').replace(/[^0-9.]/g, ''));
      if (Number.isNaN(val) || val < 0) return sum;
      return sum + Math.round(val * 100);
    }, 0);
  }, [members, exactAmounts]);

  const toggleMember = (memberId: string) => {
    setIncludedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSave = async () => {
    setError(null);
    if (!groupId) return;
    if (!title.trim()) {
      setError('Enter a description for this expense.');
      return;
    }
    if (totalCents <= 0) {
      setError('Enter an amount greater than ₱0.');
      return;
    }
    if (!paidById) {
      setError('Select who paid.');
      return;
    }

    let splitRows: { member_id: string; amount_cents: number }[] = [];

    if (splitType === 'equal') {
      if (includedIds.length === 0) {
        setError('Select at least one person to split with.');
        return;
      }
      splitRows = splitEqually(totalCents, includedIds);
    } else {
      if (Math.abs(exactSumCents - totalCents) > 1) {
        setError(
          `Exact amounts (${formatPeso(exactSumCents)}) must equal total (${formatPeso(totalCents)}).`
        );
        return;
      }
      splitRows = members.map((m) => {
        const val = parseFloat((exactAmounts[m.id] ?? '').replace(/[^0-9.]/g, ''));
        const cents = Number.isNaN(val) || val < 0 ? 0 : Math.round(val * 100);
        return { member_id: m.id, amount_cents: cents };
      });
    }

    setSaving(true);
    const { data: exp, error: expErr } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        title: title.trim(),
        amount_cents: totalCents,
        paid_by_member_id: paidById,
        split_type: splitType,
        category,
      })
      .select()
      .single();

    if (expErr || !exp) {
      setError(expErr?.message ?? 'Failed to save expense.');
      setSaving(false);
      return;
    }

    const { error: splitErr } = await supabase.from('expense_splits').insert(
      splitRows.map((r) => ({
        expense_id: exp.id,
        member_id: r.member_id,
        amount_cents: r.amount_cents,
      }))
    );

    if (splitErr) {
      setError(splitErr.message);
      setSaving(false);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setSaving(false);
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.coralAccent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={palette.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Add Expense
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Amount Hero */}
          <View
            style={[
              styles.amountCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}>
            <Text style={[styles.pesoSign, { color: palette.coralAccent, fontFamily: TakoFonts.black }]}>
              ₱
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              placeholderTextColor={palette.mute}
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={[styles.amountInput, { color: palette.ink, fontFamily: TakoFonts.black }]}
            />
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            What was it for?
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Ramen Nagi, Grab, Groceries"
            placeholderTextColor={palette.mute}
            style={[
              styles.input,
              { backgroundColor: palette.surface, color: palette.ink, borderColor: palette.border, fontFamily: TakoFonts.regular },
            ]}
          />

          {/* Category */}
          <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[
                    styles.catChip,
                    { backgroundColor: active ? palette.chipOn : palette.chip },
                  ]}>
                  <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? palette.chipOnInk : palette.ink,
                        fontFamily: TakoFonts.bold,
                      },
                    ]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Paid By */}
          <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Paid by
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {members.map((m) => {
              const active = paidById === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaidById(m.id)}
                  style={[
                    styles.catChip,
                    { backgroundColor: active ? palette.chipOn : palette.chip },
                  ]}>
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? palette.chipOnInk : palette.ink,
                        fontFamily: TakoFonts.bold,
                      },
                    ]}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Split Type */}
          <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Split Method
          </Text>
          <View style={[styles.segment, { backgroundColor: palette.chip }]}>
            {(['equal', 'exact'] as const).map((type) => {
              const active = splitType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSplitType(type)}
                  style={[styles.segBtn, active && { backgroundColor: palette.chipOn }]}>
                  <Text
                    style={[
                      styles.segText,
                      {
                        color: active ? palette.chipOnInk : palette.ink,
                        fontFamily: TakoFonts.bold,
                      },
                    ]}>
                    {type === 'equal' ? 'Split Equally' : 'Exact Amounts'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Split Members */}
          <View
            style={[
              styles.splitCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}>
            {splitType === 'equal' ? (
              members.map((m) => {
                const checked = includedIds.includes(m.id);
                const share =
                  checked && includedIds.length > 0 && totalCents > 0
                    ? Math.round(totalCents / includedIds.length)
                    : 0;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => toggleMember(m.id)}
                    style={styles.splitRow}>
                    <View style={styles.splitLeft}>
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={checked ? palette.coralAccent : palette.mute}
                      />
                      <Text style={[styles.splitName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                        {m.name}
                      </Text>
                    </View>
                    <Text style={[styles.splitShare, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      {checked ? formatPeso(share) : '₱0'}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <>
                {members.map((m) => (
                  <View key={m.id} style={styles.splitRow}>
                    <Text style={[styles.splitName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      {m.name}
                    </Text>
                    <View style={[styles.exactInputWrap, { backgroundColor: palette.surfaceAlt }]}>
                      <Text style={{ color: palette.mute, fontFamily: TakoFonts.bold }}>₱</Text>
                      <TextInput
                        value={exactAmounts[m.id] ?? ''}
                        onChangeText={(txt) =>
                          setExactAmounts((prev) => ({ ...prev, [m.id]: txt }))
                        }
                        placeholder="0"
                        placeholderTextColor={palette.mute}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        style={[
                          styles.exactInput,
                          { color: palette.ink, fontFamily: TakoFonts.bold },
                        ]}
                      />
                    </View>
                  </View>
                ))}
                <Text style={[styles.remainingText, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Remaining: {formatPeso(totalCents - exactSumCents)}
                </Text>
              </>
            )}
          </View>

          {error && (
            <Text style={[styles.errorText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: palette.coralAccent },
              pressed && { opacity: 0.9 },
            ]}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveBtnText, { fontFamily: TakoFonts.bold }]}>
                Save Expense
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 19 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  amountCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pesoSign: { fontSize: 36 },
  amountInput: {
    fontSize: 40,
    minWidth: 120,
    textAlign: 'center',
  },
  label: { fontSize: 13, marginTop: 4 },
  input: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  chipRow: { gap: 8, paddingVertical: 2 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  chipText: { fontSize: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
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
  segText: { fontSize: 14 },
  splitCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitName: { fontSize: 15 },
  splitShare: { fontSize: 15 },
  exactInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    minWidth: 100,
  },
  exactInput: {
    fontSize: 16,
    minWidth: 64,
    textAlign: 'right',
  },
  remainingText: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  saveBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
