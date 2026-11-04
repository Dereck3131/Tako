import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRoomStore } from '../../src/store/roomStore';
import { Colors, Radii } from '../../src/constants/theme';
import { Badge } from '../../src/components/Badge';

export default function ItemsScreen() {
  const router = useRouter();
  const { items, members } = useRoomStore();
  const [filter, setFilter] = useState<'All' | 'Unclaimed' | 'Mine'>('All');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
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
                onPress={() => setFilter(tab)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Blue Summary Hero Card */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summarySubtitle}>12 items · Friday Night Dinner</Text>
            <Text style={styles.summaryTotal}>$310.00</Text>
          </View>
          <Badge label="2 unclaimed" variant="amber" />
        </View>

        {/* Item Cards List */}
        <View style={styles.itemList}>
          {/* Item 1 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Truffle Burger ×2</Text>
              <Text style={styles.itemAuthor}>Added by Mia</Text>
              <View style={styles.avatarRow}>
                {members.slice(0, 3).map((m, idx) => (
                  <Image
                    key={m.id}
                    source={{ uri: m.avatarUrl }}
                    style={[styles.miniAvatar, { marginLeft: idx > 0 ? -6 : 0 }]}
                  />
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$36.00</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 2 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Margherita Pizza</Text>
              <Text style={styles.itemAuthor}>Added by Aly</Text>
              <Text style={styles.nobodyText}>Nobody yet</Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$24.00</Text>
              <Badge label="Unclaimed" variant="amber" />
            </View>
          </TouchableOpacity>

          {/* Item 3 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Iced Tea ×4</Text>
              <Text style={styles.itemAuthor}>Added by Jonas</Text>
              <View style={styles.avatarRow}>
                {members.slice(0, 4).map((m, idx) => (
                  <Image
                    key={m.id}
                    source={{ uri: m.avatarUrl }}
                    style={[styles.miniAvatar, { marginLeft: idx > 0 ? -6 : 0 }]}
                  />
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$18.00</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 4 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Garlic Fries</Text>
              <Text style={styles.itemAuthor}>Added by Jonas</Text>
              <View style={styles.avatarRow}>
                {members.slice(1, 3).map((m, idx) => (
                  <Image
                    key={m.id}
                    source={{ uri: m.avatarUrl }}
                    style={[styles.miniAvatar, { marginLeft: idx > 0 ? -6 : 0 }]}
                  />
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$9.50</Text>
              <Badge label="Claimed" variant="emerald" />
            </View>
          </TouchableOpacity>

          {/* Item 5 */}
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push('/claim')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>Tiramisu</Text>
              <Text style={styles.itemAuthor}>Added by Ken</Text>
              <Text style={styles.nobodyText}>Nobody yet</Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Text style={styles.itemPrice}>$12.00</Text>
              <Badge label="Unclaimed" variant="amber" />
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
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addItemButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    paddingVertical: 8,
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
    shadowRadius: 12,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryTotal: {
    color: '#FFFFFF',
    fontSize: 32,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  nobodyText: {
    fontSize: 12,
    color: Colors.amber,
    fontWeight: '600',
  },
  avatarRow: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
});
