import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { FieldError } from '@/components/FieldError';
import { OtpSixBoxInput, type OtpSixBoxInputHandle } from '@/components/OtpSixBoxInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SpringPressable } from '@/components/SpringPressable';
import { TakoMascot } from '@/components/TakoMascot';
import { Radii, TakoFonts, getCardElevation } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTakoTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '@/lib/takoData';
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  authSignInSchema,
  authSignUpSchema,
  emailSchema,
  getPasswordStrengthHint,
  getResendStatus,
  mapResetOtpError,
  otpCodeSchema,
  profileNameSchema,
  resetNewPasswordSchema,
  signInPasswordSchema,
  signUpPasswordSchema,
} from '@/lib/validation';
import type { TakoState } from '@/types/tako';

type ResetStep = 'idle' | 'request' | 'verify_code' | 'new_password';

function getDevResetPreview(): { step: ResetStep; email: string } {
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('resetPreview');
    if (preview === 'request' || preview === 'verify_code' || preview === 'new_password') {
      return { step: preview, email: params.get('email') || 'alex@example.com' };
    }
  }
  return { step: 'idle', email: '' };
}

export function AuthScreen() {
  const { palette, isDark } = useTakoTheme();
  const { signIn, signInAsGuest, signOut, setPasswordRecoveryPending } = useAuth();
  const placeholderHintColor = isDark ? 'rgba(185, 171, 201, 0.55)' : 'rgba(106, 106, 106, 0.55)';
  const cardElevation = getCardElevation(isDark);
  const initialPreview = getDevResetPreview();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialPreview.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>(initialPreview.step);
  const [otpCode, setOtpCode] = useState('');
  const [otpTouched, setOtpTouched] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(
    initialPreview.step === 'verify_code' ? 58 : 0
  );
  const [resendCount, setResendCount] = useState(0);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    'name' | 'email' | 'password' | 'confirmPassword' | null
  >(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [takoState, setTakoState] = useState<TakoState>('wave');

  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmPasswordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const otpRef = useRef<OtpSixBoxInputHandle>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const isInSubFlow = otpStep || resetStep !== 'idle';
  const requiresStrongPassword = mode === 'signup' || resetStep === 'new_password';
  const strengthHint = requiresStrongPassword ? getPasswordStrengthHint(password) : null;
  const resendStatus = getResendStatus(resendSeconds, resendCount);

  const fireErrorHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const validateSingleField = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    if (field === 'name' && mode === 'signup') {
      const res = profileNameSchema.safeParse(displayName);
      setFieldErrors((prev) => ({
        ...prev,
        name: res.success ? undefined : res.error.issues[0]?.message,
      }));
    } else if (field === 'email') {
      const res = emailSchema.safeParse(email);
      setFieldErrors((prev) => ({
        ...prev,
        email: res.success ? undefined : res.error.issues[0]?.message,
      }));
    } else if (field === 'password') {
      const schema = requiresStrongPassword ? signUpPasswordSchema : signInPasswordSchema;
      const res = schema.safeParse(password);
      setFieldErrors((prev) => ({
        ...prev,
        password: res.success ? undefined : res.error.issues[0]?.message,
        confirmPassword:
          requiresStrongPassword && confirmPassword && password !== confirmPassword
            ? "Passwords don't match."
            : requiresStrongPassword && confirmPassword && password === confirmPassword
              ? undefined
              : prev.confirmPassword,
      }));
    } else if (field === 'confirmPassword' && requiresStrongPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: !confirmPassword
          ? resetStep === 'new_password'
            ? 'Confirm your new password.'
            : 'Confirm your password.'
          : confirmPassword !== password
            ? "Passwords don't match."
            : undefined,
      }));
    }
  };

  const handleOtpBlur = () => {
    if (!otpTouched && otpCode.length === 0) return;
    const parsed = otpCodeSchema.safeParse(otpCode);
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? 'Enter the 6-digit reset code.');
    }
  };

  const validateAllFields = () => {
    const schema = mode === 'signup' ? authSignUpSchema : authSignInSchema;
    const payload =
      mode === 'signup'
        ? { displayName, email, password, confirmPassword }
        : { email, password };
    const parsed = schema.safeParse(payload);
    if (parsed.success) {
      setFieldErrors({});
      return parsed.data;
    }

    const next: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key === 'displayName' && !next.name) next.name = issue.message;
      if (key === 'email' && !next.email) next.email = issue.message;
      if (key === 'password' && !next.password) next.password = issue.message;
      if (key === 'confirmPassword' && !next.confirmPassword) next.confirmPassword = issue.message;
    }
    setFieldErrors(next);

    if (next.name) nameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    else if (next.confirmPassword) confirmPasswordRef.current?.focus();

    fireErrorHaptic();
    return null;
  };

  const extractFunctionError = async (
    data: unknown,
    fnErr: { message?: string; context?: Response } | null,
    fallback: string
  ) => {
    const bodyErr = (data as { error?: string } | null)?.error;
    if (bodyErr) return bodyErr;
    if (fnErr?.context && typeof fnErr.context.json === 'function') {
      try {
        const parsed = (await fnErr.context.json()) as { error?: string };
        if (parsed?.error) return parsed.error;
      } catch {
        // ignore parse failure
      }
    }
    return fnErr?.message || fallback;
  };

  const sendOtpCode = async (targetEmail: string, action: 'send' | 'send_reset') => {
    const { data, error: fnErr } = await supabase.functions.invoke('auth-otp', {
      body: { action, email: targetEmail },
    });
    if (fnErr || (data as { error?: string } | null)?.error) {
      const msg = await extractFunctionError(data, fnErr, 'Could not send verification code.');
      return { ok: false as const, error: msg };
    }
    return { ok: true as const };
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || busy) return;
    setError(null);
    setNotice(null);

    const validData = validateAllFields();
    if (!validData) return;

    submitLockRef.current = true;
    setBusy(true);
    setTakoState('think');

    if (mode === 'signin') {
      const res = await signIn(validData.email, validData.password);
      if (res.error) {
        setError(mapAuthError(res.error));
        setTakoState('idle');
        fireErrorHaptic();
      } else {
        setTakoState('celebrate');
      }
    } else {
      const signUpData = validData as { displayName: string; email: string; password: string };
      const otpRes = await sendOtpCode(signUpData.email, 'send');
      if (!otpRes.ok) {
        const mapped = mapResetOtpError(otpRes.error);
        setError(mapped.message);
        setTakoState('idle');
        fireErrorHaptic();
      } else {
        setOtpCode('');
        setOtpTouched(false);
        setOtpError(null);
        setResendCount(0);
        setResendFeedback(null);
        setOtpStep(true);
        setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
        setTakoState('wave');
      }
    }
    setBusy(false);
    submitLockRef.current = false;
  };

  const handleVerifySignupOtp = async (overrideCode?: string) => {
    if (submitLockRef.current || busy) return;
    setError(null);
    setOtpError(null);

    const candidate = overrideCode ?? otpCode;
    const parsedCode = otpCodeSchema.safeParse(candidate);
    if (!parsedCode.success) {
      setOtpError(parsedCode.error.issues[0]?.message ?? 'Enter the 6-digit reset code.');
      otpRef.current?.focus(Math.min(candidate.length, 5));
      fireErrorHaptic();
      return;
    }

    const validData = validateAllFields();
    if (!validData) {
      setOtpStep(false);
      return;
    }

    const signUpData = validData as { displayName: string; email: string; password: string };
    submitLockRef.current = true;
    setBusy(true);
    setTakoState('think');

    const { data, error: fnErr } = await supabase.functions.invoke('auth-otp', {
      body: {
        action: 'verify',
        email: signUpData.email,
        password: signUpData.password,
        displayName: signUpData.displayName,
        code: parsedCode.data,
      },
    });

    if (fnErr || (data as { error?: string } | null)?.error) {
      const raw = await extractFunctionError(data, fnErr, 'Verification failed.');
      const mapped = mapResetOtpError(raw);
      if (mapped.target === 'code') {
        setOtpError(mapped.message);
      } else {
        setError(mapped.message);
      }
      setTakoState('idle');
      setBusy(false);
      submitLockRef.current = false;
      fireErrorHaptic();
      return;
    }

    const signInRes = await signIn(signUpData.email, signUpData.password);
    if (signInRes.error) {
      setError(mapAuthError(signInRes.error));
      setOtpStep(false);
      setTakoState('idle');
    } else {
      setTakoState('celebrate');
    }
    setBusy(false);
    submitLockRef.current = false;
  };

  const handleResendOtp = async () => {
    if (busy || !resendStatus.canResend) return;
    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) return;
    setOtpError(null);
    setError(null);
    setResendFeedback(null);
    setBusy(true);
    const action = resetStep === 'verify_code' ? 'send_reset' : 'send';
    const res = await sendOtpCode(emailRes.data, action);
    setBusy(false);
    if (!res.ok) {
      const mapped = mapResetOtpError(res.error);
      if (mapped.target === 'code') {
        setOtpError(mapped.message);
      } else {
        setError(mapped.message);
      }
      fireErrorHaptic();
    } else {
      setOtpCode('');
      setOtpTouched(false);
      setResendCount((c) => c + 1);
      setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
      setResendFeedback('New code sent');
      otpRef.current?.focus(0);
    }
  };

  const exitResetFlow = async (nextNotice?: string) => {
    if (resetStep === 'new_password') {
      await signOut().catch(() => {});
    }
    setPasswordRecoveryPending(false);
    setResetStep('idle');
    setOtpCode('');
    setOtpTouched(false);
    setOtpError(null);
    setResendCount(0);
    setResendFeedback(null);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setError(null);
    setNotice(nextNotice ?? null);
  };

  const handleForgotPassword = () => {
    setError(null);
    setNotice(null);
    setOtpError(null);
    setOtpCode('');
    setOtpTouched(false);
    setResendCount(0);
    setResendFeedback(null);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setResetStep('request');
  };

  const handleSendResetCode = async () => {
    if (submitLockRef.current || busy) return;
    setError(null);
    setNotice(null);
    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) {
      setFieldErrors((prev) => ({
        ...prev,
        email: emailRes.error.issues[0]?.message ?? 'Enter a valid email address.',
      }));
      emailRef.current?.focus();
      fireErrorHaptic();
      return;
    }

    submitLockRef.current = true;
    setBusy(true);
    setTakoState('think');
    const res = await sendOtpCode(emailRes.data, 'send_reset');
    setBusy(false);
    submitLockRef.current = false;

    if (!res.ok) {
      const mapped = mapResetOtpError(res.error);
      setError(mapped.message);
      setTakoState('idle');
      fireErrorHaptic();
      return;
    }

    setEmail(emailRes.data);
    setOtpCode('');
    setOtpTouched(false);
    setOtpError(null);
    setFieldErrors({});
    setResendCount(0);
    setResendFeedback(null);
    setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
    setResetStep('verify_code');
    setTakoState('wave');
  };

  const handleVerifyResetCode = async (overrideCode?: string) => {
    if (submitLockRef.current || busy) return;
    setError(null);
    setOtpError(null);
    setResendFeedback(null);

    const candidate = overrideCode ?? otpCode;
    const parsedCode = otpCodeSchema.safeParse(candidate);
    if (!parsedCode.success) {
      setOtpTouched(true);
      setOtpError(parsedCode.error.issues[0]?.message ?? 'Enter the 6-digit reset code.');
      otpRef.current?.focus(Math.min(candidate.length, 5));
      fireErrorHaptic();
      return;
    }

    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) {
      setResetStep('request');
      setFieldErrors({ email: 'Enter a valid email address.' });
      return;
    }

    submitLockRef.current = true;
    setBusy(true);
    setTakoState('think');

    const { data, error: fnErr } = await supabase.functions.invoke('auth-otp', {
      body: {
        action: 'verify_reset_code',
        email: emailRes.data,
        code: parsedCode.data,
      },
    });

    setBusy(false);
    submitLockRef.current = false;

    if (fnErr || (data as { error?: string } | null)?.error) {
      const raw = await extractFunctionError(data, fnErr, 'Could not verify reset code.');
      const mapped = mapResetOtpError(raw);
      if (mapped.target === 'code') {
        setOtpError(mapped.message);
      } else {
        setError(mapped.message);
      }
      setTakoState('idle');
      fireErrorHaptic();
      return;
    }

    // Move to separate password change screen while keeping verified 6-digit code in state
    setOtpCode(parsedCode.data);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setError(null);
    setOtpError(null);
    setResetStep('new_password');
    setTakoState('wave');
  };

  const handleUpdateResetPassword = async () => {
    if (submitLockRef.current || busy) return;
    setError(null);

    const parsed = resetNewPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrors: { password?: string; confirmPassword?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key === 'password' && !nextErrors.password) nextErrors.password = issue.message;
        if (key === 'confirmPassword' && !nextErrors.confirmPassword) {
          nextErrors.confirmPassword = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      if (nextErrors.password) passwordRef.current?.focus();
      else if (nextErrors.confirmPassword) confirmPasswordRef.current?.focus();
      fireErrorHaptic();
      return;
    }

    const emailRes = emailSchema.safeParse(email);
    const codeRes = otpCodeSchema.safeParse(otpCode);
    if (!emailRes.success || !codeRes.success) {
      setResetStep('verify_code');
      setOtpError('Enter the 6-digit reset code.');
      return;
    }

    submitLockRef.current = true;
    setBusy(true);
    setTakoState('think');

    const { data, error: fnErr } = await supabase.functions.invoke('auth-otp', {
      body: {
        action: 'verify_reset',
        email: emailRes.data,
        code: codeRes.data,
        password: parsed.data.password,
      },
    });

    if (fnErr || (data as { error?: string } | null)?.error) {
      const raw = await extractFunctionError(data, fnErr, 'Could not update password.');
      const mapped = mapResetOtpError(raw);
      if (mapped.target === 'password') {
        setFieldErrors((prev) => ({ ...prev, password: mapped.message }));
        passwordRef.current?.focus();
      } else if (mapped.target === 'code') {
        setResetStep('verify_code');
        setOtpError(mapped.message);
      } else {
        setError(mapped.message);
      }
      setTakoState('idle');
      setBusy(false);
      submitLockRef.current = false;
      fireErrorHaptic();
      return;
    }

    const signInRes = await signIn(emailRes.data, parsed.data.password);
    // Revoke other active sessions if supported
    await supabase.auth.signOut({ scope: 'others' }).catch(() => {});

    setBusy(false);
    submitLockRef.current = false;

    if (signInRes.error) {
      await exitResetFlow('Password updated. Sign in with your new password.');
      setTakoState('idle');
    } else {
      setPasswordRecoveryPending(false);
      setTakoState('celebrate');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AmbientGlow size={320} style={{ top: 0, alignSelf: 'center' }} />

          <TakoMascot state={takoState} size={112} />

          <Text style={[styles.wordmark, { color: palette.ink, fontFamily: TakoFonts.black }]}>
            tako
          </Text>
          <Text style={[styles.tagline, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
            Split the bill. Keep the friends.
          </Text>

          {/* Segmented Control hidden during reset or signup OTP verification */}
          {!isInSubFlow && (
            <SegmentedControl
              options={[
                { key: 'signin', label: 'Sign In' },
                { key: 'signup', label: 'Create Account' },
              ]}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setOtpStep(false);
                setResetStep('idle');
                setOtpCode('');
                setOtpTouched(false);
                setOtpError(null);
                setError(null);
                setNotice(null);
                setFieldErrors({});
              }}
              style={styles.segmentWrap}
            />
          )}

          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
              cardElevation,
            ]}>
            {mode === 'signup' && otpStep ? (
              <View style={styles.otpWrap}>
                <View style={styles.stepHeaderRow}>
                  <Pressable
                    onPress={() => {
                      setOtpStep(false);
                      setOtpError(null);
                      setResendFeedback(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Back to account details"
                    style={[styles.backIconBtn, { backgroundColor: palette.surfaceAlt }]}>
                    <Ionicons name="arrow-back" size={18} color={palette.ink} />
                  </Pressable>
                  <Text style={[styles.otpTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                    Verify your email
                  </Text>
                  <View style={styles.backIconSpacer} />
                </View>

                <View
                  style={[
                    styles.quietNote,
                    { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                  ]}>
                  <Ionicons name="mail-outline" size={16} color={palette.ink} />
                  <Text style={[styles.quietNoteText, { color: palette.ink, fontFamily: TakoFonts.regular }]}>
                    We sent a 6-digit code to{' '}
                    <Text style={{ fontFamily: TakoFonts.bold }}>{email.trim().toLowerCase()}</Text>. It
                    expires in 10 minutes.
                  </Text>
                </View>

                <OtpSixBoxInput
                  ref={otpRef}
                  value={otpCode}
                  onChange={(next) => {
                    setOtpCode(next);
                    setOtpTouched(true);
                    if (otpError) setOtpError(null);
                  }}
                  onComplete={(completed) => {
                    handleVerifySignupOtp(completed);
                  }}
                  onBlur={handleOtpBlur}
                  hasError={Boolean(otpError)}
                  disabled={busy}
                  autoFocus
                />
                <FieldError message={otpError} />

                {resendFeedback && (
                  <View
                    accessibilityRole="status"
                    accessibilityLiveRegion="polite"
                    style={[styles.feedbackNote, { backgroundColor: palette.surfaceAlt }]}>
                    <Ionicons name="checkmark-circle" size={15} color={palette.teal} />
                    <Text style={[styles.feedbackNoteText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                      {resendFeedback}
                    </Text>
                  </View>
                )}

                {error && <FieldError message={error} />}

                <PrimaryButton
                  label="Verify & Create Account"
                  onPress={() => handleVerifySignupOtp()}
                  loading={busy}
                  style={{ marginTop: 4 }}
                />

                <View style={styles.otpActionsRow}>
                  <Pressable
                    onPress={handleResendOtp}
                    disabled={busy || !resendStatus.canResend}
                    accessibilityRole="button"
                    accessibilityLabel={resendStatus.label}
                    style={styles.otpActionBtn}>
                    <Text
                      style={[
                        styles.otpActionLink,
                        {
                          color: resendStatus.canResend ? palette.coralAccent : palette.mute,
                          fontFamily: TakoFonts.bold,
                        },
                      ]}>
                      {resendStatus.label}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setOtpStep(false);
                      setOtpError(null);
                      setResendFeedback(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit details"
                    style={styles.otpActionBtn}>
                    <Text style={[styles.otpActionLink, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      Edit details
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : mode === 'signin' && resetStep !== 'idle' ? (
              <View style={styles.otpWrap}>
                {/* Step Header with 44x44 Back Button */}
                <View style={styles.stepHeaderRow}>
                  <Pressable
                    onPress={() => {
                      if (resetStep === 'verify_code') {
                        setResetStep('request');
                        setOtpCode('');
                        setOtpTouched(false);
                        setOtpError(null);
                        setError(null);
                        setResendFeedback(null);
                      } else {
                        exitResetFlow();
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      resetStep === 'verify_code' ? 'Back to email step' : 'Back to Sign In'
                    }
                    style={[styles.backIconBtn, { backgroundColor: palette.surfaceAlt }]}>
                    <Ionicons name="arrow-back" size={18} color={palette.ink} />
                  </Pressable>
                  <Text style={[styles.otpTitle, { color: palette.ink, fontFamily: TakoFonts.black }]}>
                    {resetStep === 'request'
                      ? 'Reset your password'
                      : resetStep === 'verify_code'
                        ? 'Enter reset code'
                        : 'Choose new password'}
                  </Text>
                  <View style={styles.backIconSpacer} />
                </View>

                {resetStep === 'request' && (
                  <>
                    <Text style={[styles.otpSubtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                      Enter your email and we&apos;ll send a 6-digit code.
                    </Text>

                    <View style={styles.field}>
                      <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                        Email
                      </Text>
                      <TextInput
                        ref={emailRef}
                        value={email}
                        onChangeText={(txt) => {
                          setEmail(txt);
                          if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
                        }}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => {
                          setFocusedField((f) => (f === 'email' ? null : f));
                          validateSingleField('email');
                        }}
                        onSubmitEditing={handleSendResetCode}
                        returnKeyType="send"
                        placeholder="you@example.com"
                        placeholderTextColor={placeholderHintColor}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={254}
                        autoFocus
                        style={[
                          styles.input,
                          {
                            backgroundColor: palette.surfaceAlt,
                            color: palette.ink,
                            fontFamily: TakoFonts.regular,
                            borderColor: fieldErrors.email
                              ? palette.destructive
                              : focusedField === 'email'
                                ? palette.ink
                                : 'transparent',
                          },
                        ]}
                      />
                      <FieldError message={fieldErrors.email} />
                    </View>

                    {error && <FieldError message={error} />}

                    <PrimaryButton
                      label="Send Reset Code"
                      onPress={handleSendResetCode}
                      loading={busy}
                      style={{ marginTop: 4 }}
                    />

                    <View style={styles.singleActionRow}>
                      <Pressable
                        onPress={() => exitResetFlow()}
                        accessibilityRole="button"
                        accessibilityLabel="Back to Sign In"
                        style={styles.otpActionBtn}>
                        <Text style={[styles.otpActionLink, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                          Back to Sign In
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {resetStep === 'verify_code' && (
                  <>
                    {/* Quiet high-contrast info note above the form, mentioning email once */}
                    <View
                      style={[
                        styles.quietNote,
                        { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                      ]}>
                      <Ionicons name="mail-outline" size={16} color={palette.ink} />
                      <Text
                        style={[
                          styles.quietNoteText,
                          { color: palette.ink, fontFamily: TakoFonts.regular },
                        ]}>
                        If an account exists for{' '}
                        <Text style={{ fontFamily: TakoFonts.bold }}>{email.trim().toLowerCase()}</Text>, we
                        sent a 6-digit code. It expires in 10 minutes.
                      </Text>
                    </View>

                    <OtpSixBoxInput
                      ref={otpRef}
                      value={otpCode}
                      onChange={(next) => {
                        setOtpCode(next);
                        setOtpTouched(true);
                        if (otpError) setOtpError(null);
                      }}
                      onComplete={(completed) => {
                        handleVerifyResetCode(completed);
                      }}
                      onBlur={handleOtpBlur}
                      hasError={Boolean(otpError)}
                      disabled={busy}
                      autoFocus
                    />
                    <FieldError message={otpError} />

                    {resendFeedback && (
                      <View
                        accessibilityRole="status"
                        accessibilityLiveRegion="polite"
                        style={[styles.feedbackNote, { backgroundColor: palette.surfaceAlt }]}>
                        <Ionicons name="checkmark-circle" size={15} color={palette.teal} />
                        <Text
                          style={[
                            styles.feedbackNoteText,
                            { color: palette.ink, fontFamily: TakoFonts.bold },
                          ]}>
                          {resendFeedback}
                        </Text>
                      </View>
                    )}

                    {error && <FieldError message={error} />}

                    <PrimaryButton
                      label="Verify Code"
                      onPress={() => handleVerifyResetCode()}
                      loading={busy}
                      style={{ marginTop: 4 }}
                    />

                    <View style={styles.otpActionsRow}>
                      <Pressable
                        onPress={handleResendOtp}
                        disabled={busy || !resendStatus.canResend}
                        accessibilityRole="button"
                        accessibilityLabel={resendStatus.label}
                        style={styles.otpActionBtn}>
                        <Text
                          style={[
                            styles.otpActionLink,
                            {
                              color: resendStatus.canResend ? palette.coralAccent : palette.mute,
                              fontFamily: TakoFonts.bold,
                            },
                          ]}>
                          {resendStatus.label}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => exitResetFlow()}
                        accessibilityRole="button"
                        accessibilityLabel="Back to Sign In"
                        style={styles.otpActionBtn}>
                        <Text
                          style={[
                            styles.otpActionLink,
                            { color: palette.mute, fontFamily: TakoFonts.bold },
                          ]}>
                          Back to Sign In
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {resetStep === 'new_password' && (
                  <>
                    <Text style={[styles.otpSubtitle, { color: palette.mute, fontFamily: TakoFonts.regular }]}>
                      Create a strong password you haven&apos;t used before.
                    </Text>

                    <View style={styles.field}>
                      <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                        New Password
                      </Text>
                      <View
                        style={[
                          styles.passwordWrap,
                          {
                            backgroundColor: palette.surfaceAlt,
                            borderColor: fieldErrors.password
                              ? palette.destructive
                              : focusedField === 'password'
                                ? palette.ink
                                : 'transparent',
                          },
                        ]}>
                        <TextInput
                          ref={passwordRef}
                          value={password}
                          onChangeText={(txt) => {
                            setPassword(txt);
                            if (fieldErrors.password) {
                              setFieldErrors((e) => ({ ...e, password: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => {
                            setFocusedField((f) => (f === 'password' ? null : f));
                            validateSingleField('password');
                          }}
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          placeholder="Enter new password"
                          placeholderTextColor={placeholderHintColor}
                          secureTextEntry={!showPassword}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          maxLength={72}
                          autoFocus
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
                      {strengthHint && !fieldErrors.password && (
                        <Text
                          style={[
                            styles.strengthText,
                            {
                              color:
                                strengthHint.tone === 'strong'
                                  ? palette.teal
                                  : strengthHint.tone === 'fair'
                                    ? palette.ink
                                    : palette.mute,
                              fontFamily: TakoFonts.regular,
                            },
                          ]}>
                          {strengthHint.label}
                        </Text>
                      )}
                      <FieldError message={fieldErrors.password} />
                    </View>

                    <View style={styles.field}>
                      <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                        Confirm New Password
                      </Text>
                      <View
                        style={[
                          styles.passwordWrap,
                          {
                            backgroundColor: palette.surfaceAlt,
                            borderColor: fieldErrors.confirmPassword
                              ? palette.destructive
                              : focusedField === 'confirmPassword'
                                ? palette.ink
                                : 'transparent',
                          },
                        ]}>
                        <TextInput
                          ref={confirmPasswordRef}
                          value={confirmPassword}
                          onChangeText={(txt) => {
                            setConfirmPassword(txt);
                            if (fieldErrors.confirmPassword) {
                              setFieldErrors((e) => ({ ...e, confirmPassword: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => {
                            setFocusedField((f) => (f === 'confirmPassword' ? null : f));
                            validateSingleField('confirmPassword');
                          }}
                          onSubmitEditing={handleUpdateResetPassword}
                          returnKeyType="done"
                          placeholder="Re-enter new password"
                          placeholderTextColor={placeholderHintColor}
                          secureTextEntry={!showConfirmPassword}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          maxLength={72}
                          style={[
                            styles.passwordInput,
                            {
                              color: palette.ink,
                              fontFamily: TakoFonts.regular,
                            },
                          ]}
                        />
                        <Pressable
                          onPress={() => setShowConfirmPassword((s) => !s)}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
                          style={styles.eyeBtn}>
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={palette.mute}
                          />
                        </Pressable>
                      </View>
                      <FieldError message={fieldErrors.confirmPassword} />
                    </View>

                    {error && <FieldError message={error} />}

                    <PrimaryButton
                      label="Update Password"
                      onPress={handleUpdateResetPassword}
                      loading={busy}
                      style={{ marginTop: 4 }}
                    />

                    <View style={styles.singleActionRow}>
                      <Pressable
                        onPress={() => exitResetFlow()}
                        accessibilityRole="button"
                        accessibilityLabel="Back to Sign In"
                        style={styles.otpActionBtn}>
                        <Text
                          style={[
                            styles.otpActionLink,
                            { color: palette.mute, fontFamily: TakoFonts.bold },
                          ]}>
                          Back to Sign In
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <>
                {notice && (
                  <View
                    accessibilityRole="status"
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.quietNote,
                      { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
                    ]}>
                    <Ionicons name="checkmark-circle" size={16} color={palette.teal} />
                    <Text
                      style={[
                        styles.quietNoteText,
                        { color: palette.ink, fontFamily: TakoFonts.bold },
                      ]}>
                      {notice}
                    </Text>
                  </View>
                )}

                {mode === 'signup' && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      Display Name
                    </Text>
                    <TextInput
                      ref={nameRef}
                      value={displayName}
                      onChangeText={(txt) => {
                        setDisplayName(txt);
                        if (fieldErrors.name) setFieldErrors((e) => ({ ...e, name: undefined }));
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => {
                        setFocusedField((f) => (f === 'name' ? null : f));
                        validateSingleField('name');
                      }}
                      onSubmitEditing={() => emailRef.current?.focus()}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      placeholder="e.g. Mika"
                      placeholderTextColor={placeholderHintColor}
                      autoCapitalize="words"
                      maxLength={30}
                      style={[
                        styles.input,
                        {
                          backgroundColor: palette.surfaceAlt,
                          color: palette.ink,
                          fontFamily: TakoFonts.regular,
                          borderColor: fieldErrors.name
                            ? palette.destructive
                            : focusedField === 'name'
                              ? palette.ink
                              : 'transparent',
                        },
                      ]}
                    />
                    <FieldError message={fieldErrors.name} />
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                    Email
                  </Text>
                  <TextInput
                    ref={emailRef}
                    value={email}
                    onChangeText={(txt) => {
                      setEmail(txt);
                      if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => {
                      setFocusedField((f) => (f === 'email' ? null : f));
                      validateSingleField('email');
                    }}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    placeholder="you@example.com"
                    placeholderTextColor={placeholderHintColor}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={254}
                    style={[
                      styles.input,
                      {
                        backgroundColor: palette.surfaceAlt,
                        color: palette.ink,
                        fontFamily: TakoFonts.regular,
                        borderColor: fieldErrors.email
                          ? palette.destructive
                          : focusedField === 'email'
                            ? palette.ink
                            : 'transparent',
                      },
                    ]}
                  />
                  <FieldError message={fieldErrors.email} />
                </View>

                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      Password
                    </Text>
                    {mode === 'signin' && (
                      <Pressable
                        onPress={handleForgotPassword}
                        accessibilityRole="button"
                        accessibilityLabel="Forgot password?"
                        style={styles.forgotBtn}>
                        <Text
                          style={[
                            styles.forgotText,
                            { color: palette.coralAccent, fontFamily: TakoFonts.bold },
                          ]}>
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
                            ? palette.ink
                            : 'transparent',
                      },
                    ]}>
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={(txt) => {
                        setPassword(txt);
                        if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => {
                        setFocusedField((f) => (f === 'password' ? null : f));
                        validateSingleField('password');
                      }}
                      onSubmitEditing={() => {
                        if (mode === 'signup') {
                          confirmPasswordRef.current?.focus();
                        } else {
                          handleSubmit();
                        }
                      }}
                      returnKeyType={mode === 'signup' ? 'next' : 'done'}
                      blurOnSubmit={mode !== 'signup'}
                      placeholder="Enter password"
                      placeholderTextColor={placeholderHintColor}
                      secureTextEntry={!showPassword}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                      maxLength={72}
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
                  {strengthHint && !fieldErrors.password && (
                    <Text
                      style={[
                        styles.strengthText,
                        {
                          color:
                            strengthHint.tone === 'strong'
                              ? palette.teal
                              : strengthHint.tone === 'fair'
                                ? palette.ink
                                : palette.mute,
                          fontFamily: TakoFonts.regular,
                        },
                      ]}>
                      {strengthHint.label}
                    </Text>
                  )}
                  <FieldError message={fieldErrors.password} />
                </View>

                {mode === 'signup' && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: palette.mute, fontFamily: TakoFonts.bold }]}>
                      Confirm Password
                    </Text>
                    <View
                      style={[
                        styles.passwordWrap,
                        {
                          backgroundColor: palette.surfaceAlt,
                          borderColor: fieldErrors.confirmPassword
                            ? palette.destructive
                            : focusedField === 'confirmPassword'
                              ? palette.ink
                              : 'transparent',
                        },
                      ]}>
                      <TextInput
                        ref={confirmPasswordRef}
                        value={confirmPassword}
                        onChangeText={(txt) => {
                          setConfirmPassword(txt);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((e) => ({ ...e, confirmPassword: undefined }));
                          }
                        }}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => {
                          setFocusedField((f) => (f === 'confirmPassword' ? null : f));
                          validateSingleField('confirmPassword');
                        }}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="done"
                        placeholder="Re-enter password"
                        placeholderTextColor={placeholderHintColor}
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        maxLength={72}
                        style={[
                          styles.passwordInput,
                          {
                            color: palette.ink,
                            fontFamily: TakoFonts.regular,
                          },
                        ]}
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword((s) => !s)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                        }
                        style={styles.eyeBtn}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={palette.mute}
                        />
                      </Pressable>
                    </View>
                    <FieldError message={fieldErrors.confirmPassword} />
                  </View>
                )}

                {error && <FieldError message={error} />}

                <PrimaryButton
                  label={mode === 'signin' ? 'Sign In' : 'Create Account'}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    handleSubmit();
                  }}
                  loading={busy}
                  style={{ marginTop: 4 }}
                />
              </>
            )}
          </View>

          {!isInSubFlow && (
            <SpringPressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
                handleGuest();
              }}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Continue as Guest"
              style={[
                styles.guestBtn,
                { backgroundColor: palette.surface, borderColor: palette.border },
                cardElevation,
              ]}>
              <Ionicons name="person-outline" size={16} color={palette.ink} />
              <Text style={[styles.guestText, { color: palette.ink, fontFamily: TakoFonts.bold }]}>
                Continue as Guest
              </Text>
            </SpringPressable>
          )}
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
    paddingVertical: 24,
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
    marginBottom: 18,
  },
  segmentWrap: {
    marginBottom: 14,
    width: '100%',
    maxWidth: 400,
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
    minHeight: 32,
  },
  label: {
    fontSize: 12,
  },
  forgotBtn: {
    minHeight: 44,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: -6,
  },
  forgotText: {
    fontSize: 12,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderRadius: Radii.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
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
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as never } : {}),
  },
  eyeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quietNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedbackNoteText: {
    fontSize: 13,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 22,
    minHeight: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  guestText: {
    fontSize: 14,
  },
  otpWrap: {
    gap: 10,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backIconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconSpacer: {
    width: 44,
    height: 44,
  },
  otpTitle: {
    flex: 1,
    fontSize: 20,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  otpActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  singleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  otpActionBtn: {
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpActionLink: {
    fontSize: 13,
  },
});
