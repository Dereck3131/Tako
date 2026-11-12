import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import {
  Colors,
  Radii,
  Spacing,
  TouchTarget,
  Typography,
} from '../src/constants/theme';
import { DotGridBackground } from '../src/components/DotGridBackground';
import { NeoCard } from '../src/components/NeoUI';
import { Badge } from '../src/components/Badge';
import { MemojiAvatar } from '../src/components/MemojiAvatar';
import { TakoMascot } from '../src/components/TakoMascot';
import { SettlementHero } from '../src/components/SettlementHero';
import { StaggerItem } from '../src/components/MotionPrimitives';
import { useRoomStore } from '../src/store/roomStore';

export default function SettleUpScreen() {
  const router = useRouter();
  const { currentRoom, members, markMemberPaid } = useRoomStore();
  const [hasPaidSelf, setHasPaidSelf] = useState(false);

  const handlePayNow = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }
    setHasPaidSelf(true);
    markMemberPaid('member-you');
  };

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <NeoCard
                onPress={() => router.back()}
                accessibilityLabel="Back"
                borderRadius={Radii.md}
                shadowOffset={3}
                contentStyle={styles.backBtnBox}
              >
                <Svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={Colors.ink}
                  strokeWidth={3}
                >
                  <Path d="m15 5-7 7 7 7" />
                </Svg>
              </NeoCard>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Settle up
              </Text>
            </View>
            <Badge label={`${members.length} in the room`} variant="emerald" />
          </View>

          {/* YOUR PLATE Card */}
          <StaggerItem index={0} distance={8}>
            <NeoCard
              style={{ marginTop: 18 }}
              borderRadius={Radii.card}
              contentStyle={styles.plateContent}
            >
              <Text style={styles.sectionLabel}>YOUR PLATE</Text>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Burgers
                  <Text style={styles.platePct}> 25% of $120.00</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  $30.00
                </Text>
              </View>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Drinks
                  <Text style={styles.platePct}> 25% of $60.00</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  $15.00
                </Text>
              </View>

              <View style={styles.plateRow}>
                <Text style={styles.plateItem} numberOfLines={2}>
                  Fries
                  <Text style={styles.platePct}> 25% of $30.00</Text>
                </Text>
                <Text style={styles.platePrice} numberOfLines={1}>
                  $7.50
                </Text>
              </View>
            </NeoCard>
          </StaggerItem>

          {/* THE ROOM Card */}
          <StaggerItem index={1} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.roomContent}
            >
              <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>
                THE ROOM
              </Text>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="mia" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Mia
                </Text>
                <Badge label="Paid" variant="emerald" />
              </View>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="jonas" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Jonas
                </Text>
                <Badge label="Paid" variant="emerald" />
              </View>

              <View style={styles.roomRow}>
                <View style={styles.avatarShrink}>
                  <MemojiAvatar id="aly" size={36} />
                </View>
                <Text style={styles.roomName} numberOfLines={1}>
                  Aly
                </Text>
                <Badge
                  label={hasPaidSelf ? 'Paid' : 'Pending'}
                  variant={hasPaidSelf ? 'emerald' : 'amber'}
                />
              </View>
            </NeoCard>
          </StaggerItem>

          {/* Peeking Tako Mascot + Dark Settlement Hero */}
          <StaggerItem index={2} distance={10}>
            <View style={styles.heroWrap}>
              <View style={styles.takoPeek} pointerEvents="none">
                <TakoMascot size={98} />
              </View>
              <SettlementHero
                amountCents={5250}
                splitWays={4}
                roomTitle={currentRoom.title}
                onPayNow={handlePayNow}
                hasPaid={hasPaidSelf}
              />
            </View>
          </StaggerItem>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtnBox: {
    width: TouchTarget.minSize,
    height: TouchTarget.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.ink,
    flex: 1,
    minWidth: 0,
  },
  plateContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionLabel: {
    ...Typography.micro,
    fontSize: 12,
    color: Colors.ink,
    marginBottom: 6,
  },
  plateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 9,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: Colors.ink,
  },
  plateItem: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  platePct: {
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  platePrice: {
    ...Typography.currencyMd,
    fontSize: 17,
    color: Colors.ink,
    flexShrink: 0,
  },
  roomContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
  },
  avatarShrink: {
    flexShrink: 0,
  },
  roomName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  heroWrap: {
    marginTop: 54,
    position: 'relative',
  },
  takoPeek: {
    position: 'absolute',
    right: 24,
    top: -68,
    zIndex: 1,
  },
});
