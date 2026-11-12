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
    <View style={[styles.wrapper, Shadows.card]}>
      {/* Amber hard offset shadow */}
      <View style={styles.amberShadow} />

      <View style={styles.card}>
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

        <View style={{ marginTop: 16 }}>
          <NeoButton
            label={hasPaid ? 'Paid ✓' : 'Pay Now'}
            onPress={onPayNow}
            disabled={hasPaid}
            backgroundColor={hasPaid ? Colors.mint : Colors.amber}
            textColor={Colors.ink}
            shadowColor={Colors.primary}
            shadowOffset={3}
            height={58}
            fontSize={19}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  amberShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    borderRadius: Radii.cardLg,
    backgroundColor: Colors.amber,
  },
  card: {
    backgroundColor: Colors.ink,
    borderRadius: Radii.cardLg,
    padding: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textOnDarkMuted,
  },
  amount: {
    ...Typography.currencyHero,
    fontSize: 56,
    lineHeight: 62,
    color: Colors.textWhite,
    marginTop: 2,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textOnDarkSubtle,
  },
});
