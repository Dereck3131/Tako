import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPeso } from '@/components/AnimatedPeso';
import { FieldError } from '@/components/FieldError';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { MemberPalette, Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { formatAmountDisplay, parsePesoToCents, sanitizeAmountInput } from '@/lib/money';
import { splitEqually } from '@/lib/split';
import { createSplitWithMembers } from '@/lib/takoData';
import {
  MAX_GROUP_MEMBERS,
  splitNameSchema,
  validateCustomAmountsSum,
  validateNewMemberName,
} from '@/lib/validation';

const INITIAL_COLORS = ['#FF7A8A', '#2EC4B6', '#B9A5E8', '#F5D6BA', '#6C9BFF', '#FFC857'];

type WizardStep = 1 | 2 | 3;

function StepDot({
  active,
  done,
  onPress,
}: {
  active: boolean;
  done: boolean;
  onPress: () => void;
}) {
  const { palette } = useTakoTheme();
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(active ? 28 : 10);

  useEffect(() => {
    const target = active ? 28 : 10;
    width.value = reducedMotion
      ? target
      : withTiming(target, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [active, reducedMotion, width]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.stepDotHit}>
      <Animated.View
        style={[
          styles.stepDot,
          animStyle,
          {
            backgroundColor: active
              ? palette.ctaBg
              : done
                ? palette.teal
                : palette.border,
          },
        ]}
      />
    </Pressable>
  );
}

export default function NewSplitScreen() {
  const { palette, isDark } = useTakoTheme();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const cardElevation = getCardElevation(isDark);

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'You';

  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'amount' | null>(null);
  const [splitMode, setSplitMode] = useState<'equal' | 'items' | 'custom'>('equal');
  const [people, setPeople] = useState<{ name: string; color: string; isMe?: boolean }[]>([
    { name: myName, color: INITIAL_COLORS[0], isMe: true },
  ]);
  const [paidByIdx, setPaidByIdx] = useState(0);
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [payerNotice, setPayerNotice] = useState<string | null>(null);
  const [step1Errors, setStep1Errors] = useState<{ name?: string; amount?: string }>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const amountRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const newPersonRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const submitLockRef = useRef(false);

  const amountParse = useMemo(
    () => parsePesoToCents(amountText, { allowZero: true }),
    [amountText]
  );
  const totalCents = amountParse.ok ? amountParse.cents : 0;

  const formattedAmountText = useMemo(() => formatAmountDisplay(amountText), [amountText]);

  const handleAmountChange = (txt: string) => {
    setAmountText(sanitizeAmountInput(txt));
    if (step1Errors.amount) setStep1Errors((e) => ({ ...e, amount: undefined }));
  };

  const equalShares = useMemo(
    () => splitEqually(totalCents, people.map((_, idx) => String(idx))),
    [totalCents, people]
  );

  const customCentsList = useMemo(() => {
    return people.map((_p, idx) => {
      const parsed = parsePesoToCents(customAmounts[idx] ?? '', { allowZero: true });
      return parsed.ok ? parsed.cents : -1;
    });
  }, [customAmounts, people]);

  const customValidation = useMemo(
    () => validateCustomAmountsSum(totalCents, customCentsList),
    [totalCents, customCentsList]
  );

  const handleAddPerson = () => {
    const check = validateNewMemberName(
      newPersonName,
      people.map((p) => p.name)
    );
    if (!check.ok) {
      setMemberError(check.error);
      newPersonRef.current?.focus();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const color = INITIAL_COLORS[people.length % INITIAL_COLORS.length] ?? MemberPalette[0];
    setPeople((prev) => [...prev, { name: check.name, color }]);
    setNewPersonName('');
    setMemberError(null);
    setPayerNotice(null);
    setShowAddPerson(false);
  };

  const handleRemovePerson = (idx: number) => {
    if (people[idx]?.isMe || people.length <= 1) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const removedName = people[idx]?.name ?? 'Member';
    const nextPeople = people.filter((_, i) => i !== idx);
    setPeople(nextPeople);
    if (paidByIdx === idx) {
      setPaidByIdx(0);
      setPayerNotice(
        `${removedName} was removed, so ${nextPeople[0]?.isMe ? 'You' : nextPeople[0]?.name} is now marked as payer.`
      );
    } else if (paidByIdx > idx) {
      setPaidByIdx(paidByIdx - 1);
    }
  };

  const validateStep1Field = (field: 'name' | 'amount') => {
    if (field === 'name') {
      const res = splitNameSchema.safeParse(name);
      setStep1Errors((prev) => ({
        ...prev,
        name: res.success ? undefined : res.error.issues[0]?.message,
      }));
    } else {
      const res = parsePesoToCents(amountText, { allowZero: true });
      setStep1Errors((prev) => ({
        ...prev,
        amount: res.ok ? undefined : res.error,
      }));
    }
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const nameRes = splitNameSchema.safeParse(name);
      const amtRes = parsePesoToCents(amountText, { allowZero: true });
      const nextErr: { name?: string; amount?: string } = {
        name: nameRes.success ? undefined : nameRes.error.issues[0]?.message,
        amount: amtRes.ok ? undefined : amtRes.error,
      };
      setStep1Errors(nextErr);
      if (nextErr.name || nextErr.amount) {
        if (nextErr.name) nameRef.current?.focus();
        else amountRef.current?.focus();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      if (totalCents <= 0 && splitMode !== 'items') {
        setSplitMode('items');
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep((s) => (s - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleCreate = async () => {
    if (submitLockRef.current || saving) return;
    setError(null);
    if (!user) return;
    const cleanNameRes = splitNameSchema.safeParse(name);
    if (!cleanNameRes.success) {
      setError(cleanNameRes.error.issues[0]?.message ?? 'Enter a name for this split.');
      setStep(1);
      return;
    }

    if (splitMode === 'items') {
      router.push({
        pathname: '/group/review-items',
        params: {
          splitName: cleanNameRes.data,
          paidByIdx: String(paidByIdx),
          peopleJson: JSON.stringify(people),
          totalCents: String(totalCents),
        },
      });
      return;
    }

    if (totalCents <= 0) {
      setError('Enter a bill total in Step 1, or choose "By receipt items".');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (splitMode === 'custom' && !customValidation.ok) {
      setError(customValidation.error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    submitLockRef.current = true;
    setSaving(true);
    const res = await createSplitWithMembers({
      userId: user.id,
      name: cleanNameRes.data,
      totalCents,
      splitMode,
      people,
      paidByIdx,
      customCentsList,
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

    router.replace({
      pathname: '/group/split-ready',
      params: { groupId: res.groupId },
    });
  };

  const stepMeta = {
    1: {
      title: 'What are we splitting?',
      subtitle: 'Give it a name and enter the total bill (or leave ₱0 to list items in Step 3).',
    },
    2: {
      title: 'Who’s in this split?',
      subtitle: 'Add friends now, or leave just yourself and let friends scan your QR later.',
    },
    3: {
      title: 'How should we split it?',
      subtitle: 'Choose equal shares, receipt items, or exact custom amounts.',
    },
  }[step];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <SpringPressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? 'Cancel' : 'Back'}
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons
            name={step === 1 ? 'close' : 'chevron-back'}
            size={20}
            color={palette.ink}
          />
        </SpringPressable>

        {/* Animated Progress Dots */}
        <View style={styles.stepIndicatorRow}>
          {([1, 2, 3] as const).map((s) => (
            <StepDot
              key={s}
              active={step === s}
              done={step > s}
              onPress={() => {
                if (s < step) {
                  setError(null);
                  setStep(s);
                }
              }}
            />
          ))}
        </View>

        <Text style={[styles.stepCounter, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
          {step}/3
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Step Header */}
          <View style={styles.stepHeader}>
            <Text style={[styles.stepTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {stepMeta.title}
            </Text>
            <Text style={[styles.stepSubtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              {stepMeta.subtitle}
            </Text>
          </View>

          {/* STEP 1: Name & Total Bill */}
          {step === 1 && (
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.duration(180)}
              exiting={reducedMotion ? undefined : FadeOut.duration(120)}
              style={styles.stepContent}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.border, padding: 18, gap: 10 },
                  cardElevation,
                ]}>
                <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  SPLIT NAME
                </Text>
                <TextInput
                  ref={nameRef}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (step1Errors.name) setStep1Errors((e) => ({ ...e, name: undefined }));
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => {
                    setFocusedField((f) => (f === 'name' ? null : f));
                    validateStep1Field('name');
                  }}
                  placeholder="e.g. Ramen Nagi dinner, Baguio trip"
                  placeholderTextColor={palette.mute}
                  maxLength={40}
                  autoFocus
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: palette.surfaceAlt,
                      color: palette.ink,
                      fontFamily: TakoFonts.bold,
                      borderColor: step1Errors.name
                        ? palette.destructive
                        : focusedField === 'name'
                          ? palette.ctaBg
                          : 'transparent',
                    },
                  ]}
                />
                <FieldError message={step1Errors.name} />
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.border, padding: 22, alignItems: 'center', gap: 10 },
                  cardElevation,
                ]}>
                <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  TOTAL BILL (OPTIONAL IF LISTING ITEMS)
                </Text>
                <View
                  style={[
                    styles.amountBox,
                    {
                      backgroundColor: palette.surfaceAlt,
                      borderColor: step1Errors.amount
                        ? palette.destructive
                        : focusedField === 'amount'
                          ? palette.ctaBg
                          : 'transparent',
                    },
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
                    value={formattedAmountText}
                    onChangeText={handleAmountChange}
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => {
                      setFocusedField((f) => (f === 'amount' ? null : f));
                      validateStep1Field('amount');
                    }}
                    placeholder="0"
                    placeholderTextColor={palette.mute}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    style={[
                      styles.amountInput,
                      {
                        color: palette.ink,
                        fontFamily: TakoFonts.black,
                      },
                    ]}
                  />
                </View>
                <FieldError message={step1Errors.amount} />
                <Text style={[styles.helperHint, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                  {totalCents > 0
                    ? `Total set to ${formatPeso(totalCents)}`
                    : 'Not sure yet? Leave ₱0 and add receipt items in Step 3.'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* STEP 2: People & Who Paid */}
          {step === 2 && (
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.duration(180)}
              exiting={reducedMotion ? undefined : FadeOut.duration(120)}
              style={styles.stepContent}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.border, padding: 16, gap: 12 },
                  cardElevation,
                ]}>
                <View style={styles.peopleHeader}>
                  <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                    PEOPLE IN THIS SPLIT ({people.length}/{MAX_GROUP_MEMBERS})
                  </Text>
                  <SpringPressable
                    onPress={() => {
                      if (people.length >= MAX_GROUP_MEMBERS) {
                        setError(`You can add up to ${MAX_GROUP_MEMBERS} people per split.`);
                        return;
                      }
                      setMemberError(null);
                      setShowAddPerson(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add friend"
                    style={[styles.addFriendPill, { backgroundColor: palette.coralSoft }]}>
                    <Ionicons name="person-add-outline" size={16} color={palette.coralAccent} />
                    <Text style={[styles.addFriendPillText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                      Add friend
                    </Text>
                  </SpringPressable>
                </View>

                {payerNotice && (
                  <View style={[styles.noticeBanner, { backgroundColor: palette.amberSoft }]}>
                    <Ionicons name="information-circle-outline" size={16} color={palette.amber} />
                    <Text style={[styles.noticeBannerText, { color: palette.amber, fontFamily: TakoFonts.bold }]}>
                      {payerNotice}
                    </Text>
                  </View>
                )}

                <View style={styles.peopleList}>
                  {people.map((p, idx) => {
                    const initial = p.isMe ? 'Y' : p.name.trim().charAt(0).toUpperCase() || '?';
                    return (
                      <View
                        key={`${p.name}-${idx}`}
                        style={[
                          styles.personRow,
                          idx < people.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                          },
                        ]}>
                        <View style={styles.personLeft}>
                          <View style={[styles.personAvatar, { backgroundColor: p.color }]}>
                            <Text style={[styles.personInitial, { fontFamily: TakoFonts.black }]}>
                              {initial}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={[styles.personName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                              {p.isMe ? `${p.name} (You)` : p.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={[styles.personRole, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                              {p.isMe
                                ? 'Split creator'
                                : 'Can claim this spot via QR or be marked paid'}
                            </Text>
                          </View>
                        </View>

                        {!p.isMe && (
                          <Pressable
                            onPress={() => handleRemovePerson(idx)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${p.name}`}
                            style={styles.removeBtn}>
                            <Ionicons name="close-circle" size={22} color={palette.mute} />
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Who paid the bill? */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.border, padding: 16, gap: 10 },
                  cardElevation,
                ]}>
                <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  WHO PAID THE BILL UPFRONT?
                </Text>
                <View style={styles.payerChipWrap}>
                  {people.map((p, idx) => {
                    const selected = paidByIdx === idx;
                    return (
                      <SpringPressable
                        key={`payer-${idx}`}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.selectionAsync().catch(() => {});
                          }
                          setPaidByIdx(idx);
                        }}
                        style={[
                          styles.payerChip,
                          {
                            backgroundColor: selected ? palette.plum : palette.chip,
                          },
                        ]}>
                        <View style={[styles.payerDot, { backgroundColor: p.color }]} />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.payerChipText,
                            {
                              color: selected ? '#FFF6EE' : palette.ink,
                              fontFamily: TakoFonts.bold,
                            },
                          ]}>
                          {p.isMe ? 'You' : p.name}
                        </Text>
                        {selected && <Ionicons name="checkmark" size={15} color="#FFF6EE" />}
                      </SpringPressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* STEP 3: How to Split */}
          {step === 3 && (
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.duration(180)}
              exiting={reducedMotion ? undefined : FadeOut.duration(120)}
              style={styles.stepContent}>
              {/* 3 Tactile Mode Cards */}
              <View style={styles.modeCardsStack}>
                {(
                  [
                    {
                      key: 'equal',
                      title: 'Split equally',
                      desc: 'Everyone pays an equal share of the total bill.',
                      icon: 'people-outline',
                    },
                    {
                      key: 'items',
                      title: 'By receipt items',
                      desc: 'List each item ordered and assign who had what.',
                      icon: 'receipt-outline',
                    },
                    {
                      key: 'custom',
                      title: 'Custom amounts',
                      desc: 'Type the exact peso amount for each person.',
                      icon: 'calculator-outline',
                    },
                  ] as const
                ).map((opt) => {
                  const active = splitMode === opt.key;
                  return (
                    <SpringPressable
                      key={opt.key}
                      scaleTo={0.98}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync().catch(() => {});
                        }
                        setError(null);
                        setSplitMode(opt.key);
                      }}
                      style={[
                        styles.modeCard,
                        {
                          backgroundColor: active ? palette.coralSoft : palette.surface,
                          borderColor: active ? palette.ctaBg : palette.border,
                          borderWidth: active ? 2 : 1,
                        },
                        cardElevation,
                      ]}>
                      <View
                        style={[
                          styles.modeIconBox,
                          { backgroundColor: active ? palette.surface : palette.chip },
                        ]}>
                        <Ionicons
                          name={opt.icon}
                          size={20}
                          color={active ? palette.ctaBg : palette.ink}
                        />
                      </View>
                      <View style={styles.modeCopy}>
                        <Text style={[styles.modeTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                          {opt.title}
                        </Text>
                        <Text style={[styles.modeDesc, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                          {opt.desc}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          active
                            ? { backgroundColor: palette.ctaBg, borderColor: palette.ctaBg }
                            : { borderColor: palette.border },
                        ]}>
                        {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </SpringPressable>
                  );
                })}
              </View>

              {/* Preview Box for Equal Split */}
              {splitMode === 'equal' && (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border, padding: 16, gap: 10 },
                    cardElevation,
                  ]}>
                  <View style={styles.peopleHeader}>
                    <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      EQUAL SHARE PREVIEW
                    </Text>
                    <AnimatedPeso
                      cents={totalCents}
                      style={[styles.fieldLabel, { color: palette.ink, fontFamily: TakoFonts.black }]}
                    />
                  </View>
                  {people.map((p, idx) => (
                    <View key={`eq-${idx}`} style={styles.customRow}>
                      <Text
                        numberOfLines={1}
                        style={[styles.customName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                        {p.isMe ? `${p.name} (You)` : p.name}
                      </Text>
                      <AnimatedPeso
                        cents={equalShares[idx]?.amount_cents ?? 0}
                        style={[styles.sharePreviewAmt, { color: palette.ink, fontFamily: TakoFonts.black }]}
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Inputs for Custom Split */}
              {splitMode === 'custom' && (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: palette.surface, borderColor: palette.border, padding: 16, gap: 12 },
                    cardElevation,
                  ]}>
                  <View style={styles.peopleHeader}>
                    <Text style={[styles.fieldLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      ENTER EXACT SHARES
                    </Text>
                    <Text
                      style={[
                        styles.fieldLabel,
                        {
                          color: customValidation.ok ? palette.teal : palette.destructive,
                          fontFamily: TakoFonts.bold,
                        },
                      ]}>
                      {customValidation.ok ? 'Balanced ₱0' : customValidation.error}
                    </Text>
                  </View>
                  {people.map((p, idx) => (
                    <View key={`custom-${idx}`} style={styles.customRow}>
                      <Text
                        numberOfLines={1}
                        style={[styles.customName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                        {p.isMe ? `${p.name} (You)` : p.name}
                      </Text>
                      <View style={[styles.customInputWrap, { backgroundColor: palette.surfaceAlt }]}>
                        <Text style={{ color: palette.mute, fontFamily: TakoFonts.bold }}>₱</Text>
                        <TextInput
                          value={customAmounts[idx] ?? ''}
                          onChangeText={(txt) => {
                            setError(null);
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [idx]: sanitizeAmountInput(txt),
                            }));
                          }}
                          placeholder={String(Math.round((equalShares[idx]?.amount_cents ?? 0) / 100))}
                          placeholderTextColor={palette.mute}
                          keyboardType="decimal-pad"
                          inputMode="decimal"
                          style={[
                            styles.customInput,
                            { color: palette.ink, fontFamily: TakoFonts.bold },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Info Banner for Items Split */}
              {splitMode === 'items' && (
                <View style={[styles.itemsInfoBanner, { backgroundColor: palette.lavenderSoft }]}>
                  <TakoMascot state="idle" size={44} interactive={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemsInfoTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      Next: Add items & assign who had what
                    </Text>
                    <Text
                      style={[
                        styles.itemsInfoSub,
                        { color: isDark ? palette.mute : palette.plum, fontFamily: TakoFonts.regular },
                      ]}>
                      You’ll list the items ordered, tap who ordered each one, and then get your shareable QR code.
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {error && (
            <Text style={[styles.errorText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: palette.bg,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          {step < 3 ? (
            <PrimaryButton
              label={step === 1 ? 'Next: Add people' : 'Next: How to split'}
              iconRight="arrow-forward"
              onPress={handleNextStep}
              accessibilityLabel="Continue to next step"
            />
          ) : (
            <PrimaryButton
              label={splitMode === 'items' ? 'Next: Add receipt items' : 'Create split & get QR'}
              icon={splitMode === 'items' ? 'list-outline' : 'qr-code-outline'}
              onPress={handleCreate}
              loading={saving}
              accessibilityLabel="Create split"
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Add Person Bottom Sheet */}
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
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <TextInput
              ref={newPersonRef}
              value={newPersonName}
              onChangeText={(t) => {
                setNewPersonName(t);
                if (memberError) setMemberError(null);
              }}
              placeholder="Friend's name (e.g. Mia)"
              placeholderTextColor={palette.mute}
              maxLength={30}
              autoFocus
              onSubmitEditing={handleAddPerson}
              style={[
                styles.modalInput,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />
            <FieldError message={memberError} />

            <PrimaryButton
              label="Add to split"
              onPress={handleAddPerson}
            />
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
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDotHit: {
    minHeight: 32,
    justifyContent: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 13,
    minWidth: 44,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 28,
    gap: 16,
  },
  stepHeader: {
    gap: 4,
  },
  stepTitle: {
    fontSize: 24,
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepContent: {
    gap: 14,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.9,
  },
  nameInput: {
    borderRadius: Radii.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    width: '100%',
  },
  pesoSign: { fontSize: 36 },
  amountInput: {
    fontSize: 42,
    minWidth: 90,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  helperHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addFriendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: Radii.pill,
  },
  addFriendPillText: {
    fontSize: 13,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  noticeBannerText: {
    fontSize: 12,
    flex: 1,
  },
  peopleList: {
    gap: 2,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  personLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: {
    color: '#2B1B3D',
    fontSize: 14,
  },
  personName: {
    fontSize: 15,
  },
  personRole: {
    fontSize: 12,
  },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payerChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: Radii.pill,
    maxWidth: '100%',
  },
  payerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  payerChipText: {
    fontSize: 14,
    flexShrink: 1,
  },
  modeCardsStack: {
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: Radii.xl,
    gap: 12,
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCopy: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    fontSize: 15,
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  customName: {
    fontSize: 14,
    flex: 1,
  },
  sharePreviewAmt: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 108,
  },
  customInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  itemsInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radii.xl,
  },
  itemsInfoTitle: {
    fontSize: 14,
  },
  itemsInfoSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
  modalTitle: { fontSize: 20 },
  modalCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
});
