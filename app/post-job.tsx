import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
];

export default function PostJobScreen() {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    salaryRange: '',
    employmentType: 'FULL_TIME',
    category: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      showDialog({ title: 'Error', message: 'Please fill in title and description', primaryButton: { text: 'OK' } });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.postJob(formData);
      if (response.success) {
        showDialog({
          title: 'Success',
          message: 'Job posted successfully. Waiting for admin approval.',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to post job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to post job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const employmentTypeLabel = (t: string) =>
    t
      .split('_')
      .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
      .join(' ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a job</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.requiredNote}>Fields marked * are required.</Text>

          {/* Basics */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basics</Text>

            <View style={styles.field}>
              <Text style={styles.label}>
                Job title <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="briefcase-outline" size={18} color={APP_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Senior Software Engineer"
                  placeholderTextColor={APP_COLORS.textMuted}
                  value={formData.title}
                  onChangeText={(t) => setField('title', t)}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { minHeight: 132 }]}
                placeholder="Describe what the candidate will do, the team, and what success looks like."
                placeholderTextColor={APP_COLORS.textMuted}
                value={formData.description}
                onChangeText={(t) => setField('description', t)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Requirements</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 110 }]}
                placeholder="List skills, experience, and must-haves (bullet style works great)."
                placeholderTextColor={APP_COLORS.textMuted}
                value={formData.requirements}
                onChangeText={(t) => setField('requirements', t)}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Responsibilities</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 110 }]}
                placeholder="Day-to-day responsibilities and key deliverables."
                placeholderTextColor={APP_COLORS.textMuted}
                value={formData.responsibilities}
                onChangeText={(t) => setField('responsibilities', t)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Compensation & location */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Location & compensation</Text>

            <View style={styles.twoColRow}>
              <View style={[styles.field, styles.col]}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="location-outline" size={18} color={APP_COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., New York, NY"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={formData.location}
                    onChangeText={(t) => setField('location', t)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.field, styles.col]}>
                <Text style={styles.label}>Salary range</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="cash-outline" size={18} color={APP_COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., $50k - $70k"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={formData.salaryRange}
                    onChangeText={(t) => setField('salaryRange', t)}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Type & category */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Type & category</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Employment type</Text>
              <View style={styles.chipsWrap}>
                {EMPLOYMENT_TYPES.map((type) => {
                  const selected = formData.employmentType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setField('employmentType', type)}
                      activeOpacity={0.85}
                      style={[styles.chip, selected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{employmentTypeLabel(type)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="pricetag-outline" size={18} color={APP_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Technology, Healthcare"
                  placeholderTextColor={APP_COLORS.textMuted}
                  value={formData.category}
                  onChangeText={(t) => setField('category', t)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.submitButtonText}>Post job</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.back()}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 16,
  },
  requiredNote: { fontSize: 12, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 14 },

  sectionCard: {
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: APP_SPACING.borderRadiusLg,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: APP_COLORS.textSecondary, marginBottom: 12 },

  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: APP_COLORS.textSecondary, marginBottom: 8 },
  required: { color: APP_COLORS.danger },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: APP_SPACING.inputHeight,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  textArea: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },

  twoColRow: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  chipActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '800', color: APP_COLORS.textSecondary },
  chipTextActive: { color: APP_COLORS.white },

  footer: { marginTop: 8 },
  submitButton: {
    height: 54,
    borderRadius: APP_SPACING.borderRadiusLg,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    marginTop: 10,
    height: 50,
    borderRadius: APP_SPACING.borderRadiusLg,
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: APP_COLORS.textSecondary, fontSize: 15, fontWeight: '800' },
});

