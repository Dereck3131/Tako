import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radii, Shadows, Typography } from '../constants/theme';
import { MotionTokens } from '../constants/motion';
import { NeoButton } from './NeoUI';
import { AnimatedNumber, useReducedMotion } from './MotionPrimitives';

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
  const reducedMotion = useReducedMotion();
  const coinOpacity = useSharedValue(0);
  const coinY = useSharedValue(-22);
  const coinScale = useSharedValue(1.08);

  useEffect(() => {
    if (!hasPaid) {
      coinOpacity.value = 0;
      coinY.value = -22;
      coinScale.value = 1.08;
      return;
    }
    if (reducedMotion) {
      coinOpacity.value = 1;
      coinY.value = 0;
      coinScale.value = 1;
      return;
    }
    coinOpacity.value = withSequence(
      withTiming(1, { duration: 160, easing: MotionTokens.easing.reanimatedOut }),
      withTiming(1, { duration: 480 }),
      withTiming(0, { duration: 220 })
    );
    coinY.value = withSpring(0, MotionTokens.spring.bounce);
    coinScale.value = withSpring(1, MotionTokens.spring.bounce);
  }, [coinOpacity, coinScale, coinY, hasPaid, reducedMotion]);

  const coinStyle = useAnimatedStyle(() => ({
    opacity: coinOpacity.value,
    transform: [{ translateY: coinY.value }, { scale: coinScale.value }],
  }));

  return (
    <View style={[styles.card, Shadows.hero]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Your share to pay</Text>
        <Animated.View style={coinStyle} pointerEvents="none">
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={10} fill={Colors.amber} stroke={Colors.ink} strokeWidth={2} />
            <Circle cx={12} cy={12} r={4.5} fill="none" stroke={Colors.ink} strokeWidth={1.6} />
          </Svg>
        </Animated.View>
      </View>
      <AnimatedNumber
        value={amountCents}
        formatter={(c) => `$${(c / 100).toFixed(2)}`}
        style={styles.amount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
