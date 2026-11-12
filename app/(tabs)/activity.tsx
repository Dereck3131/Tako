import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoomStore } from '../../src/store/roomStore';
import {
  Colors,
  Motion,
  Radii,
  Spacing,
  TouchTarget,
  Typography,
} from '../../src/constants/theme';
import { DotGridBackground } from '../../src/components/DotGridBackground';
import { NeoCard } from '../../src/components/NeoUI';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../../src/components/MemojiAvatar';
import { StaggerItem, useReducedMotion } from '../../src/components/MotionPrimitives';
import { TakoMascot, getTakoMood, getTakoMoodCopy } from '../../src/components/TakoMascot';
import { formatMoney } from '../../src/services/currency';
import { t } from '../../src/constants/i18n';
import { triggerHaptic } from '../../src/services/feedbackEngine';

export default function ActivityScreen() {
  const {
    activities,
    members,
    items,
    shares,
    selectedAnimal,
    currency,
    language,
    roundToPeso,
    muteNudges,
    canNudgeMember,
    nudgeMember,
  } = useRoomStore();
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);

  const getMemojiId = (name: string): MemojiId => {
    const lower = name.toLowerCase();
    if (lower.includes('mia')) return 'mia';
    if (lower.includes('jonas')) return 'jonas';
    if (lower.includes('aly')) return 'aly';
    if (lower.includes('ken')) return 'ken';
    return selectedAnimal;
  };

  const paidMembers = members.filter((m) => m.paymentStatus === 'paid' || m.paymentStatus === 'verified');
  const unpaidMembers = members.filter(
    (m) => m.totalOwedCents > 0 && m.paymentStatus !== 'paid' && m.paymentStatus !== 'verified' && m.userId !== 'user-you'
  );
  const paidCount = paidMembers.length;
  const totalMembers = 4;
  const paidCents = paidMembers.reduce((sum, m) => sum + m.totalOwedCents, 0);
  const totalCents = 21000;
  const ratio = Math.min(1, Math.max(0, paidCents / totalCents));
  const takoMood = getTakoMood(members, items, shares);
  const moodCopy = getTakoMoodCopy(takoMood, language, paidCount, totalMembers);

  const progressAnim = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    const anim = Animated.timing(progressAnim, {
      toValue: ratio,
      duration: reducedMotion ? 0 : Motion.durationNormal,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();
    return () => anim.stop();
  }, [ratio, progressAnim, reducedMotion]);

  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-(trackWidth / 2), 0],
  });

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Activity</Text>
            <Badge label="Live" variant="emerald" />
          </View>

          {/* Settlement Progress Card */}
          <StaggerItem index={0} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.lg }}
              borderRadius={Radii.card}
              contentStyle={styles.settlementContent}
            >
              <View style={styles.settlementTopRow}>
                <Text style={styles.settlementLabel}>SETTLEMENT</Text>
                <Badge
                  label={`${paidCount} of ${totalMembers} paid`}
                  variant="emerald"
                />
              </View>

              <View style={styles.amountRow}>
                <Text
                  style={styles.boldAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(paidCents, currency, { roundToWhole: roundToPeso })}
                </Text>
                <Text style={styles.totalAmount} numberOfLines={1}>
                  {' '}
                  of {formatMoney(totalCents, currency, { roundToWhole: roundToPeso })}
                </Text>
              </View>

              <View
                style={styles.progressTrack}
                onLayout={(e: LayoutChangeEvent) =>
                  setTrackWidth(e.nativeEvent.layout.width)
                }
              >
                {trackWidth > 0 && (
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: trackWidth,
                        transform: [{ translateX }, { scaleX: progressAnim }],
                      },
                    ]}
                  />
                )}
              </View>

              {/* Tako Mood Strip */}
              <View style={styles.moodRow}>
                <TakoMascot size={46} mood={takoMood} />
                <Text style={styles.moodText} numberOfLines={2}>
                  {moodCopy}
                </Text>
              </View>

              {/* Squirt Ink Gentle Nudge (1 per person / 24h) */}
              {unpaidMembers.length > 0 && (
                <View style={styles.nudgeSection}>
                  {unpaidMembers.map((friend) => {
                    const allowed = canNudgeMember(friend.id);
                    return (
                      <View key={friend.id} style={styles.nudgeRow}>
                        <View style={styles.nudgeLeft}>
                          <MemojiAvatar id={getMemojiId(friend.displayName)} size={32} />
                          <Text style={styles.nudgeName} numberOfLines={1}>
                            {friend.displayName} · {formatMoney(friend.totalOwedCents, currency, { roundToWhole: roundToPeso })}
                          </Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Squirt ink nudge to ${friend.displayName}`}
                          disabled={!allowed}
                          onPress={() => {
                            const res = nudgeMember(friend.id);
                            if (res.sent) triggerHaptic('tick');
                          }}
                          style={({ pressed }) => [
                            styles.nudgeBtn,
                            !allowed && styles.nudgeBtnDisabled,
                            pressed && allowed && { transform: [{ scale: Motion.pressScale }] },
                          ]}
                        >
                          <Text style={[styles.nudgeBtnText, !allowed && styles.nudgeBtnTextDisabled]}>
                            {muteNudges
                              ? t(language, 'nudgesMuted')
                              : allowed
                              ? t(language, 'squirtInk')
                              : t(language, 'nudgedToday')}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </NeoCard>
          </StaggerItem>

          {/* Today Section */}
          <Text style={styles.sectionHeader}>Today</Text>
          {activities.length === 0 ? (
            <NeoCard borderRadius={Radii.card} contentStyle={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySub}>
                Claims, splits, and payments will show up here in real time.
              </Text>
            </NeoCard>
          ) : (
            <StaggerItem index={1} distance={10}>
              <NeoCard borderRadius={Radii.card} contentStyle={styles.feedContent}>
                {activities.map((act, idx) => {
                  const memojiId = getMemojiId(act.actorName);
                  return (
                    <View
                      key={act.id}
                      style={[
                        styles.eventRow,
                        idx > 0 && styles.eventRowBorder,
                      ]}
                    >
                      <View style={styles.avatarShrink}>
                        <MemojiAvatar id={memojiId} size={38} />
                      </View>
                      <View style={styles.eventTextCol}>
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {act.title}
                        </Text>
                        {act.subtitle ? (
                          <Text style={styles.eventSubtitle} numberOfLines={1}>
                            {act.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.eventRightCol}>
                        {act.badge && (
                          <Badge label={act.badge.label} variant={act.badge.variant} />
                        )}
                        <Text style={styles.timeText} numberOfLines={1}>
                          {act.relativeTime}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </NeoCard>
            </StaggerItem>
          )}
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
  },
  title: {
    ...Typography.screenTitle,
  },
  settlementContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  settlementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settlementLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  boldAmount: {
    ...Typography.currencyLg,
    color: Colors.ink,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceSubtle,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.mintProgress,
    borderRadius: Radii.pill,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  moodText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  nudgeSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  nudgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  nudgeName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    flex: 1,
  },
  nudgeBtn: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeBtnDisabled: {
    backgroundColor: Colors.surfaceSubtle,
  },
  nudgeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  nudgeBtnTextDisabled: {
    color: Colors.textSecondary,
  },
  sectionHeader: {
    ...Typography.sectionTitle,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.cardTitle,
  },
  emptySub: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  feedContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: 12,
  },
  eventRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  avatarShrink: {
    flexShrink: 0,
  },
  eventTextCol: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    color: Colors.ink,
  },
  eventSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  eventRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
