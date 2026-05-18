/**
 * Egyptian mobile phone validation/normalization.
 *
 * Accepts:
 *   - 11 digits starting with 01 followed by 0/1/2/5
 *   - Optional country prefix: +20, 0020, or 20
 *   - Internal spaces / dashes / parentheses are tolerated
 *
 * Examples:
 *   "01012345678"     → valid
 *   "+201012345678"   → valid (normalizes to 01012345678)
 *   "0020 10 1234567" → valid
 *   "01312345678"     → invalid (third digit must be 0,1,2,5)
 */

const EG_MOBILE_RE = /^01[0125]\d{8}$/;

export function normalizePhone(input: string): string {
  if (!input) return "";
  const digits = input.replace(/\D+/g, "");
  if (digits.startsWith("0020")) return "0" + digits.slice(4);
  if (digits.startsWith("002"))  return "0" + digits.slice(3);
  if (digits.startsWith("20") && digits.length === 12) return "0" + digits.slice(2);
  return digits;
}

export function isValidEgyptianMobile(input: string): boolean {
  const n = normalizePhone(input);
  return EG_MOBILE_RE.test(n);
}

/**
 * Validate optional phone — empty string is treated as valid.
 * Returns an Arabic error message if invalid, or null if valid.
 */
export function validatePhoneOptional(input: string | null | undefined): string | null {
  if (!input) return null;
  return isValidEgyptianMobile(input) ? null : "رقم الهاتف غير صالح — يجب أن يبدأ بـ 010/011/012/015 ويتكون من 11 رقمًا";
}

/**
 * Validate required phone. Returns Arabic error message or null.
 */
export function validatePhoneRequired(input: string | null | undefined): string | null {
  if (!input) return "رقم الهاتف مطلوب";
  return isValidEgyptianMobile(input) ? null : "رقم الهاتف غير صالح — يجب أن يبدأ بـ 010/011/012/015 ويتكون من 11 رقمًا";
}

export const PHONE_PLACEHOLDER = "01XXXXXXXXX";
