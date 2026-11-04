import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Radii } from '../constants/theme';

interface SettlementHeroProps {
  amountCents: number;
  splitCount: number;
  roomTitle: string;
  onPayNow: () => void;
}

export const SettlementHero: React.FC<SettlementHeroProps> = ({
  amountCents,
  splitCount,
  roomTitle,
  onPayNow,
}) => {
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback for web
    }
    onPayNow();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sublabel}>Your share to pay</Text>
      <Text style={styles.currency}>${(amountCents / 100).toFixed(2)}</Text>
      <Text style={styles.detail}>
        Split {splitCount} ways · {roomTitle}
      </Text>
      <TouchableOpacity
        style={styles.payButton}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <Text style={styles.payButtonText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardMidnight,
    borderRadius: Radii.card,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  sublabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  currency: {
    color: Colors.textWhite,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  detail: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: Colors.amber,
    borderRadius: Radii.pill,
    minHeight: 52, // >= 48px touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
