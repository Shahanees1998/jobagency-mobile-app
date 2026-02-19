import { JobCard } from '@/components/jobs';
import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { apiClient } from '@/lib/api';
import { storage, type JobFilters, type RecentSearch } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SUGGEST_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;
const SUGGEST_RESULTS_LIMIT = 15;

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [jobQuery, setJobQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobFilters | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestionSource, setSuggestionSource] = useState<'job' | 'location' | 'recent'>('recent');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: showResults ? 'Search result' : 'Search query',
      headerTitleStyle: { fontFamily: 'Kanit', fontSize: 18, fontWeight: '600', color: APP_COLORS.textPrimary },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => (showResults ? setShowResults(false) : router.back())}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => (showResults ? router.push('/job-filters') : router.push('/notifications'))}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          hitSlop={12}
        >
          <Ionicons
            name={showResults ? 'filter-outline' : 'notifications-outline'}
            size={24}
            color={APP_COLORS.textPrimary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showResults]);

  const loadFilters = useCallback(async () => {
    const f = await storage.getJobFilters();
    setFilters(f ?? null);
    return f;
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const loadRecentSearches = useCallback(async () => {
    const list = await storage.getRecentSearches();
    setRecentSearches(list);
  }, []);
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    const job = (jobQuery ?? '').trim();
    const loc = (locationQuery ?? '').trim();
    const jobLen = job.length;
    const locLen = loc.length;

    if (jobLen >= MIN_QUERY_LENGTH) {
      suggestDebounceRef.current = setTimeout(async () => {
        setLoadingSuggestions(true);
        setSuggestionSource('job');
        try {
          const res = await apiClient.getJobs({
            search: job,
            limit: SUGGEST_RESULTS_LIMIT,
          });
          const raw = res.success && res.data ? (res.data as any) : null;
          const jobs = Array.isArray(raw?.jobs) ? raw.jobs : Array.isArray(raw) ? raw : [];
          const titles = Array.from(
            new Set(
              jobs
                .map((j: any) => j.title || j.employer?.companyName || j.companyName)
                .filter(Boolean)
            )
          ).slice(0, 10) as string[];
          setSuggestions(titles);
        } catch {
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, SUGGEST_DEBOUNCE_MS);
    } else if (locLen >= MIN_QUERY_LENGTH && jobLen < MIN_QUERY_LENGTH) {
      suggestDebounceRef.current = setTimeout(async () => {
        setLoadingSuggestions(true);
        setSuggestionSource('location');
        try {
          const res = await apiClient.getJobs({
            search: loc,
            limit: SUGGEST_RESULTS_LIMIT,
          });
          const raw = res.success && res.data ? (res.data as any) : null;
          const jobs = Array.isArray(raw?.jobs) ? raw.jobs : Array.isArray(raw) ? raw : [];
          const locations = Array.from(
            new Set(
              jobs
                .map((j: any) => j.location || j.employer?.location)
                .filter(Boolean)
            )
          ).slice(0, 10) as string[];
          setSuggestions(locations);
        } catch {
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, SUGGEST_DEBOUNCE_MS);
    } else {
      setSuggestionSource('recent');
      setSuggestions([]);
      setLoadingSuggestions(false);
      loadRecentSearches().then((list) => setRecentSearches(list));
    }

    return () => {
      if (suggestDebounceRef.current) {
        clearTimeout(suggestDebounceRef.current);
        suggestDebounceRef.current = null;
      }
    };
  }, [jobQuery, locationQuery, loadRecentSearches]);

  useFocusEffect(
    useCallback(() => {
      if (showResults && (jobQuery.trim() || locationQuery.trim())) {
        loadFilters().then((f) => runSearch(f ?? undefined));
      }
    }, [showResults, jobQuery, locationQuery, loadFilters, runSearch])
  );

  const loadSavedIds = useCallback(async () => {
    const ids = await storage.getSavedJobIds();
    setSavedJobIds(ids);
  }, []);
  useEffect(() => {
    loadSavedIds();
  }, [loadSavedIds]);

  const runSearch = useCallback(async (filterOverride?: JobFilters | null) => {
    const search = [jobQuery.trim(), locationQuery.trim()].filter(Boolean).join(' ');
    if (!search.trim()) return;
    setLoading(true);
    setShowResults(true);
    try {
      const f = filterOverride ?? filters ?? (await loadFilters());
      const employmentType = f?.jobType?.length ? f.jobType : undefined;
      const response = await apiClient.getJobs({
        page: 1,
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
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw?.jobs) ? raw.jobs : Array.isArray(raw) ? raw : [];
        setJobs(list);
        setTotal(typeof raw?.total === 'number' ? raw.total : list.length);
        await storage.addRecentSearch(jobQuery, locationQuery);
        loadRecentSearches();
      } else {
        setJobs([]);
        setTotal(0);
      }
    } catch (e) {
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [jobQuery, locationQuery, filters, loadFilters, loadRecentSearches]);

  const onSuggestionPress = useCallback((text: string, source: 'job' | 'location') => {
    if (source === 'job') setJobQuery(text);
    else setLocationQuery(text);
  }, []);

  const onRecentSearchPress = useCallback((s: RecentSearch) => {
    setJobQuery(s.job);
    setLocationQuery(s.location);
  }, []);

  const listPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;

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

  const toggleSaved = useCallback(async (item: any) => {
    const jobId = item.id;
    const ids = await storage.getSavedJobIds();
    const isSaved = ids.includes(jobId);
    if (isSaved) {
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
  }, []);

  if (showResults) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.resultsHeader}>
          <View style={styles.queryRow}>
            <Ionicons name="search-outline" size={18} color={APP_COLORS.textMuted} />
            <Text style={styles.queryText} numberOfLines={1}>{jobQuery || 'Job title, keywords...'}</Text>
          </View>
          <View style={styles.queryRow}>
            <Ionicons name="location-outline" size={18} color={APP_COLORS.textMuted} />
            <Text style={styles.queryText} numberOfLines={1}>{locationQuery || 'City, state, or remote'}</Text>
          </View>
          <Text style={styles.resultsSummary}>
            {`${jobQuery.trim() || 'Jobs'} jobs${locationQuery.trim() ? ` in ${locationQuery.trim()}` : ''}`}
          </Text>
          {total !== null && (
            <Text style={styles.resultsCount}>{total}+ jobs</Text>
          )}
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={APP_COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item, index) => item?.id ?? `job-${index}`}
            contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const card = mapJobToCard(item);
              return (
                <JobCard
                  title={card.title}
                  companyName={card.companyName}
                  location={card.location}
                  benefits={card.benefits}
                  companyLogoLetter={card.companyLogoLetter}
                  saved={savedJobIds.includes(item.id)}
                  onPress={() => router.push(`/job-details/${item.id}`)}
                  onBookmark={() => toggleSaved(item)}
                  onDislike={() => {}}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No jobs found</Text>
                <Text style={styles.emptySubtext}>Try different keywords or location.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputsBox}>
          <View style={styles.inputRow}>
            <Ionicons name="search-outline" size={22} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Job title, keywords, or company..."
              placeholderTextColor="#9CA3AF"
              value={jobQuery}
              onChangeText={setJobQuery}
              returnKeyType="next"
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={22} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='City, state, Zip Code, or "remote"...'
              placeholderTextColor="#9CA3AF"
              value={locationQuery}
              onChangeText={setLocationQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <Text style={styles.suggestionsTitle}>
          {suggestionSource === 'recent' ? 'Recent searches' : 'Search suggestions'}
        </Text>
        {loadingSuggestions ? (
          <View style={styles.suggestionsList}>
            <ActivityIndicator size="small" color={APP_COLORS.primary} style={styles.suggestLoader} />
          </View>
        ) : suggestionSource === 'recent' && (recentSearches ?? []).length > 0 ? (
          <View style={styles.suggestionsList}>
            {(recentSearches ?? []).map((s, i) => (
              <TouchableOpacity
                key={`${s.job}-${s.location}-${i}`}
                style={styles.suggestionRow}
                onPress={() => onRecentSearchPress(s)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color={APP_COLORS.textMuted} />
                <View style={styles.recentSearchContent}>
                  {(s.job || s.location) && (
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {[s.job, s.location].filter(Boolean).join(' • ')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (suggestions ?? []).length > 0 ? (
          <View style={styles.suggestionsList}>
            {(suggestions ?? []).map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionRow}
                onPress={() => onSuggestionPress(s, suggestionSource as 'job' | 'location')}
                activeOpacity={0.7}
              >
                <Ionicons name="search-outline" size={18} color={APP_COLORS.textMuted} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.suggestionsList}>
            <Text style={styles.suggestHint}>
              {jobQuery.trim().length >= 1 || locationQuery.trim().length >= 1
                ? 'Type at least 2 characters to see suggestions from live jobs.'
                : 'Your recent searches will appear here.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.findJobsBtn}
          onPress={runSearch}
          activeOpacity={0.85}
        >
          <Text style={styles.findJobsBtnText}>Find jobs</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  keyboard: { flex: 1, paddingHorizontal: APP_SPACING.screenPadding },
  inputsBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Kanit',
    color: '#031019',
    paddingVertical: 0,
  },
  suggestionsTitle: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 12,
  },
  suggestionsList: { marginBottom: 24 },
  suggestLoader: { paddingVertical: 16 },
  suggestHint: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    fontFamily: 'Kanit',
    paddingVertical: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  recentSearchContent: { flex: 1 },
  suggestionText: { fontSize: 15, color: APP_COLORS.textSecondary, fontFamily: 'Kanit' },
  findJobsBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findJobsBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600', fontFamily: 'Kanit' },
  resultsHeader: {
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  queryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  queryText: { fontSize: 15, color: APP_COLORS.textSecondary, flex: 1 },
  resultsSummary: { fontSize: 15, color: APP_COLORS.textPrimary, marginTop: 8 },
  resultsCount: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 16 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '600', color: APP_COLORS.textPrimary },
  emptySubtext: { fontSize: 14, color: APP_COLORS.textMuted, marginTop: 8 },
});
