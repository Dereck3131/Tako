import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radii, Shadows, Typography } from '../constants/theme';
import { NeoButton } from './NeoUI';

interface SettlementHeroProps {
  amountCents: number;
  splitWays: number;
  roomTitle: string;
  onPayNow: () => void;
  hasPaid?: boolean;
}

export function SettlementHero({
  amountCents,
  splitWays,
  roomTitle,
  onPayNow,
  hasPaid = false,
}: SettlementHeroProps) {
  return (
    <View style={[styles.card, Shadows.hero]}>
      <Text style={styles.label}>Your share to pay</Text>
      <Text
        style={styles.amount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        ${(amountCents / 100).toFixed(2)}
      </Text>
      <Text style={styles.subtext} numberOfLines={1} ellipsizeMode="tail">
        Split {splitWays} {splitWays === 1 ? 'way' : 'ways'} · {roomTitle}
      </Text>

      <View style={{ marginTop: 18 }}>
        <NeoButton
          label={hasPaid ? 'Paid ✓' : 'Pay Now'}
          onPress={onPayNow}
          disabled={hasPaid}
          backgroundColor={hasPaid ? Colors.mint : Colors.amber}
          textColor={hasPaid ? Colors.mintText : Colors.ink}
          height={54}
          fontSize={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardDark,
    borderRadius: Radii.cardLg,
    padding: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textOnDarkMuted,
  },
  amount: {
    ...Typography.currencyHero,
    color: Colors.textWhite,
    marginTop: 4,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textOnDarkSubtle,
    marginTop: 2,
  },
});
