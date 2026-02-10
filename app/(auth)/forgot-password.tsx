import { AuthInput, PrimaryButton } from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOCK_ICON_BG = '#E8F4FC';
const FORGOT_DESCRIPTION =
  "Don't worry. We've got you covered. Enter your email address and we'll send you an OTP code to reset your password.";

export default function ForgotPasswordScreen() {
  const { showDialog } = useDialog();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showDialog({ title: 'Error', message: 'Please enter your email address', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.forgotPassword(email.trim());
      if (response.success) {
        const debugOtp = (response.data as any)?.debugOtp;
        if (debugOtp) {
          showDialog({
            title: 'OTP (testing)',
            message: `Email delivery is not configured. Use this OTP to reset password:\n\n${debugOtp}`,
            primaryButton: { text: 'Continue', onPress: () => router.push({ pathname: '/(auth)/otp-sent', params: { email: email.trim() } }) },
          });
        } else {
          router.push({ pathname: '/(auth)/otp-sent', params: { email: email.trim() } });
        }
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to send OTP', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      showDialog({ title: 'Error', message: e instanceof Error ? e.message : 'An error occurred', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={56}
                color={AUTH_COLORS.primary}
              />
            </View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.description}>{FORGOT_DESCRIPTION}</Text>
            <AuthInput
              icon="email"
              placeholder="Enter Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.input}
            />
            <PrimaryButton
              title="Send OTP code"
              onPress={handleSendOTP}
              loading={loading}
              showArrow={false}
              style={styles.primaryBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  keyboard: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_SPACING.contentPaddingH + 8,
    paddingTop: 40,
    paddingBottom: AUTH_SPACING.contentPaddingV * 2,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LOCK_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: AUTH_SPACING.gapSection,
    paddingHorizontal: 8,
  },
  input: {
    width: '100%',
    marginBottom: AUTH_SPACING.gapSection,
  },
  primaryBtn: { width: '100%' },
});
