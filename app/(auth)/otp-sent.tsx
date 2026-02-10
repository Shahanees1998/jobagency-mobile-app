import { PrimaryButton } from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CHECK_ICON_BG = '#E8F4FC';

export default function OtpSentScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();

  const handleEnterOTP = () => {
    router.push({ pathname: '/(auth)/enter-otp', params: { email } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={AUTH_COLORS.primary}
          />
        </View>
        <Text style={styles.title}>OTP sent successfully!</Text>
        <Text style={styles.description}>
          We've sent a one-time password (OTP) to your email. Please check your inbox (and spam folder) to complete the verification process.
        </Text>
        <PrimaryButton
          title="Enter OTP"
          onPress={handleEnterOTP}
          showArrow={false}
          style={styles.primaryBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: AUTH_SPACING.contentPaddingH + 8,
    paddingTop: 48,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: CHECK_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
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
    marginBottom: AUTH_SPACING.gapSection * 2,
    paddingHorizontal: 8,
  },
  primaryBtn: { width: '100%' },
});
