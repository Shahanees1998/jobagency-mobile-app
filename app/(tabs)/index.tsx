import { EmployerJobCard, JobCard } from '@/components/jobs';
import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { storage, type JobFilters } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

function CandidateJobsScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobFilters | null>(null);
  const loadingMoreRef = useRef(false);

  const firstName = user?.firstName || 'there';

  const loadSavedIds = useCallback(async () => {
    const ids = await storage.getSavedJobIds();
    setSavedJobIds(ids);
  }, []);

  const loadFilters = useCallback(async () => {
    const f = await storage.getJobFilters();
    setFilters(f);
    return f;
  }, []);

  const loadJobs = useCallback(async (pageNum = 1, search = '', filterOverride?: JobFilters | null) => {
    const f = filterOverride ?? filters;
    console.log('[Home] loadJobs called, page:', pageNum, 'search:', search, 'filters:', f);
    if (pageNum > 1) {
      loadingMoreRef.current = true;
      setLoading(true);
    }
    const employmentType = f?.jobType?.length ? f.jobType : undefined;
    try {
      const response = await apiClient.getJobs({
        page: pageNum,
        limit: 20,
        search: search || undefined,
        employmentType,
        datePosted: (f?.datePosted ?? 'all') as any,
        sortBy: (f?.sortBy ?? 'relevance') as any,
        remote: Array.isArray(f?.remote) ? f!.remote : undefined,
        experienceLevel: f?.experienceLevel && f.experienceLevel !== 'all' ? f.experienceLevel : undefined,
        salary: f?.salary && f.salary !== 'all' ? f.salary : undefined,
        education: f?.education && f.education !== 'all' ? f.education : undefined,
      });
      console.log('[Home] getJobs response:', response.success, 'data keys:', response.data ? Object.keys(response.data as object) : null);

      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw?.jobs) ? raw.jobs : Array.isArray(raw) ? raw : [];
        const total = typeof raw?.total === 'number' ? raw.total : null;
        const totalPages = typeof raw?.totalPages === 'number' ? raw.totalPages : null;
        const limit = 20;

        if (pageNum === 1) {
          setJobs(list);
        } else {
          setJobs((prev) => [...prev, ...list]);
        }
        if (totalPages !== null) {
          setHasMore(pageNum < totalPages);
        } else if (total !== null) {
          setHasMore(pageNum * limit < total);
        } else {
          setHasMore(list.length >= limit);
        }
        console.log('[Home] jobs set, count:', list.length, 'hasMore:', pageNum === 1 ? (list.length >= limit) : 'n/a');
      } else {
        console.log('[Home] getJobs not success or no data:', response);
      }
    } catch (error) {
      console.error('[Home] Error loading jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
      console.log('[Home] loadJobs done, setLoading(false)');
    }
  }, [filters]);

  useEffect(() => {
    loadSavedIds();
  }, [loadSavedIds]);

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      console.log('[Home] useFocusEffect: focus, loading filters...');
      loadFilters().then((f) => {
        console.log('[Home] loadFilters resolved, isFocused:', isFocused, 'filters:', f);
        if (!isFocused) return;
        setFilters(f ?? null);
        setPage(1);
        loadJobs(1, searchQuery, f ?? undefined);
      });
      return () => {
        isFocused = false;
        console.log('[Home] useFocusEffect: blur');
      };
    }, [loadFilters, loadJobs, searchQuery])
  );

  useEffect(() => {
    loadFilters().then((f) => {
      if (f) setFilters(f);
    });
  }, [loadFilters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadFilters().then((f) => loadJobs(1, searchQuery, f));
  }, [searchQuery, loadJobs, loadFilters]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || !hasMore || jobs.length === 0) return;
    const next = page + 1;
    setPage(next);
    loadJobs(next, searchQuery);
  }, [loading, hasMore, page, searchQuery, jobs.length, loadJobs]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
    setLoading(true);
    loadJobs(1, q);
  }, [loadJobs]);

  const openFilters = useCallback(() => {
    router.push('/job-filters');
  }, []);

  const mapJobToCard = (item: any) => {
    const benefits = item.benefits
      ? (Array.isArray(item.benefits) ? item.benefits : [item.benefits])
      : [];
    if (!benefits.length && item.perks) {
      benefits.push(...(Array.isArray(item.perks) ? item.perks : [item.perks]));
    }
    const fallbackBenefits = [
      'Health Insurance',
      'Paid time off',
      'RSU',
      'Life insurance',
      'Disability insurance',
    ];
    return {
      id: item.id,
      title: item.title || 'Job Title',
      companyName: item.employer?.companyName || item.companyName || 'Company',
      location: item.location || item.employer?.location || 'Location',
      benefits: benefits.length ? benefits : fallbackBenefits.slice(0, 5),
      companyLogoLetter: item.employer?.companyName?.charAt(0) || item.companyName?.charAt(0),
    };
  };

  const isCandidate = user?.role === 'CANDIDATE';

  /** Save (bookmark) – local storage only */
  const toggleSaved = useCallback(async (item: any) => {
    const jobId = item.id;
    const currentlySaved = savedJobIds.includes(jobId);
    if (currentlySaved) {
      await storage.removeSavedJobId(jobId);
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
    } else {
      const summary = mapJobToCard(item);
      await storage.addSavedJob({
        id: summary.id,
        title: summary.title,
        companyName: summary.companyName,
        location: summary.location,
        benefits: summary.benefits,
        companyLogoLetter: summary.companyLogoLetter,
      });
      setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
    }
  }, [savedJobIds]);

  /** Like – API only (candidate) */
  const toggleLike = useCallback(async (item: any) => {
    if (user?.role !== 'CANDIDATE') return;
    const jobId = item.id;
    const currentlyLiked = item.saved === true;
    try {
      if (currentlyLiked) {
        const res = await apiClient.unsaveJob(jobId);
        if (res.success)
          setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, saved: false } : j)));
      } else {
        const res = await apiClient.saveJob(jobId);
        if (res.success)
          setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, saved: true } : j)));
      }
    } catch (e) {
      console.error('Toggle like failed:', e);
    }
  }, [user?.role]);

  const renderJob = ({ item }: { item: any }) => {
    const card = mapJobToCard(item);
    return (
      <JobCard
        title={card.title}
        companyName={card.companyName}
        location={card.location}
        benefits={card.benefits}
        companyLogoLetter={card.companyLogoLetter}
        saved={savedJobIds.includes(item.id)}
        liked={isCandidate ? item.saved === true : false}
        onPress={() => router.push(`/job-details/${item.id}`)}
        onBookmark={() => toggleSaved(item)}
        onLike={() => toggleLike(item)}
        onDislike={() => { }}
      />
    );
  };

  if (loading && jobs.length === 0) {
    console.log('[Home] Candidate: showing loading (loading=true, jobs=0)');
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.subGreeting}>Time to level up your job hunt.</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} hitSlop={12}>
              <Ionicons name="timer-outline" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.iconBtn}
              hitSlop={12}
            >
              <Ionicons name="notifications-outline" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <TouchableOpacity
            style={styles.searchBarTouchable}
            onPress={() => router.push('/search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={22} color="#6B7280" style={styles.searchBarIcon} />
            <Text style={styles.searchBarPlaceholder} numberOfLines={1}>
              {searchQuery || 'Job title, keywords, or company...'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Popular Jobs</Text>
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item, index) => item?.id ?? `job-${index}`}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={APP_COLORS.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore && jobs.length > 0 ? (
              <View style={styles.footerLoader}>
                {loading && page > 1 ? (
                  <ActivityIndicator size="small" color={APP_COLORS.primary} />
                ) : (
                  <Text style={styles.footerLoaderText}>Pull up for more</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Check back later or try a different search.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function EmployerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employerId, setEmployerId] = useState<string>('');
  const [filters, setFilters] = useState<JobFilters | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  const firstName = user?.firstName || 'there';

  const loadFilters = useCallback(async () => {
    const f = await storage.getJobFilters();
    setFilters(f ?? null);
    return f;
  }, []);

  const loadEmployerProfile = useCallback(async () => {
    try {
      const res = await apiClient.getEmployerProfile();
      if (res.success && res.data) {
        const d = res.data as any;
        setCompanyName(d.companyName || '');
        setEmployerId(d.id ?? d.employerId ?? '');
      }
    } catch (_) {}
  }, []);

  const loadJobs = useCallback(async (pageNum = 1, search = '', filterOverride?: JobFilters | null, employerIdOverride?: string) => {
    const f = filterOverride ?? filters;
    const eid = employerIdOverride ?? employerId;
    if (pageNum > 1) loadingMoreRef.current = true;
    if (pageNum === 1) setLoading(true);
    const employmentType = f?.jobType?.length ? f.jobType : undefined;
    try {
      const response = await apiClient.getJobs({
        page: pageNum,
        limit: 20,
        search: search || undefined,
        employerId: eid || undefined,
        employmentType,
        datePosted: (f?.datePosted ?? 'all') as any,
        sortBy: (f?.sortBy ?? 'relevance') as any,
        remote: Array.isArray(f?.remote) ? f!.remote : undefined,
        experienceLevel: f?.experienceLevel && f.experienceLevel !== 'all' ? f.experienceLevel : undefined,
        salary: f?.salary && f.salary !== 'all' ? f.salary : undefined,
        education: f?.education && f.education !== 'all' ? f.education : undefined,
      });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw?.jobs) ? raw.jobs : Array.isArray(raw) ? raw : [];
        const totalPages = typeof raw?.totalPages === 'number' ? raw.totalPages : null;
        const total = typeof raw?.total === 'number' ? raw.total : null;
        const limit = 20;
        if (pageNum === 1) setJobs(list);
        else setJobs((prev) => [...prev, ...list]);
        if (totalPages !== null) setHasMore(pageNum < totalPages);
        else if (total !== null) setHasMore(pageNum * limit < total);
        else setHasMore(list.length >= limit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  }, [employerId, filters]);

  useFocusEffect(
    useCallback(() => {
      loadEmployerProfile();
      loadFilters().then((f) => {
        setPage(1);
        setLoading(true);
        apiClient.getEmployerProfile().then((res) => {
          const id = res.success && res.data ? (res.data as any).id ?? (res.data as any).employerId : '';
          setEmployerId(id || '');
          if (id) loadJobs(1, searchQuery, f ?? undefined, id);
          else setLoading(false);
        });
      });
    }, [loadEmployerProfile, loadFilters, loadJobs, searchQuery])
  );

  useEffect(() => {
    if (employerId && filters !== undefined) loadFilters().then((f) => { if (f) setFilters(f); });
  }, [employerId, loadFilters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadFilters().then((f) => loadJobs(1, searchQuery, f ?? undefined));
  }, [searchQuery, loadJobs, loadFilters]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || !hasMore || jobs.length === 0) return;
    const next = page + 1;
    setPage(next);
    loadJobs(next, searchQuery);
  }, [loading, hasMore, page, searchQuery, jobs.length, loadJobs]);

  const handleDeleteJob = useCallback((item: any) => {
    showDialog({
      title: 'Delete job',
      message: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      primaryButton: {
        text: 'Yes, Delete', onPress: async () => {
          try {
            const res = await apiClient.updateJob(item.id, { status: 'CLOSED' });
            if (res.success) setJobs((prev) => prev.filter((j) => j.id !== item.id));
            else showDialog({ title: 'Error', message: res.error || 'Failed to delete', primaryButton: { text: 'OK' } });
          } catch (e: any) {
            showDialog({ title: 'Error', message: e?.message || 'Failed to delete', primaryButton: { text: 'OK' } });
          }
        }
      },
      secondaryButton: { text: 'Cancel' },
    });
  }, [showDialog]);

  const mapJobToCard = (item: any) => {
    const benefits = item.benefits ? (Array.isArray(item.benefits) ? item.benefits : [item.benefits]) : [];
    return {
      id: item.id,
      title: item.title || 'Job Title',
      companyName: companyName || item.employer?.companyName || item.companyName || 'Company',
      location: item.location || 'Location',
      benefits: benefits.length ? benefits : [],
      companyLogoLetter: (companyName || item.employer?.companyName || item.companyName || '?').charAt(0),
    };
  };

  if (loading && jobs.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.subGreeting}>Time to level up your job hunt.</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} hitSlop={12}>
              <Ionicons name="timer-outline" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn} hitSlop={12}>
              <Ionicons name="notifications-outline" size={24} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <TouchableOpacity
            style={styles.searchBarTouchable}
            onPress={() => router.push('/search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={22} color="#6B7280" style={styles.searchBarIcon} />
            <Text style={styles.searchBarPlaceholder} numberOfLines={1}>
              {searchQuery || 'Job title, keywords, or company...'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Popular Jobs</Text>
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => item?.id ?? `job-${index}`}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore && jobs.length > 0 ? (
              <View style={styles.footerLoader}>
                {loading && page > 1 ? (
                  <ActivityIndicator size="small" color={APP_COLORS.primary} />
                ) : (
                  <Text style={styles.footerLoaderText}>Pull up for more</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Check back later or try a different search.</Text>
              <TouchableOpacity
                style={[styles.createJobBtn, { marginTop: 20 }]}
                onPress={() => router.push('/post-job')}
                activeOpacity={0.85}
              >
                <Text style={styles.createJobBtnText}>Post a job</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const card = mapJobToCard(item);
            return (
              <EmployerJobCard
                title={card.title}
                companyName={card.companyName}
                location={card.location}
                benefits={card.benefits}
                companyLogoLetter={card.companyLogoLetter}
                onPress={() => router.push(`/job-details/${item.id}`)}
                onEdit={() => router.push(`/edit-job/${item.id}`)}
                onDelete={() => handleDeleteJob(item)}
              />
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default function IndexScreen() {
  const { user } = useAuth();
  console.log('[Home] IndexScreen render, user:', user?.id, 'role:', user?.role);
  if (user?.role === 'CANDIDATE') return <CandidateJobsScreen />;
  if (user?.role === 'EMPLOYER') return <EmployerDashboardScreen />;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Admin – use web interface</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Kanit',
    fontSize: 24,
    fontWeight: '700',
    color: '#031019',
    marginBottom: 2,
  },
  subGreeting: {
    fontFamily: 'Kanit',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  searchWrap: {
    marginBottom: 28,
  },
  searchBarTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 56,
    paddingHorizontal: 20,
    height: 52,
  },
  searchBarIcon: {
    marginRight: 10,
  },
  searchBarPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Kanit',
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '500',
    color: '#031019',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoaderText: {
    fontSize: 13,
    color: APP_COLORS.textSecondary,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    marginTop: 8,
  },
  employerEmpty: {
    flex: 1,
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  employerEmptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
  },
  employerEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  employerEmptySubtext: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  createJobBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: APP_SPACING.borderRadius,
  },
  createJobBtnText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
