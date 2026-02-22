import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
  candidateLocation: string;
  candidateAvatarUrl?: string;
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
              candidateLocation: app.candidate?.location || candidate.city || '—',
              candidateAvatarUrl: candidate.profileImage || app.candidate?.profileImage,
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

  const getInitial = (name: string) => (name && name[0]) ? name.trim().split(/\s/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() : '?';

  const renderItem = ({ item }: { item: InterviewItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
        <View style={styles.cardIcons}>
          <TouchableOpacity
            style={styles.iconBtnEdit}
            onPress={() => router.push(`/edit-interview/${item.applicationId}?jobId=${item.jobId}`)}
            hitSlop={12}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={15} color={APP_COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnDelete}
            onPress={() => handleDelete(item)}
            hitSlop={12}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={15} color={APP_COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.candidateRow}>
        <View style={styles.avatarWrap}>
          {item.candidateAvatarUrl ? (
            <Image source={{ uri: item.candidateAvatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarLetter}>{getInitial(item.candidateName)}</Text>
          )}
        </View>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName} numberOfLines={1}>{item.candidateName}</Text>
          <Text style={styles.candidateLocation} numberOfLines={1}>{item.candidateLocation}</Text>
        </View>
      </View>
      <View style={styles.pillRow}>
        <View style={[styles.pill, styles.pillHalf]}>
          <Ionicons name="calendar-outline" size={18} color={APP_COLORS.textPrimary} style={styles.pillIcon} />
          <Text style={styles.pillText} numberOfLines={1}>{item.date}</Text>
        </View>
        <View style={[styles.pill, styles.pillHalf]}>
          <Ionicons name="time-outline" size={18} color={APP_COLORS.textPrimary} style={styles.pillIcon} />
          <Text style={styles.pillText} numberOfLines={1}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.pill}>
        <Ionicons name="location-outline" size={18} color={APP_COLORS.textPrimary} style={styles.pillIcon} />
        <Text style={styles.pillText} numberOfLines={1}>{item.location}</Text>
      </View>
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
            Schedule an interview from a job{'\u2019'}s candidates to see them here.
          </Text>
          <TouchableOpacity style={styles.scheduleBtn} onPress={() => router.push('/schedule-interview')} activeOpacity={0.85}>
            <Text style={styles.scheduleBtnText}>Schedule interview.</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.applicationId}
            contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom + 72 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const CARD_BG = '#72A4BF26';
const PILL_RADIUS = 10;

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
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDE4E9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, flex: 1, marginRight: 12 },
  cardIcons: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconBtnEdit: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDelete: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: APP_COLORS.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 0 },
  avatarLetter: { fontSize: 14, fontWeight: '700', color: APP_COLORS.white },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 14, fontWeight: '500', color: APP_COLORS.textPrimary },
  candidateLocation: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    borderRadius: PILL_RADIUS,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillHalf: { flex: 1 },
  pillIcon: { marginRight: 10 },
  pillText: { fontSize: 12, fontWeight: '700', color: APP_COLORS.textPrimary, flex: 1 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
