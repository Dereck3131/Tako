import React, { useState } from 'react';
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
import { Colors, Radii } from '../../src/constants/theme';
import { Badge } from '../../src/components/Badge';
import { MemojiAvatar } from '../../src/components/MemojiAvatar';

export default function ItemsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | 'Unclaimed' | 'Mine'>('All');
  const [claimedDishes, setClaimedDishes] = useState<Record<string, boolean>>({});

  const handleQuickClaim = (dishName: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setClaimedDishes((prev) => ({ ...prev, [dishName]: true }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header matching Page 2 */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Items</Text>
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => router.push('/claim')}
          >
            <Text style={styles.addItemText}>+ Add item</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Unclaimed', 'Mine'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {
                    // Fallback
                  }
                  setFilter(tab);
                }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Blue Summary Hero Card matching Page 2 */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summarySubtitle}>12 items · Friday Night Dinner</Text>
            <Text style={styles.summaryTotal}>$310.00</Text>
          </View>
          <Badge
            label={claimedDishes['pizza'] && claimedDishes['tiramisu'] ? 'All claimed 🎉' : '2 unclaimed'}
            variant={claimedDishes['pizza'] && claimedDishes['tiramisu'] ? 'emerald' : 'amber'}
          />
        </View>

        {/* Item Cards List matching Page 2 */}
        <View style={styles.itemList}>
          {/* Item 1: Truffle Burger x2 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Truffle Burger ×2</Text>
              <Text style={styles.itemAuthor}>Added by Mia</Text>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarStackItem, { zIndex: 3 }]}>
                  <MemojiAvatar id="mia" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 2 }]}>
                  <MemojiAvatar id="jonas" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 1 }]}>
                  <MemojiAvatar id="aly" size={24} />
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$36.00</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 2: Margherita Pizza */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Margherita Pizza</Text>
              <Text style={styles.itemAuthor}>Added by Aly</Text>
              {claimedDishes['pizza'] ? (
                <Text style={styles.claimedSelfText}>Claimed by You (100%)</Text>
              ) : (
                <TouchableOpacity
                  style={styles.quickClaimPill}
                  onPress={() => handleQuickClaim('pizza')}
                >
                  <Text style={styles.quickClaimText}>Nobody yet · Claim</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$24.00</Text>
              <Badge
                label={claimedDishes['pizza'] ? 'Claimed' : 'Unclaimed'}
                variant={claimedDishes['pizza'] ? 'emerald' : 'amber'}
              />
            </View>
          </TouchableOpacity>

          {/* Item 3: Iced Tea x4 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Iced Tea ×4</Text>
              <Text style={styles.itemAuthor}>Added by Jonas</Text>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarStackItem, { zIndex: 4 }]}>
                  <MemojiAvatar id="you" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 3 }]}>
                  <MemojiAvatar id="mia" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 2 }]}>
                  <MemojiAvatar id="jonas" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 1 }]}>
                  <MemojiAvatar id="aly" size={24} />
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$18.00</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 4: Garlic Fries */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Garlic Fries</Text>
              <Text style={styles.itemAuthor}>Added by Jonas</Text>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarStackItem, { zIndex: 2 }]}>
                  <MemojiAvatar id="jonas" size={24} />
                </View>
                <View style={[styles.avatarStackItem, { marginLeft: -6, zIndex: 1 }]}>
                  <MemojiAvatar id="you" size={24} />
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$9.50</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 5: Tiramisu */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Tiramisu</Text>
              <Text style={styles.itemAuthor}>Added by Ken</Text>
              {claimedDishes['tiramisu'] ? (
                <Text style={styles.claimedSelfText}>Claimed by You (100%)</Text>
              ) : (
                <TouchableOpacity
                  style={styles.quickClaimPill}
                  onPress={() => handleQuickClaim('tiramisu')}
                >
                  <Text style={styles.quickClaimText}>Nobody yet · Claim</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$12.00</Text>
              <Badge
                label={claimedDishes['tiramisu'] ? 'Claimed' : 'Unclaimed'}
                variant={claimedDishes['tiramisu'] ? 'emerald' : 'amber'}
              />
            </View>
          </TouchableOpacity>
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
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  addItemButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingHorizontal: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    paddingHorizontal: 18,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.card,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryTotal: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  itemList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#2F65F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  quickClaimPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF3FF',
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  quickClaimText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  claimedSelfText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 13,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
});
