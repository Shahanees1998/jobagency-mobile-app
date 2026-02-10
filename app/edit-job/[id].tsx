import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 160;
const LOGO_SIZE = 64;

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
];

function employmentTypeLabel(t: string) {
  return t
    .split('_')
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
    .join(' ');
}

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'EMPLOYER' || !id) {
      router.back();
      return;
    }
    loadJob();
  }, [id, user?.role]);

  const loadJob = async () => {
    if (!id) return;
    try {
      const response = await apiClient.getEmployerJobById(id);
      if (response.success && response.data) {
        const j = response.data;
        setFormData({
          title: j.title || '',
          description: j.description || '',
          requirements: j.requirements || '',
          responsibilities: j.responsibilities || '',
          location: j.location || '',
          salaryRange: j.salaryRange || '',
          employmentType: j.employmentType || 'FULL_TIME',
          category: j.category || '',
        });
      }
    } catch (error) {
      console.error('Error loading job:', error);
      showDialog({ title: 'Error', message: 'Failed to load job', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const doCloseJob = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.updateJob(id, { status: 'CLOSED' });
      if (response.success) {
        showDialog({
          title: 'Job closed',
          message: 'This job has been delisted successfully.',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to close job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to close job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async () => {
    showDialog({
      title: 'Close this job?',
      message:
        "This will delist the job and candidates will no longer be able to apply. You can't undo this from the mobile app.",
      primaryButton: { text: 'Close job', onPress: doCloseJob },
      secondaryButton: { text: 'Cancel' },
    });
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.title.trim() || !formData.description.trim()) {
      showDialog({ title: 'Error', message: 'Please fill in title and description', primaryButton: { text: 'OK' } });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.updateJob(id, formData);
      if (response.success) {
        showDialog({
          title: 'Success',
          message: 'Job updated successfully',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to update job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to update job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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

  const letter = (formData.title || 'J').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Same header as job-details */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit job</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Same banner + logo as job-details */}
        <View style={styles.banner}>
          <View style={styles.bannerPlaceholder} />
          <View style={styles.logoOverlay}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>{letter}</Text>
            </View>
          </View>
        </View>

        {/* Title input (same position as job title) */}
        <TextInput
          style={styles.jobTitleInput}
          placeholder="Job title"
          placeholderTextColor={APP_COLORS.textMuted}
          value={formData.title}
          onChangeText={(t) => setField('title', t)}
          autoCapitalize="words"
        />

        {/* Job details card - same as job-details but editable */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
            <TextInput
              style={styles.cardInput}
              placeholder="Salary range (e.g., $50k - $70k)"
              placeholderTextColor={APP_COLORS.textMuted}
              value={formData.salaryRange}
              onChangeText={(t) => setField('salaryRange', t)}
            />
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
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
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {employmentTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
            <TextInput
              style={styles.cardInput}
              placeholder="Location (e.g., New York, NY)"
              placeholderTextColor={APP_COLORS.textMuted}
              value={formData.location}
              onChangeText={(t) => setField('location', t)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Full Job description - same card as job-details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Full Job description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the role, team, and what success looks like."
            placeholderTextColor={APP_COLORS.textMuted}
            value={formData.description}
            onChangeText={(t) => setField('description', t)}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Requirements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Requirements</Text>
          <TextInput
            style={styles.textArea}
            placeholder="List skills, experience, and must-haves."
            placeholderTextColor={APP_COLORS.textMuted}
            value={formData.requirements}
            onChangeText={(t) => setField('requirements', t)}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Responsibilities */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Responsibilities</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Day-to-day responsibilities and key deliverables."
            placeholderTextColor={APP_COLORS.textMuted}
            value={formData.responsibilities}
            onChangeText={(t) => setField('responsibilities', t)}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category</Text>
          <TextInput
            style={styles.cardInputSingle}
            placeholder="e.g., Technology, Healthcare"
            placeholderTextColor={APP_COLORS.textMuted}
            value={formData.category}
            onChangeText={(t) => setField('category', t)}
            autoCapitalize="words"
          />
        </View>

        {/* Actions - same style as job-details Apply / Edit */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={APP_COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Update job</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCloseJob}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Close job (Delist)</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 0 },
  banner: {
    height: BANNER_HEIGHT,
    marginBottom: LOGO_SIZE / 2 + 8,
    position: 'relative',
  },
  bannerPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: APP_COLORS.primary,
    opacity: 0.9,
    borderRadius: APP_SPACING.borderRadius,
  },
  logoOverlay: {
    position: 'absolute',
    left: APP_SPACING.screenPadding,
    bottom: -LOGO_SIZE / 2,
  },
  logoBox: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 28, fontWeight: '700', color: APP_COLORS.white },
  jobTitleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 20,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 12 },
  cardInput: { flex: 1, fontSize: 15, color: APP_COLORS.textPrimary, paddingVertical: 4 },
  cardInputSingle: {
    fontSize: 15,
    color: APP_COLORS.textPrimary,
    paddingVertical: 8,
  },
  chipsWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  chipActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary },
  chipTextActive: { color: APP_COLORS.white },
  textArea: {
    fontSize: 15,
    lineHeight: 24,
    color: APP_COLORS.textPrimary,
    minHeight: 120,
    paddingVertical: 4,
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  primaryButtonText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: APP_COLORS.danger,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.danger },
  bottomPadding: { height: 24 },
});
