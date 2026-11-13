import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Motion, Radii, Shadows, Spacing } from '../../constants/theme';
import { BASE_ROOM_DATA, EMPTY_ROOM_DATA, WORST_CASE_ROOM_DATA } from './mockData';
import { VariantAFeed } from './VariantAFeed';
import { VariantBBento } from './VariantBBento';
import { VariantCOrbit } from './VariantCOrbit';
import { VariantDChat } from './VariantDChat';

export type RoomVariantKey = 'A' | 'B' | 'C' | 'D';
export type RoomDataKey = 'demo' | 'worst' | 'empty';

export function RoomPrototypeSwitcher() {
  const [activeVariant, setActiveVariant] = useState<RoomVariantKey>('B');
  const [activeData, setActiveData] = useState<RoomDataKey>('demo');

  const data =
    activeData === 'worst'
      ? WORST_CASE_ROOM_DATA
      : activeData === 'empty'
      ? EMPTY_ROOM_DATA
      : BASE_ROOM_DATA;

  return (
    <View style={styles.container}>
      {/* Dev-only Floating Switcher Bar */}
      {__DEV__ && (
        <View style={[styles.floatingBar, Shadows.card]}>
          <View style={styles.row}>
            <Text style={styles.barLabel}>LAYOUT</Text>
            <View style={styles.pillGroup}>
              {(['A', 'B', 'C', 'D'] as RoomVariantKey[]).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setActiveVariant(v)}
                  style={[styles.pillBtn, activeVariant === v && styles.pillBtnActive]}
                >
                  <Text style={[styles.pillText, activeVariant === v && styles.pillTextActive]}>
                    {v === 'A' ? 'Feed' : v === 'B' ? 'Bento' : v === 'C' ? 'Orbit' : 'Chat'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.barLabel}>DATA</Text>
            <View style={styles.pillGroup}>
              <Pressable
                onPress={() => setActiveData('demo')}
                style={[styles.pillBtn, activeData === 'demo' && styles.pillBtnActive]}
              >
                <Text style={[styles.pillText, activeData === 'demo' && styles.pillTextActive]}>Demo</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveData('worst')}
                style={[styles.pillBtn, activeData === 'worst' && styles.pillBtnActive]}
              >
                <Text style={[styles.pillText, activeData === 'worst' && styles.pillTextActive]}>Worst-Case</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveData('empty')}
                style={[styles.pillBtn, activeData === 'empty' && styles.pillBtnActive]}
              >
                <Text style={[styles.pillText, activeData === 'empty' && styles.pillTextActive]}>Empty</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Render Active Variant */}
      <View style={styles.variantViewport}>
        {activeVariant === 'A' && <VariantAFeed data={data} />}
        {activeVariant === 'B' && <VariantBBento data={data} />}
        {activeVariant === 'C' && <VariantCOrbit data={data} />}
        {activeVariant === 'D' && <VariantDChat data={data} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  variantViewport: {
    flex: 1,
  },
  floatingBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 9999,
    backgroundColor: 'rgba(20, 18, 58, 0.92)',
    borderRadius: Radii.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.6,
  },
  pillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: 'transparent',
  },
  pillBtnActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
