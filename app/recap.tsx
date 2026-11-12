import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { NeoCard } from '../src/components/NeoUI';
import { RecapCard } from '../src/components/RecapCard';
import { Colors, Radii, Spacing, Typography } from '../src/constants/theme';
import { useRoomStore } from '../src/store/roomStore';
import { generateBillAwards } from '../src/services/awardsEngine';

export default function RecapScreen() {
  const router = useRouter();
  const {
    currentRoom,
    members,
    items,
    shares,
    adjustmentCountByMember,
    currency,
    language,
    optOutAwards,
    selectedAnimal,
  } = useRoomStore();

  // Privacy toggle ON by default
  const [hideAmounts, setHideAmounts] = useState(true);

  const owingMembers = members.filter((m) => m.totalOwedCents > 0);
  const totalCents = owingMembers.reduce((sum, m) => sum + m.totalOwedCents, 0);
  const perPersonCents =
    owingMembers.length > 0 ? Math.round(totalCents / owingMembers.length) : 0;

  const awards = useMemo(
    () =>
      generateBillAwards({
        members,
        items,
        shares,
        adjustmentCountByMember,
        currency,
        optOutAwards,
        hideAmounts,
      }),
    [members, items, shares, adjustmentCountByMember, currency, optOutAwards, hideAmounts]
  );

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <NeoCard
              onPress={() => router.back()}
              accessibilityLabel="Back"
              borderRadius={Radii.pill}
              contentStyle={styles.backBtnBox}
            >
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={Colors.ink}
                strokeWidth={2.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="m15 5-7 7 7 7" />
              </Svg>
            </NeoCard>
            <Text style={styles.headerTitle}>Bill Recap & Awards</Text>
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <RecapCard
              groupName={currentRoom.title}
              dateLabel="Tonight"
              totalCents={totalCents}
              perPersonCents={perPersonCents}
              currency={currency}
              language={language}
              awards={awards}
              hideAmounts={hideAmounts}
              onToggleHideAmounts={setHideAmounts}
              selectedAnimal={selectedAnimal}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </DotGridBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtnBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.sectionTitle,
    flex: 1,
  },
});
