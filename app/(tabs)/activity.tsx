import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRoomStore } from '../../src/store/roomStore';
import { Colors, Radii } from '../../src/constants/theme';
import { Badge } from '../../src/components/Badge';

export default function ActivityScreen() {
  const { activities } = useRoomStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Activity</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Settlement Progress Card */}
        <View style={styles.settlementCard}>
          <View style={styles.settlementTopRow}>
            <Text style={styles.settlementLabel}>SETTLEMENT</Text>
            <Badge label="2 of 4 paid" variant="emerald" />
          </View>
          <View style={styles.amountRatioRow}>
            <Text style={styles.boldAmount}>$105.00</Text>
            <Text style={styles.totalAmount}> of $210.00</Text>
          </View>
          {/* Progress Bar (50% progress) */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>

        {/* Timeline Section */}
        <Text style={styles.sectionHeader}>Today</Text>
        <View style={styles.feedCard}>
          {activities.map((act, idx) => (
            <View
              key={act.id}
              style={[
                styles.eventRow,
                idx < activities.length - 1 && styles.eventBorder,
              ]}
            >
              <Image source={{ uri: act.actorAvatar }} style={styles.actorAvatar} />
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.eventTitle}>{act.title}</Text>
                {act.subtitle && (
                  <Text style={styles.eventSubtitle}>{act.subtitle}</Text>
                )}
              </View>
              <View style={styles.badgeTimeCol}>
                {act.badge && (
                  <Badge label={act.badge.label} variant={act.badge.variant} />
                )}
                <Text style={styles.timeText}>{act.relativeTime}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 6,
  },
  liveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.emerald,
  },
  settlementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  settlementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settlementLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  amountRatioRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  boldAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  eventBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  badgeTimeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
