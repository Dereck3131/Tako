import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { supabase } from '@/lib/supabase';
import type { TakoState } from '@/types/tako';

export function AuthScreen() {
  const { palette } = useTakoTheme();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [takoState, setTakoState] = useState<TakoState>('wave');

  const validateFields = () => {
    const next: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) {
      next.password = 'Enter your password.';
    } else if (mode === 'signup' && password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);

    if (!validateFields()) {
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

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldErrors({ email: 'Enter your email above to reset your password.' });
      return;
    }
    setBusy(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed);
    setBusy(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setNotice('Password reset link sent. Check your inbox.');
    }
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
        <View style={styles.scroll}>
          <AmbientGlow size={320} style={{ top: 0, alignSelf: 'center' }} />

          <TakoMascot state={takoState} size={118} />

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
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                    setFieldErrors({});
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
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField((f) => (f === 'name' ? null : f))}
                  placeholder="e.g. Mika"
                  placeholderTextColor={palette.mute}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.surfaceAlt,
                      color: palette.ink,
                      fontFamily: TakoFonts.regular,
                      borderColor: focusedField === 'name' ? palette.coralAccent : 'transparent',
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
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField((f) => (f === 'email' ? null : f))}
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
                    borderColor: fieldErrors.email
                      ? palette.destructive
                      : focusedField === 'email'
                        ? palette.coralAccent
                        : 'transparent',
                  },
                ]}
              />
              {fieldErrors.email && (
                <Text style={[styles.fieldError, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                  {fieldErrors.email}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                  Password
                </Text>
                {mode === 'signin' && (
                  <Pressable onPress={handleForgotPassword} hitSlop={8}>
                    <Text style={[styles.forgotText, { color: palette.coralAccent, fontFamily: TakoFonts.bold }]}>
                      Forgot password?
                    </Text>
                  </Pressable>
                )}
              </View>
              <View
                style={[
                  styles.passwordWrap,
                  {
                    backgroundColor: palette.surfaceAlt,
                    borderColor: fieldErrors.password
                      ? palette.destructive
                      : focusedField === 'password'
                        ? palette.coralAccent
                        : 'transparent',
                  },
                ]}>
                <TextInput
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField((f) => (f === 'password' ? null : f))}
                  placeholder="••••••••"
                  placeholderTextColor={palette.mute}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.passwordInput,
                    {
                      color: palette.ink,
                      fontFamily: TakoFonts.regular,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={palette.mute}
                  />
                </Pressable>
              </View>
              {fieldErrors.password && (
                <Text style={[styles.fieldError, { color: palette.destructive, fontFamily: TakoFonts.bold }]}>
                  {fieldErrors.password}
                </Text>
              )}
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
            accessibilityRole="button"
            accessibilityLabel="Continue as Guest"
            style={({ pressed }) => [
              styles.guestBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pressed && { opacity: 0.85 },
            ]}>
            <Ionicons name="person-outline" size={16} color={palette.ink} />
            <Text style={[styles.guestText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
              Continue as Guest
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  glow: {
    position: 'absolute',
    top: 10,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.7,
  },
  wordmark: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -2.4,
    marginTop: 0,
  },
  tagline: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 14,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radii.pill,
    marginBottom: 12,
    width: '100%',
    maxWidth: 400,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
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
    padding: 16,
    gap: 10,
  },
  field: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
  },
  forgotText: {
    fontSize: 12,
  },
  fieldError: {
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    borderRadius: Radii.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    paddingLeft: 14,
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 22,
    minHeight: 46,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  guestText: {
    fontSize: 14,
  },
});
