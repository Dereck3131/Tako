export const MAX_AMOUNT_CENTS = 999_999_999; // ₱9,999,999.99

/**
 * Strips currency symbols, commas, and whitespace from user input,
 * returning a strict centavo integer or a specific human-readable error.
 */
export function parsePesoToCents(
  raw: string,
  options: { allowZero?: boolean; fieldLabel?: string } = {}
): { ok: true; cents: number } | { ok: false; error: string } {
  const { allowZero = false } = options;
  const trimmed = raw.trim();

  if (!trimmed) {
    return allowZero
      ? { ok: true, cents: 0 }
      : { ok: false, error: 'Enter an amount greater than ₱0.' };
  }

  if (/[eE]/.test(trimmed)) {
    return { ok: false, error: 'Enter a standard peso amount (no scientific notation).' };
  }

  if (trimmed.startsWith('-') || /-/.test(trimmed)) {
    return { ok: false, error: 'Amount cannot be negative.' };
  }

  // Strip ₱, commas, and spaces
  const cleaned = trimmed.replace(/[₱,\s]/g, '');

  if (!cleaned) {
    return allowZero
      ? { ok: true, cents: 0 }
      : { ok: false, error: 'Enter an amount greater than ₱0.' };
  }

  if (!/^\d+(\.\d*)?$/.test(cleaned)) {
    return { ok: false, error: 'Enter a valid number (e.g. 1,200.50).' };
  }

  const [intPart, decPart = ''] = cleaned.split('.');
  if (decPart.length > 2) {
    return { ok: false, error: 'Use at most 2 decimal places (centavos).' };
  }

  const whole = Number.parseInt(intPart, 10);
  const frac = Number.parseInt(decPart.padEnd(2, '0'), 10);
  const cents = whole * 100 + frac;

  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: 'Maximum amount is ₱9,999,999.99.' };
  }

  if (!allowZero && cents <= 0) {
    return { ok: false, error: 'Enter an amount greater than ₱0.' };
  }

  return { ok: true, cents };
}

/**
 * Hard input filter for peso text inputs:
 * - Digits and a single decimal point only
 * - Max 2 decimal places
 * - Strips leading zeros ("007" -> "7", preserves "0." and "0.5")
 */
export function sanitizeAmountInput(raw: string): string {
  const noSymbols = raw.replace(/[₱,\s]/g, '');
  let out = '';
  let seenDot = false;
  let decCount = 0;

  for (const ch of noSymbols) {
    if (ch >= '0' && ch <= '9') {
      if (seenDot) {
        if (decCount >= 2) continue;
        decCount += 1;
      }
      out += ch;
    } else if (ch === '.' && !seenDot) {
      seenDot = true;
      out += out.length === 0 ? '0.' : '.';
    }
  }

  if (!out) return '';

  const [intPart, decPart] = out.split('.');
  const normalizedInt = intPart.replace(/^0+(?=\d)/, '');
  return decPart !== undefined ? `${normalizedInt}.${decPart}` : normalizedInt;
}

/**
 * Formats a sanitized numeric string with grouping commas for display while typing.
 */
export function formatAmountDisplay(raw: string): string {
  if (!raw) return '';
  const sanitized = sanitizeAmountInput(raw);
  if (!sanitized) return '';
  const [intPart, decPart] = sanitized.split('.');
  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : '0';
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

/**
 * Always formats integer centavos with 2 decimal places: ₱1,200.00
 */
export function formatPesoExact(cents: number): string {
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? '-' : ''}₱${formatted}`;
}
