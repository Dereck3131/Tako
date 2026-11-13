import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, formatPeso } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

interface SplitPreview {
  code: string;
  name?: string;
  totalCents?: number;
  memberCount?: number;
  paidBy?: string;
}

function extractInviteCode(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/(?:join\/|code=)([A-Za-z0-9-]+)/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;
  return candidate.replace(/^TAKO-/i, '').toUpperCase();
}

export default function ScanScreen() {
  const { palette } = useTakoTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [permission, requestPermission] = useCameraPermissions();

  const [code, setCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedLock, setScannedLock] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);
  const [preview, setPreview] = useState<SplitPreview | null>(null);

  const shakeX = useSharedValue(0);

  React.useEffect(() => {
    if (shakeTick === 0 || reducedMotion) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [reducedMotion, shakeTick, shakeX]);

  const triggerShake = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setShakeTick((t) => t + 1);
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const submitCode = useCallback(
    async (rawInput: string) => {
      setError(null);
      const cleaned = extractInviteCode(rawInput);
      if (!cleaned) {
        setError('Enter the invite code from your friend’s screen.');
        triggerShake();
        return;
      }

      setJoining(true);
      const { data: previewData } = await supabase
        .rpc('preview_group_by_code', { p_code: cleaned })
        .maybeSingle();

      setJoining(false);
      if (previewData && typeof previewData === 'object') {
        const row = previewData as {
          name?: string;
          total_cents?: number;
          member_count?: number;
          paid_by?: string;
        };
        setPreview({
          code: cleaned,
          name: row.name,
          totalCents: row.total_cents,
          memberCount: row.member_count,
          paidBy: row.paid_by,
        });
      } else {
        setPreview({ code: cleaned });
      }
    },
    [triggerShake]
  );

  const confirmJoin = async () => {
    if (!preview) return;
    setJoining(true);
    const { data: groupId, error: rpcErr } = await supabase.rpc('join_group_by_code', {
      p_code: preview.code,
      p_member_name: profile?.display_name ?? null,
    });

    if (rpcErr || !groupId) {
      setPreview(null);
      setError(rpcErr?.message ?? 'Split not found for that code.');
      setJoining(false);
      setScannedLock(false);
      triggerShake();
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setPreview(null);
    setJoining(false);
    setCode('');
    setScannedLock(false);
    router.replace(`/group/${groupId}`);
  };

  const handleJoin = () => submitCode(code);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedLock || joining) return;
    setScannedLock(true);
    setCode(data);
    submitCode(data);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          keyboardShouldPersistTaps="handled">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.topIconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
              hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={palette.ink} />
            </Pressable>
            <Text style={[styles.topTitle, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Join a split
            </Text>
            <Pressable
              onPress={() => setTorchOn((t) => !t)}
              disabled={!permission?.granted || Platform.OS === 'web'}
              accessibilityRole="button"
              accessibilityLabel={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
              style={[
                styles.topIconBtn,
                {
                  backgroundColor: torchOn ? palette.coralSoft : palette.surface,
                  borderColor: torchOn ? palette.coralAccent : palette.border,
                  opacity: permission?.granted && Platform.OS !== 'web' ? 1 : 0.4,
                },
              ]}
              hitSlop={8}>
              <Ionicons
                name={torchOn ? 'flashlight' : 'flashlight-outline'}
                size={20}
                color={torchOn ? palette.coralAccent : palette.ink}
              />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            Scan to join
          </Text>
          <Text style={[styles.subtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
            Point your camera at the QR on a friend’s phone to hop into their split.
          </Text>

          {/* Tako Peeking Over Viewfinder */}
          <View style={styles.viewfinderWrap}>
            <View style={styles.mascotPeek}>
              <TakoMascot state="peek" size={110} hidePeekCard interactive />
            </View>

            <View style={styles.viewfinder}>
              {Platform.OS !== 'web' && permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torchOn}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
              ) : (
                <View style={styles.qrInner}>
                  <Ionicons name="qr-code" size={88} color="#FFF6EE" />
                  {Platform.OS !== 'web' ? (
                    <Pressable
                      onPress={() => requestPermission()}
                      style={[styles.permBtn, { backgroundColor: palette.coral }]}>
                      <Text style={[styles.permText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                        Enable camera
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={[styles.webHint, { fontFamily: TakoFonts.regular }]}>
                      Enter code below
                    </Text>
                  )}
                </View>
              )}

              {/* 4 Coral Corners */}
              <View style={[styles.corner, styles.tl, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.tr, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.bl, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.br, { borderColor: palette.coral }]} pointerEvents="none" />
            </View>
          </View>

          {/* Code Input */}
          <View style={styles.codeSection}>
            <Text style={[styles.orLabel, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
              Or enter the code
            </Text>

            <Animated.View
              style={[
                styles.codeBox,
                {
                  backgroundColor: palette.surface,
                  borderColor: error ? palette.destructive : palette.border,
                },
                shakeStyle,
              ]}>
              <TextInput
                value={code}
                onChangeText={(txt) => {
                  setCode(txt);
                  if (error) setError(null);
                }}
                placeholder="e.g. TAKO-4821"
                placeholderTextColor={palette.mute}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: palette.surfaceAlt,
                    color: palette.ink,
                    fontFamily: code.length > 0 ? TakoFonts.black : TakoFonts.regular,
                  },
                ]}
              />
              <Pressable
                onPress={handleJoin}
                disabled={joining}
                accessibilityRole="button"
                accessibilityLabel="Join split by code"
                style={({ pressed }) => [
                  styles.joinBtn,
                  { backgroundColor: palette.coral },
                  pressed && { opacity: 0.9 },
                ]}>
                {joining ? (
                  <ActivityIndicator color={palette.plum} />
                ) : (
                  <Text style={[styles.joinText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                    Join
                  </Text>
                )}
              </Pressable>
            </Animated.View>

            {error && (
              <Text style={[styles.errorText, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                {error}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Split Preview Modal before joining */}
      <Modal
        visible={!!preview}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPreview(null);
          setScannedLock(false);
        }}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: palette.surface,
                paddingBottom: Math.max(insets.bottom, 24) + 8,
              },
            ]}>
            <Text style={[styles.previewKicker, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
              TAKO-{preview?.code}
            </Text>
            <Text style={[styles.previewTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              {preview?.name ?? 'Join this split?'}
            </Text>
            {preview?.name ? (
              <Text style={[styles.previewMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                {preview.totalCents !== undefined ? `${formatPeso(preview.totalCents)} · ` : ''}
                {preview.memberCount !== undefined
                  ? `${preview.memberCount} ${preview.memberCount === 1 ? 'person' : 'people'}`
                  : ''}
                {preview.paidBy ? ` · paid by ${preview.paidBy}` : ''}
              </Text>
            ) : (
              <Text style={[styles.previewMeta, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                Tap Join to hop into this split and see the items.
              </Text>
            )}

            <View style={styles.previewActions}>
              <Pressable
                onPress={() => {
                  setPreview(null);
                  setScannedLock(false);
                }}
                style={[styles.cancelPreviewBtn, { borderColor: palette.border }]}>
                <Text style={[styles.cancelPreviewText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmJoin}
                disabled={joining}
                style={[styles.confirmJoinBtn, { backgroundColor: palette.coral }]}>
                {joining ? (
                  <ActivityIndicator color={palette.plum} />
                ) : (
                  <Text style={[styles.confirmJoinText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                    Join split
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewfinderWrap: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 24,
  },
  mascotPeek: {
    marginBottom: -20,
    zIndex: 0,
  },
  viewfinder: {
    width: 248,
    height: 248,
    borderRadius: 28,
    backgroundColor: '#2B1B3D',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  permBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permText: {
    fontSize: 13,
  },
  webHint: {
    marginTop: 10,
    color: '#D5C7E8',
    fontSize: 12,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3.5,
  },
  tl: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  qrInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: 170,
    height: 2.5,
    borderRadius: 2,
  },
  codeSection: {
    gap: 10,
  },
  orLabel: {
    fontSize: 13,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 6,
  },
  codeInput: {
    flex: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  joinBtn: {
    paddingHorizontal: 22,
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: Radii.lg,
  },
  joinText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  previewCard: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 22,
    gap: 8,
  },
  previewKicker: {
    fontSize: 12,
    letterSpacing: 1.4,
  },
  previewTitle: {
    fontSize: 22,
  },
  previewMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelPreviewBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPreviewText: {
    fontSize: 15,
  },
  confirmJoinBtn: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmJoinText: {
    fontSize: 15,
  },
});
