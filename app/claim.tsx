import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRoomStore } from '../src/store/roomStore';
import { Colors, Radii } from '../src/constants/theme';
import { TicketCard } from '../src/components/TicketCard';

export default function ClaimAndAdjustModal() {
  const router = useRouter();
  const { members } = useRoomStore();

  // 4 sliders sharing the $120 Burgers item equally (25% / $30.00 each)
  const [shares, setShares] = useState([
    { id: 'you', name: 'You', pct: 25, amount: 30.0, avatar: members[0]?.avatarUrl },
    { id: 'mia', name: 'Mia', pct: 25, amount: 30.0, avatar: members[1]?.avatarUrl },
    { id: 'jonas', name: 'Jonas', pct: 25, amount: 30.0, avatar: members[2]?.avatarUrl },
    { id: 'aly', name: 'Aly', pct: 25, amount: 30.0, avatar: members[3]?.avatarUrl },
  ]);

  const adjustShare = (index: number, newPct: number) => {
    const clamped = Math.max(0, Math.min(100, newPct));
    const delta = clamped - shares[index].pct;
    const othersCount = shares.length - 1;
    if (othersCount <= 0) return;

    const deductionPerOther = delta / othersCount;

    setShares((prev) =>
      prev.map((s, idx) => {
        if (idx === index) {
          return {
            ...s,
            pct: clamped,
            amount: Number(((120 * clamped) / 100).toFixed(2)),
          };
        } else {
          const nextPct = Math.max(0, Math.min(100, s.pct - deductionPerOther));
          return {
            ...s,
            pct: Math.round(nextPct),
            amount: Number(((120 * nextPct) / 100).toFixed(2)),
          };
        }
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navigation Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim & adjust</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Receipt Ticket Card with Barcode */}
        <TicketCard
          childrenTop={
            <View>
              <View style={styles.receiptTopHeader}>
                <Text style={styles.receiptLabel}>RECEIPT · FRIDAY NIGHT DINNER</Text>
                <Text style={styles.receiptNumber}>#0412</Text>
              </View>

              <View style={styles.receiptItemRow}>
                <Text style={styles.itemTitle}>Burgers ×4</Text>
                <Text style={styles.itemPrice}>$120.00</Text>
              </View>

              <View style={styles.receiptItemRow}>
                <Text style={styles.itemTitle}>Drinks ×6</Text>
                <Text style={styles.itemPrice}>$60.00</Text>
              </View>

              <View style={styles.receiptItemRow}>
                <Text style={styles.itemTitle}>Fries ×2</Text>
                <Text style={styles.itemPrice}>$30.00</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>$210.00</Text>
              </View>
            </View>
          }
          childrenBottom={
            <View style={styles.barcodeContainer}>
              {/* Simulated Retail Barcode Lines */}
              <View style={styles.barcodeLines}>
                {[2, 4, 1, 3, 5, 2, 6, 1, 4, 2, 5, 3, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2].map(
                  (width, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.barcodeBar,
                        { width, marginRight: (idx % 3) + 2 },
                      ]}
                    />
                  )
                )}
              </View>
            </View>
          }
        />

        {/* Who is Sharing Burgers Header */}
        <View style={styles.sharingHeaderRow}>
          <Text style={styles.sharingTitle}>Who is sharing Burgers</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Sliders Container */}
        <View style={styles.slidersCard}>
          {shares.map((person, idx) => (
            <View key={person.id} style={styles.sliderPersonRow}>
              <View style={styles.personInfoRow}>
                <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
                <Text style={styles.personName}>{person.name}</Text>
                <View style={styles.shareStats}>
                  <Text style={styles.sharePct}>{person.pct}%</Text>
                  <Text style={styles.shareAmount}>
                    ${person.amount.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Interactive Visual Slider Track */}
              <View style={styles.sliderTrackWrapper}>
                <View style={styles.trackBackground}>
                  <View
                    style={[styles.trackFill, { width: `${person.pct}%` }]}
                  />
                  <TouchableOpacity
                    style={[styles.sliderThumb, { left: `${person.pct}%` }]}
                    onPress={() => {
                      // Toggle slider demo step: 25% -> 50% -> 25%
                      adjustShare(idx, person.pct === 25 ? 50 : 25);
                    }}
                  >
                    <View style={styles.innerThumbCircle} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Confirm Split CTA */}
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={styles.confirmButtonText}>Confirm split</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  receiptTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  receiptNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  barcodeContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#0F172A',
  },
  sharingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  sharingTitle: {
    fontSize: 18,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.emerald,
  },
  slidersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  sliderPersonRow: {
    marginBottom: 20,
  },
  personInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  shareStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sharePct: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  shareAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sliderTrackWrapper: {
    height: 24,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  innerThumbCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
