import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
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
import { SafeAreaView } from 'react-native-safe-area-context';

function getGroupKey(createdAt: string): 'Today' | 'Yesterday' | string {
  const d = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeAgo(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiClient.getNotifications({ page: 1, limit: 50 });
      const raw = res.success && res.data ? res.data : {};
      const list = Array.isArray(raw.notifications) ? raw.notifications : Array.isArray(raw) ? raw : [];
      setNotifications(list);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const groups: { key: string; items: any[] }[] = [];
  const seen = new Set<string>();
  notifications.forEach((n) => {
    const key = getGroupKey(n.createdAt || n.created_at || '');
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({ key, items: [] });
    }
    const last = groups[groups.length - 1];
    if (last.key === key) last.items.push(n);
  });

  const isEmployer = user?.role === 'EMPLOYER';
  const emptyTitle = isEmployer
    ? 'Nothing right now. Check back later !!'
    : 'Nothing right now. Check back later !!';
  const emptyMessage = isEmployer
    ? "We'll notify you about applications, interviews and other updates."
    : "This is where we'll notify you about your job applications and other useful information to help you with your perfect job search.";

  if (loading && notifications.length === 0) {
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerBtn} />
      </View>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="notifications-outline" size={40} color={APP_COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{isEmployer ? 'Back to home' : 'Find jobs'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups.flatMap((g) => [{ isSection: true, key: g.key }, ...g.items.map((i) => ({ ...i, isSection: false }))])}
          keyExtractor={(item: any) => (item.isSection ? `section-${item.key}` : item.id || `n-${Math.random()}`)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          renderItem={({ item }: { item: any }) => {
            if (item.isSection) return <Text style={styles.sectionHeader}>{item.key}</Text>;
            const title = item.title || 'Notification';
            const message = item.message || '';
            const name = [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || item.user?.email || 'User';
            const letter = (name || '?').charAt(0).toUpperCase();
            const timeAgo = getTimeAgo(item.createdAt || item.created_at || '');
            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => { if (item.id) apiClient.markNotificationAsRead(item.id); loadNotifications(); }}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{letter}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.cardMessage} numberOfLines={2}>{message || title}</Text>
                  <Text style={styles.cardTime}>{timeAgo}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  list: { paddingHorizontal: APP_SPACING.screenPadding, paddingBottom: 24 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.textMuted,
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardUnread: { backgroundColor: APP_COLORS.white },
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
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textPrimary },
  cardMessage: { fontSize: 14, color: APP_COLORS.textSecondary, marginTop: 4 },
  cardTime: { fontSize: 12, color: APP_COLORS.textMuted, marginTop: 6 },
  empty: {
    flex: 1,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: APP_COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  emptyMessage: { fontSize: 16, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
