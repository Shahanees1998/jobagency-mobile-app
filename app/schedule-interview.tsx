import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
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

export default function ScheduleInterviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ jobId?: string; applicationId?: string }>();
  const { showDialog } = useDialog();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState(params.jobId ?? '');
  const [applicationId, setApplicationId] = useState(params.applicationId ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  const [candidatePickerOpen, setCandidatePickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getEmployerJobs({ page: 1, limit: 50 });
        const list = res.success && res.data ? (res.data as any).jobs || [] : [];
        setJobs(list);
        const fromParams = params.jobId ?? '';
        if (fromParams && list.some((j: any) => j.id === fromParams)) setJobId(fromParams);
        else if (list.length) setJobId((prev) => (prev && list.some((j: any) => j.id === prev) ? prev : list[0].id));
      } catch (e) {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!jobId) {
      setApplications([]);
      if (!params.applicationId) setApplicationId('');
      return;
    }
    (async () => {
      try {
        const res = await apiClient.getJobApplications(jobId, { page: 1, limit: 100 });
        const raw = res.success && res.data ? res.data as any : {};
        const list = Array.isArray(raw.applications) ? raw.applications : Array.isArray(raw) ? raw : [];
        const filtered = list.filter((a: any) => String(a.status).toUpperCase() !== 'REJECTED');
        setApplications(filtered);
        const fromParams = params.applicationId ?? '';
        if (fromParams && filtered.some((a: any) => a.id === fromParams)) setApplicationId(fromParams);
        else setApplicationId('');
      } catch (e) {
        setApplications([]);
      }
    })();
  }, [jobId]);

  const getCandidateName = (app: any) => {
    const u = app.candidate?.user;
    if (u?.firstName || u?.lastName) return [u.firstName, u.lastName].filter(Boolean).join(' ');
    return u?.email || 'Candidate';
  };

  const handleSubmit = async () => {
    if (!jobId || !applicationId) {
      showDialog({ title: 'Error', message: 'Please select job and candidate', primaryButton: { text: 'OK' } });
      return;
    }
    if (!date.trim()) {
      showDialog({ title: 'Error', message: 'Please enter interview date', primaryButton: { text: 'OK' } });
      return;
    }
    if (!time.trim()) {
      showDialog({ title: 'Error', message: 'Please enter interview time', primaryButton: { text: 'OK' } });
      return;
    }
    const dateObj = new Date(`${date}T${time.includes(':') ? time : time + ':00'}`);
    if (Number.isNaN(dateObj.getTime())) {
      showDialog({ title: 'Error', message: 'Please use a valid date and time', primaryButton: { text: 'OK' } });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.updateApplicationStatus(
        jobId,
        applicationId,
        'INTERVIEW_SCHEDULED',
        undefined,
        {
          interviewDate: dateObj.toISOString(),
          interviewLocation: location.trim() || undefined,
          interviewNotes: undefined,
        }
      );
      if (res.success) router.replace('/interview-scheduled');
      else showDialog({ title: 'Error', message: res.error || 'Failed to schedule', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e?.message || 'Failed to schedule', primaryButton: { text: 'OK' } });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const selectedJob = jobs.find((j) => j.id === jobId);
  const selectedApp = applications.find((a) => a.id === applicationId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule new interview</Text>
        <View style={styles.headerBtn} />
      </View>
      <Text style={styles.instruction}>Choose a candidate and set the interview details to move forward in the hiring process.</Text>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.selectRow} onPress={() => setJobPickerOpen(true)} activeOpacity={0.85}>
            <Text style={[styles.selectRowText, !selectedJob && styles.selectRowPlaceholder]} numberOfLines={1}>
              {selectedJob ? selectedJob.title : 'Select job role'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectRow} onPress={() => setCandidatePickerOpen(true)} activeOpacity={0.85}>
            <Text style={[styles.selectRowText, !selectedApp && styles.selectRowPlaceholder]} numberOfLines={1}>
              {selectedApp ? getCandidateName(selectedApp) : 'Select candidate'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Select interview date"
              placeholderTextColor={APP_COLORS.textMuted}
              value={date}
              onChangeText={setDate}
            />
            <Ionicons name="calendar-outline" size={20} color={APP_COLORS.textMuted} />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Select interview time"
              placeholderTextColor={APP_COLORS.textMuted}
              value={time}
              onChangeText={setTime}
            />
            <Ionicons name="time-outline" size={20} color={APP_COLORS.textMuted} />
          </View>
          <View style={[styles.inputRow, styles.inputRowLocation]}>
            <Ionicons name="location-outline" size={20} color={APP_COLORS.textMuted} style={styles.locationIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter interview location"
              placeholderTextColor={APP_COLORS.textMuted}
              value={location}
              onChangeText={setLocation}
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Schedule interview</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={jobPickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setJobPickerOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select job role</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {jobs.map((j) => (
                <TouchableOpacity
                  key={j.id}
                  style={styles.modalOption}
                  onPress={() => { setJobId(j.id); setJobPickerOpen(false); }}
                >
                  <Text style={styles.modalOptionText} numberOfLines={1}>{j.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={candidatePickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCandidatePickerOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select candidate</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {applications.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.modalOption}
                  onPress={() => { setApplicationId(app.id); setCandidatePickerOpen(false); }}
                >
                  <Text style={styles.modalOptionText} numberOfLines={1}>{getCandidateName(app)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const INPUT_BG = '#F3F4F6';
const INPUT_BORDER = '#E8EAED';
const PILL_RADIUS = 24;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  flex1: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: APP_COLORS.white,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  instruction: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    marginBottom: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 4 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: INPUT_BG,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  selectRowText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  selectRowPlaceholder: { color: APP_COLORS.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: INPUT_BG,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  inputRowLocation: {},
  locationIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: APP_COLORS.white, borderRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 12 },
  modalList: { maxHeight: 320 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 4 },
  modalOptionText: { fontSize: 16, color: APP_COLORS.textPrimary },
});
