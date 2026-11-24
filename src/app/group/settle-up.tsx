import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

import { PrimaryButton } from '@/components/PrimaryButton';
import { useToast } from '@/components/Toast';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { fetchAndCacheSnapshot } from '@/lib/offlineSync';
import { playSound } from '@/lib/sounds';
import { recordSettlement, unmarkMemberPaid, updateSettlementNote } from '@/lib/takoData';

type PaymentKey = 'gcash' | 'maya' | 'bank' | 'cash' | 'other';

function parseExistingNote(raw?: string): { method: PaymentKey; detail: string } {
  const note = (raw ?? '').trim();
  if (!note) return { method: 'gcash', detail: '' };

  const lower = note.toLowerCase();
  const extractDetail = (prefix: string) => {
    const rest = note.slice(prefix.length).trim();
    if (rest.startsWith('·')) return rest.slice(1).trim();
    if (rest.startsWith(',')) return rest.slice(1).trim();
    return rest;
  };

  if (lower.startsWith('via gcash')) return { method: 'gcash', detail: extractDetail('via gcash') };
  if (lower.startsWith('gcash')) return { method: 'gcash', detail: extractDetail('gcash') };
  if (lower.startsWith('via maya')) return { method: 'maya', detail: extractDetail('via maya') };
  if (lower.startsWith('maya')) return { method: 'maya', detail: extractDetail('maya') };
  if (lower.startsWith('via bank transfer')) return { method: 'bank', detail: extractDetail('via bank transfer') };
  if (lower.startsWith('bank transfer')) return { method: 'bank', detail: extractDetail('bank transfer') };
  if (lower.startsWith('via cash')) return { method: 'cash', detail: extractDetail('via cash') };
  if (lower.startsWith('cash')) return { method: 'cash', detail: extractDetail('cash') };
  if (lower.startsWith('via ')) return { method: 'other', detail: note.slice(4).trim() };
  return { method: 'other', detail: note };
}

interface PaymentOption {
  key: PaymentKey;
  title: string;
  subtitle: string;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  bgType: 'teal' | 'lavender' | 'coral' | 'gold' | 'surfaceAlt';
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    key: 'gcash',
    title: 'GCash',
    subtitle: 'E-wallet transfer',
    placeholder: 'e.g. 0917 123 4567 or ref # (optional)',
    icon: 'wallet-outline',
    bgType: 'teal',
  },
  {
    key: 'maya',
    title: 'Maya',
    subtitle: 'E-wallet transfer',
    placeholder: 'e.g. @username, 0917..., or ref # (optional)',
    icon: 'card-outline',
    bgType: 'lavender',
  },
  {
    key: 'bank',
    title: 'Bank transfer',
    subtitle: 'BPI, BDO, UnionBank, SeaBank…',
    placeholder: 'e.g. BPI ···4821 or SeaBank (optional)',
    icon: 'business-outline',
    bgType: 'coral',
  },
  {
    key: 'cash',
    title: 'Cash',
    subtitle: 'Paid in person',
    placeholder: 'e.g. Handed at dinner (optional)',
    icon: 'cash-outline',
    bgType: 'gold',
  },
  {
    key: 'other',
    title: 'Other',
    subtitle: 'GoTyme, Maribank, Palawan, etc.',
    placeholder: 'Where was it sent? (e.g. GoTyme)',
    icon: 'ellipsis-horizontal-circle-outline',
    bgType: 'surfaceAlt',
  },
];

export default function SettleUpScreen() {
  const params = useLocalSearchParams<{
    groupId?: string;
    amountCents?: string;
    payerName?: string;
    recipientName?: string;
    splitName?: string;
    fromMemberId?: string;
    toMemberId?: string;
    returnToGroup?: string;
    settlementId?: string;
    existingNote?: string;
  }>();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cardElevation = getCardElevation(isDark);

  const isEditing = Boolean(params.settlementId);
  const initialParsed = parseExistingNote(params.existingNote);

  const [selectedMethod, setSelectedMethod] = useState<PaymentKey>(initialParsed.method);
  const [paidToDetail, setPaidToDetail] = useState(initialParsed.detail);
  const [saving, setSaving] = useState(false);
  const [unmarking, setUnmarking] = useState(false);

  const amountCents = parseInt(params.amountCents ?? '0', 10) || 0;
  const payerName = params.payerName?.trim() || null;
  const recipientName = params.recipientName || 'Host';
  const splitName = params.splitName || 'Split';
  const returnToGroup = params.returnToGroup === '1';
  const chosenOption =
    PAYMENT_OPTIONS.find((o) => o.key === selectedMethod) ?? PAYMENT_OPTIONS[0];

  const getIconBg = (bg: PaymentOption['bgType']) => {
    if (bg === 'teal') return palette.tealSoft;
    if (bg === 'lavender') return palette.lavenderSoft;
    if (bg === 'gold') return palette.goldSoft;
    if (bg === 'coral') return palette.coralSoft;
    return palette.surfaceAlt;
  };

  const buildSettlementNote = () => {
    const trimmed = paidToDetail.trim();
    if (selectedMethod === 'other') {
      return trimmed ? `via ${trimmed}` : 'Other payment';
    }
    return trimmed ? `via ${chosenOption.title} · ${trimmed}` : `via ${chosenOption.title}`;
  };

  const handleRecordPayment = async () => {
    setSaving(true);
    const note = buildSettlementNote();
    const detail = paidToDetail.trim();
    const displayMethod =
      selectedMethod === 'other' && detail ? detail : chosenOption.title;

    let res: { ok: true; queuedOffline?: boolean } | { ok: false; error: string } = {
      ok: true,
    };

    if (isEditing && params.settlementId) {
      res = await updateSettlementNote({
        settlementId: params.settlementId,
        note,
      });
    } else if (user?.id && params.groupId && params.fromMemberId && params.toMemberId) {
      res = await recordSettlement({
        userId: user.id,
        groupId: params.groupId,
        fromMemberId: params.fromMemberId,
        toMemberId: params.toMemberId,
        amountCents,
        note,
      });
    } else if (user?.id && params.groupId) {
      const { snapshot } = await fetchAndCacheSnapshot(user.id);
      const members = snapshot.members
        .filter((m) => m.group_id === params.groupId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      if (members.length >= 2) {
        const toMember = members[0];
        const fromMember = members[members.length - 1];
        if (fromMember.id !== toMember.id) {
          res = await recordSettlement({
            userId: user.id,
            groupId: params.groupId,
            fromMemberId: fromMember.id,
            toMemberId: toMember.id,
            amountCents,
            note,
          });
        }
      }
    }

    setSaving(false);

    if (!res.ok) {
      showToast({ message: res.error, tone: 'error' });
      return;
    }

    playSound('coin');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    if (returnToGroup || isEditing) {
      showToast({
        message: isEditing
          ? `Updated payment record (${note})`
          : res.queuedOffline
            ? `Saved ${payerName ?? 'payment'} ${note} offline`
            : `Recorded ${payerName ? `${payerName}'s payment` : 'payment'} ${note}`,
      });
      router.back();
      return;
    }

    router.replace({
      pathname: '/group/all-settled',
      params: {
        amountCents: String(amountCents),
        recipientName,
        splitName,
        method: displayMethod,
        paidTo: selectedMethod === 'other' ? '' : detail,
      },
    });
  };

  const handleMarkUnpaid = async () => {
    if (!user?.id || !params.groupId || !params.fromMemberId) return;
    setUnmarking(true);
    const res = await unmarkMemberPaid({
      userId: user.id,
      groupId: params.groupId,
      fromMemberId: params.fromMemberId,
    });
    setUnmarking(false);

    if (!res.ok) {
      showToast({ message: res.error, tone: 'error' });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    showToast({
      message: `${payerName ?? 'Member'} marked as unpaid`,
    });
    router.back();
  };

  const ctaLabel = isEditing
    ? 'Save payment record'
    : selectedMethod === 'other'
      ? `Record ${formatPeso(amountCents)} payment`
      : `Record ${formatPeso(amountCents)} via ${chosenOption.title}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          {isEditing ? 'Payment record' : 'Record payment'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={[styles.youOweLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              {payerName ? `${payerName} pays ${recipientName}` : `You owe ${recipientName}`}
            </Text>
            <Text style={[styles.bigAmount, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {formatPeso(amountCents)}
            </Text>
            <Text style={[styles.splitSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              {splitName}
            </Text>
          </View>

          {/* WHERE WAS IT PAID? */}
          <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            {payerName ? `WHERE DID ${payerName.toUpperCase()} PAY?` : 'WHERE DID YOU PAY?'}
          </Text>

          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            {PAYMENT_OPTIONS.map((opt, idx) => {
              const active = selectedMethod === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    playSound('pop');
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    setSelectedMethod(opt.key);
                  }}
                  style={[
                    styles.methodRow,
                    idx < PAYMENT_OPTIONS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    },
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(opt.bgType) }]}>
                    <Ionicons name={opt.icon} size={18} color={palette.ink} />
                  </View>

                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.methodSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                      {opt.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      active
                        ? { backgroundColor: palette.ctaBg, borderColor: palette.ctaBg }
                        : { borderColor: palette.border, backgroundColor: 'transparent' },
                    ]}>
                    {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* PAID TO / DETAILS */}
          <View style={styles.detailField}>
            <Text style={[styles.sectionLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              PAID TO / DETAILS (OPTIONAL)
            </Text>
            <TextInput
              value={paidToDetail}
              onChangeText={setPaidToDetail}
              placeholder={chosenOption.placeholder}
              placeholderTextColor={palette.mute}
              maxLength={60}
              returnKeyType="done"
              style={[
                styles.detailInput,
                {
                  backgroundColor: palette.surface,
                  color: palette.ink,
                  borderColor: palette.border,
                  fontFamily: TakoFonts.regular,
                },
              ]}
            />
            <Text style={[styles.helperText, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              Tako doesn’t process payments — this logs where the payment went so everyone can keep track.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <PrimaryButton
            label={ctaLabel}
            onPress={handleRecordPayment}
            loading={saving}
          />
          {isEditing && params.fromMemberId && (
            <Pressable
              onPress={handleMarkUnpaid}
              disabled={unmarking}
              accessibilityRole="button"
              accessibilityLabel="Mark as unpaid"
              style={styles.unmarkBtn}>
              <Text style={[styles.unmarkText, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                {unmarking ? 'Updating...' : 'Mark as unpaid'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
  topTitle: { fontSize: 17 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  youOweLabel: {
    fontSize: 13,
  },
  bigAmount: {
    fontSize: 44,
    fontVariant: ['tabular-nums'],
  },
  splitSub: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.1,
    marginTop: 6,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodTitle: {
    fontSize: 15,
  },
  methodSub: {
    fontSize: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailField: {
    gap: 8,
  },
  detailInput: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  unmarkBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unmarkText: {
    fontSize: 14,
  },
});
