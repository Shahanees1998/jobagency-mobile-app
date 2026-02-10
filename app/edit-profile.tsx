import { AuthInput, PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { AUTH_SPACING } from '@/constants/authTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { showDialog } = useDialog();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const justSavedRef = useRef(false);

  useEffect(() => {
    if (!user?.email) return;
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setFullName(name);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setLocation(user.location ?? '');
  }, [user]);

  useEffect(() => {
    const onBack = () => {
      router.navigate('/(tabs)/profile');
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []);

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      showDialog({ title: 'Error', message: 'Name is required', primaryButton: { text: 'OK' } });
      return;
    }
    const [firstName, ...rest] = trimmed.split(/\s+/);
    const lastName = rest.join(' ') || firstName;
    setLoading(true);
    try {
      const response = await apiClient.updateProfile({
        firstName,
        lastName,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
      });
      if (response.success) {
        justSavedRef.current = true;
        setFullName(trimmed);
        setPhone(phone.trim());
        setLocation(location.trim());
        await refreshUser();
        showDialog({
          title: 'Success',
          message: 'Profile updated successfully. Your changes have been saved.',
          primaryButton: {
            text: 'Ok, Great!',
            onPress: () => {
              setTimeout(() => router.navigate('/(tabs)/profile'), 100);
            },
          },
        });
      } else {
        showDialog({
          title: 'Error',
          message: response.error || 'Failed to update profile',
          primaryButton: { text: 'OK' },
        });
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error.message || 'Failed to update profile',
        primaryButton: { text: 'OK' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={44} color={APP_COLORS.primary} />
        </View>
        <Text style={styles.name}>{fullName || 'User'}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
      <View style={styles.form}>
        <AuthInput
          icon="person"
          placeholder="Alexander Fleming"
          value={fullName}
          onChangeText={setFullName}
          containerStyle={styles.input}
        />
        <AuthInput
          icon="email"
          placeholder="alexanderfleming@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
          containerStyle={styles.input}
        />
        <AuthInput
          icon="phone"
          placeholder="+1 234-576-7890"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerStyle={styles.input}
        />
        <AuthInput
          icon="location"
          placeholder="New York, USA"
          value={location}
          onChangeText={setLocation}
          containerStyle={styles.input}
        />
        <PrimaryButton
          title="Update Profile"
          onPress={handleSave}
          loading={loading}
          showArrow={false}
          style={styles.button}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: APP_SPACING.screenPadding,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: APP_COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    marginBottom: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: AUTH_SPACING.gapInputs,
  },
  button: {
    marginTop: 24,
  },
});
