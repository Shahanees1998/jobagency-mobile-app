/**
 * Normalize employer logo/banner URI for React Native Image.
 * API may return full data URL (data:image/...;base64,...) or raw base64.
 */
export function imageUriForDisplay(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `data:image/png;base64,${s}`;
}
