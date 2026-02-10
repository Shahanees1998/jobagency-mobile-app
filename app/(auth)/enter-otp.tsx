import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DIGITS = 6;
const RESEND_COOLDOWN_SEC = 60;

const KEYPAD_ROWS: (string | 'back')[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'back'],
];

export default function EnterOtpScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { showDialog } = useDialog();
  const [otp, setOtp] = useState<string[]>(Array(DIGITS).fill(''));
  const [focusIndex, setFocusIndex] = useState(0);
  const [resendSec, setResendSec] = useState(RESEND_COOLDOWN_SEC);
  const [loading, setLoading] = useState(false);

  const otpString = otp.join('');

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSec]);

  const setDigit = useCallback((index: number, value: string) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (index < DIGITS - 1) setFocusIndex(index + 1);
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'back') {
        const idx = otp.some((d) => d === '') ? otp.findIndex((d) => d === '') - 1 : DIGITS - 1;
        const i = Math.max(0, idx);
        setOtp((prev) => {
          const next = [...prev];
          next[i] = '';
          return next;
        });
        setFocusIndex(i);
        return;
      }
      if (key === '') return;
      const i = otp.findIndex((d) => d === '');
      if (i === -1) return;
      setDigit(i, key);
    },
    [otp, setDigit]
  );

  const handleVerify = async () => {
    if (otpString.length !== DIGITS) return;
    setLoading(true);
    try {
      const response = await apiClient.verifyOTP(email, otpString);
      if (response.success) {
        const token = (response as { data?: { token?: string } }).data?.token ?? otpString;
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email, token },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Invalid OTP', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      showDialog({ title: 'Error', message: e instanceof Error ? e.message : 'Verification failed', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSec > 0) return;
    try {
      const response = await apiClient.forgotPassword(email);
      if (response.success) {
        const debugOtp = (response.data as any)?.debugOtp;
        if (debugOtp) {
          showDialog({
            title: 'OTP (testing)',
            message: `Use this OTP:\n\n${debugOtp}`,
            primaryButton: { text: 'OK' },
          });
        }
        setResendSec(RESEND_COOLDOWN_SEC);
        setOtp(Array(DIGITS).fill(''));
        setFocusIndex(0);
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to resend code', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      showDialog({ title: 'Error', message: e instanceof Error ? e.message : 'Failed to resend', primaryButton: { text: 'OK' } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={AUTH_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP code</Text>
        <Text style={styles.description}>
          We have sent a OTP code to your email. Please enter it below to verify your account.
        </Text>
        <View style={styles.boxRow}>
          {Array.from({ length: DIGITS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.box,
                focusIndex === i && styles.boxFocused,
                otp[i] !== '' && styles.boxFilled,
              ]}
            >
              <Text style={styles.boxText}>{otp[i] || ''}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.countdown}>
          {resendSec > 0
            ? `You can resend the code in ${resendSec} seconds`
            : 'You can resend the code now'}
        </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendSec > 0}
          style={styles.resendWrap}
        >
          <Text
            style={[
              styles.resendText,
              resendSec > 0 && styles.resendDisabled,
            ]}
          >
            Resend code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, (otpString.length !== DIGITS || loading) && styles.primaryBtnDisabled]}
          onPress={handleVerify}
          disabled={otpString.length !== DIGITS || loading}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keypadRow}>
            {row.map((key, colIdx) => (
              <TouchableOpacity
                key={colIdx}
                style={[styles.keypadKey, key === '' && styles.keypadKeyEmpty]}
                onPress={() => key !== '' && handleKey(key)}
                disabled={key === ''}
              >
                {key === 'back' ? (
                  <Ionicons name="backspace-outline" size={24} color={AUTH_COLORS.textPrimary} />
                ) : (
                  <Text style={styles.keypadKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AUTH_COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: { padding: 4 },
  content: {
    paddingHorizontal: AUTH_SPACING.contentPaddingH + 8,
    paddingTop: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AUTH_COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  boxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: AUTH_COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: { borderColor: AUTH_COLORS.primary },
  boxFilled: { borderColor: AUTH_COLORS.primary },
  boxText: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.textPrimary,
  },
  countdown: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    marginBottom: 8,
  },
  resendWrap: { marginBottom: 24 },
  resendText: {
    fontSize: AUTH_TYPO.body,
    color: AUTH_COLORS.link,
    fontWeight: '600',
  },
  resendDisabled: { color: AUTH_COLORS.inputPlaceholder },
  primaryBtn: {
    width: '100%',
    height: AUTH_SPACING.buttonHeight,
    borderRadius: AUTH_SPACING.buttonBorderRadius,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontSize: AUTH_TYPO.button,
    fontWeight: '600',
    color: AUTH_COLORS.white,
  },
  keypad: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  keypadKey: {
    width: 72,
    height: 52,
    borderRadius: 12,
    backgroundColor: AUTH_COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyEmpty: { backgroundColor: 'transparent' },
  keypadKeyText: {
    fontSize: 22,
    fontWeight: '600',
    color: AUTH_COLORS.textPrimary,
  },
});
