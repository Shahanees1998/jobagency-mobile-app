import { AuthInput, PrimaryButton } from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const { email = '', token = '' } = useLocalSearchParams<{ email?: string; token?: string }>();
  const { showDialog } = useDialog();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!password.trim()) {
      showDialog({ title: 'Error', message: 'Please enter a new password', primaryButton: { text: 'OK' } });
      return;
    }
    if (password !== confirm) {
      showDialog({ title: 'Error', message: 'Passwords do not match', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.resetPassword(token || '', password);
      if (response.success) {
        router.replace({ pathname: '/(auth)/reset-password-success' });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to reset password', primaryButton: { text: 'OK' } });
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
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.description}>
              Choose Password different from older one.
            </Text>
            <AuthInput
              icon="password"
              placeholder="Create new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              isPassword
              containerStyle={styles.input}
            />
            <AuthInput
              icon="password"
              placeholder="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              isPassword
              containerStyle={styles.input}
            />
            <PrimaryButton
              title="Save new password"
              onPress={handleSave}
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
  safe: { flex: 1, backgroundColor: AUTH_COLORS.white },
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
  logoWrap: { marginBottom: 24 },
  logo: { width: 64, height: 64 },
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
    marginBottom: AUTH_SPACING.gapSection,
    textAlign: 'center',
  },
  input: { width: '100%', marginBottom: AUTH_SPACING.gapInputs },
  primaryBtn: { width: '100%', marginTop: 8 },
});
