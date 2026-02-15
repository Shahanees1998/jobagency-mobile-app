import { AuthInput, PrimaryButton } from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOCK_ICON = require('@/assets/images/lock-line.png');

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
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.iconWrap}>
                <Image
                  source={LOCK_ICON}
                  style={styles.lockIcon}
                  resizeMode="contain"
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
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title="Send OTP code"
              onPress={handleSendOTP}
              loading={loading}
              showArrow={false}
              style={styles.primaryBtn}
            />
          </View>
        </View>
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
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_SPACING.contentPaddingH,
    paddingTop: 40,
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
    borderWidth: 1,
    borderColor: '#1E4154',
    backgroundColor: '#72A4BF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockIcon: {
    width: 56,
    height: 56,
  },
  title: {
    fontFamily: 'Kanit_400Regular',
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#031019',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Kanit_300Light',
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 14,
    letterSpacing: 0,
    textAlign: 'center',
    color: AUTH_COLORS.textSecondary,
    marginBottom: AUTH_SPACING.gapSection,
    paddingHorizontal: 16,
  },
  input: {
    width: '100%',
    marginBottom: AUTH_SPACING.gapSection,
  },
  buttonContainer: {
    paddingHorizontal: AUTH_SPACING.contentPaddingH,
    paddingBottom: AUTH_SPACING.contentPaddingV * 2,
    paddingTop: 16,
  },
  primaryBtn: { width: '100%' },
});
