import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  dates: string;
  description: string;
}

interface ResumeData {
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: string[];
  certifications: string[];
}

const emptyResume = (): ResumeData => ({
  summary: '',
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
});

function SectionHeader({
  title,
  onAdd,
  showAdd,
  onEdit,
  onDelete,
  showEditDelete,
}: {
  title: string;
  onAdd?: () => void;
  showAdd?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  showEditDelete?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showAdd && onAdd ? (
        <TouchableOpacity onPress={onAdd} style={styles.addBtn} hitSlop={12}>
          <Ionicons name="add" size={28} color="#111827" />
        </TouchableOpacity>
      ) : showEditDelete && (onEdit || onDelete) ? (
        <EditDeleteIcons
          onEdit={onEdit ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
        />
      ) : null}
    </View>
  );
}

function EditDeleteIcons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.editDeleteRow}>
      <TouchableOpacity onPress={onEdit} style={styles.editIconBtn} hitSlop={8} activeOpacity={0.8}>
        <Ionicons name="create-outline" size={18} color={APP_COLORS.white} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteIconBtn} hitSlop={8} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={18} color={APP_COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const BOTTOM_SHEET = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' as const,
  },
  sheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    maxHeight: '85%' as any,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: APP_COLORS.primary,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600' as const, color: APP_COLORS.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    marginBottom: 16,
  },
  primaryButton: {
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: APP_COLORS.white,
  },
};

function CustomHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.customHeader, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My resume</Text>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

export default function MyResumeScreen() {
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState<ResumeData>(emptyResume());
  const [profile, setProfile] = useState<any>(null);

  const [skillsModal, setSkillsModal] = useState(false);
  const [languagesModal, setLanguagesModal] = useState(false);
  const [certsModal, setCertsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ section: string; onConfirm: () => void } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadResume();
    }, [])
  );

  const loadResume = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCandidateProfile();
      if (response.success && response.data) {
        const d = response.data;
        setProfile(d);
        let work: WorkExperience[] = [];
        let education: Education[] = [];
        // Backend stores work experience as JSON in "experience" field
        if (Array.isArray(d.workExperience)) work = d.workExperience;
        else if (Array.isArray(d.experience)) work = d.experience;
        else if (typeof d.experience === 'string' && d.experience) {
          try {
            const parsed = JSON.parse(d.experience);
            work = Array.isArray(parsed) ? parsed : [];
          } catch (_) { }
        }
        // Backend stores education array as JSON in "education" field
        if (Array.isArray(d.education)) education = d.education;
        else if (typeof d.education === 'string' && d.education) {
          try {
            const parsed = JSON.parse(d.education);
            education = Array.isArray(parsed) ? parsed : [];
          } catch (_) { }
        }
        setResume({
          summary: d.bio ?? '',
          workExperience: work,
          education,
          skills: Array.isArray(d.skills) ? d.skills : [],
          languages: d.languages ? (Array.isArray(d.languages) ? d.languages : [d.languages]) : [],
          certifications: d.certifications ? (Array.isArray(d.certifications) ? d.certifications : [d.certifications]) : [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User' : 'User';
  const phone = user?.phone ?? profile?.phone ?? '';
  const email = user?.email ?? '';
  const location = profile?.location ?? 'New York, USA';

  const handleUploadPrefill = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      setUploading(true);
      const response = await apiClient.uploadCV(result.assets[0].uri);
      if (response.success) {
        showDialog({
          title: 'Resume uploaded',
          message: 'Your resume has been uploaded. We\'ll use it when you apply. You can also fill or edit sections below.',
          primaryButton: { text: 'OK' },
        });
        await loadResume();
      } else {
        showDialog({ title: 'Error', message: response.error ?? 'Upload failed', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message ?? 'Failed to pick document', primaryButton: { text: 'OK' } });
    } finally {
      setUploading(false);
    }
  };

  const persistResume = async (nextResume: ResumeData) => {
    setSaving(true);
    try {
      const response = await apiClient.updateCandidateProfile({
        bio: nextResume.summary || undefined,
        skills: nextResume.skills,
        experience: JSON.stringify(nextResume.workExperience),
        education: JSON.stringify(nextResume.education),
        languages: nextResume.languages,
        certifications: nextResume.certifications,
      });
      if (!response.success) {
        showDialog({ title: 'Error', message: response.error ?? 'Failed to save resume', primaryButton: { text: 'OK' } });
      }
    } catch (e) {
      console.error(e);
      showDialog({ title: 'Error', message: (e as Error)?.message ?? 'Failed to save resume', primaryButton: { text: 'OK' } });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (section: string, onConfirm: () => void) => {
    setDeleteConfirm({ section, onConfirm });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteConfirm.onConfirm();
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  const contentBottomPadding = Math.max(insets.bottom, 24) + 24;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal details card – light grey bg, no border; edit icon only top-right */}
        <View style={styles.personalCard}>
          <View style={styles.personalMain}>
            <View style={styles.personalNameBlock}>
              <Text style={styles.personalName}>{displayName}</Text>
              <Text style={styles.personalLine}>{phone || '+1 234-576-7890'}</Text>
              <Text style={styles.personalLine}>{email}</Text>
              <Text style={styles.personalLine}>{location}</Text>
            </View>
            <TouchableOpacity style={styles.personalEditBtn} onPress={() => router.push('/edit-profile')} hitSlop={8} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={20} color={APP_COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload resume to prefill */}
        {/* <TouchableOpacity
          style={styles.uploadPrefillBtn}
          onPress={handleUploadPrefill}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color={APP_COLORS.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color={APP_COLORS.white} />
              <Text style={styles.uploadPrefillText}>Upload resume to prefill data</Text>
            </>
          )}
        </TouchableOpacity> */}

        {/* Summary – full page add/edit */}
        <SectionHeader
          title="Summary"
          onAdd={() => router.push('/add-summary')}
          showAdd={!resume.summary}
          onEdit={() => router.push('/add-summary')}
          onDelete={() => openDeleteConfirm('Summary', () => {
            const next = { ...resume, summary: '' };
            setResume(next);
            persistResume(next);
          })}
          showEditDelete={!!resume.summary}
        />
        {resume.summary ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>{resume.summary}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.placeholderBox} onPress={() => router.push('/add-summary')} activeOpacity={0.7}>
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderText}>Your summary will appear here</Text>
            </View>
          </TouchableOpacity>
        )
        }

        {/* Work experience – full screen add/edit */}
        <SectionHeader title="Work experience" onAdd={() => router.push('/add-work-experience')} showAdd={resume.workExperience.length === 0} />
        {
          resume.workExperience.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => router.push('/add-work-experience')} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Your work experience will appear here</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              {resume.workExperience.map((w) => (
                <View key={w.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{w.title}</Text>
                    <EditDeleteIcons
                      onEdit={() => router.push({ pathname: '/add-work-experience', params: { id: w.id } })}
                      onDelete={() => openDeleteConfirm('Work experience', () => {
                        const next = { ...resume, workExperience: resume.workExperience.filter((e) => e.id !== w.id) };
                        setResume(next);
                        persistResume(next);
                      })}
                    />
                  </View>
                  <Text style={styles.entrySub}>{w.company}{(w.location ?? (w as any).cityState) ? ` - ${w.location ?? (w as any).cityState}` : ''}</Text>
                  <Text style={styles.entryMeta}>{w.startDate} to {w.endDate || 'Present'}</Text>
                  {w.description ? <Text style={styles.bodyText}>{w.description}</Text> : null}
                </View>
              ))}
              <TouchableOpacity style={styles.addAnotherRow} onPress={() => router.push('/add-work-experience')} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={APP_COLORS.primary} />
                <Text style={styles.addAnotherText}>Add work experience</Text>
              </TouchableOpacity>
            </>
          )
        }

        {/* Education – full screen add/edit */}
        <SectionHeader title="Education" onAdd={() => router.push('/add-education')} showAdd={resume.education.length === 0} />
        {
          resume.education.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => router.push('/add-education')} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Your education will appear here</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              {resume.education.map((e) => (
                <View key={e.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{e.degree}</Text>
                    <EditDeleteIcons
                      onEdit={() => router.push({ pathname: '/add-education', params: { id: e.id } })}
                      onDelete={() => openDeleteConfirm('Education', () => {
                        const next = { ...resume, education: resume.education.filter((x) => x.id !== e.id) };
                        setResume(next);
                        persistResume(next);
                      })}
                    />
                  </View>
                  <Text style={styles.entrySub}>{(e as any).school ?? e.institution}</Text>
                  <Text style={styles.entryMeta}>{e.dates}</Text>
                  {e.description ? <Text style={styles.bodyText}>{e.description}</Text> : null}
                </View>
              ))}
              <TouchableOpacity style={styles.addAnotherRow} onPress={() => router.push('/add-education')} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={APP_COLORS.primary} />
                <Text style={styles.addAnotherText}>Add education</Text>
              </TouchableOpacity>
            </>
          )
        }

        {/* Skills */}
        <SectionHeader
          title="Skills"
          onAdd={() => setSkillsModal(true)}
          showAdd={resume.skills.length === 0}
          onEdit={() => setSkillsModal(true)}
          onDelete={() => openDeleteConfirm('Skills', () => {
            const next = { ...resume, skills: [] };
            setResume(next);
            persistResume(next);
          })}
          showEditDelete={resume.skills.length > 0}
        />
        {
          resume.skills.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setSkillsModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Your skills will appear here</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.skills.join(', ')}</Text>
            </View>
          )
        }

        {/* Languages */}
        <SectionHeader
          title="Languages"
          onAdd={() => setLanguagesModal(true)}
          showAdd={resume.languages.length === 0}
          onEdit={() => setLanguagesModal(true)}
          onDelete={() => openDeleteConfirm('Languages', () => {
            const next = { ...resume, languages: [] };
            setResume(next);
            persistResume(next);
          })}
          showEditDelete={resume.languages.length > 0}
        />
        {
          resume.languages.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setLanguagesModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Your languages will appear here</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.languages.join(', ')}</Text>
            </View>
          )
        }

        {/* Certifications & licenses */}
        <SectionHeader
          title="Certifications & licenses"
          onAdd={() => setCertsModal(true)}
          showAdd={resume.certifications.length === 0}
          onEdit={() => setCertsModal(true)}
          onDelete={() => openDeleteConfirm('Certifications & licenses', () => {
            const next = { ...resume, certifications: [] };
            setResume(next);
            persistResume(next);
          })}
          showEditDelete={resume.certifications.length > 0}
        />
        {
          resume.certifications.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setCertsModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Your certifications will appear here</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.certifications.join(', ')}</Text>
            </View>
          )
        }

        <View style={{ height: 24 }} />

        {/* Delete confirmation – bottom sheet */}
        <Modal visible={deleteConfirm !== null} transparent animationType="slide">
          <Pressable style={BOTTOM_SHEET.overlay} onPress={() => setDeleteConfirm(null)}>
            <Pressable
              style={[BOTTOM_SHEET.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={BOTTOM_SHEET.handle} />
              <Text style={BOTTOM_SHEET.sheetTitle}>Delete {deleteConfirm?.section}</Text>
              <View style={styles.sheetTitleUnderline} />
              <Text style={styles.sheetMessage}>Sure you want to delete?</Text>
              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.sheetCancel} onPress={() => setDeleteConfirm(null)} activeOpacity={0.85}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetDeleteConfirm} onPress={confirmDelete} activeOpacity={0.85}>
                  <Text style={styles.sheetDeleteConfirmText}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <SimpleListModal
          visible={skillsModal}
          title="Skills"
          placeholder="e.g. JavaScript, React, Node.js"
          value={resume.skills.join(', ')}
          onClose={() => setSkillsModal(false)}
          onSave={(text) => {
            const skills = text ? text.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const next = { ...resume, skills };
            setResume(next);
            persistResume(next);
          }}
          insets={insets}
        />
        <SimpleListModal
          visible={languagesModal}
          title="Languages"
          placeholder="e.g. English, Spanish"
          value={resume.languages.join(', ')}
          onClose={() => setLanguagesModal(false)}
          onSave={(text) => {
            const languages = text ? text.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const next = { ...resume, languages };
            setResume(next);
            persistResume(next);
          }}
          insets={insets}
        />
        <SimpleListModal
          visible={certsModal}
          title="Certifications & licenses"
          placeholder="e.g. AWS Certified, PMP"
          value={resume.certifications.join(', ')}
          onClose={() => setCertsModal(false)}
          onSave={(text) => {
            const certifications = text ? text.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const next = { ...resume, certifications };
            setResume(next);
            persistResume(next);
          }}
          insets={insets}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SimpleListModal({
  visible,
  title,
  placeholder,
  value,
  onClose,
  onSave,
  insets,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  value: string;
  onClose: () => void;
  onSave: (text: string) => void;
  insets: { bottom: number };
}) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(value);
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={BOTTOM_SHEET.overlay} onPress={onClose}>
        <Pressable style={[BOTTOM_SHEET.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
          <View style={BOTTOM_SHEET.handle} />
          <Text style={BOTTOM_SHEET.sheetTitle}>{title}</Text>
          <TextInput style={BOTTOM_SHEET.input} placeholder={placeholder} value={text} onChangeText={setText} placeholderTextColor={APP_COLORS.textMuted} />
          <TouchableOpacity style={BOTTOM_SHEET.primaryButton} onPress={() => { onSave(text); onClose(); }} activeOpacity={0.85}>
            <Text style={BOTTOM_SHEET.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_COLORS.background },
  personalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: APP_SPACING.itemPadding,
    marginBottom: 20,
  },
  personalMain: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  personalNameBlock: { flex: 1 },
  personalName: { fontSize: 20, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 4 },
  personalEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalLine: { fontSize: 15, color: APP_COLORS.textSecondary, marginBottom: 4 },
  uploadPrefillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    marginBottom: 24,
  },
  uploadPrefillText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '500', color: APP_COLORS.textPrimary },
  addBtn: { padding: 4 },
  placeholderBox: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
    minHeight: 64,
    justifyContent: 'center',
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 13, fontWeight: '400', color: APP_COLORS.textMuted },
  sectionContent: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
  },
  sectionContentRow: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionContentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1 },
  editDeleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: { fontSize: 15, lineHeight: 22, color: APP_COLORS.textPrimary, marginTop: 4 },
  bodyTextFlex: { fontSize: 15, lineHeight: 22, color: APP_COLORS.textPrimary, flex: 1 },
  entryCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  entryTitle: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary, flex: 1 },
  customHeader: {
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
  },
  entrySub: { fontSize: 15, color: APP_COLORS.textSecondary, marginBottom: 4 },
  entryMeta: { fontSize: 13, color: APP_COLORS.textMuted },
  addAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
  },
  addAnotherText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.primary },
  sheetTitleUnderline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -APP_SPACING.screenPadding,
    marginTop: 16,
    marginBottom: 16,
  },
  sheetMessage: { fontSize: 16, color: APP_COLORS.textPrimary, textAlign: 'center', marginBottom: 24 },
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
  sheetDeleteConfirm: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.danger,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDeleteConfirmText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
