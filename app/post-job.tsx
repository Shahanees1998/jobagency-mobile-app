import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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

const STEPS = [
  { num: 1, label: 'Basics' },
  { num: 2, label: 'Benefits' },
  { num: 3, label: 'Details' },
] as const;
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
  const [jobTypeDropdownOpen, setJobTypeDropdownOpen] = useState(false);
  const [deletePerkIndex, setDeletePerkIndex] = useState<number | null>(null);
  const descriptionRef = useRef<TextInput>(null);
  const [descriptionSelection, setDescriptionSelection] = useState({ start: 0, end: 0 });

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const insertAtCursorDescription = (textToInsert: string) => {
    const start = descriptionSelection.start;
    const end = descriptionSelection.end;
    const before = formData.description.slice(0, start);
    const after = formData.description.slice(end);
    const newText = before + textToInsert + after;
    setField('description', newText);
    const newCursor = start + textToInsert.length;
    setDescriptionSelection({ start: newCursor, end: newCursor });
    setTimeout(() => {
      descriptionRef.current?.setNativeProps({ selection: { start: newCursor, end: newCursor } });
    }, 0);
  };

  const handleDescriptionNumberedList = () => {
    const desc = formData.description;
    const atLineStart = descriptionSelection.start === 0 || desc[descriptionSelection.start - 1] === '\n';
    const textBeforeCursor = desc.slice(0, descriptionSelection.start);
    const numberedMatches = textBeforeCursor.match(/^\d+\.\s/gm) || [];
    const nextNum = numberedMatches.length + 1;
    const toInsert = atLineStart ? `${nextNum}. ` : `\n${nextNum}. `;
    insertAtCursorDescription(toInsert);
  };

  const handleDescriptionBulletList = () => {
    const desc = formData.description;
    const atLineStart = descriptionSelection.start === 0 || desc[descriptionSelection.start - 1] === '\n';
    const toInsert = atLineStart ? '• ' : '\n• ';
    insertAtCursorDescription(toInsert);
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

  const openDeletePerk = (index: number) => setDeletePerkIndex(index);

  const confirmDeletePerk = () => {
    if (deletePerkIndex !== null) {
      setFormData((prev) => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== deletePerkIndex) }));
      setDeletePerkIndex(null);
    }
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
        {STEPS.map((s, i) => (
          <React.Fragment key={s.label}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, i === step && styles.stepCircleActive]}>
                <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{s.num}</Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]} numberOfLines={1}>{s.label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={styles.stepConnector}>
                <View style={[styles.stepConnectorLine, styles.stepConnectorDashed]} />
                <View style={[styles.stepConnectorLine, styles.stepConnectorDashed]} />
                <View style={[styles.stepConnectorLine, styles.stepConnectorDashed]} />
              </View>
            )}
          </React.Fragment>
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
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="briefcase-outline" size={20} color="#111827" />
                  </View>
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
                  <View style={styles.inputIconWrap}>
                    <Text style={styles.inputIconDollar}>$</Text>
                  </View>
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
                <TouchableOpacity
                  style={styles.dropdownWrap}
                  onPress={() => setJobTypeDropdownOpen(true)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      formData.employmentType ? styles.dropdownTextSelected : undefined,
                    ]}
                    numberOfLines={1}
                  >
                    {formData.employmentType ? employmentTypeLabel(formData.employmentType) : 'Select job type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="location-outline" size={20} color="#111827" />
                  </View>
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
                <View style={styles.benefitsHeaderText}>
                  <Text style={styles.sectionTitle}>Perks and benefits</Text>
                  <Text style={styles.sectionSubtext}>
                    Highlight the benefits and perks offered with this role to attract the right candidates for this job.
                  </Text>
                </View>
                <TouchableOpacity style={styles.addPerkButton} onPress={() => setAddPerkModalVisible(true)} hitSlop={12}>
                  <Ionicons name="add" size={32} color={APP_COLORS.primary} />
                </TouchableOpacity>
              </View>
              {formData.benefits.map((name, i) => (
                <View key={i} style={styles.perkCard}>
                  <Text style={styles.perkName} numberOfLines={1}>{name}</Text>
                  <View style={styles.perkActions}>
                    <TouchableOpacity onPress={() => openEditPerk(i)} style={styles.perkEditBtn} activeOpacity={0.8}>
                      <Ionicons name="refresh" size={18} color={APP_COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openDeletePerk(i)} style={styles.perkDeleteBtn} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={18} color={APP_COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.sectionSubtext}>
                Describe the role, responsibilities, and expectations to help candidates understand the job clearly.
              </Text>
              <View style={styles.descWrap}>
                <View style={styles.descToolbarRow}>
                  <TouchableOpacity style={styles.descToolbarIcon} onPress={handleDescriptionNumberedList} activeOpacity={0.7}>
                    <Ionicons name="reorder-three" size={22} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.descToolbarIcon} onPress={handleDescriptionBulletList} activeOpacity={0.7}>
                    <Ionicons name="list" size={22} color="#111827" />
                  </TouchableOpacity>
                </View>
                <View style={styles.descToolbarBorder} />
                <TextInput
                  ref={descriptionRef}
                  style={styles.textArea}
                  placeholder="Enter job description..."
                  placeholderTextColor={APP_COLORS.textMuted}
                  value={formData.description}
                  onChangeText={(t) => setField('description', t)}
                  onSelectionChange={({ nativeEvent }) => setDescriptionSelection(nativeEvent.selection)}
                  selection={descriptionSelection}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          <View style={styles.footer}>
            {step < 2 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.9}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
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

      {/* Add perk – bottom sheet */}
      <Modal visible={addPerkModalVisible} transparent animationType="slide" onRequestClose={() => setAddPerkModalVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setAddPerkModalVisible(false)}>
          <Pressable
            style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.sheetHandle} onPress={() => setAddPerkModalVisible(false)} activeOpacity={1}>
              <View style={styles.sheetHandleBar} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Add perk & benefit</Text>
            <Text style={styles.sheetLabel}>Perk & benefit name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Enter perk & benefit name"
              placeholderTextColor={APP_COLORS.textMuted}
              value={newPerkName}
              onChangeText={setNewPerkName}
              autoFocus
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setAddPerkModalVisible(false)} activeOpacity={0.85}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetSave} onPress={addPerk} activeOpacity={0.85}>
                <Text style={styles.sheetSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit perk – bottom sheet */}
      <Modal visible={editPerkModalVisible} transparent animationType="slide" onRequestClose={() => setEditPerkModalVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setEditPerkModalVisible(false)}>
          <Pressable
            style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.sheetHandle} onPress={() => setEditPerkModalVisible(false)} activeOpacity={1}>
              <View style={styles.sheetHandleBar} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Edit perk & benefit</Text>
            <Text style={styles.sheetLabel}>Perk & benefit name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Enter perk & benefit name"
              placeholderTextColor={APP_COLORS.textMuted}
              value={editPerkName}
              onChangeText={setEditPerkName}
              autoFocus
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setEditPerkModalVisible(false)} activeOpacity={0.85}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetSave} onPress={saveEditPerk} activeOpacity={0.85}>
                <Text style={styles.sheetSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete perk – bottom sheet */}
      <Modal visible={deletePerkIndex !== null} transparent animationType="slide" onRequestClose={() => setDeletePerkIndex(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setDeletePerkIndex(null)}>
          <Pressable
            style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.sheetHandle} onPress={() => setDeletePerkIndex(null)} activeOpacity={1}>
              <View style={styles.sheetHandleBar} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Delete Perk & benefit</Text>
            <Text style={styles.sheetMessage}>Sure you want to delete?</Text>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setDeletePerkIndex(null)} activeOpacity={0.85}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetDeleteConfirm} onPress={confirmDeletePerk} activeOpacity={0.85}>
                <Text style={styles.sheetDeleteConfirmText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={jobTypeDropdownOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setJobTypeDropdownOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select job type</Text>
            {EMPLOYMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.jobTypeOption}
                onPress={() => {
                  setField('employmentType', type);
                  setJobTypeDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.jobTypeOptionText}>{employmentTypeLabel(type)}</Text>
                {formData.employmentType === type && (
                  <Ionicons name="checkmark" size={20} color={APP_COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stepCircleActive: {
    backgroundColor: APP_COLORS.primary,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
  },
  stepNumActive: {
    color: APP_COLORS.white,
  },
  stepLabel: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary, flex: 1 },
  stepLabelActive: { color: APP_COLORS.textPrimary },
  stepConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 2,
    flexShrink: 0,
  },
  stepConnectorLine: {
    width: 12,
    height: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#D1D5DB',
  },
  stepConnectorDashed: {
    borderStyle: 'dashed',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 6 },
  sectionSubtext: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20, marginBottom: 20 },
  benefitsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  benefitsHeaderText: { flex: 1, marginRight: 12 },
  addPerkButton: { padding: 4 },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  perkName: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary },
  perkActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  perkEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: APP_SPACING.inputHeight,
    backgroundColor: '#F3F4F6',
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputIconDollar: { fontSize: 18, fontWeight: '700', color: '#111827' },
  input: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  dropdownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: APP_SPACING.inputHeight,
    backgroundColor: '#F3F4F6',
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: APP_COLORS.textMuted,
    flex: 1,
  },
  dropdownTextSelected: {
    color: APP_COLORS.textPrimary,
  },
  jobTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  jobTypeOptionText: { fontSize: 16, color: APP_COLORS.textPrimary },
  descWrap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 180,
  },
  descToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  descToolbarIcon: {
    padding: 6,
    marginRight: 4,
  },
  descToolbarBorder: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  textArea: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 140,
  },
  footer: { marginTop: 24 },
  primaryBtn: {
    flexDirection: 'row',
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
  // Bottom sheets (add / edit / delete perk)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
  },
  sheetMessage: {
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  sheetInput: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  sheetActions: { flexDirection: 'row', gap: 12 },
  sheetCancel: {
    flex: 1,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  sheetSave: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sheetDeleteConfirm: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.danger,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDeleteConfirmText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
