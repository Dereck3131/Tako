import React, { useState } from 'react';
import {
  Pressable,
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
  Border,
  Colors,
  Motion,
  Radii,
  Spacing,
  TouchTarget,
  Typography,
} from '../../src/constants/theme';
import { DotGridBackground } from '../../src/components/DotGridBackground';
import { NeoButton, NeoCard } from '../../src/components/NeoUI';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../../src/components/MemojiAvatar';
import { HairlineEmptyReceipt } from '../../src/components/HairlineEmptyReceipt';
import { StaggerItem } from '../../src/components/MotionPrimitives';
import { useRoomStore } from '../../src/store/roomStore';

interface DisplayItem {
  id: string;
  title: string;
  addedBy: string;
  price: string;
  claimers: MemojiId[];
  mine: boolean;
}

const SAMPLE_ITEMS: DisplayItem[] = [
  {
    id: 'truffle-burger',
    title: 'Truffle Burger ×2',
    addedBy: 'Added by Mia',
    price: '$36.00',
    claimers: ['bear', 'fox', 'panda'],
    mine: true,
  },
  {
    id: 'margherita-pizza',
    title: 'Margherita Pizza',
    addedBy: 'Added by Aly',
    price: '$24.00',
    claimers: [],
    mine: false,
  },
  {
    id: 'iced-tea',
    title: 'Iced Tea ×4',
    addedBy: 'Added by Jonas',
    price: '$18.00',
    claimers: ['bear', 'panda', 'frog', 'cat'],
    mine: true,
  },
  {
    id: 'garlic-fries',
    title: 'Garlic Fries',
    addedBy: 'Added by Jonas',
    price: '$9.50',
    claimers: ['bear', 'panda'],
    mine: true,
  },
  {
    id: 'tiramisu',
    title: 'Tiramisu',
    addedBy: 'Added by Ken',
    price: '$12.00',
    claimers: [],
    mine: false,
  },
];

export default function ItemsScreen() {
  const router = useRouter();
  const { selectedAnimal } = useRoomStore();
  const [filter, setFilter] = useState<'All' | 'Unclaimed' | 'Mine'>('All');
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>({});
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);

  const handleQuickClaim = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setClaimedMap((prev) => ({ ...prev, [id]: true }));
  };

  const itemsWithClaims = SAMPLE_ITEMS.map((item) => {
    const isClaimedNow = item.claimers.length > 0 || claimedMap[item.id];
    const claimers =
      item.claimers.length > 0
        ? item.claimers.map((c) => (c === 'bear' ? selectedAnimal : c))
        : claimedMap[item.id]
          ? [selectedAnimal]
          : [];
    return {
      ...item,
      claimers,
      isClaimed: isClaimedNow,
      mine: item.mine || Boolean(claimedMap[item.id]),
    };
  });

  const filteredItems = showEmptyDemo
    ? []
    : itemsWithClaims.filter((item) => {
        if (filter === 'Unclaimed') return !item.isClaimed;
        if (filter === 'Mine') return item.mine;
        return true;
      });

  const unclaimedCount = itemsWithClaims.filter((i) => !i.isClaimed).length;

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Items</Text>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showEmptyDemo ? 'Show items' : 'Preview empty state'}
                onPress={() => setShowEmptyDemo(!showEmptyDemo)}
                style={({ pressed }) => [
                  styles.emptyToggle,
                  pressed && { transform: [{ scale: Motion.pressScale }] },
                ]}
              >
                <Text style={styles.emptyToggleText}>
                  {showEmptyDemo ? 'Show items' : 'Empty'}
                </Text>
              </Pressable>
              <NeoButton
                label="+ Add item"
                onPress={() => router.push('/claim')}
                backgroundColor={Colors.amber}
                textColor={Colors.ink}
                height={44}
                fontSize={14}
              />
            </View>
          </View>

          {filteredItems.length === 0 ? (
            /* Empty State with Signature Hairline Illustration */
            <StaggerItem index={0} distance={10}>
              <View style={styles.emptyCard}>
                <View style={{ alignItems: 'center' }}>
                  <HairlineEmptyReceipt size={148} />
                </View>
                <Text style={styles.emptyTitle}>No items yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add the first dish and Tako will tell everyone in the room.
                </Text>

                <View style={{ marginTop: 22, width: '100%' }}>
                  <NeoButton
                    label="+ Add first item"
                    onPress={() => {
                      setShowEmptyDemo(false);
                      setFilter('All');
                      router.push('/claim');
                    }}
                    backgroundColor={Colors.amber}
                    textColor={Colors.ink}
                    height={54}
                    fontSize={17}
                  />
                </View>

                <View style={{ marginTop: 14, width: '100%' }}>
                  <NeoButton
                    onPress={() => {
                      setShowEmptyDemo(false);
                      setFilter('All');
                    }}
                    backgroundColor="#FFFFFF"
                    textColor={Colors.ink}
                    height={50}
                    fontSize={15}
                  >
                    <Svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={Colors.ink}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                    >
                      <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
                    </Svg>
                    <Text style={styles.scanBtnText}>Scan the receipt</Text>
                  </NeoButton>
                </View>
              </View>
            </StaggerItem>
          ) : (
            <>
              {/* Filter Chips */}
              <View style={styles.filterRow}>
                {(['All', 'Unclaimed', 'Mine'] as const).map((tab) => {
                  const isActive = filter === tab;
                  return (
                    <Pressable
                      key={tab}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      style={({ pressed }) => [
                        styles.filterChip,
                        isActive ? styles.filterChipActive : styles.filterChipInactive,
                        pressed && { transform: [{ scale: Motion.pressScale }] },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {
                          // Fallback
                        }
                        setFilter(tab);
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.filterChipText,
                          { color: isActive ? '#FFFFFF' : Colors.ink },
                        ]}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Blue Summary Hero Card */}
              <NeoCard
                style={{ marginTop: 14 }}
                backgroundColor={Colors.primary}
                borderRadius={Radii.card}
                contentStyle={styles.summaryContent}
              >
                <View style={styles.summaryTextCol}>
                  <Text style={styles.summarySub} numberOfLines={1}>
                    12 items · Friday Night Dinner
                  </Text>
                  <Text style={styles.summaryTotal} numberOfLines={1} adjustsFontSizeToFit>
                    $310.00
                  </Text>
                </View>
                <Badge
                  label={
                    unclaimedCount === 0
                      ? 'All claimed'
                      : `${unclaimedCount} unclaimed`
                  }
                  variant={unclaimedCount === 0 ? 'emerald' : 'amber'}
                />
              </NeoCard>

              {/* Item Cards */}
              <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
                {filteredItems.map((item, idx) => (
                  <StaggerItem key={item.id} index={idx} distance={8}>
                    <NeoCard
                      onPress={() => router.push('/claim')}
                      borderRadius={Radii.lg}
                      contentStyle={styles.itemCardContent}
                    >
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemInfoCol}>
                          <Text style={styles.itemTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.itemAddedBy} numberOfLines={1}>
                            {item.addedBy}
                          </Text>
                        </View>
                        <Text style={styles.itemPrice} numberOfLines={1}>
                          {item.price}
                        </Text>
                      </View>

                      <View style={styles.itemBottomRow}>
                        {item.isClaimed ? (
                          <View style={styles.avatarStack}>
                            {item.claimers.map((avatar, aIdx) => (
                              <View
                                key={`${avatar}-${aIdx}`}
                                style={{
                                  marginLeft: aIdx > 0 ? -9 : 0,
                                  zIndex: 10 - aIdx,
                                }}
                              >
                                <MemojiAvatar id={avatar} size={26} />
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.nobodyText}>Nobody yet</Text>
                        )}

                        {item.isClaimed ? (
                          <Badge label="Claimed" variant="emerald" />
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Claim ${item.title}`}
                            onPress={() => handleQuickClaim(item.id)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.quickClaimHit,
                              pressed && { transform: [{ scale: Motion.pressScale }] },
                            ]}
                          >
                            <Badge label="Tap to claim" variant="amber" />
                          </Pressable>
                        )}
                      </View>
                    </NeoCard>
                  </StaggerItem>
                ))}
              </View>
            </>
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
    gap: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  emptyToggle: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  title: {
    ...Typography.screenTitle,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 14,
  },
  filterChip: {
    minHeight: TouchTarget.minSize,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.ink,
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  summaryTextCol: {
    flex: 1,
    minWidth: 0,
  },
  summarySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryTotal: {
    ...Typography.currencyLg,
    color: '#FFFFFF',
    marginTop: 2,
  },
  itemCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  itemInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...Typography.cardTitle,
  },
  itemAddedBy: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.currencyMd,
    fontSize: 21,
    lineHeight: 25,
    color: Colors.ink,
    flexShrink: 0,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 36,
  },
  quickClaimHit: {
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nobodyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyCard: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    borderRadius: Radii.cardLg,
    borderWidth: Border.width,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: Colors.ink,
    marginTop: 10,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  scanBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
});
