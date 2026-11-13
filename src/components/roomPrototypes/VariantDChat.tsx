import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Motion, Radii, Shadows, Spacing, TouchTarget, Typography } from '../../constants/theme';
import { Badge } from '../Badge';
import { MemojiAvatar, MemojiId, resolveAnimal } from '../MemojiAvatar';
import { TakoMascot } from '../TakoMascot';
import { formatMoney } from '../../services/currency';
import { RoomPrototypeMockData } from './mockData';

interface Props {
  data: RoomPrototypeMockData;
}

export function VariantDChat({ data }: Props) {
  const router = useRouter();
  const { room, members, items, myShareCents, totalSpendCents } = data;
  const [inputText, setInputText] = useState('');

  return (
    <View style={styles.container}>
      {/* Top Compact Room Bar */}
      <View style={[styles.topBar, Shadows.cardSoft]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={styles.roomStatus}>
            {members.length} members · Total: {formatMoney(totalSpendCents, 'PHP')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settle')}
          style={({ pressed }) => [
            styles.sharePill,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <Text style={styles.sharePillText}>Pay {formatMoney(myShareCents, 'PHP')}</Text>
        </Pressable>
      </View>

      {/* Chat Timeline Feed */}
      <ScrollView contentContainerStyle={styles.timeline} showsVerticalScrollIndicator={false}>
        {/* System join message */}
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>Tako opened the bill for {room.title} (PIN {room.pinHash})</Text>
        </View>

        {members.slice(1).map((m) => (
          <View key={`join-${m.id}`} style={styles.systemBubble}>
            <Text style={styles.systemText}>
              {m.displayName} joined the table
            </Text>
          </View>
        ))}

        {/* Dishes as rich chat bubbles */}
        {items.map((item, idx) => {
          const isYou = item.createdBy === 'user-you';
          const avatarId = resolveAnimal(item.createdBy as MemojiId);

          return (
            <View key={item.id} style={[styles.messageRow, isYou ? styles.messageRight : styles.messageLeft]}>
              {!isYou && (
                <View style={styles.avatarWrap}>
                  <MemojiAvatar id={avatarId} size={34} />
                </View>
              )}
              <View style={[styles.dishBubble, isYou ? styles.dishBubbleYou : styles.dishBubbleOther, Shadows.cardSoft]}>
                <View style={styles.dishHeader}>
                  <Text style={styles.dishSender}>{isYou ? 'You' : item.createdByName}</Text>
                  <Text style={styles.dishTime}>{item.createdAt}</Text>
                </View>
                <Text style={styles.dishTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.dishPriceRow}>
                  <Text style={styles.dishPrice}>{formatMoney(item.priceCents, 'PHP')}</Text>
                  <Pressable
                    onPress={() => router.push('/claim')}
                    style={({ pressed }) => [
                      styles.claimBtn,
                      pressed && { transform: [{ scale: Motion.pressScale }] },
                    ]}
                  >
                    <Text style={styles.claimBtnText}>{idx === 0 ? 'My share 25%' : 'Claim bite'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {/* Tako assistant tip message */}
        <View style={styles.takoTipRow}>
          <TakoMascot size={36} mood="happy" />
          <View style={styles.takoTipBubble}>
            <Text style={styles.takoTipText}>
              All set! Tap any dish bubble to tweak your exact bite or split evenly.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Composer: Add dish input + Camera scan button */}
      <View style={[styles.composerWrap, Shadows.card]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan receipt camera"
          onPress={() => router.push('/(tabs)/items')}
          style={styles.cameraBtn}
        >
          <Text style={styles.cameraBtnIcon}>📷</Text>
        </Pressable>
        <TextInput
          placeholder="Add an item (e.g. Garlic Rice ₱80)…"
          placeholderTextColor={Colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          style={styles.composerInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send dish"
          style={({ pressed }) => [
            styles.sendBtn,
            inputText.trim().length > 0 && styles.sendBtnActive,
            pressed && { transform: [{ scale: Motion.pressScale }] },
          ]}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  roomStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sharePill: {
    minHeight: TouchTarget.minSize,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeline: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  systemText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageLeft: {
    justifyContent: 'flex-start',
  },
  messageRight: {
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    width: 34,
    height: 34,
  },
  dishBubble: {
    maxWidth: '82%',
    borderRadius: 20,
    padding: Spacing.md,
    borderWidth: 1,
  },
  dishBubbleOther: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  dishBubbleYou: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
    borderBottomRightRadius: 4,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  dishSender: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  dishTime: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  dishPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
  claimBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  takoTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.sm,
  },
  takoTipBubble: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 16,
    padding: Spacing.md,
  },
  takoTipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  composerWrap: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtnIcon: {
    fontSize: 16,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },
  sendBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
