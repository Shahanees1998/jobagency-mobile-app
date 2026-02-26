import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
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

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function EditInterviewScreen() {
  const params = useLocalSearchParams<{ applicationId: string; jobId?: string }>();
  const applicationId = params.applicationId;
  const jobId = params.jobId || '';
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [interviewDateTime, setInterviewDateTime] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
          setInterviewDateTime(new Date(app.interviewDate));
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
    if (!interviewDateTime) {
      showDialog({ title: 'Error', message: 'Please select interview date and time', primaryButton: { text: 'OK' } });
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
          interviewDate: interviewDateTime.toISOString(),
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
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.selectRow}>
            <Text style={styles.selectRowText} numberOfLines={1}>{jobTitle}</Text>
          </View>
          <View style={styles.selectRow}>
            <Text style={styles.selectRowText} numberOfLines={1}>{candidateName}</Text>
          </View>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.85}>
            <Text style={[styles.selectRowText, !interviewDateTime && styles.selectRowPlaceholder]} numberOfLines={1}>
              {interviewDateTime ? formatDateLabel(interviewDateTime) : 'Select interview date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={APP_COLORS.textMuted} />
          </TouchableOpacity>
          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal visible transparent animationType="slide">
                <Pressable style={styles.pickerModalOverlay} onPress={() => setShowDatePicker(false)}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={12}>
                        <Text style={styles.pickerModalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={interviewDateTime ?? new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, selectedDate) => {
                        if (selectedDate) {
                          setInterviewDateTime((prev) => {
                            const d = selectedDate;
                            if (prev) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes(), 0, 0);
                            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
                          });
                        }
                      }}
                    />
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={interviewDateTime ?? new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setInterviewDateTime((prev) => {
                      const d = selectedDate;
                      if (prev) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes(), 0, 0);
                      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
                    });
                  }
                }}
              />
            )
          )}
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowTimePicker(true)} activeOpacity={0.85}>
            <Text style={[styles.selectRowText, !interviewDateTime && styles.selectRowPlaceholder]} numberOfLines={1}>
              {interviewDateTime ? formatTimeLabel(interviewDateTime) : 'Select interview time'}
            </Text>
            <Ionicons name="time-outline" size={20} color={APP_COLORS.textMuted} />
          </TouchableOpacity>
          {showTimePicker && (
            Platform.OS === 'ios' ? (
              <Modal visible transparent animationType="slide">
                <Pressable style={styles.pickerModalOverlay} onPress={() => setShowTimePicker(false)}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)} hitSlop={12}>
                        <Text style={styles.pickerModalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={interviewDateTime ?? new Date()}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={(_, selectedTime) => {
                        if (selectedTime) {
                          setInterviewDateTime((prev) => {
                            const t = selectedTime;
                            const base = prev ?? new Date();
                            return new Date(base.getFullYear(), base.getMonth(), base.getDate(), t.getHours(), t.getMinutes(), 0, 0);
                          });
                        }
                      }}
                    />
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={interviewDateTime ?? new Date()}
                mode="time"
                display="default"
                is24Hour={false}
                onChange={(_, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setInterviewDateTime((prev) => {
                      const t = selectedTime;
                      const base = prev ?? new Date();
                      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), t.getHours(), t.getMinutes(), 0, 0);
                    });
                  }
                }}
              />
            )
          )}
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
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update interview</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerModalContent: { backgroundColor: APP_COLORS.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 34 },
  pickerModalHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pickerModalDone: { fontSize: 17, fontWeight: '600', color: APP_COLORS.primary },
});
