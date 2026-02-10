import { AuthInput, PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { AUTH_SPACING } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const { showDialog } = useDialog();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showDialog({ title: 'Error', message: 'Please fill in all fields', primaryButton: { text: 'OK' } });
      return;
    }
    if (newPassword !== confirmPassword) {
      showDialog({ title: 'Error', message: 'New passwords do not match', primaryButton: { text: 'OK' } });
      return;
    }
    if (newPassword.length < 6) {
      showDialog({ title: 'Error', message: 'Password must be at least 6 characters', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      if (response.success) {
        showDialog({
          title: 'Success',
          message: 'Password updated successfully. For your security, please use this new password for future logins.',
          primaryButton: { text: 'Ok, Great!', onPress: () => router.back() },
        });
      } else {
        showDialog({
          title: 'Error',
          message: response.error || 'Failed to change password',
          primaryButton: { text: 'OK' },
        });
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error.message || 'Failed to change password',
        primaryButton: { text: 'OK' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Update password</Text>
        <Text style={styles.subtitle}>Choose Password different from older one.</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Current password</Text>
          <AuthInput
            icon="password"
            placeholder="Enter password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            isPassword
            containerStyle={styles.input}
          />
          <Text style={styles.label}>New password</Text>
          <AuthInput
            icon="password"
            placeholder="Enter password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            containerStyle={styles.input}
          />
          <Text style={styles.label}>Confirm new password</Text>
          <AuthInput
            icon="password"
            placeholder="Enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            containerStyle={styles.input}
          />
          <PrimaryButton
            title="Update password"
            onPress={handleChangePassword}
            loading={loading}
            showArrow={false}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1 },
  content: {
    padding: APP_SPACING.screenPadding,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: APP_COLORS.textMuted,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    marginBottom: AUTH_SPACING.gapInputs,
  },
  button: {
    marginTop: 24,
    width: '100%',
    alignSelf: 'stretch',
  },
});
