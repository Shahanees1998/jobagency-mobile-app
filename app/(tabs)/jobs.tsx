import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
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

export default function EmployerJobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = React.useRef(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'PENDING':
        return '#FF9800';
      case 'SUSPENDED':
        return '#9E9E9E';
      default:
        return colors.icon;
    }
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.jobCard, { backgroundColor: colors.background, borderColor: colors.icon }]}
      onPress={() => router.push(`/job-details/${item.id}`)}
    >
      <View style={styles.jobHeader}>
        <ThemedText type="defaultSemiBold" style={styles.jobTitle}>
          {item.title}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>{item.status}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </ThemedText>
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <IconSymbol name="doc.text.fill" size={14} color={colors.icon} />
          <ThemedText style={styles.metaText}>{item.applicationCount || 0} applications</ThemedText>
        </View>
        <View style={styles.metaItem}>
          <IconSymbol name="eye.fill" size={14} color={colors.icon} />
          <ThemedText style={styles.metaText}>{item.views || 0} views</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.createdDate}>
        Posted on {new Date(item.createdAt).toLocaleDateString()}
      </ThemedText>
    </TouchableOpacity>
  );

  if (loading && jobs.length === 0) {
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
          <ThemedText type="title" style={styles.title}>My Jobs</ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: APP_COLORS.primary }]}
            onPress={() => router.push('/post-job')}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No jobs posted yet</Text>
              <Text style={styles.emptySubtext}>Post a job to start receiving applications.</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/post-job')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyButtonText}>Post New Job</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  jobCard: {
    padding: APP_SPACING.itemPadding,
    borderRadius: APP_SPACING.borderRadiusLg,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: APP_COLORS.surfaceGray,
    borderColor: '#E5E7EB',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  jobMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  createdDate: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: APP_SPACING.borderRadius,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


