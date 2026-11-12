import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoomStore } from '../../src/store/roomStore';
import {
  Border,
  Colors,
  Motion,
  Radii,
  Spacing,
  Typography,
} from '../../src/constants/theme';
import { DotGridBackground } from '../../src/components/DotGridBackground';
import { NeoCard } from '../../src/components/NeoUI';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../../src/components/MemojiAvatar';
import { StaggerItem, useReducedMotion } from '../../src/components/MotionPrimitives';

export default function ActivityScreen() {
  const { activities, members, selectedAnimal } = useRoomStore();
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

  const paidMembers = members.filter((m) => m.paymentStatus === 'paid');
  const paidCount = paidMembers.length;
  const totalMembers = Math.max(1, members.length - 1); // exclude host or show total
  const paidCents = paidMembers.reduce((sum, m) => sum + m.totalOwedCents, 0);
  const totalCents = 21000;
  const ratio = Math.min(1, Math.max(0, paidCents / totalCents));

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
              style={{ marginTop: 18 }}
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
                  ${(paidCents / 100).toFixed(2)}
                </Text>
                <Text style={styles.totalAmount} numberOfLines={1}>
                  {' '}
                  of ${(totalCents / 100).toFixed(2)}
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
                        <MemojiAvatar id={memojiId} size={40} />
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
    paddingHorizontal: 18,
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
    fontSize: 12,
    color: Colors.ink,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  boldAmount: {
    ...Typography.currencyLg,
    color: Colors.ink,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 16,
    borderWidth: Border.width,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.mintProgress,
    borderRightWidth: Border.width,
    borderRightColor: Colors.ink,
  },
  sectionHeader: {
    ...Typography.sectionTitle,
    marginTop: 18,
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
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: 12,
  },
  eventRowBorder: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: Colors.ink,
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
    fontWeight: '800',
    lineHeight: 19,
    color: Colors.ink,
  },
  eventSubtitle: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '700',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
