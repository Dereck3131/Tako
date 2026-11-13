import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function ScanScreen() {
  const { palette } = useTakoTheme();
  const { profile } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    const cleaned = code.trim().replace(/^TAKO-/i, '').toUpperCase();
    if (!cleaned) {
      setError('Enter the invite code from your friend’s screen.');
      return;
    }

    setJoining(true);
    const { data: groupId, error: rpcErr } = await supabase.rpc('join_group_by_code', {
      p_code: cleaned,
      p_member_name: profile?.display_name ?? null,
    });

    if (rpcErr || !groupId) {
      setError(rpcErr?.message ?? 'Split not found for that code.');
      setJoining(false);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    setJoining(false);
    setCode('');
    router.replace(`/group/${groupId}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.plum }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color="#FFF6EE" />
            </Pressable>
            <Text style={[styles.topTitle, { fontFamily: TakoFonts.bold }]}>
              Join a split
            </Text>
            <View style={{ width: 38 }} />
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

            <View style={styles.viewfinder}>
              {/* 4 Coral Corners */}
              <View style={[styles.corner, styles.tl, { borderColor: palette.coral }]} />
              <View style={[styles.corner, styles.tr, { borderColor: palette.coral }]} />
              <View style={[styles.corner, styles.bl, { borderColor: palette.coral }]} />
              <View style={[styles.corner, styles.br, { borderColor: palette.coral }]} />

              {/* QR Icon + Scan Line */}
              <View style={styles.qrInner}>
                <Ionicons name="qr-code" size={116} color="#FFF6EE" />
                <View style={[styles.scanLine, { backgroundColor: palette.coral }]} />
              </View>
            </View>
          </View>

          {/* Code Input */}
          <View style={styles.codeSection}>
            <Text style={[styles.orLabel, { fontFamily: TakoFonts.bold }]}>
              Or enter the code
            </Text>

            <View style={styles.codeBox}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="TAKO-4821"
                placeholderTextColor="#8E7EA3"
                autoCapitalize="characters"
                autoCorrect={false}
                style={[styles.codeInput, { fontFamily: TakoFonts.black }]}
              />
              <Pressable
                onPress={handleJoin}
                disabled={joining}
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
            </View>

            {error && (
              <Text style={[styles.errorText, { color: palette.coral, fontFamily: TakoFonts.bold }]}>
                {error}
              </Text>
            )}
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
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFF6EE',
    fontSize: 16,
  },
  title: {
    color: '#FFF6EE',
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    color: '#C7B8DB',
    fontSize: 14,
    lineHeight: 20,
  },
  viewfinderWrap: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 24,
  },
  mascotPeek: {
    marginBottom: -20,
    zIndex: 0,
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: 28,
    backgroundColor: '#3A2850',
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
    color: '#D5C7E8',
    fontSize: 13,
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
    letterSpacing: 1.5,
  },
  joinBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
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
});
