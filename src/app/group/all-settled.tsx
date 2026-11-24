import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';

export default function AllSettledScreen() {
  const params = useLocalSearchParams<{
    amountCents?: string;
    recipientName?: string;
    splitName?: string;
    method?: string;
    paidTo?: string;
  }>();
  const { palette, isDark } = useTakoTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cardElevation = getCardElevation(isDark);

  const amountCents = parseInt(params.amountCents ?? '0', 10) || 0;
  const recipientName = params.recipientName || 'Host';
  const splitName = params.splitName || 'Split';
  const method = params.method || 'GCash';
  const paidTo = params.paidTo?.trim() || '';
  const [receiptMeta] = useState(() => ({
    reference: String(Date.now()).slice(-8).replace(/(\d{4})(\d{4})/, '$1 $2'),
    dateText: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  }));
  const { reference, dateText } = receiptMeta;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  const handleShareReceipt = async () => {
    const paidToLine = paidTo ? `\nPaid to: ${recipientName} (${paidTo})` : `\nPaid to: ${recipientName}`;
    await Share.share({
      message: `Tako Record — Paid ${recipientName} ${formatPeso(amountCents)} for ${splitName}\nPaid via: ${method}${paidToLine}\nDate: ${dateText}`,
    }).catch(() => {});
  };

  const rows = [
    { label: 'Amount', value: formatPeso(amountCents) },
    { label: 'Paid via', value: method },
    ...(paidTo ? [{ label: 'Paid to', value: paidTo }] : []),
    { label: 'Recorded', value: dateText },
    { label: 'Ref', value: reference },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}>
        <View style={styles.heroWrap}>
          <TakoMascot state="celebrate" size={140} interactive />
          <Text style={[styles.title, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Payment recorded!
          </Text>
          <Text style={[styles.subtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
            Logged {formatPeso(amountCents)} to {recipientName} via {method} for {splitName}.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
            cardElevation,
          ]}>
          {rows.map((row, idx) => (
            <View
              key={row.label}
              style={[
                styles.receiptRow,
                idx < rows.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: palette.border,
                },
              ]}>
              <Text style={[styles.rowLabel, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                {row.label}
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back to splits"
            onPress={() => router.replace('/(tabs)')}
          />

          <SpringPressable
            onPress={handleShareReceipt}
            accessibilityRole="button"
            accessibilityLabel="Share receipt"
            style={[
              styles.secondaryBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            <Ionicons name="share-outline" size={17} color={palette.ink} />
            <Text style={[styles.secondaryText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Share receipt
            </Text>
          </SpringPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    justifyContent: 'space-between',
    gap: 22,
  },
  heroWrap: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 28,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.05)' },
  }),
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 13,
  },
  rowValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: Radii.pill,
    minHeight: 52,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 50,
    paddingVertical: 14,
  },
  secondaryText: {
    fontSize: 15,
  },
});
