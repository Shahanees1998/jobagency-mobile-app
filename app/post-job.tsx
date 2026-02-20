import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
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

export default function PostJobScreen() {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salaryRange: '',
    employmentType: 'FULL_TIME',
    benefits: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [addPerkModalVisible, setAddPerkModalVisible] = useState(false);
  const [editPerkModalVisible, setEditPerkModalVisible] = useState(false);
  const [newPerkName, setNewPerkName] = useState('');
  const [editingPerkIndex, setEditingPerkIndex] = useState<number | null>(null);
  const [editPerkName, setEditPerkName] = useState('');

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addPerk = () => {
    const name = newPerkName.trim();
    if (name) {
      setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, name] }));
      setNewPerkName('');
      setAddPerkModalVisible(false);
    }
  };

  const openEditPerk = (index: number) => {
    setEditingPerkIndex(index);
    setEditPerkName(formData.benefits[index] ?? '');
    setEditPerkModalVisible(true);
  };

  const saveEditPerk = () => {
    const name = editPerkName.trim();
    if (editingPerkIndex !== null) {
      if (name) {
        setFormData((prev) => ({
          ...prev,
          benefits: prev.benefits.map((b, i) => (i === editingPerkIndex ? name : b)),
        }));
      }
      setEditingPerkIndex(null);
      setEditPerkName('');
      setEditPerkModalVisible(false);
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

  const hasUnsavedContent = () =>
    formData.title.trim() !== '' ||
    formData.description.trim() !== '' ||
    formData.location.trim() !== '' ||
    formData.salaryRange.trim() !== '' ||
    formData.benefits.length > 0;

  const handleBack = () => {
    if (hasUnsavedContent()) {
      showDialog({
        title: 'Delete job',
        message: 'Sure you want to delete this job posting?',
        primaryButton: { text: 'Yes, Delete', onPress: () => router.back() },
        secondaryButton: { text: 'Cancel' },
      });
    } else {
      router.back();
    }
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
    if (!formData.title.trim() || !formData.description.trim()) {
      showDialog({ title: 'Error', message: 'Please fill in title and description', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.postJob({
        title: formData.title,
        description: formData.description,
        location: formData.location || undefined,
        salaryRange: formData.salaryRange || undefined,
        employmentType: formData.employmentType,
        benefits: formData.benefits.length ? formData.benefits : undefined,
      });
      if (response.success) {
        router.replace('/job-posted');
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to post job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to post job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create new job</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <Text
            key={label}
            style={[styles.stepLabel, i === step && styles.stepLabelActive]}
          >
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
              <Text style={styles.sectionSubtext}>
                Add the most important job details so candidates can quickly understand the role and requirements.
              </Text>
              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <Ionicons name="briefcase-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIconSvg} />
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
                  <Ionicons name="cash-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIconSvg} />
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
                  <Ionicons name="location-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIconSvg} />
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
              <View style={styles.benefitsHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Perks and benefits</Text>
                  <Text style={styles.sectionSubtext}>
                    Highlight the benefits and perks offered with this role to attract the right candidates for this job.
                  </Text>
                </View>
                <TouchableOpacity style={styles.addPerkButton} onPress={() => setAddPerkModalVisible(true)} hitSlop={12}>
                  <Ionicons name="add" size={26} color={APP_COLORS.primary} />
                </TouchableOpacity>
              </View>
              {formData.benefits.map((name, i) => (
                <View key={i} style={styles.perkPill}>
                  <Text style={styles.perkName} numberOfLines={1}>{name}</Text>
                  <TouchableOpacity onPress={() => openEditPerk(i)} hitSlop={12} style={styles.perkIconBtn}>
                    <Ionicons name="checkmark-circle" size={22} color={APP_COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePerk(i)} hitSlop={12} style={styles.perkIconBtn}>
                    <Ionicons name="trash-outline" size={22} color={APP_COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPerkRow} onPress={() => setAddPerkModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={22} color={APP_COLORS.primary} />
                <Text style={styles.addPerkText}>Add perk & benefit</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.sectionSubtext}>
                Describe the role, responsibilities, and expectations to help candidates understand the job clearly.
              </Text>
              <View style={styles.field}>
                <View style={styles.textAreaIcons}>
                  <TouchableOpacity><Ionicons name="list-outline" size={20} color={APP_COLORS.textMuted} /></TouchableOpacity>
                  <TouchableOpacity><Ionicons name="document-text-outline" size={20} color={APP_COLORS.textMuted} /></TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter job description..."
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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Post job</Text>}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={addPerkModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddPerkModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add perk & benefit</Text>
            <Text style={styles.modalLabel}>Perk & benefit name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter perk & benefit name"
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

      <Modal visible={editPerkModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditPerkModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit perk & benefit</Text>
            <Text style={styles.modalLabel}>Perk & benefit name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter perk & benefit name"
              placeholderTextColor={APP_COLORS.textMuted}
              value={editPerkName}
              onChangeText={setEditPerkName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditPerkModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEditPerk}>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 6 },
  sectionSubtext: { fontSize: 13, color: APP_COLORS.textSecondary, marginBottom: 16 },
  benefitsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  addPerkButton: { padding: 4 },
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
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    gap: 10,
  },
  perkName: { flex: 1, fontSize: 15, color: APP_COLORS.textPrimary },
  perkIconBtn: { padding: 2 },
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
  textAreaIcons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary, marginBottom: 8 },
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
