import { AuthInput, PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { AUTH_SPACING } from '@/constants/authTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.customHeader, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change password</Text>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { showDialog } = useDialog();
  const insets = useSafeAreaInsets();
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
        // Navigate to the success screen
        router.push('/password-changed');
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
    <View style={styles.container}>
      <CustomHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          title="Update password"
          onPress={handleChangePassword}
          loading={loading}
          showArrow={false}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  content: {
    padding: APP_SPACING.screenPadding,
    paddingTop: 24,
    paddingBottom: 100, // Space for the footer
  },
  customHeader: {

  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.surfaceGray,
  },
  button: {
    width: '100%',
  },
});
