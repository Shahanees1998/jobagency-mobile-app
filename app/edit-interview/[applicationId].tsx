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

export default function EditInterviewScreen() {
  const params = useLocalSearchParams<{ applicationId: string; jobId?: string }>();
  const applicationId = params.applicationId;
  const jobId = params.jobId || '';
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!jobId || !applicationId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiClient.getJobApplications(jobId, { page: 1, limit: 100 });
        const raw = res.success && res.data ? res.data as any : {};
        const list = Array.isArray(raw.applications) ? raw.applications : Array.isArray(raw) ? raw : [];
        const app = list.find((a: any) => a.id === applicationId);
        setApplication(app);
        if (app?.interviewDate) {
          const d = new Date(app.interviewDate);
          setDate(d.toLocaleDateString('en-CA')); // YYYY-MM-DD
          setTime(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
        }
        if (app?.interviewLocation) setLocation(app.interviewLocation);
      } catch (e) {
        setApplication(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, applicationId]);

  const handleSubmit = async () => {
    if (!jobId || !applicationId) return;
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
      if (res.success) router.replace('/interview-updated');
      else showDialog({ title: 'Error', message: res.error || 'Failed to update', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e?.message || 'Failed to update', primaryButton: { text: 'OK' } });
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

  if (!application) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFound}>Interview not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const jobTitle = application.job?.title || 'Job';
  const candidateName = [application.candidate?.user?.firstName, application.candidate?.user?.lastName].filter(Boolean).join(' ') || application.candidate?.user?.email || 'Candidate';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update existing interview</Text>
        <View style={styles.headerBtn} />
      </View>
      <Text style={styles.instruction}>Update date, time and location as needed.</Text>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Job role</Text>
            <Text style={styles.readOnlyValue}>{jobTitle}</Text>
          </View>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Candidate</Text>
            <Text style={styles.readOnlyValue}>{candidateName}</Text>
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
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update interview.</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: APP_COLORS.textMuted, marginBottom: 16 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.primary },
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
  readOnlyRow: { marginBottom: 12 },
  readOnlyLabel: { fontSize: 12, color: APP_COLORS.textMuted, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, color: APP_COLORS.textPrimary, fontWeight: '500' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary, marginBottom: 8 },
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
