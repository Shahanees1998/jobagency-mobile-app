import { JobCard } from '@/components/jobs';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { SavedJobSummary, storage } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type MyJobsTab = 'saved' | 'applied' | 'interviews';

const EMPTY_ICON_BG = '#E8F4FC';

// Candidate: My Jobs with Saved / Applied / Interviews
function CandidateMyJobsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { showDialog } = useDialog();
  const [activeTab, setActiveTab] = useState<MyJobsTab>('saved');
  const [savedJobs, setSavedJobs] = useState<SavedJobSummary[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = React.useRef(false);
  const [withdrawModalApp, setWithdrawModalApp] = useState<any | null>(null);
  const [interviewDetailsVisible, setInterviewDetailsVisible] = useState(false);
  const [selectedInterviewDetails, setSelectedInterviewDetails] = useState<{
    date: string;
    time: string;
    location: string;
  } | null>(null);

  const interviews = applications.filter((a) => {
    const s = String(a?.status || '').toUpperCase();
    return s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW_COMPLETED' || a?.interviewScheduled || a?.interviewDate;
  });
  const savedCount = savedJobs.length;
  const appliedCount = applications.length;
  const interviewsCount = interviews.length;

  const loadSavedJobs = useCallback(async () => {
    const jobs = await storage.getSavedJobs();
    setSavedJobs(jobs);
  }, []);

  const loadApplications = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum > 1) loadingMoreRef.current = true;
      const limit = pageNum === 1 ? 50 : 20;
      const response = await apiClient.getMyApplications({ page: pageNum, limit });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list =
          Array.isArray(raw)
            ? raw
            : (raw?.applications ?? raw?.data?.applications ?? []);
        const totalFromApi = typeof raw?.total === 'number' ? raw.total : (typeof raw?.data?.total === 'number' ? raw.data.total : null);
        const totalPagesFromApi = typeof raw?.totalPages === 'number' ? raw.totalPages : (typeof raw?.data?.totalPages === 'number' ? raw.data.totalPages : null);
        if (__DEV__) {
          console.log('[Applications] loadApplications', {
            pageNum,
            limit,
            listLength: list.length,
            total: totalFromApi,
            totalPages: totalPagesFromApi,
            hasApplicationsKey: !!raw?.applications,
            hasDataApplications: !!raw?.data?.applications,
          });
        }
        if (pageNum === 1) setApplications(list);
        else setApplications((prev) => [...prev, ...list]);
        const totalPages = totalPagesFromApi;
        const total = totalFromApi;
        const more =
          totalPages != null ? pageNum < totalPages
            : total != null ? (pageNum * limit) < total
            : list.length >= limit;
        setHasMore(more);
      } else {
        if (pageNum === 1) setApplications([]);
      }
    } catch (e) {
      if (__DEV__) console.warn('[Applications] loadApplications error', e);
      if (pageNum === 1) setApplications([]);
    } finally {
      if (pageNum > 1) loadingMoreRef.current = false;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      setPage(1);
      await Promise.all([loadSavedJobs(), loadApplications(1)]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSavedJobs, loadApplications]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const loadMore = () => {
    if (activeTab === 'saved') return;
    if (loadingMoreRef.current || loading || !hasMore || applications.length === 0) return;
    const next = page + 1;
    setPage(next);
    loadApplications(next);
  };

  const handleUnsave = useCallback(async (jobId: string) => {
    await storage.removeSavedJobId(jobId);
    setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const applicationToCard = (app: any) => {
    const job = app.job || app;
    const employer = job.employer || {};
    const companyName = employer.companyName ?? job.companyName ?? 'Company';
    const location = job.location ?? employer.location ?? 'Location';
    const benefits = Array.isArray(job.benefits) ? job.benefits : job.perks ? [].concat(job.perks) : [];
    return {
      id: job.id || app.id,
      applicationId: app.id,
      title: job.title || 'Job',
      companyName,
      location,
      benefits: benefits.length ? benefits : ['Health Insurance', 'Paid time off', 'RSU', 'Life insurance', 'Disability insurance'].slice(0, 5),
      companyLogoLetter: (companyName || '?').charAt(0).toUpperCase(),
    };
  };

  const renderSavedJob = ({ item }: { item: SavedJobSummary }) => (
    <JobCard
      title={item.title}
      companyName={item.companyName}
      location={item.location}
      benefits={item.benefits}
      companyLogoLetter={item.companyLogoLetter}
      saved
      onPress={() => router.push(`/job-details/${item.id}`)}
      onBookmark={() => handleUnsave(item.id)}
      onDislike={() => {}}
    />
  );

  const openInterviewDetails = (app: any) => {
    const job = app.job || app;
    const dt = app.interviewDate ? new Date(app.interviewDate) : null;
    const date = dt ? dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : (job.interviewDate || '');
    const time = dt ? dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : (job.interviewTime || '');
    setSelectedInterviewDetails({
      date: date || '—',
      time: time || '—',
      location: app.interviewLocation || job.interviewLocation || '—',
    });
    setInterviewDetailsVisible(true);
  };

  const handleWithdraw = async () => {
    if (!withdrawModalApp) return;
    const appId = withdrawModalApp.id;
    try {
      const job = withdrawModalApp.job || withdrawModalApp;
      const jobId = job.id;
      const response = await apiClient.withdrawApplication(jobId, appId);
      if (response?.success === false) {
        showDialog({ title: 'Error', message: response?.error || 'Failed to withdraw', primaryButton: { text: 'OK' } });
        return;
      }
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      await storage.removeAppliedJobId(jobId);
      setWithdrawModalApp(null);
      showDialog({ title: 'Withdrawn', message: 'Your application has been withdrawn.', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      setWithdrawModalApp(null);
      showDialog({
        title: 'Error',
        message: e?.message || 'Failed to withdraw application. Please try again.',
        primaryButton: { text: 'OK' },
      });
    }
  };

  const renderApplicationJob = ({ item }: { item: any }) => {
    const card = applicationToCard(item);
    const s = String(item?.status || '').toUpperCase();
    const isInterview = s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW_COMPLETED' || item?.interviewScheduled || item?.interviewDate;
    return (
      <View style={styles.appliedCardWrap}>
        <TouchableOpacity
          style={styles.appliedCard}
          onPress={() => router.push(`/job-details/${card.id}`)}
          activeOpacity={0.85}
        >
          <View style={styles.appliedCardHeader}>
            <Text style={styles.appliedCardTitle} numberOfLines={1}>{card.title}</Text>
            <TouchableOpacity
              style={styles.infoIconWrap}
              onPress={(e) => { e.stopPropagation(); router.push(`/job-details/${card.id}`); }}
              hitSlop={8}
            >
              <Ionicons name="information-circle-outline" size={24} color={APP_COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.companyRow}>
            <View style={styles.logoDark}>
              <Text style={styles.logoLetter}>{card.companyLogoLetter}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName} numberOfLines={1}>{card.companyName}</Text>
              <Text style={styles.location} numberOfLines={1}>{card.location}</Text>
            </View>
          </View>
          {isInterview && (
            <TouchableOpacity
              style={styles.interviewInlineBtn}
              onPress={(e) => { e.stopPropagation(); openInterviewDetails(item); }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={16} color={APP_COLORS.primaryDark} style={{ marginRight: 8 }} />
              <Text style={styles.interviewInlineBtnText}>Interview details</Text>
            </TouchableOpacity>
          )}
          {card.benefits && card.benefits.length > 0 && (
            <View style={styles.tags}>
              {card.benefits.slice(0, 5).map((b: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{typeof b === 'string' ? b : (b as any)?.label ?? b}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.appliedCardActions}>
          {isInterview && (
            <TouchableOpacity style={styles.interviewDetailsBtn} onPress={() => openInterviewDetails(item)} activeOpacity={0.85}>
              <Text style={styles.interviewDetailsBtnText}>Interview details</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setWithdrawModalApp(item)} style={styles.withdrawButton} activeOpacity={0.85}>
            <Ionicons name="arrow-undo-outline" size={18} color={APP_COLORS.textSecondary} style={styles.withdrawButtonIcon} />
            <Text style={styles.withdrawButtonText}>Withdraw application</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const tabs: { key: MyJobsTab; label: string; count: number }[] = [
    { key: 'saved', label: 'Saved', count: savedCount },
    { key: 'applied', label: 'Applied', count: appliedCount },
    { key: 'interviews', label: 'Interviews', count: interviewsCount },
  ];

  const currentList = activeTab === 'saved' ? savedJobs : activeTab === 'applied' ? applications : interviews;
  const renderItem = activeTab === 'saved' ? renderSavedJob : renderApplicationJob;
  const keyExtractor = activeTab === 'saved' ? (item: SavedJobSummary) => item.id : (item: any) => item.id;

  const emptySaved = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bookmark-outline" size={48} color={APP_COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No saved jobs yet !!</Text>
      <Text style={styles.emptySubtext}>
        Track jobs you are interested in by saving them. Your saved jobs will appear here.
      </Text>
      <TouchableOpacity style={styles.findJobsBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
        <Text style={styles.findJobsBtnText}>Find jobs</Text>
      </TouchableOpacity>
    </View>
  );

  const emptyApplied = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="paper-plane-outline" size={48} color={APP_COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No applications yet !!</Text>
      <Text style={styles.emptySubtext}>
        All applications you&apos;ve completed on Next Job will appear here.
      </Text>
      <TouchableOpacity style={styles.findJobsBtnFull} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
        <Text style={styles.findJobsBtnText}>Find jobs</Text>
      </TouchableOpacity>
    </View>
  );

  const emptyInterviews = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="calendar-outline" size={48} color={APP_COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No upcoming interviews !!</Text>
      <Text style={styles.emptySubtext}>
        Details of your scheduled interviews, including date, time, and location will be shown here.
      </Text>
      <TouchableOpacity style={styles.findJobsBtnFull} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
        <Text style={styles.findJobsBtnText}>Find jobs</Text>
      </TouchableOpacity>
    </View>
  );

  const emptyComponent =
    activeTab === 'saved' ? emptySaved : activeTab === 'applied' ? emptyApplied : emptyInterviews;

  if (loading && savedJobs.length === 0 && applications.length === 0) {
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Jobs</Text>
          <NotificationBell size={24} style={styles.bellBtn} />
        </View>

        <View style={styles.pillRow}>
          {tabs.map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[styles.pill, activeTab === key && styles.pillActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, activeTab === key && styles.pillTextActive]} numberOfLines={1}>
                {label} {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={currentList}
          renderItem={renderItem as any}
          keyExtractor={keyExtractor as any}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            activeTab !== 'saved' && hasMore && currentList.length > 0 ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                {loading && page > 1 ? (
                  <ActivityIndicator size="small" color={APP_COLORS.primary} />
                ) : (
                  <Text style={{ color: APP_COLORS.textMuted, fontWeight: '600' }}>Pull up for more</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={emptyComponent}
        />

        {/* Withdraw application modal */}
        <Modal visible={!!withdrawModalApp} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setWithdrawModalApp(null)}>
            <Pressable style={styles.withdrawModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.withdrawIconWrap}>
                <Ionicons name="document-text-outline" size={28} color={APP_COLORS.textSecondary} />
              </View>
              <Text style={styles.withdrawModalTitle}>Withdraw application?</Text>
              <Text style={styles.withdrawModalMessage}>
                Your application will be withdrawn. You can reapply to this job later if it is still open.
              </Text>
              <TouchableOpacity style={styles.withdrawConfirmBtn} onPress={handleWithdraw} activeOpacity={0.85}>
                <Text style={styles.withdrawConfirmText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keepApplicationBtn} onPress={() => setWithdrawModalApp(null)} activeOpacity={0.85}>
                <Text style={styles.keepApplicationText}>Keep application</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Interview details popup */}
        <Modal visible={interviewDetailsVisible} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setInterviewDetailsVisible(false)}>
            <Pressable style={styles.interviewModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.interviewIconWrap}>
                <Ionicons name="hand-left-outline" size={32} color={APP_COLORS.white} />
              </View>
              <Text style={styles.interviewModalTitle}>Interview details</Text>
              {selectedInterviewDetails && (
                <>
                  <View style={styles.interviewField}>
                    <Ionicons name="calendar-outline" size={20} color={APP_COLORS.textMuted} style={styles.interviewFieldIcon} />
                    <Text style={styles.interviewFieldText}>{selectedInterviewDetails.date}</Text>
                  </View>
                  <View style={styles.interviewField}>
                    <Ionicons name="time-outline" size={20} color={APP_COLORS.textMuted} style={styles.interviewFieldIcon} />
                    <Text style={styles.interviewFieldText}>{selectedInterviewDetails.time}</Text>
                  </View>
                  <View style={styles.interviewField}>
                    <Ionicons name="location-outline" size={20} color={APP_COLORS.textMuted} style={styles.interviewFieldIcon} />
                    <Text style={[styles.interviewFieldText, styles.interviewFieldMultiline]}>{selectedInterviewDetails.location}</Text>
                  </View>
                </>
              )}
              <TouchableOpacity style={styles.okGreatBtn} onPress={() => setInterviewDetailsVisible(false)} activeOpacity={0.85}>
                <Text style={styles.okGreatBtnText}>Ok, great!</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Employer: Applications Management (unchanged)
function EmployerApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { showDialog } = useDialog();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [appPage, setAppPage] = useState(1);
  const [appHasMore, setAppHasMore] = useState(true);
  const loadingMoreRef = React.useRef(false);
  const [scheduleModalApp, setScheduleModalApp] = useState<any | null>(null);
  const [statusModalApp, setStatusModalApp] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      setAppPage(1);
      loadApplications(selectedJob, 1);
    }
  }, [selectedJob]);

  const loadJobs = async () => {
    try {
      const response = await apiClient.getEmployerJobs();
      if (response.success && response.data) {
        const jobList = response.data.jobs || [];
        setJobs(jobList);
        if (jobList.length > 0 && !selectedJob) setSelectedJob(jobList[0].id);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadApplications = async (jobId: string, pageNum = 1) => {
    setLoading(true);
    try {
      if (pageNum > 1) loadingMoreRef.current = true;
      const response = await apiClient.getJobApplications(jobId, { page: pageNum, limit: 20 });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw) ? raw : raw?.applications ?? [];
        if (pageNum === 1) setApplications(list);
        else setApplications((prev) => [...prev, ...list]);
        const totalPages = typeof raw?.totalPages === 'number' ? raw.totalPages : null;
        setAppHasMore(totalPages ? pageNum < totalPages : list.length >= 20);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedJob) {
      setAppPage(1);
      loadApplications(selectedJob, 1);
    }
  };

  const loadMore = () => {
    if (!selectedJob) return;
    if (loadingMoreRef.current || loading || !appHasMore || applications.length === 0) return;
    const next = appPage + 1;
    setAppPage(next);
    loadApplications(selectedJob, next);
  };

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    if (!selectedJob) return;
    try {
      const response = await apiClient.updateApplicationStatus(selectedJob, applicationId, status);
      if (response.success) loadApplications(selectedJob);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openScheduleModal = (app: any) => {
    setScheduleModalApp(app);
    // Prefill if already scheduled
    const dt = app.interviewDate ? new Date(app.interviewDate) : null;
    setScheduleDate(dt ? dt.toISOString().slice(0, 10) : '');
    setScheduleTime(dt ? dt.toTimeString().slice(0, 5) : '');
    setScheduleLocation(app.interviewLocation || '');
    setScheduleNotes(app.interviewNotes || '');
  };

  const handleScheduleInterview = async () => {
    if (!selectedJob || !scheduleModalApp) return;
    if (!scheduleDate.trim() || !scheduleTime.trim()) {
      showDialog({ title: 'Error', message: 'Please enter date and time', primaryButton: { text: 'OK' } });
      return;
    }
    // Build ISO string in local timezone
    const isoCandidate = `${scheduleDate.trim()}T${scheduleTime.trim()}:00`;
    const dt = new Date(isoCandidate);
    if (Number.isNaN(dt.getTime())) {
      showDialog({ title: 'Error', message: 'Invalid date/time format', primaryButton: { text: 'OK' } });
      return;
    }
    try {
      const response = await apiClient.updateApplicationStatus(
        selectedJob,
        scheduleModalApp.id,
        'INTERVIEW_SCHEDULED',
        undefined,
        {
          interviewDate: dt.toISOString(),
          interviewLocation: scheduleLocation.trim() || undefined,
          interviewNotes: scheduleNotes.trim() || undefined,
        }
      );
      if (response.success) {
        setScheduleModalApp(null);
        showDialog({ title: 'Scheduled', message: 'Interview scheduled successfully.', primaryButton: { text: 'OK' } });
        loadApplications(selectedJob);
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to schedule interview', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to schedule interview', primaryButton: { text: 'OK' } });
    }
  };

  const formatInterviewQuickView = (app: any) => {
    if (!app?.interviewDate) return null;
    try {
      const d = new Date(app.interviewDate);
      const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${date} • ${time}`;
    } catch {
      return null;
    }
  };

  const renderApplicationItem = ({ item }: { item: any }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <View>
          <Text style={styles.candidateName}>
            {item.candidate?.user?.firstName} {item.candidate?.user?.lastName}
          </Text>
          <Text style={styles.candidateEmail}>{item.candidate?.user?.email}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {(String(item.status || '').toUpperCase() === 'INTERVIEW_SCHEDULED' || item.interviewScheduled || item.interviewDate) && (
        <View style={styles.interviewQuickWrap}>
          <View style={styles.interviewBadgeRow}>
            <View style={styles.interviewBadge}>
              <Ionicons name="calendar-outline" size={14} color={APP_COLORS.primaryDark} style={{ marginRight: 6 }} />
              <Text style={styles.interviewBadgeText}>Interview scheduled</Text>
            </View>
            {formatInterviewQuickView(item) ? (
              <Text style={styles.interviewQuickText} numberOfLines={1}>
                {formatInterviewQuickView(item)}
              </Text>
            ) : null}
          </View>
          {item.interviewLocation ? (
            <View style={styles.interviewLocationRow}>
              <Ionicons name="location-outline" size={14} color={APP_COLORS.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.interviewLocationText} numberOfLines={1}>{item.interviewLocation}</Text>
            </View>
          ) : null}
        </View>
      )}
      {item.coverLetter && (
        <Text style={styles.coverLetter} numberOfLines={3}>
          {item.coverLetter}
        </Text>
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => setStatusModalApp(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonSecondaryText}>Change status ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: APP_COLORS.primaryDark }]}
          onPress={() => openScheduleModal(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: APP_COLORS.primary }]}
          onPress={() => router.push(`/application-details/${item.id}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && applications.length === 0) {
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
      <View style={styles.container}>
        <Text style={styles.employerTitle}>Applications</Text>
        {jobs.length > 0 && (
          <View style={styles.jobFilter}>
            <FlatList
              horizontal
              data={jobs}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.jobFilterItem, selectedJob === item.id && styles.jobFilterItemActive]}
                  onPress={() => setSelectedJob(item.id)}
                >
                  <Text style={[styles.jobFilterText, selectedJob === item.id && styles.jobFilterTextActive]}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {jobs.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs yet</Text>
            <Text style={styles.emptySubtext}>Post a job to receive applications.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/post-job')} activeOpacity={0.85}>
              <Text style={styles.emptyButtonText}>Post New Job</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={applications}
              renderItem={renderApplicationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                appHasMore && applications.length > 0 ? (
                  <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                    {loading && appPage > 1 ? (
                      <ActivityIndicator size="small" color={APP_COLORS.primary} />
                    ) : (
                      <Text style={{ color: APP_COLORS.textMuted, fontWeight: '600' }}>Pull up for more</Text>
                    )}
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No applications for this job</Text>
                </View>
              }
            />

            {/* Change status modal */}
            <Modal visible={!!statusModalApp} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setStatusModalApp(null)}>
                <Pressable style={styles.statusModalCard} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.statusIconWrap}>
                    <Ionicons name="swap-vertical" size={26} color={APP_COLORS.primary} />
                  </View>
                  <Text style={styles.statusModalTitle}>Update application status</Text>
                  <Text style={styles.statusModalSubtitle}>
                    Choose the next step for this candidate.
                  </Text>

                  <TouchableOpacity
                    style={styles.statusOption}
                    onPress={() => {
                      if (statusModalApp) handleStatusUpdate(statusModalApp.id, 'REVIEWING');
                      setStatusModalApp(null);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.statusPill, { backgroundColor: '#E5E7EB' }]}>
                      <Text style={[styles.statusPillText, { color: '#374151' }]}>Reviewing</Text>
                    </View>
                    <Text style={styles.statusOptionText}>Keep for now while you review their profile.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusOption}
                    onPress={() => {
                      if (statusModalApp) handleStatusUpdate(statusModalApp.id, 'APPROVED');
                      setStatusModalApp(null);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.statusPill, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.statusPillText, { color: '#166534' }]}>Approve</Text>
                    </View>
                    <Text style={styles.statusOptionText}>Move this candidate forward in your process.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusOption}
                    onPress={() => {
                      if (statusModalApp) handleStatusUpdate(statusModalApp.id, 'REJECTED');
                      setStatusModalApp(null);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.statusPill, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.statusPillText, { color: '#B91C1C' }]}>Reject</Text>
                    </View>
                    <Text style={styles.statusOptionText}>Politely decline this application.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusCancelBtn}
                    onPress={() => setStatusModalApp(null)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.statusCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Schedule interview modal */}
            <Modal visible={!!scheduleModalApp} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setScheduleModalApp(null)}>
                <Pressable style={styles.scheduleModalCard} onPress={(e) => e.stopPropagation()}>
                  <View style={styles.withdrawIconWrap}>
                    <Ionicons name="calendar-outline" size={28} color={APP_COLORS.textSecondary} />
                  </View>
                  <Text style={styles.withdrawModalTitle}>Schedule interview</Text>
                  <Text style={styles.withdrawModalMessage}>
                    Enter date and time (24h) and optional location/notes.
                  </Text>

                  <View style={styles.scheduleRow}>
                    <TextInput
                      style={styles.scheduleInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={APP_COLORS.textMuted}
                      value={scheduleDate}
                      onChangeText={setScheduleDate}
                    />
                    <TextInput
                      style={styles.scheduleInput}
                      placeholder="HH:MM"
                      placeholderTextColor={APP_COLORS.textMuted}
                      value={scheduleTime}
                      onChangeText={setScheduleTime}
                    />
                  </View>
                  <TextInput
                    style={styles.scheduleInputFull}
                    placeholder="Location (optional)"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={scheduleLocation}
                    onChangeText={setScheduleLocation}
                  />
                  <TextInput
                    style={[styles.scheduleInputFull, styles.scheduleNotes]}
                    placeholder="Notes (optional)"
                    placeholderTextColor={APP_COLORS.textMuted}
                    value={scheduleNotes}
                    onChangeText={setScheduleNotes}
                    multiline
                  />

                  <TouchableOpacity style={styles.keepApplicationBtn} onPress={handleScheduleInterview} activeOpacity={0.85}>
                    <Text style={styles.keepApplicationText}>Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.withdrawConfirmBtn} onPress={() => setScheduleModalApp(null)} activeOpacity={0.85}>
                    <Text style={styles.withdrawConfirmText}>Cancel</Text>
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function ApplicationsScreen() {
  const { user } = useAuth();

  if (user?.role === 'CANDIDATE') return <CandidateMyJobsScreen />;
  if (user?.role === 'EMPLOYER') return <EmployerApplicationsScreen />;
  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1, paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 8 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: APP_COLORS.textPrimary },
  bellBtn: { padding: 4 },
  pillRow: { flexDirection: 'row', gap: 4, marginBottom: 20, paddingHorizontal: 2 },
  pill: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    maxWidth: '33%',
  },
  pillActive: { backgroundColor: APP_COLORS.primary },
  pillText: { fontSize: 11, fontWeight: '600', color: APP_COLORS.textPrimary, flexShrink: 1 },
  pillTextActive: { color: APP_COLORS.white },
  list: { paddingBottom: 24 },
  emptyContainer: { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: EMPTY_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  emptySubtext: { fontSize: 14, color: APP_COLORS.textMuted, marginTop: 8, textAlign: 'center' },
  findJobsBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: APP_SPACING.borderRadius,
    marginTop: 24,
  },
  findJobsBtnFull: {
    width: '100%',
    backgroundColor: APP_COLORS.primary,
    height: 52,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  findJobsBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
  appliedCardWrap: { marginBottom: 12 },
  appliedCard: {
    backgroundColor: '#E8EEF2',
    borderRadius: APP_SPACING.borderRadiusLg,
    padding: APP_SPACING.itemPadding,
  },
  appliedCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  appliedCardTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, flex: 1, marginRight: 8 },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: EMPTY_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDark: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoLetter: { color: APP_COLORS.white, fontSize: 18, fontWeight: '700' },
  companyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  companyInfo: { flex: 1, minWidth: 0 },
  companyName: { fontSize: 15, color: APP_COLORS.textPrimary, fontWeight: '500' },
  location: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: APP_COLORS.surfaceGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 12, color: APP_COLORS.textSecondary, fontWeight: '500', maxWidth: 120 },
  interviewInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(13,148,136,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.22)',
    marginBottom: 10,
  },
  interviewInlineBtnText: { fontSize: 13, fontWeight: '700', color: APP_COLORS.primaryDark },
  appliedCardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingHorizontal: 4 },
  interviewDetailsBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: APP_SPACING.borderRadius,
  },
  interviewDetailsBtnText: { color: APP_COLORS.white, fontSize: 14, fontWeight: '600' },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: APP_SPACING.borderRadius,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  withdrawButtonIcon: { marginRight: 6 },
  withdrawButtonText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  withdrawModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  withdrawIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  withdrawModalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  withdrawModalMessage: { fontSize: 15, color: APP_COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  withdrawConfirmBtn: {
    width: '100%',
    height: 48,
    backgroundColor: APP_COLORS.background,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  withdrawConfirmText: { color: APP_COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  keepApplicationBtn: {
    width: '100%',
    height: 48,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepApplicationText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
  interviewModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  interviewIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  interviewModalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 20, textAlign: 'center' },
  interviewField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  interviewFieldIcon: { marginRight: 12, marginTop: 2 },
  interviewFieldText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  interviewFieldMultiline: { flex: 1 },
  okGreatBtn: {
    width: '100%',
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  okGreatBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
  emptyButton: { backgroundColor: APP_COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, marginTop: 16 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  applicationCard: { padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.background },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  candidateName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 4 },
  candidateEmail: { fontSize: 14, color: APP_COLORS.textMuted },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: APP_COLORS.surfaceGray },
  statusText: { color: APP_COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
  interviewQuickWrap: {
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  interviewBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  interviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(13,148,136,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.25)',
  },
  interviewBadgeText: { fontSize: 12, fontWeight: '700', color: APP_COLORS.primaryDark },
  interviewQuickText: { flex: 1, marginLeft: 10, fontSize: 12, fontWeight: '700', color: APP_COLORS.textSecondary, textAlign: 'right' },
  interviewLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  interviewLocationText: { flex: 1, fontSize: 12, color: APP_COLORS.textMuted },
  coverLetter: { fontSize: 14, marginTop: 8, color: APP_COLORS.textSecondary },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionButtonSecondary: {
    flex: 1.2,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  actionButtonSecondaryText: { fontSize: 13, fontWeight: '700', color: APP_COLORS.textSecondary },
  jobFilter: { marginBottom: 16 },
  jobFilterItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: APP_COLORS.surfaceGray },
  jobFilterItemActive: { backgroundColor: APP_COLORS.primary },
  jobFilterText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary },
  jobFilterTextActive: { color: APP_COLORS.white },
  employerTitle: { fontSize: 28, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 16 },
  scheduleModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  scheduleRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 },
  scheduleInput: {
    flex: 1,
    height: 48,
    borderRadius: APP_SPACING.borderRadius,
    backgroundColor: APP_COLORS.surfaceGray,
    paddingHorizontal: 14,
    fontSize: 15,
    color: APP_COLORS.textPrimary,
  },
  scheduleInputFull: {
    width: '100%',
    height: 48,
    borderRadius: APP_SPACING.borderRadius,
    backgroundColor: APP_COLORS.surfaceGray,
    paddingHorizontal: 14,
    fontSize: 15,
    color: APP_COLORS.textPrimary,
    marginBottom: 12,
  },
  scheduleNotes: {
    height: 84,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  statusModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusModalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 4 },
  statusModalSubtitle: { fontSize: 14, color: APP_COLORS.textMuted, marginBottom: 12 },
  statusOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  statusOptionText: { fontSize: 13, color: APP_COLORS.textSecondary },
  statusCancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusCancelText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary },
});
