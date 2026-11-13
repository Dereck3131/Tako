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

import { AmbientGlow } from '@/components/AmbientGlow';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import type { TakoState } from '@/types/tako';

export function AuthScreen() {
  const { palette } = useTakoTheme();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [takoState, setTakoState] = useState<TakoState>('wave');

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    setTakoState('think');

    if (mode === 'signin') {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
        setTakoState('idle');
      } else {
        setTakoState('celebrate');
      }
    } else {
      const res = await signUp(email, password, displayName);
      if (res.error) {
        setError(res.error);
        setTakoState('idle');
      } else if (res.needsConfirmation) {
        setNotice('Check your email to confirm your account, then sign in.');
        setTakoState('wave');
        setMode('signin');
      } else {
        setTakoState('celebrate');
      }
    }
    setBusy(false);
  };

  const handleGuest = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    setTakoState('think');
    const res = await signInAsGuest(displayName || 'Tako Guest');
    if (res.error) {
      setError(res.error);
      setTakoState('idle');
    } else {
      setTakoState('celebrate');
    }
    setBusy(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <AmbientGlow size={360} style={{ top: 10, alignSelf: 'center' }} />

          <TakoMascot state={takoState} size={160} />

          <Text style={[styles.wordmark, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            tako
          </Text>
          <Text style={[styles.tagline, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Split the bill. Keep the friends.
          </Text>

          {/* Mode switch */}
          <View style={[styles.segment, { backgroundColor: palette.chip }]}>
            {(['signin', 'signup'] as const).map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                  }}
                  style={[
                    styles.segBtn,
                    active && { backgroundColor: palette.chipOn },
                  ]}>
                  <Text
                    style={[
                      styles.segText,
                      {
                        color: active ? palette.chipOnInk : palette.ink,
                        fontFamily: TakoFonts.bold,
                      },
                    ]}>
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}>
            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Display Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Mika"
                  placeholderTextColor={palette.mute}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.surfaceAlt,
                      color: palette.ink,
                      fontFamily: TakoFonts.regular,
                    },
                  ]}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.mute}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceAlt,
                    color: palette.ink,
                    fontFamily: TakoFonts.regular,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={palette.mute}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surfaceAlt,
                    color: palette.ink,
                    fontFamily: TakoFonts.regular,
                  },
                ]}
              />
            </View>

            {error && (
              <View style={[styles.banner, { backgroundColor: palette.coralSoft }]}>
                <Text style={[styles.bannerText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                  {error}
                </Text>
              </View>
            )}

            {notice && (
              <View style={[styles.banner, { backgroundColor: palette.tealSoft }]}>
                <Text style={[styles.bannerText, { color: palette.teal, fontFamily: TakoFonts.bold }]}>
                  {notice}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: palette.coralAccent },
                pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}>
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryBtnText, { fontFamily: TakoFonts.bold }]}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleGuest}
            disabled={busy}
            style={({ pressed }) => [
              styles.guestBtn,
              { backgroundColor: palette.chip },
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={[styles.guestText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Continue as Guest
            </Text>
          </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  glow: {
    position: 'absolute',
    top: 24,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.7,
  },
  wordmark: {
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -3,
    marginTop: 2,
  },
  tagline: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 22,
  },
  segment: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: Radii.pill,
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  segText: {
    fontSize: 14,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  banner: {
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
    textAlign: 'center',
  },
  primaryBtn: {
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  guestBtn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  guestText: {
    fontSize: 14,
  },
});
