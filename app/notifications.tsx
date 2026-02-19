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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="notifications-outline" size={32} color="#000" />
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
          }
          renderItem={({ item }: { item: any }) => {
            if (item.isSection) return <Text style={styles.sectionHeader}>{item.key}</Text>;
            const title = item.title || 'Notification';
            const message = item.message || '';
            const company = item.company || item.employer?.companyName || item.user?.companyName || 'Company';
            const letter = (company || '?').charAt(0).toUpperCase();

            const d = new Date(item.createdAt || item.created_at);
            const dateStr = d.toLocaleDateString('en-GB');
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const statusLabel = `${dateStr} • ${timeStr}`;

            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead ? styles.cardUnread : styles.cardRead]}
                onPress={() => { if (item.id) apiClient.markNotificationAsRead(item.id).then(() => loadNotifications()); }}
                activeOpacity={0.85}
              >
                <View style={styles.logoBox}>
                  <Text style={styles.logoLetter}>{letter}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardBodyText}>{message}</Text>
                  <Text style={styles.cardTime}>{statusLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: APP_SPACING.screenPadding, paddingBottom: 24 },
  sectionHeader: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '700',
    color: '#031019',
    marginTop: 20,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardUnread: {
    backgroundColor: '#F2F7FB' // Light blue
  },
  cardRead: {
    backgroundColor: '#F9FAFB' // Light gray
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#031019',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoLetter: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  cardContent: { flex: 1, minWidth: 0 },
  cardBodyText: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '500',
    color: '#031019',
    lineHeight: 20,
  },
  cardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIconWrap: {
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
    fontWeight: '700',
    fontSize: 32,
    textAlign: 'center',
    color: '#000',
    marginBottom: 20,
    lineHeight: 38,
  },
  emptyMessage: {
    fontFamily: 'Kanit',
    fontWeight: '300',
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    lineHeight: 18,
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E4154',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
