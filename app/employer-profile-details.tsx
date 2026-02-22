import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';

export default function EmployerProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        setCompanyName(response.data.companyName || '');
        setCompanyWebsite(response.data.companyWebsite || '');
        setCompanyLogo(response.data.companyLogo ?? null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showDialog({ title: 'Error', message: 'Failed to load profile', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const uploadProfileImage = async (uri: string, mimeType: string = 'image/jpeg') => {
    setUploadingLogo(true);
    try {
      const response = await apiClient.uploadEmployerLogo(uri, mimeType);
      if (response.success) {
        await loadProfile();
        showDialog({
          title: 'Success',
          message: 'Company logo updated',
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
      setUploadingLogo(false);
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
      'Company logo',
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
    if (!companyName.trim()) {
      showDialog({ title: 'Error', message: 'Company name is required', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim(),
      });
      if (res.success) {
        showDialog({
          title: 'Success',
          message: 'Company details updated',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: res.error || 'Failed to save', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to save', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company details</Text>
        <View style={styles.headerBtn} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Company name</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
            placeholderTextColor={APP_COLORS.textMuted}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Company website</Text>
          <TextInput
            style={styles.input}
            value={companyWebsite}
            onChangeText={setCompanyWebsite}
            placeholder="Enter website link"
            placeholderTextColor={APP_COLORS.textMuted}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: APP_SPACING.screenPadding, paddingTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
