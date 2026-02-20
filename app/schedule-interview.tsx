import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule new interview</Text>
        <View style={styles.headerBtn} />
      </View>
      <Text style={styles.instruction}>Select job, candidate, date, time and location.</Text>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={styles.label}>Select job role</Text>
            <View style={styles.pickerWrap}>
              {jobs.map((j) => (
                <TouchableOpacity
                  key={j.id}
                  style={[styles.chip, jobId === j.id && styles.chipActive]}
                  onPress={() => setJobId(j.id)}
                >
                  <Text style={[styles.chipText, jobId === j.id && styles.chipTextActive]} numberOfLines={1}>{j.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Select candidate</Text>
            <View style={styles.pickerWrap}>
              {applications.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.chip, applicationId === app.id && styles.chipActive]}
                  onPress={() => setApplicationId(app.id)}
                >
                  <Text style={[styles.chipText, applicationId === app.id && styles.chipTextActive]} numberOfLines={1}>{getCandidateName(app)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Select interview date</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="calendar-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 15/02/2026"
                placeholderTextColor={APP_COLORS.textMuted}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Select interview time</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="time-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 11:00 AM"
                placeholderTextColor={APP_COLORS.textMuted}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Enter interview location</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={20} color={APP_COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Office address or video link"
                placeholderTextColor={APP_COLORS.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Schedule interview.</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  instruction: { fontSize: 13, color: APP_COLORS.textSecondary, paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 12, marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 8 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary, marginBottom: 8 },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  chipActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  chipText: { fontSize: 14, color: APP_COLORS.textSecondary },
  chipTextActive: { color: APP_COLORS.white },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  primaryBtn: {
    height: 54,
    borderRadius: APP_SPACING.borderRadiusLg,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
