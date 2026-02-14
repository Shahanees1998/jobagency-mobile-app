import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewCandidatesScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { showDialog } = useDialog();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await apiClient.getJobApplications(jobId, { page: 1, limit: 100 });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list = Array.isArray(raw?.applications) ? raw.applications : Array.isArray(raw) ? raw : [];
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const filtered = applications.filter((app) => {
    const name = [app.candidate?.user?.firstName, app.candidate?.user?.lastName].filter(Boolean).join(' ') || app.candidate?.user?.email || '';
    return !searchQuery.trim() || name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const getCandidateName = (app: any) => {
    const u = app.candidate?.user;
    if (u?.firstName || u?.lastName) return [u.firstName, u.lastName].filter(Boolean).join(' ');
    return u?.email || 'Candidate';
  };

  const getApplicationDate = (app: any) => {
    const d = app.appliedAt || app.createdAt;
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW_COMPLETED') {
      return { name: 'checkmark-circle' as const, color: '#22C55E' };
    }
    if (s === 'REJECTED') return { name: 'close-circle' as const, color: APP_COLORS.danger };
    return { name: 'ellipse-outline' as const, color: APP_COLORS.textMuted };
  };

  const handleApprove = async (app: any) => {
    if (!jobId || updatingId) return;
    setUpdatingId(app.id);
    try {
      const res = await apiClient.updateApplicationStatus(jobId, app.id, 'APPROVED');
      if (res.success) loadApplications();
      else showDialog({ title: 'Error', message: res.error || 'Failed to approve', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e?.message || 'Failed to approve', primaryButton: { text: 'OK' } });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = (app: any) => {
    showDialog({
      title: 'Reject application',
      message: `Reject ${getCandidateName(app)}? They will be notified.`,
      primaryButton: { text: 'Yes, Reject', onPress: async () => {
        if (!jobId || updatingId) return;
        setUpdatingId(app.id);
        try {
          const res = await apiClient.updateApplicationStatus(jobId, app.id, 'REJECTED');
          if (res.success) loadApplications();
          else showDialog({ title: 'Error', message: res.error || 'Failed to reject', primaryButton: { text: 'OK' } });
        } catch (e: any) {
          showDialog({ title: 'Error', message: (e as Error)?.message || 'Failed to reject', primaryButton: { text: 'OK' } });
        } finally {
          setUpdatingId(null);
        }
      } },
      secondaryButton: { text: 'Cancel' },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const name = getCandidateName(item);
    const letter = (name || '?').charAt(0).toUpperCase();
    const date = getApplicationDate(item);
    const statusIcon = getStatusIcon(item.status);
    const isUpdating = updatingId === item.id;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/application-details/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{letter}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); handleReject(item); }}
            style={styles.actionBtn}
            hitSlop={12}
            disabled={isUpdating}
          >
            <Ionicons name="close-circle" size={28} color={APP_COLORS.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); handleApprove(item); }}
            style={styles.actionBtn}
            hitSlop={12}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={APP_COLORS.primary} />
            ) : (
              <Ionicons name={statusIcon.name} size={28} color={statusIcon.color} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View candidates</Text>
        <View style={styles.headerBtn} />
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={22} color={APP_COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search candidates name..."
          placeholderTextColor={APP_COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No candidates yet</Text>
            <Text style={styles.emptySubtext}>Applications will appear here when candidates apply.</Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    marginHorizontal: APP_SPACING.screenPadding,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  list: { paddingHorizontal: APP_SPACING.screenPadding, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadius,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: APP_COLORS.white },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  date: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { padding: 4 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '600', color: APP_COLORS.textPrimary },
  emptySubtext: { fontSize: 14, color: APP_COLORS.textMuted, marginTop: 8 },
});
