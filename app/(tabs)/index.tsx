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
import { TakoMascot, getTakoMood, getTakoMoodCopy } from '../../src/components/TakoMascot';
import { formatMoney } from '../../src/services/currency';
import { t } from '../../src/constants/i18n';
import { NeoButton, NeoCard } from '../../src/components/NeoUI';
import { TicketCard } from '../../src/components/TicketCard';
import { PeopleCarousel } from '../../src/components/PeopleCarousel';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar, MemojiId } from '../../src/components/MemojiAvatar';
import { HeroShaderBackground } from '../../src/components/HeroShaderBackground';
import { StaggerItem } from '../../src/components/MotionPrimitives';

export default function RoomHomeScreen() {
  const router = useRouter();
  const {
    currentRoom,
    members,
    items,
    shares,
    selectedAnimal,
    currency,
    language,
    roundToPeso,
  } = useRoomStore();

  const totalSpendCents = 31000;
  const memberCount = 4;
  const owingMembers = members.filter((m) => m.totalOwedCents > 0);
  const paidCount = owingMembers.filter(
    (m) => m.paymentStatus === 'paid' || m.paymentStatus === 'verified'
  ).length;
  const takoMood = getTakoMood(members, items, shares);
  const moodCopy = getTakoMoodCopy(takoMood, language, paidCount, owingMembers.length);

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
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.roomTitle} numberOfLines={2}>
                {currentRoom.title}
              </Text>
              <Badge
                label={`${memberCount} in the room`}
                variant="emerald"
                style={{ marginTop: Spacing.xs }}
              />
            </View>
          </View>

          {/* Hero Spend Card with Tako peeking behind */}
          <StaggerItem index={0} distance={8}>
            <View style={styles.heroWrap}>
              <View style={styles.takoPeekBehind} pointerEvents="none">
                <TakoMascot size={92} mood={takoMood} />
              </View>
              <NeoCard
                noBorder
                elevated
                backgroundColor={Colors.primary}
                borderRadius={Radii.cardLg}
                contentStyle={styles.heroCardContent}
              >
                <HeroShaderBackground />
                <View style={styles.heroTopRow}>
                  <View style={styles.heroAmountCol}>
                    <Text style={styles.heroLabel}>{t(language, 'splitTheBill')}</Text>
                    <Text
                      style={styles.heroAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {formatMoney(totalSpendCents, currency, { roundToWhole: roundToPeso })}
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
                      [selectedAnimal, 'mia', 'jonas', 'aly'] as MemojiId[]
                    ).map((id, idx) => (
                      <View
                        key={`${id}-${idx}`}
                        style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 10 - idx }}
                      >
                        <MemojiAvatar id={id} size={30} />
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.moodBanner}>
                  <Text style={styles.moodBannerText} numberOfLines={2}>
                    {moodCopy}
                  </Text>
                </View>

                <View style={{ marginTop: Spacing.md }}>
                  <NeoButton
                    onPress={() => {
                      triggerHaptic();
                      router.push('/join');
                    }}
                    backgroundColor="#FFFFFF"
                    textColor={Colors.ink}
                    borderColor="transparent"
                    height={46}
                    fontSize={15}
                  >
                    <QrSmallIcon size={18} color={Colors.primary} strokeWidth={2.2} />
                    <Text style={styles.inviteBtnText}>Invite with QR</Text>
                  </NeoButton>
                </View>
              </NeoCard>
            </View>
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
                                  style={{ marginTop: 4 }}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  roomTitle: {
    ...Typography.screenTitle,
  },
  heroWrap: {
    position: 'relative',
    marginTop: 22,
  },
  takoPeekBehind: {
    position: 'absolute',
    right: 18,
    top: -54,
    zIndex: 0,
  },
  heroCardContent: {
    padding: Spacing.xl,
    position: 'relative',
    zIndex: 1,
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
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroAmount: {
    ...Typography.currencyHero,
    color: '#FFFFFF',
    marginTop: 2,
  },
  settlePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  settlePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  splitWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.md,
  },
  splitWithLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  moodBanner: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  moodBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontSize: 15,
    fontWeight: '600',
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
    paddingVertical: 14,
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
    marginTop: 3,
  },
  itemPrice: {
    ...Typography.currencyMd,
    color: Colors.ink,
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitWaysText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
