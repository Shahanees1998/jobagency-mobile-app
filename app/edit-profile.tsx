import { AuthInput, PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { AUTH_SPACING } from '@/constants/authTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { showDialog } = useDialog();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const uploadProfileImage = async (uri: string, mimeType: string = 'image/jpeg') => {
    setUploading(true);
    try {
      const response = await apiClient.uploadProfileImage(uri, mimeType);
      if (response.success) {
        await refreshUser();
        showDialog({
          title: 'Success',
          message: 'Profile image updated',
          primaryButton: { text: 'OK' },
        });
      } else {
        showDialog({
          title: 'Error',
          message: response.error || 'Failed to upload image',
          primaryButton: { text: 'OK' },
        });
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error?.message || 'Failed to upload image',
        primaryButton: { text: 'OK' },
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showDialog({
          title: 'Permission required',
          message: 'Please grant permission to access your photos.',
          primaryButton: { text: 'OK' },
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await uploadProfileImage(asset.uri, asset.mimeType ?? 'image/jpeg');
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error?.message || 'Could not open photo library.',
        primaryButton: { text: 'OK' },
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showDialog({
          title: 'Permission required',
          message: 'Please grant permission to use the camera.',
          primaryButton: { text: 'OK' },
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await uploadProfileImage(asset.uri, asset.mimeType ?? 'image/jpeg');
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error?.message || 'Could not open camera.',
        primaryButton: { text: 'OK' },
      });
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Profile photo',
      'Choose an option',
      [
        { text: 'Choose from library', onPress: handleChooseFromLibrary },
        { text: 'Take photo', onPress: handleTakePhoto },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

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
        router.push('/profile-updated');
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
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardView}
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
            <TouchableOpacity onPress={handleChangePhoto} disabled={uploading} activeOpacity={0.85}>
              <View style={styles.avatarWrap}>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={44} color={APP_COLORS.primary} />
                  </View>
                )}
                {uploading && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
            <Text style={styles.name}>{fullName || 'User'}</Text>
            <Text style={styles.emailText}>{email}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  headerArea: {
    backgroundColor: APP_COLORS.background,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
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
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: APP_COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  emailText: {
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
