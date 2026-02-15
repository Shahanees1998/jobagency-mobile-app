import { EmployerJobCard, JobCard } from '@/components/jobs';
import { InfoPopup } from '@/components/ui/InfoPopup';
import { APP_COLORS } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_SAVED_JOBS = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    companyName: 'Zoox Pvt. Ltd.',
    location: 'Sunnyvale, CA 94089',
    benefits: ['Health Insurance', 'Paid time off', 'RSU', 'Life insurance', 'Disability insurance'],
    companyLogoLetter: 'Z',
  },
  {
    id: '2',
    title: 'Junior Software Engineer',
    companyName: 'BA House Cleaning',
    location: 'Richmond, TX 27501',
    benefits: ['Parental leave', 'Paid time off', 'RSU', 'Health insurance', 'Food Provided'],
    companyLogoLetter: 'B',
  }
];

const DUMMY_APPLIED_JOBS = [
  {
    id: 'a1',
    title: 'Mobile App Developer',
    companyName: 'Tech Innovators',
    location: 'Austin, TX',
    benefits: ['Remote', 'Health Care', 'Stock Options'],
    companyLogoLetter: 'T',
  },
  {
    id: 'a2',
    title: 'UI/UX Designer',
    companyName: 'Creative Minds',
    location: 'Remote',
    benefits: ['Flexible Hours', 'Learning Stipend'],
    companyLogoLetter: 'C',
  }
];

const DUMMY_INTERVIEW_JOBS = [
  {
    id: 'i1',
    title: 'Full Stack Engineer',
    companyName: 'Cloud Systems',
    location: 'San Francisco, CA',
    benefits: ['Daily Lunch', 'Gym Membership'],
    companyLogoLetter: 'C',
  },
  {
    id: 'i2',
    title: 'Product Designer',
    companyName: 'Creative Studio',
    location: 'New York, NY',
    benefits: ['Flexible Hours', 'L&D Budget'],
    companyLogoLetter: 'C',
  }
];

function CandidateMyJobsScreen() {
  const [activeTab, setActiveTab] = useState<'Saved' | 'Applied' | 'Interviews'>('Saved');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const { showDialog } = useDialog();

  // Counts for the badges
  const counts = {
    Saved: DUMMY_SAVED_JOBS.length,
    Applied: DUMMY_APPLIED_JOBS.length,
    Interviews: DUMMY_INTERVIEW_JOBS.length,
  };

  const handleRemoveApplied = (item: any) => {
    setSelectedJob(item);
    setWithdrawModalVisible(true);
  };

  const handleShowInterviewDetails = (item: any) => {
    setSelectedInterview(item);
    setInterviewModalVisible(true);
  };

  const onWithdraw = () => {
    console.log('Withdrawn application:', selectedJob?.id);
    setWithdrawModalVisible(false);
    setSelectedJob(null);
  };

  const onInterviewOk = () => {
    setInterviewModalVisible(false);
    if (selectedInterview) {
      router.push({
        pathname: `/job-details/${selectedInterview.id}`,
        params: { expandDescription: 'true', viewMode: 'company' }
      } as any);
    }
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
        <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
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
    if (activeTab === 'Saved') return DUMMY_SAVED_JOBS;
    if (activeTab === 'Applied') return DUMMY_APPLIED_JOBS;
    return DUMMY_INTERVIEW_JOBS;
  };

  const data = getActiveData();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.iconSquare}>
              <Ionicons name="notifications-outline" size={20} color="#000" />
            </View>
          </TouchableOpacity>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardMargin}>
              <JobCard
                title={item.title}
                companyName={item.companyName}
                location={item.location}
                benefits={item.benefits}
                companyLogoLetter={item.companyLogoLetter}
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
                onPress={() => router.push(`/job-details/${item.id}`)}
                onBookmark={() => {
                  if (activeTab === 'Applied') {
                    handleRemoveApplied(item);
                  }
                }}
                onDislike={() => { }}
              />
            </View>
          )}
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
        onClose={() => setWithdrawModalVisible(false)}
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
        contentContainerStyle={styles.list}
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
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#1E4154', // Selected
  },
  tabPillInactive: {
    backgroundColor: '#F2F7FB', // Unselected
  },
  tabText: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#031019',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 11,
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
