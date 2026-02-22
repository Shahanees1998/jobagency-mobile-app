import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const REVENUE_OPTIONS = [
  'Under $1M (USD)',
  '$1M to $10M (USD)',
  '$10M to $50M (USD)',
  '$50M to $100M (USD)',
  '$100M to $500M (USD)',
  '$500M to $1B (USD)',
  '$1B to $5B (USD)',
  '$5B+ (USD)',
];

export default function EmployerProfileAboutScreen() {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [formData, setFormData] = useState({
    industry: '',
    companySize: '',
    address: '',
    city: '',
    country: '',
    founded: '',
    revenue: '',
    headquarter: '',
  });
  const [revenueDropdownOpen, setRevenueDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        const d = response.data;
        setFormData({
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
      showDialog({ title: 'Error', message: 'Failed to load profile', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({
        industry: formData.industry,
        companySize: formData.companySize,
        address: formData.address,
        city: formData.city,
        country: formData.country,
      });
      if (res.success) {
        showDialog({
          title: 'Success',
          message: 'About us updated',
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
        <Text style={styles.headerTitle}>About us</Text>
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
          <Text style={styles.instruction}>
            Share details about the company, highlighting history, revenue, industry, and website.
          </Text>
          <Text style={styles.label}>Company founded</Text>
          <TextInput
            style={styles.input}
            value={formData.founded}
            onChangeText={(t) => setFormData({ ...formData, founded: t })}
            placeholder="Enter your company founded"
            placeholderTextColor={APP_COLORS.textMuted}
            keyboardType="numeric"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Company size</Text>
          <TextInput
            style={styles.input}
            value={formData.companySize}
            onChangeText={(t) => setFormData({ ...formData, companySize: t })}
            placeholder="Enter company size"
            placeholderTextColor={APP_COLORS.textMuted}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Company revenue</Text>
          <Pressable
            style={styles.input}
            onPress={() => setRevenueDropdownOpen(!revenueDropdownOpen)}
          >
            <Text style={[styles.inputText, !formData.revenue && { color: APP_COLORS.textMuted }]}>
              {formData.revenue || 'Enter company revenue'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
          </Pressable>
          {revenueDropdownOpen && (
            <View style={styles.dropdownList}>
              {REVENUE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, revenue: opt });
                    setRevenueDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={[styles.label, { marginTop: 16 }]}>Company industry</Text>
          <TextInput
            style={styles.input}
            value={formData.industry}
            onChangeText={(t) => setFormData({ ...formData, industry: t })}
            placeholder="Enter company niche"
            placeholderTextColor={APP_COLORS.textMuted}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
            placeholder="Enter address"
            placeholderTextColor={APP_COLORS.textMuted}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
                placeholder="City"
                placeholderTextColor={APP_COLORS.textMuted}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(t) => setFormData({ ...formData, country: t })}
                placeholder="Country"
                placeholderTextColor={APP_COLORS.textMuted}
              />
            </View>
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Company headquarter</Text>
          <TextInput
            style={styles.input}
            value={formData.headquarter}
            onChangeText={(t) => setFormData({ ...formData, headquarter: t })}
            placeholder="Enter company headquarter"
            placeholderTextColor={APP_COLORS.textMuted}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
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
  scrollContent: { padding: APP_SPACING.screenPadding, paddingTop: 8 },
  instruction: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  dropdownList: {
    marginTop: 4,
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 16, color: APP_COLORS.textPrimary },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
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
