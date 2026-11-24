/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAmountDisplay,
  formatPesoExact,
  MAX_AMOUNT_CENTS,
  parsePesoToCents,
  sanitizeAmountInput,
} from '../money';
import { splitEqually } from '../split';
import {
  applyOtpBoxInput,
  authPasswordResetSchema,
  authSignUpSchema,
  getPasswordStrengthHint,
  getResendStatus,
  mapResetOtpError,
  MAX_GROUP_MEMBERS,
  MAX_OTP_RESENDS,
  normalizeInviteCode,
  normalizeOtpCode,
  OTP_RESEND_COOLDOWN_SECONDS,
  otpCodeSchema,
  resetNewPasswordSchema,
  splitNameSchema,
  validateCustomAmountsSum,
  validateItemsTargetMismatch,
  validateNewMemberName,
} from '../validation';

test('parsePesoToCents handles edge cases accurately', () => {
  assert.deepEqual(parsePesoToCents('0', { allowZero: true }), { ok: true, cents: 0 });
  assert.equal(parsePesoToCents('0', { allowZero: false }).ok, false);
  assert.deepEqual(parsePesoToCents('0.01'), { ok: true, cents: 1 });
  assert.deepEqual(parsePesoToCents('9999999.99'), { ok: true, cents: MAX_AMOUNT_CENTS });
  assert.equal(parsePesoToCents('10000000').ok, false);
  assert.deepEqual(parsePesoToCents('1,200'), { ok: true, cents: 120_000 });
  assert.deepEqual(parsePesoToCents('₱1,200.50'), { ok: true, cents: 120_050 });
  assert.equal(parsePesoToCents('1.2.3').ok, false);
  assert.equal(parsePesoToCents('1e5').ok, false);
  assert.equal(parsePesoToCents('-10').ok, false);
  assert.equal(parsePesoToCents('abc').ok, false);
  assert.equal(parsePesoToCents('').ok, false);
  assert.equal(parsePesoToCents('   ').ok, false);
  assert.equal(parsePesoToCents('12.345').ok, false);
});

test('sanitizeAmountInput and formatters behave deterministically', () => {
  assert.equal(sanitizeAmountInput('007'), '7');
  assert.equal(sanitizeAmountInput('00.50'), '0.50');
  assert.equal(sanitizeAmountInput('1.2.3'), '1.23');
  assert.equal(sanitizeAmountInput('₱1,200.509'), '1200.50');
  assert.equal(formatAmountDisplay('1200.5'), '1,200.5');
  assert.equal(formatPesoExact(120_000), '₱1,200.00');
  assert.equal(formatPesoExact(1), '₱0.01');
});

test('splitEqually distributes remainder centavos to first members', () => {
  const shares = splitEqually(10_000, ['a', 'b', 'c']);
  assert.deepEqual(
    shares.map((s) => s.amount_cents),
    [3334, 3333, 3333]
  );
  assert.equal(
    shares.reduce((s, r) => s + r.amount_cents, 0),
    10_000
  );
  assert.deepEqual(splitEqually(500, []), []);
});

test('validateItemsTargetMismatch detects under and over mismatches', () => {
  assert.deepEqual(validateItemsTargetMismatch(90_000, 120_000), {
    hasMismatch: true,
    diffCents: -30_000,
  });
  assert.deepEqual(validateItemsTargetMismatch(130_000, 120_000), {
    hasMismatch: true,
    diffCents: 10_000,
  });
  assert.deepEqual(validateItemsTargetMismatch(120_000, 120_000), {
    hasMismatch: false,
    diffCents: 0,
  });
  assert.deepEqual(validateItemsTargetMismatch(90_000, 0), {
    hasMismatch: false,
    diffCents: 0,
  });
});

test('validateCustomAmountsSum checks exact centavo sum', () => {
  assert.deepEqual(validateCustomAmountsSum(10_000, [3334, 3333, 3333]), { ok: true });
  const under = validateCustomAmountsSum(10_000, [3000, 3000]);
  assert.equal(under.ok, false);
  if (!under.ok) assert.equal(under.diffCents, 4000);

  const over = validateCustomAmountsSum(10_000, [6000, 5000]);
  assert.equal(over.ok, false);
  if (!over.ok) assert.equal(over.diffCents, -1000);

  assert.equal(validateCustomAmountsSum(10_000, [-100, 10_100]).ok, false);
});

test('normalizeInviteCode handles prefixes, missing hyphens, and non-Tako QR', () => {
  const withHyphen = normalizeInviteCode(' tako-ab12cd ');
  assert.deepEqual(withHyphen, { ok: true, code: 'AB12CD', formatted: 'TAKO-AB12CD' });

  const noHyphen = normalizeInviteCode('TAKO4821ab');
  assert.deepEqual(noHyphen, { ok: true, code: '4821AB', formatted: 'TAKO-4821AB' });

  const deepLink = normalizeInviteCode('tako://join/TAKO-99ZZ11');
  assert.deepEqual(deepLink, { ok: true, code: '99ZZ11', formatted: 'TAKO-99ZZ11' });

  const nonTako = normalizeInviteCode('https://google.com/search?q=ramen');
  assert.equal(nonTako.ok, false);
  if (!nonTako.ok) assert.equal(nonTako.reason, 'non_tako_qr');

  const tooShort = normalizeInviteCode('123');
  assert.equal(tooShort.ok, false);
  if (!tooShort.ok) assert.equal(tooShort.reason, 'invalid_format');
});

test('member & split name validation enforces limits, duplicates, emoji, and non-Latin', () => {
  const emojiSplit = splitNameSchema.safeParse('  🍜  Ramen\u0000   Night  ');
  assert.equal(emojiSplit.success, true);
  if (emojiSplit.success) assert.equal(emojiSplit.data, '🍜 Ramen Night');

  const nonLatin = splitNameSchema.safeParse('ラーメン夜');
  assert.equal(nonLatin.success, true);

  assert.equal(splitNameSchema.safeParse('   ').success, false);
  assert.equal(splitNameSchema.safeParse('a'.repeat(41)).success, false);

  assert.equal(validateNewMemberName('mia', ['Alex', 'Mia']).ok, false);
  assert.equal(validateNewMemberName('Mia 🐙', ['Alex']).ok, true);

  const twentyNames = Array.from({ length: MAX_GROUP_MEMBERS }, (_, i) => `P${i}`);
  assert.equal(validateNewMemberName('Extra', twentyNames).ok, false);
});

test('authSignUpSchema enforces 8-char password with letter+number and confirmPassword match', () => {
  assert.equal(
    authSignUpSchema.safeParse({
      displayName: 'Alex',
      email: 'alex@example.com',
      password: 'abc1234',
      confirmPassword: 'abc1234',
    }).success,
    false
  );
  assert.equal(
    authSignUpSchema.safeParse({
      displayName: 'Alex',
      email: 'alex@example.com',
      password: 'password1',
      confirmPassword: 'password2',
    }).success,
    false
  );
  assert.equal(
    authSignUpSchema.safeParse({
      displayName: 'Alex',
      email: 'ALEX@EXAMPLE.COM',
      password: 'password1',
      confirmPassword: 'password1',
    }).success,
    true
  );
});

test('authPasswordResetSchema validates 6-digit code, password rules, and confirm match', () => {
  assert.equal(
    authPasswordResetSchema.safeParse({
      email: 'alex@example.com',
      code: '12345',
      password: 'password1',
      confirmPassword: 'password1',
    }).success,
    false
  );
  assert.equal(
    authPasswordResetSchema.safeParse({
      email: 'alex@example.com',
      code: '123456',
      password: 'password1',
      confirmPassword: 'password2',
    }).success,
    false
  );
  assert.equal(
    authPasswordResetSchema.safeParse({
      email: 'ALEX@EXAMPLE.COM',
      code: '123456',
      password: 'password1',
      confirmPassword: 'password1',
    }).success,
    true
  );
});

test('normalizeOtpCode and applyOtpBoxInput strip spaces/dashes on paste and clamp to 6 digits', () => {
  assert.equal(normalizeOtpCode(' 123-456 '), '123456');
  assert.equal(normalizeOtpCode('12 34 56'), '123456');
  assert.equal(normalizeOtpCode('Code: 987-654-321'), '987654');
  assert.equal(normalizeOtpCode('abc'), '');

  const parsedPasted = otpCodeSchema.safeParse(' 482 - 910 ');
  assert.equal(parsedPasted.success, true);
  if (parsedPasted.success) assert.equal(parsedPasted.data, '482910');

  const parsedShort = otpCodeSchema.safeParse('12-3');
  assert.equal(parsedShort.success, false);
  if (!parsedShort.success) {
    assert.equal(parsedShort.error.issues[0]?.message, 'Enter the 6-digit reset code.');
  }

  // Single digit into box 0 advances focus to box 1
  assert.deepEqual(applyOtpBoxInput('', 0, '5'), {
    code: '5',
    nextFocusIndex: 1,
    isComplete: false,
  });

  // Full 6-digit paste with dashes into box 0 fills all 6 boxes and triggers auto-submit
  assert.deepEqual(applyOtpBoxInput('', 0, '582-914'), {
    code: '582914',
    nextFocusIndex: 5,
    isComplete: true,
  });

  // Typing the 6th digit completes the code
  assert.deepEqual(applyOtpBoxInput('12345', 5, '6'), {
    code: '123456',
    nextFocusIndex: 5,
    isComplete: true,
  });
});

test('resetNewPasswordSchema enforces min 8, max 72, letter+number, and specific mismatch message', () => {
  const tooShort = resetNewPasswordSchema.safeParse({
    password: 'abc12',
    confirmPassword: 'abc12',
  });
  assert.equal(tooShort.success, false);
  if (!tooShort.success) {
    assert.equal(
      tooShort.error.issues[0]?.message,
      'Use 8+ characters with at least one letter and one number.'
    );
  }

  const tooLong = resetNewPasswordSchema.safeParse({
    password: 'a1' + 'b'.repeat(71),
    confirmPassword: 'a1' + 'b'.repeat(71),
  });
  assert.equal(tooLong.success, false);
  if (!tooLong.success) {
    assert.equal(tooLong.error.issues[0]?.message, 'Password must be 72 characters or fewer.');
  }

  const mismatch = resetNewPasswordSchema.safeParse({
    password: 'Password123',
    confirmPassword: 'Password124',
  });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) {
    assert.equal(mismatch.error.issues[0]?.message, "Passwords don't match.");
  }

  const valid = resetNewPasswordSchema.safeParse({
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  assert.equal(valid.success, true);

  assert.deepEqual(getPasswordStrengthHint('abc'), {
    label: '8+ characters with a letter and a number',
    tone: 'weak',
  });
  assert.deepEqual(getPasswordStrengthHint('Passw0rd'), {
    label: 'Good password',
    tone: 'fair',
  });
  assert.deepEqual(getPasswordStrengthHint('Passw0rd99'), {
    label: 'Strong password',
    tone: 'strong',
  });
});

test('getResendStatus enforces cooldown countdown and max resend cap', () => {
  assert.equal(OTP_RESEND_COOLDOWN_SECONDS, 60);
  assert.equal(MAX_OTP_RESENDS, 3);

  assert.deepEqual(getResendStatus(42, 0), {
    canResend: false,
    exhausted: false,
    label: 'Resend in 42s',
  });

  assert.deepEqual(getResendStatus(0, 1), {
    canResend: true,
    exhausted: false,
    label: 'Resend code',
  });

  assert.deepEqual(getResendStatus(0, MAX_OTP_RESENDS), {
    canResend: false,
    exhausted: true,
    label: 'Max resends reached',
  });
});

test('mapResetOtpError returns specific non-enumerating messages for code, expiry, rate limit, and network', () => {
  assert.deepEqual(mapResetOtpError('Token has expired or is invalid'), {
    target: 'code',
    message: "That code didn't work. Check your email and try again.",
  });
  assert.deepEqual(mapResetOtpError('This code has expired'), {
    target: 'code',
    message: 'This code has expired. Tap "Resend code" for a new one.',
  });
  assert.deepEqual(mapResetOtpError('Too many incorrect attempts'), {
    target: 'code',
    message: 'Too many incorrect attempts. Request a new code to continue.',
  });
  assert.deepEqual(mapResetOtpError('New password should be different from the old password.'), {
    target: 'password',
    message: 'New password must be different from your current password.',
  });
  assert.deepEqual(mapResetOtpError('Failed to fetch'), {
    target: 'form',
    message: 'Connection error. Check your internet and try again.',
  });
});
