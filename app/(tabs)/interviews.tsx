import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type InterviewItem = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  location: string;
  date: string;
  time: string;
  application: any;
};

export default function EmployerInterviewsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { showDialog } = useDialog();
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterviews = useCallback(async () => {
    try {
      const jobsRes = await apiClient.getEmployerJobs({ page: 1, limit: 50 });
      const jobs = jobsRes.success && jobsRes.data ? (jobsRes.data as any).jobs || [] : [];
      const all: InterviewItem[] = [];
      await Promise.all(
        jobs.map(async (job: any) => {
          const appRes = await apiClient.getJobApplications(job.id, { page: 1, limit: 100 });
          const list = appRes.success && appRes.data ? ((appRes.data as any).applications || appRes.data) : [];
          const arr = Array.isArray(list) ? list : [];
          arr.forEach((app: any) => {
            const status = String(app.status || '').toUpperCase();
            if (status !== 'INTERVIEW_SCHEDULED' && !app.interviewDate) return;
            const candidate = app.candidate?.user || {};
            const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || candidate.email || 'Candidate';
            const d = app.interviewDate ? new Date(app.interviewDate) : null;
            all.push({
              applicationId: app.id,
              jobId: job.id,
              jobTitle: job.title || 'Job',
              candidateName: name,
              location: app.interviewLocation || '—',
              date: d ? d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
              time: d ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—',
              application: app,
            });
          });
        })
      );
      setItems(all);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInterviews();
  };

  const handleDelete = (item: InterviewItem) => {
    showDialog({
      title: 'Delete interview scheduled',
      message: 'Sure you want to delete?',
      primaryButton: {
        text: 'Yes, Delete',
        onPress: async () => {
          try {
            const res = await apiClient.updateApplicationStatus(item.jobId, item.applicationId, 'APPROVED');
            if (res.success) loadInterviews();
            else showDialog({ title: 'Error', message: res.error || 'Failed to delete', primaryButton: { text: 'OK' } });
          } catch (e: any) {
            showDialog({ title: 'Error', message: e?.message || 'Failed to delete', primaryButton: { text: 'OK' } });
          }
        },
      },
      secondaryButton: { text: 'Cancel' },
    });
  };

  const renderItem = ({ item }: { item: InterviewItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
        <View style={styles.cardIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/edit-interview/${item.applicationId}?jobId=${item.jobId}`)} hitSlop={12}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)} hitSlop={12}>
            <Ionicons name="trash-outline" size={24} color={APP_COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.candidateName}>{item.candidateName}</Text>
      <Text style={styles.meta}>{item.location}</Text>
      <Text style={styles.meta}>{item.date} · {item.time}</Text>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Interviews Scheduled</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn} hitSlop={12}>
          <Ionicons name="notifications-outline" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={64} color={APP_COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No interviews have been scheduled yet!!</Text>
          <Text style={styles.emptySubtext}>
            Schedule an interview from a job's candidates to see them here.
          </Text>
          <TouchableOpacity style={styles.scheduleBtn} onPress={() => router.push('/schedule-interview')} activeOpacity={0.85}>
            <Text style={styles.scheduleBtnText}>Schedule interview.</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
        />
      )}
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
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  title: { fontSize: 20, fontWeight: '700', color: APP_COLORS.textPrimary },
  bellBtn: { padding: 4 },
  list: { padding: APP_SPACING.screenPadding, paddingBottom: 24 },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: APP_COLORS.textPrimary, flex: 1 },
  cardIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  candidateName: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textPrimary },
  meta: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 4 },
  empty: { flex: 1, paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 48, alignItems: 'center' },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  emptySubtext: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  scheduleBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: APP_SPACING.borderRadius,
  },
  scheduleBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
});
