/**
 * Normalizes phone numbers to standard E.164 digits-only format.
 * Defaults to India (+91) if 10 digits provided.
 * Strips all non-digit characters.
 */
export const normalizePhone = (input) => {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove all non-numeric characters
  const digits = input.replace(/\D/g, '');

  // If 10 digits starting with 6, 7, 8, or 9 (standard Indian mobile)
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  // If 12 digits starting with 91 followed by valid 10-digit mobile
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  // If 11-15 standard international digits (E.164 without plus)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
};

export const isValidPhone = (input) => {
  const normalized = normalizePhone(input);
  return Boolean(normalized && normalized.length >= 10 && normalized.length <= 15);
};
