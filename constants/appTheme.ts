/**
 * App-wide design tokens – matches job portal UI (dark teal primary, light gray surfaces).
 */
export const APP_COLORS = {
  primary: '#1e3a5f',
  primaryDark: '#152a47',
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceGray: '#E6E6E6',
  border: '#D1D5DB',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  link: '##000000',
  danger: '#DC2626',
  success: '#059669',
  avatarBg: '#93C5FD',
} as const;

export const APP_SPACING = {
  screenPadding: 24,
  itemPadding: 16,
  inputHeight: 52,
  borderRadius: 12,
  borderRadiusLg: 16,
} as const;

/** Use with useSafeAreaInsets().bottom for tab screen scroll/list paddingBottom */
export const TAB_BAR = {
  height: 64,
  extraBottom: 32,
} as const;
