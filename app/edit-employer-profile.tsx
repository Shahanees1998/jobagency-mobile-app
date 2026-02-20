import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';

const REVENUE_OPTIONS = ['Under $1M (USD)', '$1M to $10M (USD)', '$10M to $50M (USD)', '$50M to $100M (USD)', '$100M to $500M (USD)', '$500M to $1B (USD)', '$1B to $5B (USD)', '$5B+ (USD)'];

export default function EditEmployerProfileScreen() {
  const insets = useSafeAreaInsets();
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
    founded: '',
    revenue: '',
    headquarter: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyBanner, setCompanyBanner] = useState<string>('');
  const [overviewModalVisible, setOverviewModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [aboutUsModalVisible, setAboutUsModalVisible] = useState(false);
  const [profilePicModalVisible, setProfilePicModalVisible] = useState(false);
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [revenueDropdownOpen, setRevenueDropdownOpen] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        const d = response.data;
        setCompanyLogo(d.companyLogo || '');
        setCompanyBanner(d.companyBanner || '');
        setFormData({
          companyName: d.companyName || '',
          companyDescription: d.companyDescription || '',
          companyWebsite: d.companyWebsite || '',
          industry: d.industry || '',
          companySize: d.companySize || '',
          address: d.address || '',
          city: d.city || '',
          country: d.country || '',
          founded: d.founded || '',
          revenue: d.revenue || '',
          headquarter: d.headquarter || [d.city, d.country].filter(Boolean).join(', ') || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        console.warn('[EditEmployerProfile] ImagePicker module failed to load:', e);
        showDialog({
          title: 'Unavailable',
          message: 'Photo picker is not available in this app build.',
          primaryButton: { text: 'OK' },
        });
        return null;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        showDialog({ title: 'Permission needed', message: 'Allow photo access to upload images.', primaryButton: { text: 'OK' } });
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      const asset = !result.canceled ? result.assets?.[0] : undefined;
      return asset ?? null;
    } catch (error) {
      console.error('[EditEmployerProfile] pickImage error:', error);
      showDialog({ title: 'Error', message: 'Could not open photo picker. Please try again.', primaryButton: { text: 'OK' } });
      return null;
    }
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
      const response = await apiClient.updateEmployerProfile({
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        companyWebsite: formData.companyWebsite,
        industry: formData.industry,
        companySize: formData.companySize,
        address: formData.address,
        city: formData.city,
        country: formData.country,
      });
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

  const saveOverview = async () => {
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({ companyDescription: formData.companyDescription });
      if (res.success) { setOverviewModalVisible(false); await loadProfile(); }
      else showDialog({ title: 'Error', message: res.error || 'Failed to save', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to save', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const saveDetails = async () => {
    if (!formData.companyName.trim()) {
      showDialog({ title: 'Error', message: 'Company name is required', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite,
      });
      if (res.success) { setDetailsModalVisible(false); await loadProfile(); }
      else showDialog({ title: 'Error', message: res.error || 'Failed to save', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to save', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const saveAboutUs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({
        industry: formData.industry,
        companySize: formData.companySize,
        address: formData.address,
        city: formData.city,
        country: formData.country,
      });
      if (res.success) { setAboutUsModalVisible(false); setRevenueDropdownOpen(false); await loadProfile(); }
      else showDialog({ title: 'Error', message: res.error || 'Failed to save', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to save', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const openProfilePicModal = () => {
    setProfilePicUri(null);
    setProfilePicModalVisible(true);
  };

  const handleProfilePicChange = async () => {
    const asset = await pickImage();
    if (asset) setProfilePicUri(asset.uri);
  };

  const handleProfilePicApply = async () => {
    if (!profilePicUri) {
      setProfilePicModalVisible(false);
      return;
    }
    setUploadingLogo(true);
    try {
      const response = await apiClient.uploadEmployerLogo(profilePicUri, 'image/jpeg');
      if (response.success) {
        await loadProfile();
        setProfilePicModalVisible(false);
        setProfilePicUri(null);
        showDialog({ title: 'Success', message: 'Company logo updated.', primaryButton: { text: 'OK' } });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload logo', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: (e as Error).message || 'Failed to upload logo', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
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
        <Text style={styles.headerTitle}>Company profile</Text>
        <TouchableOpacity onPress={() => loadProfile()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="refresh" size={22} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main profile card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <TouchableOpacity onPress={openProfilePicModal} disabled={uploadingLogo} style={styles.mainCardLogoWrap}>
              {companyLogo ? (
                <Image source={{ uri: companyLogo }} style={styles.mainCardLogo} />
              ) : (
                <View style={styles.mainCardLogoPlaceholder}>
                  <Ionicons name="person" size={32} color={APP_COLORS.textMuted} />
                </View>
              )}
              {uploadingLogo && (
                <View style={styles.mainCardLogoOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUploadBanner} disabled={uploadingBanner} style={styles.mainCardEditIcon}>
              {uploadingBanner ? <ActivityIndicator color={APP_COLORS.textPrimary} size="small" /> : <Ionicons name="refresh" size={20} color={APP_COLORS.textPrimary} />}
            </TouchableOpacity>
          </View>
          <View style={styles.mainCardBottom}>
            <View style={styles.mainCardNameRow}>
              <Text style={styles.mainCardName}>{formData.companyName || 'Company name'}</Text>
              <TouchableOpacity style={styles.mainCardEditIcon} onPress={() => setDetailsModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color={APP_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.mainCardLinkRow}>
              <TouchableOpacity onPress={() => formData.companyWebsite && Linking.openURL(formData.companyWebsite)} style={styles.mainCardLinkWrap}>
                <Text style={styles.mainCardLink} numberOfLines={1}>{formData.companyWebsite || 'Website link'}</Text>
                <Ionicons name="open-outline" size={14} color={APP_COLORS.link} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <Text style={styles.mainCardDot}>•</Text>
              <Text style={styles.mainCardRating}>No rating yet</Text>
            </View>
          </View>
        </View>

        <View style={styles.inlineFields}>
          <Text style={styles.label}>Company name *</Text>
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon }]} value={formData.companyName} onChangeText={(t) => setFormData({ ...formData, companyName: t })} placeholder="Company name" placeholderTextColor={colors.icon} />
          <Text style={[styles.label, { marginTop: 12 }]}>Website</Text>
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon }]} value={formData.companyWebsite} onChangeText={(t) => setFormData({ ...formData, companyWebsite: t })} placeholder="Website link" placeholderTextColor={colors.icon} keyboardType="url" autoCapitalize="none" />
        </View>

        {/* Company overview card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>Company overview</Text>
            <TouchableOpacity style={styles.sectionCardPlus} onPress={() => setOverviewModalVisible(true)}>
              <Ionicons name="add" size={22} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.sectionCardInput, { color: colors.text, borderColor: colors.icon }]}
            value={formData.companyDescription}
            onChangeText={(text) => setFormData({ ...formData, companyDescription: text })}
            placeholder="Your summary will appear here"
            placeholderTextColor={APP_COLORS.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* About us card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>About us</Text>
            <TouchableOpacity style={styles.sectionCardPlus} onPress={() => setAboutUsModalVisible(true)}>
              <Ionicons name="add" size={22} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.aboutUsFields}>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon }]} value={formData.industry} onChangeText={(t) => setFormData({ ...formData, industry: t })} placeholder="Industry" placeholderTextColor={colors.icon} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon }]} value={formData.companySize} onChangeText={(t) => setFormData({ ...formData, companySize: t })} placeholder="Company size" placeholderTextColor={colors.icon} />
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.icon }]} value={formData.address} onChangeText={(t) => setFormData({ ...formData, address: t })} placeholder="Address" placeholderTextColor={colors.icon} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon }]} value={formData.city} onChangeText={(t) => setFormData({ ...formData, city: t })} placeholder="City" placeholderTextColor={colors.icon} />
              <TextInput style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.icon }]} value={formData.country} onChangeText={(t) => setFormData({ ...formData, country: t })} placeholder="Country" placeholderTextColor={colors.icon} />
            </View>
          </View>
        </View>

        {/* Job listing card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Job listing</Text>
          <View style={styles.sectionCardPlaceholder}>
            <Text style={styles.sectionCardPlaceholderText}>Your posted jobs will appear here</Text>
          </View>
          <TouchableOpacity style={styles.sectionCardLink} onPress={() => router.push('/(tabs)/')}>
            <Text style={styles.sectionCardLinkText}>View jobs</Text>
            <Ionicons name="chevron-forward" size={18} color={APP_COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Company Reviews card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Company Reviews</Text>
          <View style={styles.sectionCardPlaceholder}>
            <Text style={styles.sectionCardPlaceholderText}>Reviews received will appear here</Text>
          </View>
          <TouchableOpacity style={styles.sectionCardLink} onPress={() => router.push(`/company-reviews/my?own=1`)}>
            <Text style={styles.sectionCardLinkText}>View profile</Text>
            <Ionicons name="chevron-forward" size={18} color={APP_COLORS.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.tint }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Company overview modal */}
      <Modal visible={overviewModalVisible} animationType="slide" onRequestClose={() => setOverviewModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOverviewModalVisible(false)} style={styles.modalHeaderBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Company overview</Text>
            <View style={styles.modalHeaderBtn} />
          </View>
          <Text style={styles.modalInstruction}>
            Add a company overview, including primary services, industry focus, and key milestones.
          </Text>
          <View style={styles.modalBody}>
            <View style={styles.modalTextAreaWrap}>
              <Ionicons name="reorder-three" size={22} color={APP_COLORS.textMuted} style={styles.modalTextAreaIcon} />
              <TextInput
                style={styles.modalTextArea}
                value={formData.companyDescription}
                onChangeText={(t) => setFormData({ ...formData, companyDescription: t })}
                placeholder="Enter company overview"
                placeholderTextColor={APP_COLORS.textMuted}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </View>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setOverviewModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveOverview} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Company details modal */}
      <Modal visible={detailsModalVisible} animationType="slide" onRequestClose={() => setDetailsModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeaderCentered}>
            <Text style={styles.modalTitle}>{(formData.companyName || formData.companyWebsite) ? 'Edit company details' : 'Add company details'}</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLabel}>Company name</Text>
            <TextInput
              style={styles.modalInput}
              value={formData.companyName}
              onChangeText={(t) => setFormData({ ...formData, companyName: t })}
              placeholder="Enter company name"
              placeholderTextColor={APP_COLORS.textMuted}
            />
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Company website</Text>
            <TextInput
              style={styles.modalInput}
              value={formData.companyWebsite}
              onChangeText={(t) => setFormData({ ...formData, companyWebsite: t })}
              placeholder="Enter website link"
              placeholderTextColor={APP_COLORS.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </ScrollView>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDetailsModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveDetails} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* About us modal */}
      <Modal visible={aboutUsModalVisible} animationType="slide" onRequestClose={() => { setAboutUsModalVisible(false); setRevenueDropdownOpen(false); }}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setAboutUsModalVisible(false); setRevenueDropdownOpen(false); }} style={styles.modalHeaderBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>About us</Text>
            <View style={styles.modalHeaderBtn} />
          </View>
          <Text style={styles.modalInstruction}>
            Share details about the company, highlighting history, revenue, industry, and website.
          </Text>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLabel}>Company founded</Text>
            <TextInput style={styles.modalInput} value={formData.founded} onChangeText={(t) => setFormData({ ...formData, founded: t })} placeholder="Enter your company founded" placeholderTextColor={APP_COLORS.textMuted} keyboardType="numeric" />
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Company size</Text>
            <TextInput style={styles.modalInput} value={formData.companySize} onChangeText={(t) => setFormData({ ...formData, companySize: t })} placeholder="Enter company size" placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Company revenue</Text>
            <Pressable style={styles.modalInput} onPress={() => setRevenueDropdownOpen(!revenueDropdownOpen)}>
              <Text style={[styles.modalInputText, !formData.revenue && { color: APP_COLORS.textMuted }]}>{formData.revenue || 'Enter company revenue'}</Text>
              <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
            </Pressable>
            {revenueDropdownOpen && (
              <View style={styles.dropdownList}>
                {REVENUE_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setFormData({ ...formData, revenue: opt }); setRevenueDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Company industry</Text>
            <TextInput style={styles.modalInput} value={formData.industry} onChangeText={(t) => setFormData({ ...formData, industry: t })} placeholder="Enter company niche" placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Company headquarter</Text>
            <TextInput style={styles.modalInput} value={formData.headquarter} onChangeText={(t) => setFormData({ ...formData, headquarter: t })} placeholder="Enter company headquarter" placeholderTextColor={APP_COLORS.textMuted} />
          </ScrollView>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setAboutUsModalVisible(false); setRevenueDropdownOpen(false); }} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveAboutUs} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Profile pic modal */}
      <Modal visible={profilePicModalVisible} animationType="slide" onRequestClose={() => setProfilePicModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeaderCentered}>
            <Text style={styles.modalTitle}>Profile Pic</Text>
          </View>
          <View style={styles.profilePicPreviewWrap}>
            <View style={styles.profilePicImageWrap}>
              {(profilePicUri || companyLogo) ? (
                <Image source={{ uri: profilePicUri || companyLogo }} style={styles.profilePicImage} resizeMode="cover" />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="person" size={64} color={APP_COLORS.textMuted} />
                </View>
              )}
              <View style={styles.profilePicCropOverlay} pointerEvents="none" />
            </View>
          </View>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleProfilePicChange} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleProfilePicApply} disabled={uploadingLogo} activeOpacity={0.85}>
              {uploadingLogo ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingBottom: 24,
  },
  mainCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainCardTop: {
    backgroundColor: APP_COLORS.surfaceGray,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  mainCardLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  mainCardLogo: { width: '100%', height: '100%' },
  mainCardLogoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  mainCardLogoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  mainCardEditIcon: { padding: 4 },
  mainCardBottom: { padding: 16 },
  mainCardNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  mainCardName: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, flex: 1 },
  mainCardLinkRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  mainCardLinkWrap: { flexDirection: 'row', alignItems: 'center' },
  mainCardLink: { fontSize: 14, color: APP_COLORS.link, textDecorationLine: 'underline', fontWeight: '600' },
  mainCardDot: { fontSize: 14, color: APP_COLORS.textMuted },
  mainCardRating: { fontSize: 14, color: APP_COLORS.textMuted, fontWeight: '600' },
  inlineFields: { marginBottom: 16 },
  sectionCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionCardTitle: { fontSize: 18, fontWeight: '800', color: APP_COLORS.textPrimary },
  sectionCardPlus: { padding: 4 },
  sectionCardInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: APP_COLORS.surfaceGray,
  },
  sectionCardPlaceholder: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: 10,
    padding: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  sectionCardPlaceholderText: { fontSize: 14, color: APP_COLORS.textMuted },
  sectionCardLink: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  sectionCardLinkText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.primary, marginRight: 4 },
  aboutUsFields: { gap: 12, marginTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  form: {
    width: '100%',
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

  modalSafe: { flex: 1, backgroundColor: APP_COLORS.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderCentered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderBtn: { padding: 4, minWidth: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  modalInstruction: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalBody: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  modalInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: APP_COLORS.textPrimary },
  modalInputText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  modalTextAreaWrap: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 200 },
  modalTextAreaIcon: { marginRight: 12, marginTop: 4 },
  modalTextArea: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, minHeight: 172, paddingVertical: 0, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCancelBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  modalSaveBtn: { flex: 1, backgroundColor: APP_COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  dropdownList: { marginTop: 4, backgroundColor: APP_COLORS.white, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', maxHeight: 220 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 16, color: APP_COLORS.textPrimary },
  profilePicPreviewWrap: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  profilePicImageWrap: { width: 280, height: 280, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  profilePicImage: { width: '100%', height: '100%' },
  profilePicPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  profilePicCropOverlay: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', top: 40, left: 40 },
});


