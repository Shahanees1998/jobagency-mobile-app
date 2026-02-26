import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DIGITS = 6;
const RESEND_COOLDOWN_SEC = 60;

export default function EnterOtpScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { showDialog } = useDialog();
  const [otpValue, setOtpValue] = useState('');
  const [resendSec, setResendSec] = useState(RESEND_COOLDOWN_SEC);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const rawDigits = otpValue.replace(/\D/g, '').slice(0, DIGITS);
  const otpString = rawDigits.length === DIGITS ? rawDigits : '';
  const otpArray = rawDigits.split('').concat(Array(Math.max(0, DIGITS - rawDigits.length)).fill(''));

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSec]);

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, DIGITS);
    setOtpValue(cleaned);
  };

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
        setOtpValue('');
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to resend code', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      showDialog({ title: 'Error', message: e instanceof Error ? e.message : 'Failed to resend', primaryButton: { text: 'OK' } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={AUTH_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Enter OTP code</Text>
          <Text style={styles.description}>
            We have sent an OTP code to your email. Enter it below to verify your account.
          </Text>
          <TouchableOpacity
            style={styles.boxRow}
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
          >
            {Array.from({ length: DIGITS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.box,
                  otpArray[i] !== '' && styles.boxFilled,
                ]}
              >
                <Text style={styles.boxText}>{otpArray[i] || ''}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otpValue}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={DIGITS}
              autoFocus
              accessibilityLabel="OTP code input"
            />
          </TouchableOpacity>
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
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: AUTH_COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  keyboardAvoid: { flex: 1 },
  boxRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'nowrap',
    justifyContent: 'center',
    position: 'relative',
  },
  box: {
    width: 40,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: AUTH_COLORS.primary },
  boxText: {
    fontFamily: 'Kanit_500Medium',
    fontSize: 18,
    fontWeight: '600',
    color: AUTH_COLORS.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
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
    fontSize: 14,
    fontWeight: '400',
    color: AUTH_COLORS.link,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  resendDisabled: { color: AUTH_COLORS.inputPlaceholder },
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
    marginTop: 42,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontFamily: 'Kanit_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
