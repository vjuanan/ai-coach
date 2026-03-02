export const MAX_NUMERIC_DIGITS = 2;

export function sanitizeDigits(value: string, maxDigits = MAX_NUMERIC_DIGITS): string {
    return value.replace(/\D/g, '').slice(0, maxDigits);
}

export function normalizeNumericInputValue(
    value: string | number | null | undefined,
    maxDigits = MAX_NUMERIC_DIGITS
): string {
    if (value === null || value === undefined) return '';
    return sanitizeDigits(String(value), maxDigits);
}

export function toNumberOrNull(value: string, maxDigits = MAX_NUMERIC_DIGITS): number | null {
    const sanitized = sanitizeDigits(value, maxDigits);
    if (!sanitized) return null;
    return Number.parseInt(sanitized, 10);
}

export function toNumberOrEmpty(value: string, maxDigits = MAX_NUMERIC_DIGITS): number | '' {
    const sanitized = sanitizeDigits(value, maxDigits);
    if (!sanitized) return '';
    return Number.parseInt(sanitized, 10);
}
