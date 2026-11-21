/**
 * Input sanitization and CSV export escaping helpers to guard against XSS and formula injection.
 */

const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG_REGEX = /<\/?[a-zA-Z][^>]*>/g;
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

/**
 * Strips control characters and embedded HTML tags from user-supplied plain text
 * while preserving ordinary punctuation and newlines.
 */
export function sanitizePlainText(input: string): string {
  return input
    .replace(CONTROL_CHAR_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .trim();
}

/**
 * Escapes a CSV cell per RFC 4180 and neutralizes spreadsheet formula injection
 * (`=`, `+`, `-`, `@`, tab, CR prefixes).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = FORMULA_PREFIX_REGEX.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
