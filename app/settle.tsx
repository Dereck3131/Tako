import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRoomStore } from '../src/store/roomStore';
import { Colors, Radii } from '../src/constants/theme';
import { TicketCard } from '../src/components/TicketCard';
import { Badge } from '../src/components/Badge';
import { SettlementHero } from '../src/components/SettlementHero';

export default function SettleUpScreen() {
  const router = useRouter();
  const { members, markMemberPaid } = useRoomStore();
  const [hasPaidSelf, setHasPaidSelf] = useState(false);

  const handlePayNow = () => {
    setHasPaidSelf(true);
    markMemberPaid('member-you');
    Alert.alert(
      'Settlement Initiated',
      'Opening Venmo deep link with prefilled $52.50 to host Alex. Marked as Paid!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle up</Text>
          <View style={styles.roomCountBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.roomCountText}>4 in room</Text>
          </View>
        </View>

        {/* Breakdown Ticket Card */}
        <TicketCard
          childrenTop={
            <View>
              <Text style={styles.cardSectionLabel}>YOUR ITEMS · 25% EACH</Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Burgers</Text>
                <Text style={styles.itemPrice}>$30.00</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Drinks</Text>
                <Text style={styles.itemPrice}>$15.00</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>Fries</Text>
                <Text style={styles.itemPrice}>$7.50</Text>
              </View>
            </View>
          }
          childrenBottom={
            <View>
              <Text style={styles.cardSectionLabel}>THE ROOM</Text>

              {/* Mia */}
              <View style={styles.memberStatusRow}>
                <View style={styles.memberInfo}>
                  <Image
                    source={{ uri: members[1]?.avatarUrl }}
                    style={styles.avatarImg}
                  />
                  <Text style={styles.memberName}>Mia</Text>
                </View>
                <Badge label="Paid" variant="emerald" />
              </View>

              {/* Jonas */}
              <View style={styles.memberStatusRow}>
                <View style={styles.memberInfo}>
                  <Image
                    source={{ uri: members[2]?.avatarUrl }}
                    style={styles.avatarImg}
                  />
                  <Text style={styles.memberName}>Jonas</Text>
                </View>
                <Badge label="Paid" variant="emerald" />
              </View>

              {/* Aly */}
              <View style={styles.memberStatusRow}>
                <View style={styles.memberInfo}>
                  <Image
                    source={{ uri: members[3]?.avatarUrl }}
                    style={styles.avatarImg}
                  />
                  <Text style={styles.memberName}>Aly</Text>
                </View>
                <Badge
                  label={hasPaidSelf ? 'Paid' : 'Pending'}
                  variant={hasPaidSelf ? 'emerald' : 'amber'}
                />
              </View>
            </View>
          }
        />

        {/* Midnight Navy Hero Card with Amber Pay Now button */}
        <SettlementHero
          amountCents={5250}
          splitCount={4}
          roomTitle="Friday Night Dinner"
          onPayNow={handlePayNow}
        />
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
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  roomCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 6,
  },
  roomCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  memberStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
