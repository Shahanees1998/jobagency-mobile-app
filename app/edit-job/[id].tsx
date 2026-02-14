import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['1 Basics', '2 Benefits', '3 Details'] as const;
const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
];

function employmentTypeLabel(t: string) {
  return t.split('_').map((p) => p.charAt(0) + p.slice(1).toLowerCase()).join(' ');
}

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salaryRange: '',
    employmentType: 'FULL_TIME' as string,
    benefits: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [addPerkModalVisible, setAddPerkModalVisible] = useState(false);
  const [newPerkName, setNewPerkName] = useState('');

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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
        const j = response.data as any;
        setFormData({
          title: j.title || '',
          description: j.description || '',
          location: j.location || '',
          salaryRange: j.salaryRange || '',
          employmentType: j.employmentType || 'FULL_TIME',
          benefits: Array.isArray(j.benefits) ? j.benefits : [],
        });
      }
    } catch (error) {
      console.error('Error loading job:', error);
      showDialog({ title: 'Error', message: 'Failed to load job', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const addPerk = () => {
    const name = newPerkName.trim();
    if (name) {
      setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, name] }));
      setNewPerkName('');
      setAddPerkModalVisible(false);
    }
  };

  const removePerk = (index: number) => {
    showDialog({
      title: 'Delete Perk & benefit',
      message: 'Sure you want to delete?',
      primaryButton: { text: 'Yes, Delete', onPress: () => setFormData((prev) => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) })) },
      secondaryButton: { text: 'Cancel' },
    });
  };

  const handleNext = () => {
    if (step === 0) {
      if (!formData.title.trim()) {
        showDialog({ title: 'Error', message: 'Please enter job title', primaryButton: { text: 'OK' } });
        return;
      }
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.title.trim() || !formData.description.trim()) {
      showDialog({ title: 'Error', message: 'Please fill in title and description', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.updateJob(id, {
        title: formData.title,
        description: formData.description,
        location: formData.location || undefined,
        salaryRange: formData.salaryRange || undefined,
        employmentType: formData.employmentType,
        benefits: formData.benefits,
      });
      if (response.success) {
        router.replace('/job-updated');
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to update job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to update job', primaryButton: { text: 'OK' } });
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
        <Text style={styles.headerTitle}>Edit existing job</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <Text key={label} style={[styles.stepLabel, i === step && styles.stepLabelActive]}>
            {label}
          </Text>
        ))}
      </View>

      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <>
              <Text style={styles.sectionTitle}>Basic Job Information</Text>
              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputIcon}>H</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Job title"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={formData.title}
                    onChangeText={(t) => setField('title', t)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputIcon}>€</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Salary range"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={formData.salaryRange}
                    onChangeText={(t) => setField('salaryRange', t)}
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Select job type</Text>
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
                <View style={styles.inputWrap}>
                  <Ionicons name="location-outline" size={18} color={APP_COLORS.textMuted} style={styles.inputIconSvg} />
                  <TextInput
                    style={styles.input}
                    placeholder="Job address"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={formData.location}
                    onChangeText={(t) => setField('location', t)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Perks and benefits</Text>
              <TouchableOpacity style={styles.addPerkRow} onPress={() => setAddPerkModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={22} color={APP_COLORS.primary} />
                <Text style={styles.addPerkText}>Add perk & benefit</Text>
              </TouchableOpacity>
              {formData.benefits.map((name, i) => (
                <View key={i} style={styles.perkRow}>
                  <View style={styles.perkCheck} />
                  <Text style={styles.perkName}>{name}</Text>
                  <TouchableOpacity onPress={() => removePerk(i)} hitSlop={12}>
                    <Ionicons name="close-circle" size={24} color={APP_COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter job description."
                  placeholderTextColor={APP_COLORS.textMuted}
                  value={formData.description}
                  onChangeText={(t) => setField('description', t)}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          <View style={styles.footer}>
            {step < 2 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.9}>
                <Text style={styles.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update job</Text>}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={addPerkModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddPerkModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add perk & benefit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Perk & benefit name"
              placeholderTextColor={APP_COLORS.textMuted}
              value={newPerkName}
              onChangeText={setNewPerkName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setAddPerkModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addPerk}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  stepRow: {
    flexDirection: 'row',
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingVertical: 16,
    gap: 16,
  },
  stepLabel: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textMuted },
  stepLabelActive: { color: APP_COLORS.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary, marginBottom: 8 },
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
  inputIcon: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textMuted, marginRight: 10 },
  inputIconSvg: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
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
  chipText: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary },
  chipTextActive: { color: APP_COLORS.white },
  addPerkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  addPerkText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.primary },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  perkCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: APP_COLORS.primary },
  perkName: { flex: 1, fontSize: 15, color: APP_COLORS.textPrimary },
  textArea: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 140,
  },
  footer: { marginTop: 24 },
  primaryBtn: {
    height: 54,
    borderRadius: APP_SPACING.borderRadiusLg,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 16 },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, height: 48, backgroundColor: APP_COLORS.surfaceGray, borderRadius: APP_SPACING.borderRadius, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  modalSave: { flex: 1, height: 48, backgroundColor: APP_COLORS.primary, borderRadius: APP_SPACING.borderRadius, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
