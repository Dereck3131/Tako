import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldError } from '@/components/FieldError';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SpringPressable } from '@/components/SpringPressable';
import { Radii, TakoFonts, formatPeso, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { parsePesoToCents, sanitizeAmountInput } from '@/lib/money';
import { createItemizedSplit } from '@/lib/takoData';
import { receiptItemSchema, validateItemsTargetMismatch } from '@/lib/validation';

interface DraftItem {
  id: string;
  name: string;
  qty: number;
  unitCents: number;
}

export default function ReviewItemsScreen() {
  const { groupId, payerId, splitName, paidByIdx, peopleJson, totalCents: initialTotalParam } =
    useLocalSearchParams<{
      groupId?: string;
      payerId?: string;
      splitName?: string;
      paidByIdx?: string;
      peopleJson?: string;
      totalCents?: string;
    }>();
  const { palette, isDark } = useTakoTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [targetBillCents, setTargetBillCents] = useState(
    () => parseInt(initialTotalParam ?? '0', 10) || 0
  );

  const [items, setItems] = useState<DraftItem[]>([]);
  const [editingItem, setEditingItem] = useState<DraftItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [modalErrors, setModalErrors] = useState<{ name?: string; qty?: string; price?: string }>({});
  const [isNewItem, setIsNewItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editNameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const editQtyRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const editPriceRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const submitLockRef = useRef(false);

  const totalCents = useMemo(
    () => items.reduce((sum, it) => sum + it.qty * it.unitCents, 0),
    [items]
  );

  const mismatch = useMemo(
    () => validateItemsTargetMismatch(totalCents, targetBillCents),
    [totalCents, targetBillCents]
  );
  const mismatchCents = mismatch.diffCents;
  const cardElevation = getCardElevation(isDark);

  const duplicateNameWarning = useMemo(() => {
    const trimmed = editName.trim().toLowerCase();
    if (!trimmed || !editingItem) return null;
    const exists = items.some(
      (it) => it.id !== editingItem.id && it.name.trim().toLowerCase() === trimmed
    );
    return exists ? `Another item is already named "${editName.trim()}".` : null;
  }, [editName, editingItem, items]);

  const openEdit = (item: DraftItem) => {
    setIsNewItem(false);
    setModalErrors({});
    setEditingItem(item);
    setEditName(item.name);
    setEditQty(String(item.qty));
    setEditUnitPrice(String(item.unitCents / 100));
  };

  const openAdd = () => {
    const fresh: DraftItem = {
      id: String(Date.now()),
      name: '',
      qty: 1,
      unitCents: 0,
    };
    setIsNewItem(true);
    setModalErrors({});
    setEditingItem(fresh);
    setEditName('');
    setEditQty('1');
    setEditUnitPrice('');
  };

  const saveEditModal = () => {
    if (!editingItem) return;
    const qtyNum = Number.parseInt(editQty.replace(/[^0-9]/g, ''), 10);
    const priceParse = parsePesoToCents(editUnitPrice, { allowZero: false });

    const nextErr: { name?: string; qty?: string; price?: string } = {};
    const parsedItem = receiptItemSchema.safeParse({
      name: editName,
      qty: Number.isNaN(qtyNum) ? 0 : qtyNum,
      unitCents: priceParse.ok ? priceParse.cents : 0,
    });

    if (!parsedItem.success) {
      for (const issue of parsedItem.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key === 'name' && !nextErr.name) nextErr.name = issue.message;
        if (key === 'qty' && !nextErr.qty) nextErr.qty = issue.message;
        if (key === 'unitCents' && !nextErr.price) nextErr.price = issue.message;
      }
    }
    if (!priceParse.ok) {
      nextErr.price = priceParse.error;
    }

    setModalErrors(nextErr);
    if (nextErr.name || nextErr.qty || nextErr.price) {
      if (nextErr.name) editNameRef.current?.focus();
      else if (nextErr.qty) editQtyRef.current?.focus();
      else editPriceRef.current?.focus();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (!parsedItem.success) return;
    const updated: DraftItem = {
      id: editingItem.id,
      name: parsedItem.data.name,
      qty: parsedItem.data.qty,
      unitCents: parsedItem.data.unitCents,
    };

    if (isNewItem) {
      setItems((prev) => [...prev, updated]);
    } else {
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    }
    setError(null);
    setEditingItem(null);
  };

  const handleLooksRight = async () => {
    if (submitLockRef.current || saving) return;
    if (items.length === 0 || totalCents <= 0) {
      setError('Add at least one item before continuing.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    if (mismatch.hasMismatch) {
      setError(
        `Items total ${formatPeso(totalCents)} doesn't match your ${formatPeso(targetBillCents)} bill target. Adjust items or update the bill total below.`
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }
    if (!user) return;
    setError(null);
    submitLockRef.current = true;
    setSaving(true);

    let parsedPeople: { name: string; color: string; isMe?: boolean }[] | undefined;
    if (peopleJson) {
      try {
        parsedPeople = JSON.parse(peopleJson);
      } catch {
        parsedPeople = undefined;
      }
    }

    const res = await createItemizedSplit({
      userId: user.id,
      groupId,
      payerId,
      splitName,
      paidByIdx: parseInt(paidByIdx || '0', 10) || 0,
      people: parsedPeople,
      items,
    });

    setSaving(false);
    submitLockRef.current = false;

    if (!res.ok) {
      setError(res.error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    router.replace({
      pathname: '/group/who-had-what',
      params: {
        groupId: res.groupId,
        fromCreation: '1',
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
          Review items
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Info Banner */}
        <View style={[styles.banner, { backgroundColor: palette.lavenderSoft }]}>
          <Ionicons name="checkmark" size={16} color={palette.plum} />
          <Text style={[styles.bannerText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'item' : 'items'} added. Tap one to edit.`
              : 'Tap "+ Add an item" below to list what everyone ordered.'}
          </Text>
        </View>

        {/* Items Card */}
        {items.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            {items.map((item, idx) => {
              const lineTotal = item.qty * item.unitCents;
              const sub =
                item.qty > 1
                  ? `Qty ${item.qty} · ${formatPeso(item.unitCents)} each`
                  : `Qty 1`;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openEdit(item)}
                  style={[
                    styles.itemRow,
                    idx < items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: palette.border,
                    },
                  ]}>
                  <View style={styles.itemLeft}>
                    <Text style={[styles.itemName, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSub, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                      {sub}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemPrice, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                      {formatPeso(lineTotal)}
                    </Text>
                    <Ionicons name="pencil" size={14} color={palette.mute} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Dashed + Add an item */}
        <SpringPressable
          onPress={openAdd}
          style={[styles.addBtn, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Ionicons name="add" size={18} color={palette.coralAccent} />
          <Text style={[styles.addBtnText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
            Add an item
          </Text>
        </SpringPressable>

        {/* Bill Target Mismatch Warning with 2 Actions */}
        {mismatchCents !== 0 && (
          <View style={[styles.mismatchBanner, { backgroundColor: palette.amberSoft }]}>
            <View style={styles.mismatchTopRow}>
              <Ionicons name="alert-circle-outline" size={18} color={palette.amber} />
              <Text style={[styles.mismatchText, { color: palette.amber, fontFamily: TakoFonts.bold }]}>
                {mismatchCents < 0
                  ? `${formatPeso(Math.abs(mismatchCents))} under your ${formatPeso(targetBillCents)} bill target`
                  : `${formatPeso(mismatchCents)} over your ${formatPeso(targetBillCents)} bill target`}
              </Text>
            </View>
            <View style={styles.mismatchActions}>
              <SpringPressable
                onPress={() => {
                  setTargetBillCents(totalCents);
                  setError(null);
                }}
                style={[styles.mismatchActionBtn, { backgroundColor: palette.surface }]}>
                <Text style={[styles.mismatchActionText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Update bill to {formatPeso(totalCents)}
                </Text>
              </SpringPressable>
              <SpringPressable
                onPress={openAdd}
                style={[styles.mismatchActionBtn, { backgroundColor: palette.surface }]}>
                <Text style={[styles.mismatchActionText, { color: palette.amber, fontFamily: TakoFonts.bold }]}>
                  Adjust items
                </Text>
              </SpringPressable>
            </View>
          </View>
        )}

        {/* Dark Plum Total Bar */}
        <View style={[styles.totalBar, { backgroundColor: palette.plum }]}>
          <View>
            <Text style={[styles.totalBarLabel, { fontFamily: TakoFonts.bold }]}>
              Total
            </Text>
            <Text style={[styles.totalBarSub, { fontFamily: TakoFonts.regular }]}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
              {targetBillCents > 0 ? ` · Bill target ${formatPeso(targetBillCents)}` : ''}
            </Text>
          </View>
          <Text style={[styles.totalBarAmt, { fontFamily: TakoFonts.black }]}>
            {formatPeso(totalCents)}
          </Text>
        </View>

        {error && (
          <Text style={{ color: palette.coralAccent, fontFamily: TakoFonts.bold, textAlign: 'center', fontSize: 13 }}>
            {error}
          </Text>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 16) },
        ]}>
        <PrimaryButton
          label="Looks right"
          onPress={handleLooksRight}
          loading={saving}
        />
      </View>

      {/* Edit Item Modal */}
      <Modal
        visible={!!editingItem}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                {isNewItem ? 'Add item' : 'Edit item'}
              </Text>
              <Pressable onPress={() => setEditingItem(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={palette.mute} />
              </Pressable>
            </View>

            <TextInput
              ref={editNameRef}
              value={editName}
              onChangeText={(t) => {
                setEditName(t);
                if (modalErrors.name) setModalErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="Item name (e.g. Tonkotsu ramen)"
              placeholderTextColor={palette.mute}
              maxLength={40}
              style={[
                styles.input,
                { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.regular },
              ]}
            />
            <FieldError message={modalErrors.name} />
            {duplicateNameWarning && !modalErrors.name && (
              <Text style={[styles.dupWarning, { color: palette.amber, fontFamily: TakoFonts.bold }]}>
                {duplicateNameWarning}
              </Text>
            )}

            <View style={styles.editRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.inputLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Qty
                </Text>
                <TextInput
                  ref={editQtyRef}
                  value={editQty}
                  onChangeText={(t) => {
                    setEditQty(t.replace(/[^0-9]/g, ''));
                    if (modalErrors.qty) setModalErrors((e) => ({ ...e, qty: undefined }));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[
                    styles.input,
                    { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.bold },
                  ]}
                />
                <FieldError message={modalErrors.qty} />
              </View>
              <View style={{ flex: 2, gap: 4 }}>
                <Text style={[styles.inputLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Price each (₱)
                </Text>
                <TextInput
                  ref={editPriceRef}
                  value={editUnitPrice}
                  onChangeText={(t) => {
                    setEditUnitPrice(sanitizeAmountInput(t));
                    if (modalErrors.price) setModalErrors((e) => ({ ...e, price: undefined }));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={palette.mute}
                  style={[
                    styles.input,
                    { backgroundColor: palette.surfaceAlt, color: palette.ink, fontFamily: TakoFonts.bold },
                  ]}
                />
                <FieldError message={modalErrors.price} />
              </View>
            </View>

            <PrimaryButton
              label="Save item"
              onPress={saveEditModal}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontSize: 17 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  bannerText: { fontSize: 13 },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#2B1B3D',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 10px rgba(43, 27, 61, 0.05)' },
  }),
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: { fontSize: 15 },
  itemSub: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 14 },
  mismatchBanner: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  mismatchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mismatchText: {
    fontSize: 13,
    flex: 1,
  },
  mismatchActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mismatchActionBtn: {
    paddingHorizontal: 12,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: Radii.pill,
  },
  mismatchActionText: {
    fontSize: 12,
  },
  dupWarning: {
    fontSize: 12,
    marginTop: -4,
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: Radii.xl,
  },
  totalBarLabel: {
    color: '#FFF6EE',
    fontSize: 14,
  },
  totalBarSub: {
    color: '#C7B8DB',
    fontSize: 11,
    marginTop: 2,
  },
  totalBarAmt: {
    color: '#FFF6EE',
    fontSize: 24,
    fontVariant: ['tabular-nums'],
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  ctaBtn: {
    borderRadius: Radii.pill,
    minHeight: 52,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    paddingBottom: 34,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 20 },
  editRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: { fontSize: 12 },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
});
