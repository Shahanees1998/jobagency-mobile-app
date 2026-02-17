import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
}: {
  title: string;
  onAdd?: () => void;
  showAdd?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showAdd && onAdd ? (
        <TouchableOpacity onPress={onAdd} style={styles.addBtn} hitSlop={12}>
          <Ionicons name="add" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function EditDeleteIcons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.editDeleteRow}>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtn} hitSlop={8}>
        <Ionicons name="pencil" size={16} color={APP_COLORS.white} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, styles.deleteIconBtn]} hitSlop={8}>
        <Ionicons name="trash-outline" size={16} color={APP_COLORS.white} />
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

  const [summaryModal, setSummaryModal] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const [workModal, setWorkModal] = useState<{ open: boolean; item?: WorkExperience }>({ open: false });
  const [educationModal, setEducationModal] = useState<{ open: boolean; item?: Education }>({ open: false });
  const [skillsModal, setSkillsModal] = useState(false);
  const [languagesModal, setLanguagesModal] = useState(false);
  const [certsModal, setCertsModal] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

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

  const saveSummary = () => {
    const next = { ...resume, summary: summaryDraft };
    setResume(next);
    setSummaryModal(false);
    persistResume(next);
  };

  const addWork = () => setWorkModal({ open: true });
  const editWork = (item: WorkExperience) => setWorkModal({ open: true, item });
  const deleteWork = (id: string) => {
    const next = { ...resume, workExperience: resume.workExperience.filter((e) => e.id !== id) };
    setResume(next);
    persistResume(next);
  };
  const saveWork = (item: Omit<WorkExperience, 'id'>) => {
    const id = workModal.item?.id ?? `w-${Date.now()}`;
    let next: ResumeData;
    if (workModal.item) {
      next = {
        ...resume,
        workExperience: resume.workExperience.map((e) => (e.id === id ? { ...item, id } : e)),
      };
    } else {
      next = { ...resume, workExperience: [...resume.workExperience, { ...item, id }] };
    }
    setResume(next);
    setWorkModal({ open: false });
    persistResume(next);
  };

  const addEducation = () => setEducationModal({ open: true });
  const editEducation = (item: Education) => setEducationModal({ open: true, item });
  const deleteEducation = (id: string) => {
    const next = { ...resume, education: resume.education.filter((e) => e.id !== id) };
    setResume(next);
    persistResume(next);
  };
  const saveEducation = (item: Omit<Education, 'id'>) => {
    const id = educationModal.item?.id ?? `e-${Date.now()}`;
    let next: ResumeData;
    if (educationModal.item) {
      next = {
        ...resume,
        education: resume.education.map((e) => (e.id === id ? { ...item, id } : e)),
      };
    } else {
      next = { ...resume, education: [...resume.education, { ...item, id }] };
    }
    setResume(next);
    setEducationModal({ open: false });
    persistResume(next);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal details card */}
        <View style={styles.personalCard}>
          <View style={styles.personalMain}>
            <Text style={styles.personalName}>{displayName}</Text>
            <TouchableOpacity style={styles.personalEditBtn} hitSlop={12} onPress={() => router.push('/edit-profile')}>
              <Ionicons name="create-outline" size={22} color={APP_COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.personalLine}>{phone || '+1 234-576-7890'}</Text>
          <Text style={styles.personalLine}>{email}</Text>
          <Text style={styles.personalLine}>{location}</Text>
        </View>

        {/* Upload resume to prefill */}
        <TouchableOpacity
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
        </TouchableOpacity>

        {/* Summary */}
        <SectionHeader title="Summary" onAdd={() => { setSummaryDraft(resume.summary); setSummaryModal(true); }} showAdd />
        {resume.summary ? (
          <View style={styles.sectionContent}>
            <View style={styles.sectionContentHeader}>
              <View style={styles.flex1} />
              <EditDeleteIcons
                onEdit={() => { setSummaryDraft(resume.summary); setSummaryModal(true); }}
                onDelete={() => {
                  const next = { ...resume, summary: '' };
                  setResume(next);
                  persistResume(next);
                }}
              />
            </View>
            <Text style={styles.bodyText}>{resume.summary}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.placeholderBox} onPress={() => setSummaryModal(true)} activeOpacity={0.7}>
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderText}>Add summary</Text>
            </View>
          </TouchableOpacity>
        )
        }

        {/* Work experience */}
        <SectionHeader title="Work experience" onAdd={addWork} showAdd />
        {
          resume.workExperience.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={addWork} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Add work experience</Text>
              </View>
            </TouchableOpacity>
          ) : (
            resume.workExperience.map((w) => (
              <View key={w.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{w.title}</Text>
                  <EditDeleteIcons onEdit={() => editWork(w)} onDelete={() => deleteWork(w.id)} />
                </View>
                <Text style={styles.entrySub}>{w.company}{w.location ? ` - ${w.location}` : ''}</Text>
                <Text style={styles.entryMeta}>{w.startDate} to {w.endDate || 'Present'}</Text>
                {w.description ? <Text style={styles.bodyText}>{w.description}</Text> : null}
              </View>
            ))
          )
        }

        {/* Education */}
        <SectionHeader title="Education" onAdd={addEducation} showAdd />
        {
          resume.education.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={addEducation} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Add education</Text>
              </View>
            </TouchableOpacity>
          ) : (
            resume.education.map((e) => (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{e.degree}</Text>
                  <EditDeleteIcons onEdit={() => editEducation(e)} onDelete={() => deleteEducation(e.id)} />
                </View>
                <Text style={styles.entrySub}>{e.institution}</Text>
                <Text style={styles.entryMeta}>{e.dates}</Text>
                {e.description ? <Text style={styles.bodyText}>{e.description}</Text> : null}
              </View>
            ))
          )
        }

        {/* Skills */}
        <SectionHeader title="Skills" onAdd={() => setSkillsModal(true)} showAdd />
        {
          resume.skills.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setSkillsModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Add skills</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.skills.join(', ')}</Text>
              <EditDeleteIcons
                onEdit={() => setSkillsModal(true)}
                onDelete={() => {
                  const next = { ...resume, skills: [] };
                  setResume(next);
                  persistResume(next);
                }}
              />
            </View>
          )
        }

        {/* Languages */}
        <SectionHeader title="Languages" onAdd={() => setLanguagesModal(true)} showAdd />
        {
          resume.languages.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setLanguagesModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Add languages</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.languages.join(', ')}</Text>
              <EditDeleteIcons
                onEdit={() => setLanguagesModal(true)}
                onDelete={() => {
                  const next = { ...resume, languages: [] };
                  setResume(next);
                  persistResume(next);
                }}
              />
            </View>
          )
        }

        {/* Certifications & licenses */}
        <SectionHeader title="Certifications & licenses" onAdd={() => setCertsModal(true)} showAdd />
        {
          resume.certifications.length === 0 ? (
            <TouchableOpacity style={styles.placeholderBox} onPress={() => setCertsModal(true)} activeOpacity={0.7}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Add certifications</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.sectionContentRow}>
              <Text style={styles.bodyTextFlex}>{resume.certifications.join(', ')}</Text>
              <EditDeleteIcons
                onEdit={() => setCertsModal(true)}
                onDelete={() => {
                  const next = { ...resume, certifications: [] };
                  setResume(next);
                  persistResume(next);
                }}
              />
            </View>
          )
        }

        <View style={{ height: 32 }} />

        {/* Summary modal */}
        <Modal visible={summaryModal} transparent animationType="slide">
          <Pressable style={BOTTOM_SHEET.overlay} onPress={() => setSummaryModal(false)}>
            <Pressable style={[BOTTOM_SHEET.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
              <View style={BOTTOM_SHEET.handle} />
              <Text style={BOTTOM_SHEET.sheetTitle}>Summary</Text>
              <TextInput
                style={BOTTOM_SHEET.textArea}
                placeholder="Your summary will appear here"
                placeholderTextColor={APP_COLORS.textMuted}
                value={summaryDraft}
                onChangeText={setSummaryDraft}
                multiline
                numberOfLines={5}
              />
              <TouchableOpacity style={BOTTOM_SHEET.primaryButton} onPress={saveSummary} activeOpacity={0.85}>
                <Text style={BOTTOM_SHEET.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Work experience modal - inline component for brevity */}
        <WorkExperienceModal
          visible={workModal.open}
          item={workModal.item}
          onClose={() => setWorkModal({ open: false })}
          onSave={saveWork}
          insets={insets}
        />

        <EducationModal
          visible={educationModal.open}
          item={educationModal.item}
          onClose={() => setEducationModal({ open: false })}
          onSave={saveEducation}
          insets={insets}
        />

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
      </ScrollView >
    </View >
  );
}

function WorkExperienceModal({
  visible,
  item,
  onClose,
  onSave,
  insets,
}: {
  visible: boolean;
  item?: WorkExperience;
  onClose: () => void;
  onSave: (item: Omit<WorkExperience, 'id'>) => void;
  insets: { bottom: number };
}) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setCompany(item.company);
      setLocation(item.location);
      setStartDate(item.startDate);
      setEndDate(item.endDate);
      setDescription(item.description);
    } else {
      setTitle('');
      setCompany('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setDescription('');
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), company: company.trim(), location: location.trim(), startDate, endDate, description });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={BOTTOM_SHEET.overlay} onPress={onClose}>
        <Pressable style={[BOTTOM_SHEET.sheet, { paddingBottom: insets.bottom + 24, maxHeight: '90%' as any }]} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={BOTTOM_SHEET.handle} />
            <Text style={BOTTOM_SHEET.sheetTitle}>{item ? 'Edit work experience' : 'Add work experience'}</Text>
            <Text style={BOTTOM_SHEET.fieldLabel}>Job title</Text>
            <TextInput style={BOTTOM_SHEET.input} placeholder="Senior Software Engineer" value={title} onChangeText={setTitle} placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={BOTTOM_SHEET.fieldLabel}>Company</Text>
            <TextInput style={BOTTOM_SHEET.input} placeholder="Zoox Pvt. LTD." value={company} onChangeText={setCompany} placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={BOTTOM_SHEET.fieldLabel}>Location</Text>
            <TextInput style={BOTTOM_SHEET.input} placeholder="New York" value={location} onChangeText={setLocation} placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={BOTTOM_SHEET.fieldLabel}>Start date</Text>
            <TextInput style={BOTTOM_SHEET.input} placeholder="January 2022" value={startDate} onChangeText={setStartDate} placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={BOTTOM_SHEET.fieldLabel}>End date</Text>
            <TextInput style={BOTTOM_SHEET.input} placeholder="Present" value={endDate} onChangeText={setEndDate} placeholderTextColor={APP_COLORS.textMuted} />
            <Text style={BOTTOM_SHEET.fieldLabel}>Description</Text>
            <TextInput style={BOTTOM_SHEET.textArea} placeholder="Responsibilities and achievements..." value={description} onChangeText={setDescription} multiline placeholderTextColor={APP_COLORS.textMuted} />
            <TouchableOpacity style={BOTTOM_SHEET.primaryButton} onPress={handleSave} activeOpacity={0.85}>
              <Text style={BOTTOM_SHEET.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EducationModal({
  visible,
  item,
  onClose,
  onSave,
  insets,
}: {
  visible: boolean;
  item?: Education;
  onClose: () => void;
  onSave: (item: Omit<Education, 'id'>) => void;
  insets: { bottom: number };
}) {
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [dates, setDates] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setDegree(item.degree);
      setInstitution(item.institution);
      setDates(item.dates);
      setDescription(item.description);
    } else {
      setDegree('');
      setInstitution('');
      setDates('');
      setDescription('');
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!degree.trim()) return;
    onSave({ degree: degree.trim(), institution: institution.trim(), dates, description });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={BOTTOM_SHEET.overlay} onPress={onClose}>
        <Pressable style={[BOTTOM_SHEET.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
          <View style={BOTTOM_SHEET.handle} />
          <Text style={BOTTOM_SHEET.sheetTitle}>{item ? 'Edit education' : 'Add education'}</Text>
          <Text style={BOTTOM_SHEET.fieldLabel}>Degree</Text>
          <TextInput style={BOTTOM_SHEET.input} placeholder="Bachelor of Science in Computer Science" value={degree} onChangeText={setDegree} placeholderTextColor={APP_COLORS.textMuted} />
          <Text style={BOTTOM_SHEET.fieldLabel}>Institution</Text>
          <TextInput style={BOTTOM_SHEET.input} placeholder="University name" value={institution} onChangeText={setInstitution} placeholderTextColor={APP_COLORS.textMuted} />
          <Text style={BOTTOM_SHEET.fieldLabel}>Dates</Text>
          <TextInput style={BOTTOM_SHEET.input} placeholder="2018 - 2022" value={dates} onChangeText={setDates} placeholderTextColor={APP_COLORS.textMuted} />
          <Text style={BOTTOM_SHEET.fieldLabel}>Description</Text>
          <TextInput style={BOTTOM_SHEET.textArea} placeholder="Optional details..." value={description} onChangeText={setDescription} multiline placeholderTextColor={APP_COLORS.textMuted} />
          <TouchableOpacity style={BOTTOM_SHEET.primaryButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={BOTTOM_SHEET.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: APP_SPACING.itemPadding,
    marginBottom: 20,
  },
  personalMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  personalName: { fontSize: 20, fontWeight: '700', color: APP_COLORS.textPrimary },
  personalEditBtn: { padding: 4 },
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  addBtn: { padding: 4 },
  placeholderBox: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
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
  placeholderText: { fontSize: 16, fontWeight: '500', color: APP_COLORS.textPrimary },
  sectionContent: { backgroundColor: APP_COLORS.surfaceGray, borderRadius: APP_SPACING.borderRadius, padding: APP_SPACING.itemPadding, marginBottom: 16 },
  sectionContentRow: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionContentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1 },
  editDeleteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: { backgroundColor: APP_COLORS.danger },
  bodyText: { fontSize: 15, lineHeight: 22, color: APP_COLORS.textPrimary, marginTop: 4 },
  bodyTextFlex: { fontSize: 15, lineHeight: 22, color: APP_COLORS.textPrimary, flex: 1 },
  entryCard: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
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
});
