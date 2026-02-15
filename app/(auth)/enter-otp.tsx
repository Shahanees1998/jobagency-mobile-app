import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DIGITS = 4;
const RESEND_COOLDOWN_SEC = 60;

const KEYPAD_ROWS: (string | 'back')[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'back'],
];

const KEY_LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

export default function EnterOtpScreen() {
  const TEST_IMMEDIATE_NAV = true; // set true to bypass verification for quick testing
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
    if (TEST_IMMEDIATE_NAV) {
      router.push({ pathname: '/(auth)/reset-password', params: { email, token: otpString } });
      return;
    }
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
          {resendSec > 0 ? (
            <>You can resend the code in <Text style={styles.countdownNumber}>{resendSec}</Text> seconds</>
          ) : (
            'You can resend the code now'
          )}
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
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, (otpString.length !== DIGITS || loading) && styles.primaryBtnDisabled]}
        onPress={handleVerify}
        disabled={otpString.length !== DIGITS || loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>
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
                ) : key === '' ? null : (
                  <>
                    <Text style={styles.keypadKeyText}>{key}</Text>
                    {KEY_LETTERS[key as string] ? (
                      <Text style={styles.keypadLetters}>{KEY_LETTERS[key as string]}</Text>
                    ) : null}
                  </>
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
    paddingHorizontal: AUTH_SPACING.contentPaddingH,
    paddingTop: 16,
    alignItems: 'flex-start',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AUTH_COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'left',
  },
  description: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    textAlign: 'left',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  boxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
  },
  box: {
    width: 72,
    height: 52,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: { borderColor: AUTH_COLORS.primary },
  boxFilled: { borderColor: AUTH_COLORS.primary },
  boxText: {
    fontFamily: 'Kanit_500Medium',
    fontSize: 24,
    fontWeight: '500',
    color: AUTH_COLORS.textPrimary,
  },
  countdown: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    marginBottom: 8,
    alignSelf: 'center',
  },
  countdownNumber: {
    color: '#72A4BF',
  },
  resendWrap: { marginBottom: 24, alignSelf: 'center' },
  resendText: {
    fontFamily: 'Kanit_400Regular',
    fontSize: 18,
    fontWeight: '400',
    color: AUTH_COLORS.link,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  resendDisabled: { color: AUTH_COLORS.inputPlaceholder },
  keypad: {
    marginTop: 'auto',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#939393',
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
    borderRadius: 8,
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
  keypadLetters: {
    fontSize: 12,
    color: AUTH_COLORS.textSecondary,
    marginTop: 4,
  },
  primaryBtn: {
    width: '90%',
    maxWidth: 420,
    height: 56,
    borderRadius: 56,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontFamily: 'Kanit_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
