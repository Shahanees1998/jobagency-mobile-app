import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { APP_COLORS } from '@/constants/appTheme';

export default function EditEmployerProfileScreen() {
  const { refreshUser } = useAuth();
  const { showDialog } = useDialog();
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    address: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyBanner, setCompanyBanner] = useState<string>('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        setCompanyLogo(response.data.companyLogo || '');
        setCompanyBanner(response.data.companyBanner || '');
        setFormData({
          companyName: response.data.companyName || '',
          companyDescription: response.data.companyDescription || '',
          companyWebsite: response.data.companyWebsite || '',
          industry: response.data.industry || '',
          companySize: response.data.companySize || '',
          address: response.data.address || '',
          city: response.data.city || '',
          country: response.data.country || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      showDialog({ title: 'Permission needed', message: 'Allow photo access to upload images.', primaryButton: { text: 'OK' } });
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0];
  };

  const handleUploadLogo = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingLogo(true);
    try {
      const response = await apiClient.uploadEmployerLogo(asset.uri, asset.mimeType || 'image/jpeg');
      if (response.success) {
        showDialog({ title: 'Success', message: 'Company logo updated.', primaryButton: { text: 'OK' } });
        await loadProfile();
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload logo', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to upload logo', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingBanner(true);
    try {
      const response = await apiClient.uploadEmployerBanner(asset.uri, asset.mimeType || 'image/jpeg');
      if (response.success) {
        showDialog({ title: 'Success', message: 'Company banner updated.', primaryButton: { text: 'OK' } });
        await loadProfile();
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload banner', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to upload banner', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!formData.companyName.trim()) {
      showDialog({ title: 'Error', message: 'Company name is required', primaryButton: { text: 'OK' } });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.updateEmployerProfile(formData);
      if (response.success) {
        await refreshUser();
        showDialog({
          title: 'Success',
          message: 'Profile updated successfully',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to update profile', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to update profile', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Edit Company Profile</ThemedText>

        <View style={styles.form}>
          {/* Media section */}
          <View style={styles.mediaBlock}>
            <Text style={styles.mediaLabel}>Company banner</Text>
            <View style={styles.bannerWrap}>
              {companyBanner ? (
                <Image source={{ uri: companyBanner }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={APP_COLORS.textMuted} />
                  <Text style={styles.bannerPlaceholderText}>Add a banner</Text>
                </View>
              )}
              <TouchableOpacity style={styles.bannerBtn} onPress={handleUploadBanner} disabled={uploadingBanner} activeOpacity={0.85}>
                {uploadingBanner ? <ActivityIndicator color="#fff" /> : <Text style={styles.bannerBtnText}>Change</Text>}
              </TouchableOpacity>
            </View>

            <Text style={[styles.mediaLabel, { marginTop: 16 }]}>Company logo</Text>
            <View style={styles.logoRow}>
              <View style={styles.logoWrap}>
                {companyLogo ? (
                  <Image source={{ uri: companyLogo }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="business-outline" size={22} color={APP_COLORS.textMuted} />
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.logoBtn} onPress={handleUploadLogo} disabled={uploadingLogo} activeOpacity={0.85}>
                {uploadingLogo ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoBtnText}>Change logo</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Company Name *</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Company Description</ThemedText>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.icon }]}
              value={formData.companyDescription}
              onChangeText={(text) => setFormData({ ...formData, companyDescription: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Website</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={formData.companyWebsite}
              onChangeText={(text) => setFormData({ ...formData, companyWebsite: text })}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Industry</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={formData.industry}
              onChangeText={(text) => setFormData({ ...formData, industry: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Company Size</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={formData.companySize}
              onChangeText={(text) => setFormData({ ...formData, companySize: text })}
              placeholder="e.g., 1-10, 11-50, 51-200"
              placeholderTextColor={colors.icon}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Address</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <ThemedText style={styles.label}>City</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <ThemedText style={styles.label}>Country</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaBlock: {
    marginBottom: 24,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 10,
  },
  bannerWrap: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: APP_COLORS.surfaceGray,
    position: 'relative',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bannerPlaceholderText: { marginTop: 6, color: APP_COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  bannerBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  logoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});


