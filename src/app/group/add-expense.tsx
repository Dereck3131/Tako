import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldError } from '@/components/FieldError';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { parsePesoToCents, sanitizeAmountInput } from '@/lib/money';
import { addSingleExpense } from '@/lib/takoData';
import { addExpenseSchema, validateCustomAmountsSum } from '@/lib/validation';
import type { GroupMember } from '@/types/tako';

const CATEGORIES = [
  { key: 'food', label: 'Food' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'ride', label: 'Ride' },
  { key: 'stay', label: 'Stay' },
  { key: 'other', label: 'Other' },
] as const;

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const cardElevation = getCardElevation(isDark);

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
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; title?: string; split?: string }>({});

  const amountRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const titleRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!groupId || !user?.id) return;
    fetchAndCacheSnapshot(user.id).then(({ snapshot }) => {
      const list = snapshot.members
        .filter((m) => m.group_id === groupId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      setMembers(list);
      const me = list.find((m) => m.user_id === user.id) ?? list[0];
      if (me) setPaidById(me.id);
      setIncludedIds(list.map((m) => m.id));
      setLoading(false);
    });
  }, [groupId, user?.id]);

  const amountParse = useMemo(
    () => parsePesoToCents(amountText, { allowZero: false }),
    [amountText]
  );
  const totalCents = amountParse.ok ? amountParse.cents : 0;

  const exactCentsList = useMemo(() => {
    return members.map((m) => {
      const parsed = parsePesoToCents(exactAmounts[m.id] ?? '', { allowZero: true });
      return parsed.ok ? parsed.cents : -1;
    });
  }, [members, exactAmounts]);

  const exactValidation = useMemo(
    () => validateCustomAmountsSum(totalCents, exactCentsList),
    [totalCents, exactCentsList]
  );

  const toggleMember = (memberId: string) => {
    setFieldErrors((e) => ({ ...e, split: undefined }));
    setIncludedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const validateFieldOnBlur = (field: 'amount' | 'title') => {
    if (field === 'amount') {
      const res = parsePesoToCents(amountText, { allowZero: false });
      setFieldErrors((prev) => ({ ...prev, amount: res.ok ? undefined : res.error }));
    } else {
      const res = addExpenseSchema.shape.title.safeParse(title);
      setFieldErrors((prev) => ({
        ...prev,
        title: res.success ? undefined : res.error.issues[0]?.message,
      }));
    }
  };

  const handleSave = async () => {
    if (submitLockRef.current || saving) return;
    setError(null);
    if (!groupId) return;

    const amtRes = parsePesoToCents(amountText, { allowZero: false });
    const titleRes = addExpenseSchema.shape.title.safeParse(title);
    const nextErr: { amount?: string; title?: string; split?: string } = {
      amount: amtRes.ok ? undefined : amtRes.error,
      title: titleRes.success ? undefined : titleRes.error.issues[0]?.message,
    };

    if (splitType === 'equal' && includedIds.length === 0) {
      nextErr.split = 'Select at least one person to split this expense.';
    } else if (splitType === 'exact' && amtRes.ok) {
      const sumCheck = validateCustomAmountsSum(amtRes.cents, exactCentsList);
      if (!sumCheck.ok) nextErr.split = sumCheck.error;
    }

    setFieldErrors(nextErr);
    if (nextErr.amount || nextErr.title || nextErr.split) {
      if (nextErr.amount) amountRef.current?.focus();
      else if (nextErr.title) titleRef.current?.focus();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    if (!amtRes.ok || !titleRes.success) return;

    submitLockRef.current = true;
    setSaving(true);
    const res = await addSingleExpense({
      groupId,
      title: titleRes.data,
      amountCents: amtRes.cents,
      category,
      paidById,
      splitType,
      includedIds,
      exactSplits: members.map((m, idx) => ({
        member_id: m.id,
        amount_cents: Math.max(0, exactCentsList[idx] ?? 0),
      })),
    });
    setSaving(false);
    submitLockRef.current = false;

    if (!res.ok) {
      setError(res.error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
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
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={palette.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Add Expense
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Amount Hero */}
          <View
            style={[
              styles.amountCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            <Text
              style={[
                styles.pesoSign,
                {
                  color: totalCents > 0 ? palette.ctaBg : palette.mute,
                  fontFamily: TakoFonts.black,
                },
              ]}>
              ₱
            </Text>
            <TextInput
              ref={amountRef}
              value={amountText}
              onChangeText={(t) => {
                setAmountText(sanitizeAmountInput(t));
                if (fieldErrors.amount) setFieldErrors((e) => ({ ...e, amount: undefined }));
              }}
              onBlur={() => validateFieldOnBlur('amount')}
              placeholder="0.00"
              placeholderTextColor={isDark ? 'rgba(185,171,201,0.45)' : 'rgba(106,106,106,0.45)'}
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={[styles.amountInput, { color: palette.ink, fontFamily: TakoFonts.black }]}
            />
          </View>
          <FieldError message={fieldErrors.amount} />

          {/* Description */}
          <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            What was it for?
          </Text>
          <TextInput
            ref={titleRef}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (fieldErrors.title) setFieldErrors((e) => ({ ...e, title: undefined }));
            }}
            onBlur={() => validateFieldOnBlur('title')}
            placeholder="e.g. Ramen Nagi, Grab, Groceries"
            placeholderTextColor={palette.mute}
            maxLength={40}
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                color: palette.ink,
                borderColor: fieldErrors.title ? palette.destructive : palette.border,
                fontFamily: TakoFonts.regular,
              },
            ]}
          />
          <FieldError message={fieldErrors.title} />

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
          <SegmentedControl
            options={[
              { key: 'equal', label: 'Split Equally' },
              { key: 'exact', label: 'Exact Amounts' },
            ]}
            value={splitType}
            onChange={setSplitType}
          />

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
                        onChangeText={(txt) => {
                          setFieldErrors((e) => ({ ...e, split: undefined }));
                          setExactAmounts((prev) => ({
                            ...prev,
                            [m.id]: sanitizeAmountInput(txt),
                          }));
                        }}
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
                <Text
                  style={[
                    styles.remainingText,
                    {
                      color: exactValidation.ok ? palette.teal : palette.destructive,
                      fontFamily: TakoFonts.bold,
                    },
                  ]}>
                  {exactValidation.ok ? 'Balanced ₱0' : exactValidation.error}
                </Text>
              </>
            )}
          </View>
          <FieldError message={fieldErrors.split} />

          {error && (
            <Text style={[styles.errorText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <PrimaryButton
            label="Save Expense"
            onPress={handleSave}
            loading={saving}
          />
        </View>
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
    paddingVertical: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 19 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  label: { fontSize: 13, marginTop: 4 },
  input: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 20 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 40,
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
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
