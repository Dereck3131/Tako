import { z } from 'zod';

import { MAX_AMOUNT_CENTS, parsePesoToCents } from './money';

export const MAX_GROUP_MEMBERS = 20;

/**
 * Strips ASCII control characters, collapses repeated whitespace, and trims.
 */
export function sanitizeText(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const emailSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Enter a valid email address.')
      .max(254, 'Email must be 254 characters or fewer.')
      .email('Enter a valid email address.')
  );

export const signInPasswordSchema = z
  .string()
  .min(1, 'Enter your password.')
  .max(72, 'Password must be 72 characters or fewer.');

export const signUpPasswordSchema = z
  .string()
  .min(8, 'Use 8+ characters with at least one letter and one number.')
  .max(72, 'Password must be 72 characters or fewer.')
  .refine((val) => /[a-zA-Z]/.test(val) && /\d/.test(val), {
    message: 'Use 8+ characters with at least one letter and one number.',
  });

export function getPasswordStrengthHint(password: string): {
  label: string;
  tone: 'weak' | 'fair' | 'strong';
} | null {
  if (!password) return null;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (password.length >= 10 && hasLetter && hasNumber) {
    return { label: 'Strong password', tone: 'strong' };
  }
  if (password.length >= 8 && hasLetter && hasNumber) {
    return { label: 'Good password', tone: 'fair' };
  }
  return { label: '8+ characters with a letter and a number', tone: 'weak' };
}

/**
 * Strips spaces, dashes, and any non-digit characters on paste/input and clamps to 6 digits.
 */
export function normalizeOtpCode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6);
}

/**
 * Applies a single-digit or pasted multi-digit input at box `index` (0..5) of a 6-digit OTP.
 */
export function applyOtpBoxInput(
  currentCode: string,
  index: number,
  rawText: string
): {
  code: string;
  nextFocusIndex: number;
  isComplete: boolean;
} {
  const digits = rawText.replace(/\D/g, '');
  const slots = Array.from({ length: 6 }, (_, i) => currentCode[i] ?? '');

  if (!digits) {
    slots[index] = '';
    const nextCode = slots.join('');
    return {
      code: nextCode,
      nextFocusIndex: index,
      isComplete: nextCode.length === 6 && /^\d{6}$/.test(nextCode),
    };
  }

  // Multi-digit paste: if 6+ digits pasted anywhere, fill from box 0; otherwise fill from `index`
  if (digits.length >= 6) {
    const code = digits.slice(0, 6);
    return {
      code,
      nextFocusIndex: 5,
      isComplete: true,
    };
  }

  let writeIdx = index;
  for (const ch of digits) {
    if (writeIdx > 5) break;
    slots[writeIdx] = ch;
    writeIdx += 1;
  }

  const nextCode = slots.join('');
  const nextFocusIndex = Math.min(5, Math.max(index + digits.length, 0));
  return {
    code: nextCode,
    nextFocusIndex,
    isComplete: nextCode.length === 6 && /^\d{6}$/.test(nextCode),
  };
}

export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const MAX_OTP_RESENDS = 3;

export function getResendStatus(
  resendSeconds: number,
  resendCount: number
): {
  canResend: boolean;
  exhausted: boolean;
  label: string;
} {
  if (resendCount >= MAX_OTP_RESENDS) {
    return {
      canResend: false,
      exhausted: true,
      label: 'Max resends reached',
    };
  }
  if (resendSeconds > 0) {
    return {
      canResend: false,
      exhausted: false,
      label: `Resend in ${resendSeconds}s`,
    };
  }
  return {
    canResend: true,
    exhausted: false,
    label: 'Resend code',
  };
}

export function mapResetOtpError(rawMessage: string): {
  target: 'code' | 'password' | 'form';
  message: string;
} {
  const msg = rawMessage.trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('internet') ||
    lower.includes('functionsfetcherror')
  ) {
    return {
      target: 'form',
      message: 'Connection error. Check your internet and try again.',
    };
  }

  if (
    lower.includes('same_password') ||
    lower.includes('different from the old password') ||
    lower.includes('different from your current password')
  ) {
    return {
      target: 'password',
      message: 'New password must be different from your current password.',
    };
  }

  if (lower.includes('too many') || lower.includes('rate limit') || lower.includes('attempt')) {
    return {
      target: 'code',
      message: 'Too many incorrect attempts. Request a new code to continue.',
    };
  }

  if (lower.includes('wait ') && lower.includes('before requesting another code')) {
    return {
      target: 'code',
      message: msg,
    };
  }

  if (
    lower.includes('this code has expired') ||
    (lower.includes('expired') && !lower.includes('or is invalid'))
  ) {
    return {
      target: 'code',
      message: 'This code has expired. Tap "Resend code" for a new one.',
    };
  }

  if (
    lower.includes('token has expired or is invalid') ||
    lower.includes('invalid') ||
    lower.includes('incorrect') ||
    lower.includes('no verification code') ||
    lower.includes('otp')
  ) {
    return {
      target: 'code',
      message: "That code didn't work. Check your email and try again.",
    };
  }

  return {
    target: 'form',
    message: 'Something went wrong. Please try again.',
  };
}

export const otpCodeSchema = z
  .string()
  .transform(normalizeOtpCode)
  .pipe(
    z
      .string()
      .regex(/^\d{6}$/, 'Enter the 6-digit reset code.')
  );

export const authSignInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export const authSignUpSchema = z
  .object({
    displayName: z
      .string()
      .transform(sanitizeText)
      .pipe(
        z
          .string()
          .min(1, 'Display name must be 1–30 characters.')
          .max(30, 'Display name must be 1–30 characters.')
      ),
    email: emailSchema,
    password: signUpPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  });

export const resetNewPasswordSchema = z
  .object({
    password: signUpPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  });

export const authPasswordResetSchema = z
  .object({
    email: emailSchema,
    code: otpCodeSchema,
    password: signUpPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  });

export const splitNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Enter a name for this split (1–40 characters).')
      .max(40, 'Enter a name for this split (1–40 characters).')
  );

export const memberNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Enter a name (1–30 characters).')
      .max(30, 'Enter a name (1–30 characters).')
  );

export const profileNameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(
    z
      .string()
      .min(1, 'Display name must be 1–30 characters.')
      .max(30, 'Display name must be 1–30 characters.')
  );

export function validateNewMemberName(
  rawName: string,
  existingNames: string[]
): { ok: true; name: string } | { ok: false; error: string } {
  if (existingNames.length >= MAX_GROUP_MEMBERS) {
    return { ok: false, error: `You can add up to ${MAX_GROUP_MEMBERS} people per split.` };
  }
  const parsed = memberNameSchema.safeParse(rawName);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Enter a name (1–30 characters).' };
  }
  const normalized = parsed.data.toLowerCase();
  const duplicate = existingNames.some((n) => sanitizeText(n).toLowerCase() === normalized);
  if (duplicate) {
    return { ok: false, error: `${parsed.data} is already in this split.` };
  }
  return { ok: true, name: parsed.data };
}

export const receiptItemSchema = z.object({
  name: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, 'Enter an item name (1–40 characters).')
        .max(40, 'Enter an item name (1–40 characters).')
    ),
  qty: z
    .number()
    .int('Quantity must be between 1 and 99.')
    .min(1, 'Quantity must be between 1 and 99.')
    .max(99, 'Quantity must be between 1 and 99.'),
  unitCents: z
    .number()
    .int()
    .min(1, 'Enter an amount greater than ₱0.')
    .max(MAX_AMOUNT_CENTS, 'Maximum amount is ₱9,999,999.99.'),
});

export function validateCustomAmountsSum(
  totalCents: number,
  memberAmountsCents: number[]
): { ok: true } | { ok: false; diffCents: number; error: string } {
  for (const c of memberAmountsCents) {
    if (!Number.isInteger(c) || c < 0) {
      return { ok: false, diffCents: totalCents, error: 'Enter an amount of ₱0 or more.' };
    }
  }
  const sum = memberAmountsCents.reduce((a, b) => a + b, 0);
  const diffCents = totalCents - sum;
  if (diffCents !== 0) {
    const absText = `₱${(Math.abs(diffCents) / 100).toLocaleString('en-PH', {
      minimumFractionDigits: Math.abs(diffCents) % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
    return {
      ok: false,
      diffCents,
      error:
        diffCents > 0
          ? `${absText} left to assign`
          : `${absText} over the bill total`,
    };
  }
  return { ok: true };
}

export function validateItemsTargetMismatch(
  itemsTotalCents: number,
  targetBillCents: number
): { hasMismatch: boolean; diffCents: number } {
  if (targetBillCents <= 0 || itemsTotalCents <= 0) {
    return { hasMismatch: false, diffCents: 0 };
  }
  const diffCents = itemsTotalCents - targetBillCents;
  return { hasMismatch: diffCents !== 0, diffCents };
}

export const VALID_CATEGORIES = ['food', 'drinks', 'ride', 'stay', 'other'] as const;

export const addExpenseSchema = z.object({
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, 'Enter a description (1–40 characters).')
        .max(40, 'Enter a description (1–40 characters).')
    ),
  amountCents: z
    .number()
    .int()
    .min(1, 'Enter an amount greater than ₱0.')
    .max(MAX_AMOUNT_CENTS, 'Maximum amount is ₱9,999,999.99.'),
  category: z.enum(VALID_CATEGORIES),
  paidById: z.string().min(1, 'Select who paid.'),
  splitType: z.enum(['equal', 'exact']),
});

/**
 * Normalizes a QR payload, deep link, or typed code to 6 uppercase alphanumeric chars.
 */
export function normalizeInviteCode(raw: string): {
  ok: true;
  code: string;
  formatted: string;
} | {
  ok: false;
  reason: 'non_tako_qr' | 'invalid_format';
  error: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: 'invalid_format',
      error: 'Enter a 6-character Tako code (e.g. TAKO-4821AB).',
    };
  }

  // If it looks like a URL or deep link that isn't a Tako join link
  if (/^https?:\/\//i.test(trimmed) && !/(?:tako|join\/|code=)/i.test(trimmed)) {
    return {
      ok: false,
      reason: 'non_tako_qr',
      error: "This QR code isn't a Tako invite.",
    };
  }

  const urlMatch = trimmed.match(/(?:join\/|code=)([A-Za-z0-9-]+)/i);
  const candidate = (urlMatch ? urlMatch[1] : trimmed)
    .replace(/^TAKO[-_\s]?/i, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(candidate)) {
    return {
      ok: false,
      reason: 'invalid_format',
      error: 'Enter a 6-character Tako code (e.g. TAKO-4821AB).',
    };
  }

  return {
    ok: true,
    code: candidate,
    formatted: `TAKO-${candidate}`,
  };
}

export function parseAndValidateAmount(
  raw: string,
  options: { allowZero?: boolean } = {}
) {
  return parsePesoToCents(raw, options);
}
