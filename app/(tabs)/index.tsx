import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { QrSmallIcon } from '../../src/components/Icons';
import { useRoomStore } from '../../src/store/roomStore';
import { Colors, Radii } from '../../src/constants/theme';
import { TicketCard } from '../../src/components/TicketCard';
import { PeopleCarousel } from '../../src/components/PeopleCarousel';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar } from '../../src/components/MemojiAvatar';

export default function RoomHomeScreen() {
  const router = useRouter();
  const { currentRoom, members } = useRoomStore();

  const totalSpendCents = 31000; // $310.00 from Figma

  const triggerHaptic = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.roomTitle}>{currentRoom.title}</Text>
              {/* Orange Triangle Down Chevron matching Figma */}
              <View style={styles.orangeChevron}>
                <Text style={styles.orangeChevronText}>▼</Text>
              </View>
            </View>
            <View style={styles.liveCountRow}>
              <View style={styles.greenDot} />
              <Text style={styles.liveCountText}>4 in room</Text>
            </View>
          </View>

          {/* Top-Right Memoji Avatar Stack matching Figma */}
          <View style={styles.avatarStack}>
            <View style={[styles.avatarStackItem, { zIndex: 3 }]}>
              <MemojiAvatar id="mia" size={34} />
            </View>
            <View style={[styles.avatarStackItem, { marginLeft: -12, zIndex: 2 }]}>
              <MemojiAvatar id="jonas" size={34} />
            </View>
            <View style={[styles.avatarStackItem, { marginLeft: -12, zIndex: 1 }]}>
              <MemojiAvatar id="aly" size={34} />
            </View>
          </View>
        </View>

        {/* Hero Spend Card ($310.00) matching Figma Page 1 */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubtext}>Total spend</Text>
          <Text style={styles.heroCurrency}>
            ${(totalSpendCents / 100).toFixed(2)}
          </Text>

          <View style={styles.splitWithRow}>
            <Text style={styles.splitWithLabel}>Split with</Text>
            <View style={styles.splitAvatars}>
              {['you', 'mia', 'jonas', 'aly', 'ken'].map((id, idx) => (
                <View
                  key={id}
                  style={[
                    styles.splitAvatarBorder,
                    { marginLeft: idx > 0 ? -10 : 0, zIndex: 10 - idx },
                  ]}
                >
                  <MemojiAvatar id={id} size={32} />
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.inviteButton}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic();
              router.push('/join');
            }}
          >
            <View style={{ marginRight: 8 }}>
              <QrSmallIcon size={18} color={Colors.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.inviteButtonText}>Invite to Room via QR</Text>
          </TouchableOpacity>
        </View>

        {/* In the Room Now Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>In the Room Now</Text>
        </View>
        <PeopleCarousel members={members} />

        {/* Live Items Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Live items</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/items');
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Ticket Item 1: Truffle Burger x2 */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic();
            router.push('/claim');
          }}
        >
          <TicketCard
            childrenTop={
              <View style={styles.itemRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemTitle}>Truffle Burger ×2</Text>
                  <Text style={styles.itemSubtitle}>Added by Mia · just now</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemPrice}>$36.00</Text>
                  <Badge label="NEW" variant="amber" />
                </View>
              </View>
            }
            childrenBottom={
              <View style={styles.splitRow}>
                <Text style={styles.splitWaysText}>Split 3 ways</Text>
                <View style={styles.avatarMiniStack}>
                  <View style={[styles.miniAvatarWrap, { zIndex: 3 }]}>
                    <MemojiAvatar id="mia" size={26} />
                  </View>
                  <View style={[styles.miniAvatarWrap, { marginLeft: -8, zIndex: 2 }]}>
                    <MemojiAvatar id="jonas" size={26} />
                  </View>
                  <View style={[styles.miniAvatarWrap, { marginLeft: -8, zIndex: 1 }]}>
                    <MemojiAvatar id="aly" size={26} />
                  </View>
                </View>
              </View>
            }
          />
        </TouchableOpacity>

        {/* Ticket Item 2: Garlic Fries */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            triggerHaptic();
            router.push('/claim');
          }}
        >
          <TicketCard
            childrenTop={
              <View style={styles.itemRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemTitle}>Garlic Fries</Text>
                  <Text style={styles.itemSubtitle}>Added by Jonas · 2m ago</Text>
                </View>
                <Text style={styles.itemPrice}>$9.50</Text>
              </View>
            }
            childrenBottom={
              <View style={styles.splitRow}>
                <Text style={styles.splitWaysText}>Split 2 ways</Text>
                <View style={styles.avatarMiniStack}>
                  <View style={[styles.miniAvatarWrap, { zIndex: 2 }]}>
                    <MemojiAvatar id="jonas" size={26} />
                  </View>
                  <View style={[styles.miniAvatarWrap, { marginLeft: -8, zIndex: 1 }]}>
                    <MemojiAvatar id="you" size={26} />
                  </View>
                </View>
              </View>
            }
          />
        </TouchableOpacity>

        {/* Bottom Settle Shortcut */}
        <TouchableOpacity
          style={styles.settleShortcutButton}
          activeOpacity={0.85}
          onPress={() => {
            triggerHaptic();
            router.push('/settle');
          }}
        >
          <Text style={styles.settleShortcutText}>Go to Settlement ($52.50) →</Text>
        </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  orangeChevron: {
    marginLeft: 6,
    justifyContent: 'center',
  },
  orangeChevronText: {
    fontSize: 12,
    color: '#F97316', // Orange chevron matching Figma
  },
  liveCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 6,
  },
  liveCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 18,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.card,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  heroSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroCurrency: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  splitWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  splitWithLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 10,
  },
  splitAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitAvatarBorder: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 17,
  },
  inviteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  inviteButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitWaysText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  avatarMiniStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatarWrap: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 14,
  },
  settleShortcutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  settleShortcutText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
