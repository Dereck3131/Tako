import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldError } from '@/components/FieldError';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts } from '@/constants/theme';
import { useTakoTheme } from '@/context/ThemeContext';
import { previewInviteByCode } from '@/lib/takoData';

export default function ScanScreen() {
  const { palette } = useTakoTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [permission, requestPermission] = useCameraPermissions();

  const [code, setCode] = useState('');
  const [focusInput, setFocusInput] = useState(false);
  const [joining, setJoining] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const lastScannedRef = useRef<{ value: string; ts: number }>({ value: '', ts: 0 });

  const scanY = useSharedValue(-52);

  useEffect(() => {
    if (reducedMotion) return;
    scanY.value = withRepeat(
      withTiming(52, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reducedMotion, scanY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  const submitCode = async (rawInput: string, fromScanner = false) => {
    setInlineError(null);
    setErrorMessage(null);
    setJoining(true);
    const res = await previewInviteByCode(rawInput);
    setJoining(false);
    setScannedLock(false);

    if (!res.ok) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      if (!fromScanner && res.reason === 'invalid_format') {
        setInlineError(res.error);
        return;
      }
      setErrorMessage(res.error);
      setQrFailed(true);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const row = res.preview;
    router.push({
      pathname: '/group/join-split',
      params: {
        code: row.invite_code,
        name: row.name,
        totalCents: String(row.total_cents),
        itemCount: String(row.item_count),
        memberCount: String(row.member_count),
        paidBy: row.paid_by,
        membersJson: JSON.stringify(row.members ?? []),
      },
    });
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    if (
      scannedLock ||
      joining ||
      (lastScannedRef.current.value === data && now - lastScannedRef.current.ts < 3000)
    ) {
      return;
    }
    lastScannedRef.current = { value: data, ts: now };
    setScannedLock(true);
    setCode(data);
    submitCode(data, true);
  };

  // Screen J6: "That QR didn't work" (from Sheet 3)
  if (qrFailed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top']}>
        <View
          style={[
            styles.errorScreenWrap,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}>
          <View style={styles.errorCenter}>
            <TakoMascot state="confused" size={148} interactive />
            <Text style={[styles.errorTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
              That QR didn’t work
            </Text>
            <Text style={[styles.errorSubtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
              {errorMessage || 'It may have expired, or it isn’t a Tako code. Ask your friend to refresh it and try again.'}
            </Text>
          </View>

          <View style={styles.errorActions}>
            <Pressable
              onPress={() => {
                setQrFailed(false);
                setScannedLock(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={({ pressed }) => [
                styles.tryAgainBtn,
                { backgroundColor: palette.coral },
                pressed && { opacity: 0.92 },
              ]}>
              <Ionicons name="refresh" size={18} color={palette.plum} />
              <Text style={[styles.tryAgainText, { color: palette.plum, fontFamily: TakoFonts.bold }]}>
                Try again
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setQrFailed(false);
                setScannedLock(false);
                setFocusInput(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Enter code instead"
              style={({ pressed }) => [
                styles.enterCodeBtn,
                { backgroundColor: palette.surface, borderColor: palette.border },
                pressed && { opacity: 0.85 },
              ]}>
              <Text style={[styles.enterCodeText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Enter code instead
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Screen J1: "Scan to join" (Dark Plum full-screen experience from Sheet 3)
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]} edges={['top']}>
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
              style={styles.backBtn}
              hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color="#FFF6EE" />
            </Pressable>
            <Text style={[styles.topTitle, { fontFamily: TakoFonts.bold }]}>
              Join a split
            </Text>
          </View>

          <Text style={[styles.title, { fontFamily: TakoFonts.black }]}>
            Scan to join
          </Text>
          <Text style={[styles.subtitle, { fontFamily: TakoFonts.regular }]}>
            Point your camera at the QR on a friend’s phone to hop into their split.
          </Text>

          {/* Tako Peeking Over Viewfinder */}
          <View style={styles.viewfinderWrap}>
            <View style={styles.mascotPeek}>
              <TakoMascot state="peek" size={110} hidePeekCard interactive />
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web' && !permission?.granted) {
                  if (permission && !permission.canAskAgain) {
                    Linking.openSettings().catch(() => {});
                  } else {
                    requestPermission();
                  }
                } else if (code.trim()) {
                  submitCode(code);
                } else {
                  setFocusInput(true);
                }
              }}
              style={styles.viewfinder}>
              {Platform.OS !== 'web' && permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
              ) : Platform.OS !== 'web' && permission && !permission.canAskAgain ? (
                <View style={styles.qrInner}>
                  <Ionicons name="camera-outline" size={44} color="#FFF6EE" />
                  <Text style={[styles.permDeniedText, { fontFamily: TakoFonts.bold }]}>
                    Camera access denied.{'\n'}Tap to open Settings.
                  </Text>
                </View>
              ) : (
                <View style={styles.qrInner}>
                  <Ionicons name="qr-code" size={118} color="#FFF6EE" />
                </View>
              )}

              {/* Animated Horizontal Coral Scan Line */}
              <Animated.View
                style={[styles.scanLine, { backgroundColor: palette.coral }, scanLineStyle]}
                pointerEvents="none"
              />

              {/* 4 Coral Corners */}
              <View style={[styles.corner, styles.tl, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.tr, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.bl, { borderColor: palette.coral }]} pointerEvents="none" />
              <View style={[styles.corner, styles.br, { borderColor: palette.coral }]} pointerEvents="none" />
            </Pressable>
          </View>

          {/* Code Input */}
          <View style={styles.codeSection}>
            <Text style={[styles.orLabel, { fontFamily: TakoFonts.regular }]}>
              Or enter the code
            </Text>

            <View style={styles.codeBox}>
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  if (inlineError) setInlineError(null);
                }}
                autoFocus={focusInput}
                placeholder="e.g. TAKO-4821AB"
                placeholderTextColor="rgba(43, 27, 61, 0.35)"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={24}
                style={[styles.codeInput, { fontFamily: TakoFonts.black }]}
              />
              <Pressable
                onPress={() => submitCode(code)}
                disabled={joining}
                accessibilityRole="button"
                accessibilityLabel="Join split by code"
                style={({ pressed }) => [
                  styles.joinBtn,
                  { backgroundColor: palette.ctaBg },
                  pressed && { opacity: 0.9 },
                ]}>
                {joining ? (
                  <ActivityIndicator color={palette.ctaInk} />
                ) : (
                  <Text style={[styles.joinText, { color: palette.ctaInk, fontFamily: TakoFonts.bold }]}>
                    Join
                  </Text>
                )}
              </Pressable>
            </View>
            <FieldError message={inlineError} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFF6EE',
    fontSize: 15,
  },
  title: {
    color: '#FFF6EE',
    fontSize: 28,
    marginBottom: 2,
  },
  subtitle: {
    color: '#C7B8DB',
    fontSize: 13,
    lineHeight: 19,
  },
  viewfinderWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  mascotPeek: {
    marginBottom: -22,
    zIndex: 0,
  },
  viewfinder: {
    width: 244,
    height: 244,
    borderRadius: 28,
    backgroundColor: '#3A2850',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    paddingHorizontal: 16,
    gap: 8,
  },
  permDeniedText: {
    color: '#FFF6EE',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  scanLine: {
    position: 'absolute',
    width: 176,
    height: 2.5,
    borderRadius: 2,
  },
  codeSection: {
    gap: 8,
  },
  orLabel: {
    color: '#C7B8DB',
    fontSize: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3A2850',
    borderRadius: Radii.xl,
    padding: 6,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#FFF6EE',
    color: '#2B1B3D',
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    letterSpacing: 1.2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
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
  invalidDemoLink: {
    alignItems: 'center',
    paddingTop: 4,
  },
  invalidDemoText: {
    color: '#9B8AB4',
    fontSize: 11,
  },
  errorScreenWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    justifyContent: 'space-between',
  },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorTitle: {
    fontSize: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  errorActions: {
    gap: 10,
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    minHeight: 52,
    paddingVertical: 15,
  },
  tryAgainText: {
    fontSize: 16,
  },
  enterCodeBtn: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 50,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterCodeText: {
    fontSize: 15,
  },
});
