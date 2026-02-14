/**
 * Auth screen design tokens – pixel-perfect match to provided UI.
 * Banner: very dark blue/black + grid; form: white; inputs: light grey; links: blue.
 */
export const AUTH_COLORS = {
  /** Auth banner background (very dark blue/black) */
  bannerBg: '#1F2937',
  /** Primary CTA (Login, Create Account button) – dark blue/teal */
  primary: '#1E4A6F',
  primaryDark: '#163a5c',
  white: '#FFFFFF',
  /** Form / content area background */
  formBg: '#FFFFFF',
  formBgAlt: '#F9FAFB',
  /** Input field background */
  inputBg: '#F3F4F6',
  /** Input border */
  inputBorder: '#D1D5DB',
  /** Placeholder text and icons in inputs */
  inputPlaceholder: '#6B7280',
  /** Main body text (intro, labels) */
  textPrimary: '#111827',
  /** Secondary text (Remember me, footer) */
  textSecondary: '#374151',
  /** "Forget Password?" link – blue */
  link: '##000000',
  /** Separator lines and "or" text */
  separator: '#6B7280',
  /** Google button border */
  googleBorder: '#D1D5DB',
  /** Google button text – black */
  googleText: '#000000',
} as const;

export const AUTH_SPACING = {
  bannerPaddingH: 24,
  bannerPaddingV: 28,
  contentPaddingH: 15,
  contentPaddingV: 20,
  inputHeight: 52,
  /** Pill-shaped inputs and buttons */
  inputBorderRadius: 16,
  buttonBorderRadius: 16,
  buttonHeight: 52,
  gapInputs: 14,
  gapSection: 24,
} as const;

export const AUTH_TYPO = {
  bannerTitle: 24,
  bannerSubtitle: 14,
  body: 15,
  bodySmall: 14,
  label: 14,
  button: 16,
} as const;
