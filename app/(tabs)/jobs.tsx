import { EmployerJobCard, JobCard } from '@/components/jobs';
import { InfoPopup } from '@/components/ui/InfoPopup';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { APP_COLORS, TAB_BAR } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { imageUriForDisplay } from '@/lib/imageUri';
import { SavedJobSummary, storage } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

function applicationToCard(app: any) {
  const job = app.job || app;
  const employer = job.employer || {};
  const companyName = employer.companyName ?? job.companyName ?? 'Company';
  const location = job.location ?? employer.location ?? 'Location';
  let benefits: string[] = [];
  if (Array.isArray(job.benefits)) benefits = job.benefits;
  else if (job.perks) benefits = [].concat(job.perks);
  else if (typeof job.benefits === 'string') {
    try { const p = JSON.parse(job.benefits); benefits = Array.isArray(p) ? p : []; } catch { benefits = job.benefits ? [job.benefits] : []; }
  }
  const companyLogoUrl = imageUriForDisplay(employer.companyLogo) ?? undefined;
  return {
    id: job.id || app.id,
    title: job.title || 'Job',
    companyName,
    location,
    benefits,
    companyLogoLetter: (companyName || '?').charAt(0).toUpperCase(),
    companyLogoUrl,
  };
}

function CandidateMyJobsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const [activeTab, setActiveTab] = useState<'Saved' | 'Applied' | 'Interviews'>('Saved');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const { showDialog } = useDialog();

  const [savedJobs, setSavedJobs] = useState<SavedJobSummary[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const interviews = applications.filter((a) => {
    const s = String(a?.status || '').toUpperCase();
    return s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW_COMPLETED' || a?.interviewScheduled || a?.interviewDate;
  });

  const counts = {
    Saved: savedJobs.length,
    Applied: applications.length,
    Interviews: interviews.length,
  };

  const loadSavedJobs = useCallback(async () => {
    const jobs = await storage.getSavedJobs();
    setSavedJobs(jobs);
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const response = await apiClient.getMyApplications({ page: 1, limit: 50 });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw) ? raw : (raw?.applications ?? raw?.data?.applications ?? []);
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadSavedJobs(), loadApplications()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSavedJobs, loadApplications]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleRemoveApplied = (item: any) => {
    setSelectedApplication(item);
    setWithdrawModalVisible(true);
  };

  const handleShowInterviewDetails = (item: any) => {
    setSelectedInterview(item);
    setInterviewModalVisible(true);
  };

  const onWithdraw = async () => {
    const app = selectedApplication;
    setWithdrawModalVisible(false);
    setSelectedApplication(null);
    if (!app) return;
    const jobId = app.job?.id || app.id;
    const applicationId = app.id;
    try {
      const response = await apiClient.withdrawApplication(jobId, applicationId);
      if (response?.success === false) {
        showDialog({ title: 'Error', message: response?.error || 'Failed to withdraw', primaryButton: { text: 'OK' } });
        return;
      }
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      await storage.removeAppliedJobId(jobId);
      showDialog({ title: 'Withdrawn', message: 'Your application has been withdrawn.', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({
        title: 'Error',
        message: e?.message || 'Failed to withdraw application. Please try again.',
        primaryButton: { text: 'OK' },
      });
    }
  };

  const onInterviewOk = () => {
    setInterviewModalVisible(false);
    setSelectedInterview(null);
  };

  const renderInterviewDetails = () => (
    <View style={styles.interviewDetailsBox}>
      <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>
          <Ionicons name="briefcase-outline" size={18} color="#031019" />
        </View>
        <Text style={styles.detailText}>12/03/2026</Text>
      </View>
      <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>
          <Ionicons name="time-outline" size={18} color="#031019" />
        </View>
        <Text style={styles.detailText}>10:00 AM</Text>
      </View>
      <View style={styles.detailRow}>
        <View style={[styles.detailIconBox, { backgroundColor: '#8692A6' }]}>
          <Ionicons name="map-outline" size={18} color="#FFF" />
        </View>
        <Text style={styles.detailText}>Building 4, Sector 7, Silicon Valley</Text>
      </View>
    </View>
  );

  const renderTab = (label: 'Saved' | 'Applied' | 'Interviews') => {
    const isActive = activeTab === label;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(label)}
        style={[
          styles.tabPill,
          isActive ? styles.tabPillActive : styles.tabPillInactive
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {counts[label]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    let title = '';
    let subtext = '';
    if (activeTab === 'Saved') {
      title = 'No saved jobs yet !!';
      subtext = 'Track jobs you are interested in by saving them. Your saved jobs will appear here.';
    } else if (activeTab === 'Applied') {
      title = 'No applications yet !!';
      subtext = 'Apply for jobs to see them here. Your application history will appear here.';
    } else {
      title = 'No interviews yet !!';
      subtext = 'Stay tuned! Your scheduled interviews will appear here.';
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="desktop-outline" size={48} color="#000" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtext}>{subtext}</Text>
        <TouchableOpacity
          style={styles.findJobsBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.findJobsBtnText}>Find jobs</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getActiveData = () => {
    if (activeTab === 'Saved') return savedJobs;
    if (activeTab === 'Applied') return applications;
    return interviews;
  };

  const data = getActiveData();
  const isAppliedOrInterviews = activeTab === 'Applied' || activeTab === 'Interviews';

  if (loading && savedJobs.length === 0 && applications.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Jobs</Text>
          </View>
        </SafeAreaView>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <View style={styles.iconSquare}>
            <NotificationBell size={20} color="#000" />
          </View>
        </View>
        <View style={styles.tabsRow}>
          {renderTab('Saved')}
          {renderTab('Applied')}
          {renderTab('Interviews')}
        </View>
      </SafeAreaView>

      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => (isAppliedOrInterviews ? (item.job?.id || item.id) : item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          renderItem={({ item }) => {
            const card = isAppliedOrInterviews ? applicationToCard(item) : item;
            const jobId = isAppliedOrInterviews ? (item.job?.id || item.id) : item.id;
            return (
              <View style={styles.cardMargin}>
                <JobCard
                  title={card.title}
                  companyName={card.companyName}
                  location={card.location}
                  benefits={Array.isArray(card.benefits) ? card.benefits : []}
                  companyLogoLetter={card.companyLogoLetter}
                  companyLogoUrl={card.companyLogoUrl}
                  saved={activeTab === 'Saved'}
                  showRemoveIcon={activeTab === 'Applied'}
                  hideDislike={activeTab === 'Applied' || activeTab === 'Interviews'}
                  hideBookmark={activeTab === 'Interviews'}
                  footerButton={activeTab === 'Interviews' ? {
                    text: 'Interview Details',
                    onPress: () => {
                      handleShowInterviewDetails(item);
                    }
                  } : undefined}
                  onPress={() => router.push(`/job-details/${jobId}`)}
                  onBookmark={() => {
                    if (activeTab === 'Saved') {
                      storage.removeSavedJobId(jobId).then(() => setSavedJobs((prev) => prev.filter((j) => j.id !== jobId)));
                    } else if (activeTab === 'Applied') {
                      handleRemoveApplied(item);
                    }
                  }}
                  onDislike={() => { }}
                />
              </View>
            );
          }}
        />
      ) : renderEmptyState()}

      <InfoPopup
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        icon="trash-outline"
        title="Withdraw your application?"
        message="Once your application is approved, you'll be able to view employer details and interview locations."
        buttonText="Withdraw application"
        onButtonPress={onWithdraw}
        primaryVariant="danger"
        secondaryButton={{
          text: 'Keep application',
          onPress: () => setWithdrawModalVisible(false),
        }}
      />

      <InfoPopup
        visible={interviewModalVisible}
        onClose={() => { setInterviewModalVisible(false); setSelectedInterview(null); }}
        icon="calendar"
        iconBgColor="#72A4BF"
        title="Interview Details"
        message="Your interview has been scheduled! Please find the details below."
        buttonText="Ok, great!"
        onButtonPress={onInterviewOk}
      >
        {renderInterviewDetails()}
      </InfoPopup>
    </View>
  );
}

function EmployerJobsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { user } = useAuth();
  const userData = user as any;
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = React.useRef(false);

  useEffect(() => {
    loadJobs(1);
  }, []);

  const loadJobs = async (pageNum = 1) => {
    try {
      if (pageNum > 1) loadingMoreRef.current = true;
      const response = await apiClient.getEmployerJobs({ page: pageNum, limit: 20 });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = raw?.jobs || [];
        if (pageNum === 1) setJobs(list);
        else setJobs((prev) => [...prev, ...list]);
        const totalPages = typeof raw?.totalPages === 'number' ? raw.totalPages : null;
        setHasMore(totalPages ? pageNum < totalPages : list.length >= 20);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadJobs(1);
  };

  const loadMore = () => {
    if (loadingMoreRef.current || loading || !hasMore || jobs.length === 0) return;
    const next = page + 1;
    setPage(next);
    loadJobs(next);
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <EmployerJobCard
      title={item.title}
      companyName={userData?.companyName || 'My Company'}
      location={item.location || 'Remote'}
      benefits={item.benefits || []}
      companyLogoLetter={userData?.companyName?.charAt(0)}
      onPress={() => router.push(`/job-details/${item.id}`)}
      onEdit={() => router.push(`/post-job?id=${item.id}`)}
      onDelete={() => { /* Handle delete */ }}
    />
  );

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/post-job')}
          >
            <Ionicons name="add" size={24} color="#031019" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.employerEmpty}>
            <Text style={styles.emptyTitle}>No jobs posted yet</Text>
            <Text style={styles.emptySubtext}>Post a job to start receiving applications.</Text>
            <TouchableOpacity
              style={styles.findJobsBtn}
              onPress={() => router.push('/post-job')}
              activeOpacity={0.85}
            >
              <Text style={styles.findJobsBtnText}>Post New Job</Text>
            </TouchableOpacity>
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          hasMore && jobs.length > 0 ? (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              {loading && page > 1 ? (
                <ActivityIndicator size="small" color={APP_COLORS.primary} />
              ) : (
                <Text style={{ color: APP_COLORS.textMuted, fontWeight: '600' }}>Pull up for more</Text>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

export default function JobsScreenSwitch() {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYER') return <EmployerJobsScreen />;
  return <CandidateMyJobsScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Kanit',
    fontSize: 24,
    fontWeight: '700',
    color: '#031019',
  },
  headerIconBtn: {
    padding: 2,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F2F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EE',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EE',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    height: 36,
    borderRadius: 18,
    gap: 3,
    minWidth: 0,
    maxWidth: '33%',
  },
  tabPillActive: {
    backgroundColor: '#1E4154', // Selected
  },
  tabPillInactive: {
    backgroundColor: '#F2F7FB', // Unselected
  },
  tabText: {
    fontFamily: 'Kanit',
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#031019',
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
  },
  badgeInactive: {
    backgroundColor: '#1E4154',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#1E4154',
  },
  badgeTextInactive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cardMargin: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  employerEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#72A4BF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E4154',
    marginBottom: 40,
  },
  emptyTitle: {
    fontFamily: 'Kanit',
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  emptySubtext: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '300',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 48,
  },
  findJobsBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E4154',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findJobsBtnText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  interviewDetailsBox: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F7FB',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EE',
  },
  detailText: {
    fontFamily: 'Kanit',
    fontSize: 14,
    color: '#031019',
    fontWeight: '500',
    flex: 1,
  },
});
