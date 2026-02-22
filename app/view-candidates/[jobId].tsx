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
    return `On ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  const handleReject = (app: any) => {
    showDialog({
      title: 'Reject application',
      message: `Are you sure you want to reject ${getCandidateName(app)}? They will be notified.`,
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

  const handleCheckPress = (app: any) => {
    const status = String(app.status || '').toUpperCase();
    if (status === 'APPLIED' || status === 'PENDING' || !status) {
      router.push(`/schedule-interview?jobId=${jobId}&applicationId=${app.id}`);
      return;
    }
    if (status === 'APPROVED') {
      router.push(`/schedule-interview?jobId=${jobId}&applicationId=${app.id}`);
      return;
    }
    if (status === 'INTERVIEW_SCHEDULED' || status === 'INTERVIEW_COMPLETED') {
      router.push(`/edit-interview/${app.id}?jobId=${jobId}`);
      return;
    }
  };

  const handleViewCandidate = (app: any) => {
    router.push(`/application-details/${app.id}`);
  };

  const isRejected = (app: any) => String(app.status || '').toUpperCase() === 'REJECTED';
  const isApprovedOrScheduled = (app: any) => {
    const s = String(app.status || '').toUpperCase();
    return s === 'APPROVED' || s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEW_COMPLETED';
  };

  const renderItem = ({ item }: { item: any }) => {
    const name = getCandidateName(item);
    const letter = (name || '?').charAt(0).toUpperCase();
    const date = getApplicationDate(item);
    const isUpdating = updatingId === item.id;
    const rejected = isRejected(item);
    const approvedOrScheduled = isApprovedOrScheduled(item);

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => handleViewCandidate(item)}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{letter}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleViewCandidate(item)}
            style={styles.actionBtnView}
            hitSlop={8}
          >
            <Ionicons name="eye-outline" size={16} color={APP_COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleReject(item)}
            style={[styles.actionBtnReject, !rejected && styles.actionBtnGray]}
            hitSlop={8}
            disabled={isUpdating}
          >
            <Ionicons name="close" size={16} color={rejected ? APP_COLORS.white : APP_COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => !isUpdating && handleCheckPress(item)}
            style={[styles.actionBtnApprove, !approvedOrScheduled && styles.actionBtnGray]}
            hitSlop={8}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={approvedOrScheduled ? APP_COLORS.white : APP_COLORS.textSecondary} />
            ) : (
              <Ionicons name="checkmark" size={16} color={approvedOrScheduled ? APP_COLORS.white : APP_COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
        <Ionicons name="search-outline" size={20} color={APP_COLORS.textPrimary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search candidates name ...."
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
        style={styles.listBg}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom:10,
    marginHorizontal: APP_SPACING.screenPadding-10,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, paddingVertical: 0 },
  listBg: { backgroundColor: APP_COLORS.white },
  list: { paddingHorizontal: 0, paddingTop: 4, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#72A4BF26',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#B8D0D9',
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: APP_COLORS.white },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500', color: APP_COLORS.textPrimary },
  date: { fontSize: 13, color: APP_COLORS.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnView: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnReject: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnApprove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnGray: {
    backgroundColor: '#E5E7EB',
  },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '600', color: APP_COLORS.textPrimary },
  emptySubtext: { fontSize: 14, color: APP_COLORS.textMuted, marginTop: 8 },
});
