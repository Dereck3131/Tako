import React from 'react';
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
import { QrSmallIcon } from '../../src/components/Icons';
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
import { TakoMascot } from '../../src/components/TakoMascot';
import { NeoButton, NeoCard } from '../../src/components/NeoUI';
import { TicketCard } from '../../src/components/TicketCard';
import { PeopleCarousel } from '../../src/components/PeopleCarousel';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../../src/components/MemojiAvatar';
import { HeroShaderBackground } from '../../src/components/HeroShaderBackground';
import { StaggerItem } from '../../src/components/MotionPrimitives';

export default function RoomHomeScreen() {
  const router = useRouter();
  const { currentRoom, members, items, selectedAnimal } = useRoomStore();

  const totalSpendCents = 31000;
  const memberCount = members.length;

  const triggerHaptic = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Web fallback
    }
  };

  const liveItems = items.slice(0, 3);

  return (
    <DotGridBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Tako Mascot */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.roomTitle} numberOfLines={2}>
                {currentRoom.title}
              </Text>
              <Badge
                label={`${memberCount} in the room`}
                variant="emerald"
                style={{ marginTop: Spacing.sm }}
              />
            </View>
            <View style={styles.takoCorner}>
              <TakoMascot size={104} />
            </View>
          </View>

          {/* Blue Hero Spend Card with subtle signature shader gradient */}
          <StaggerItem index={0} distance={8}>
            <NeoCard
              style={{ marginTop: Spacing.sm }}
              backgroundColor={Colors.primary}
              borderRadius={Radii.cardLg}
              contentStyle={styles.heroCardContent}
            >
              <HeroShaderBackground />
              <View style={styles.heroTopRow}>
                <View style={styles.heroAmountCol}>
                  <Text style={styles.heroLabel}>Total spend</Text>
                  <Text
                    style={styles.heroAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    ${(totalSpendCents / 100).toFixed(2)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Settle up"
                  style={({ pressed }) => [
                    styles.settlePill,
                    pressed && { transform: [{ scale: Motion.pressScale }] },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    router.push('/settle');
                  }}
                >
                  <Text style={styles.settlePillText}>Settle up →</Text>
                </Pressable>
              </View>

              <View style={styles.splitWithRow}>
                <Text style={styles.splitWithLabel}>Split with</Text>
                <View style={styles.avatarStack}>
                  {(
                    [selectedAnimal, 'mia', 'jonas', 'aly', 'ken'] as MemojiId[]
                  ).map((id, idx) => (
                    <View
                      key={`${id}-${idx}`}
                      style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 10 - idx }}
                    >
                      <MemojiAvatar id={id} size={32} />
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ marginTop: Spacing.md }}>
                <NeoButton
                  onPress={() => {
                    triggerHaptic();
                    router.push('/join');
                  }}
                  backgroundColor={Colors.amber}
                  textColor={Colors.ink}
                  height={46}
                  fontSize={15}
                >
                  <QrSmallIcon size={18} color={Colors.ink} strokeWidth={2.4} />
                  <Text style={styles.inviteBtnText}>Invite with QR</Text>
                </NeoButton>
              </View>
            </NeoCard>
          </StaggerItem>

          {/* Who's here */}
          <Text style={styles.sectionTitle}>Who's here</Text>
          <PeopleCarousel members={members} />

          {/* Live receipt */}
          <Text style={styles.sectionTitle}>Live receipt</Text>
          {liveItems.length === 0 ? (
            <NeoCard borderRadius={Radii.card} contentStyle={styles.emptyReceiptCard}>
              <Text style={styles.emptyReceiptTitle}>No items claimed yet</Text>
              <Text style={styles.emptyReceiptSub}>
                Add the first dish in Items to start splitting.
              </Text>
            </NeoCard>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {liveItems.map((item, idx) => {
                const splitAvatars: MemojiId[] =
                  idx === 0
                    ? [selectedAnimal, 'mia', 'jonas']
                    : [selectedAnimal, 'jonas'];
                return (
                  <StaggerItem key={item.id} index={idx + 1} distance={10}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Claim ${item.title}`}
                      onPress={() => {
                        triggerHaptic();
                        router.push('/claim');
                      }}
                      style={({ pressed }) =>
                        pressed ? { transform: [{ scale: Motion.pressScale }] } : undefined
                      }
                    >
                      <TicketCard
                        topStyle={styles.ticketTop}
                        bottomStyle={styles.ticketBottom}
                        childrenTop={
                          <View style={styles.ticketTopRow}>
                            <View style={styles.ticketInfoCol}>
                              <Text style={styles.itemTitle} numberOfLines={2}>
                                {item.title}
                              </Text>
                              <Text style={styles.itemMeta} numberOfLines={1}>
                                Added by {item.createdByName} · {item.createdAt}
                              </Text>
                            </View>
                            <View style={styles.ticketPriceCol}>
                              <Text style={styles.itemPrice} numberOfLines={1}>
                                ${(item.priceCents / 100).toFixed(2)}
                              </Text>
                              {item.isNew && (
                                <Badge
                                  label="NEW"
                                  variant="amber"
                                  style={{ marginTop: 3 }}
                                />
                              )}
                            </View>
                          </View>
                        }
                        childrenBottom={
                          <View style={styles.ticketBottomRow}>
                            <Text style={styles.splitWaysText}>
                              Split {splitAvatars.length}{' '}
                              {splitAvatars.length === 1 ? 'way' : 'ways'}
                            </Text>
                            <View style={styles.avatarStack}>
                              {splitAvatars.map((id, aIdx) => (
                                <View
                                  key={`${id}-${aIdx}`}
                                  style={{
                                    marginLeft: aIdx > 0 ? -9 : 0,
                                    zIndex: 10 - aIdx,
                                  }}
                                >
                                  <MemojiAvatar id={id} size={26} />
                                </View>
                              ))}
                            </View>
                          </View>
                        }
                      />
                    </Pressable>
                  </StaggerItem>
                );
              })}
            </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 72,
    gap: Spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  roomTitle: {
    ...Typography.screenTitle,
    fontSize: 24,
    marginTop: Spacing.xs,
  },
  takoCorner: {
    marginTop: -12,
    marginRight: -6,
    flexShrink: 0,
  },
  heroCardContent: {
    padding: Spacing.xl,
    position: 'relative',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  heroAmountCol: {
    flex: 1,
    minWidth: 0,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroAmount: {
    ...Typography.currencyHero,
    fontSize: 52,
    lineHeight: 56,
    color: '#FFFFFF',
    marginTop: 2,
  },
  settlePill: {
    backgroundColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  settlePillText: {
    color: Colors.amber,
    fontSize: 13,
    fontWeight: '800',
  },
  splitWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.md,
  },
  splitWithLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  emptyReceiptCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyReceiptTitle: {
    ...Typography.cardTitle,
  },
  emptyReceiptSub: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  ticketTop: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  ticketBottom: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  ticketInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  ticketPriceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  itemTitle: {
    ...Typography.cardTitle,
  },
  itemMeta: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.currencyMd,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.ink,
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitWaysText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
});
