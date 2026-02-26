import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { apiClient } from '@/lib/api';
import { subscribeToUserNotifications } from '@/lib/pusher';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatNotificationDate(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (dateOnly.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (dateOnly.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}, ${timeStr}`;
}

function getGroupKey(createdAt: string): 'Today' | 'Yesterday' | string {
  const d = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const params = useLocalSearchParams<{ id?: string }>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const openedFromPushRef = useRef(false);

  const hasUnread = notifications.some((n) => !n.isRead);

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

  const notificationUnsubscribeRef = useRef<(() => void) | null>(null);
  // Real-time: subscribe to user notification channel so new notifications (e.g. job approved) appear without refresh
  useFocusEffect(
    useCallback(() => {
      const userId = user?.id;
      if (!userId) return () => {};
      notificationUnsubscribeRef.current = null;
      subscribeToUserNotifications(userId, () => {
        loadNotifications();
        refreshUnreadCount();
      }).then((fn) => {
        notificationUnsubscribeRef.current = fn;
      });
      return () => {
        const fn = notificationUnsubscribeRef.current;
        if (typeof fn === 'function') {
          fn();
          notificationUnsubscribeRef.current = null;
        }
      };
    }, [user?.id, loadNotifications, refreshUnreadCount])
  );

  // Open notification popup when navigated from push tap with ?id=notificationId
  useEffect(() => {
    const notificationId = params.id;
    if (!notificationId || notifications.length === 0 || openedFromPushRef.current) return;
    const item = notifications.find((n) => n.id === notificationId);
    if (item) {
      openedFromPushRef.current = true;
      setSelectedNotification(item);
      apiClient.markNotificationAsRead(item.id).catch(() => {});
      loadNotifications();
      refreshUnreadCount();
    }
  }, [params.id, notifications, loadNotifications, refreshUnreadCount]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const openNotificationDetail = useCallback(
    async (item: any) => {
      if (!item?.id) return;
      setSelectedNotification(item);
      try {
        await apiClient.markNotificationAsRead(item.id);
        await loadNotifications();
        refreshUnreadCount();
      } catch {
        // keep modal open
      }
    },
    [loadNotifications, refreshUnreadCount]
  );

  const closeDetail = useCallback(() => setSelectedNotification(null), []);

  const markAllAsRead = useCallback(async () => {
    if (markAllLoading || !hasUnread) return;
    setMarkAllLoading(true);
    try {
      const res = await apiClient.markAllNotificationsAsRead();
      if (res.success) {
        await loadNotifications();
        refreshUnreadCount();
      }
    } catch {
      // ignore
    } finally {
      setMarkAllLoading(false);
    }
  }, [markAllLoading, hasUnread, loadNotifications, refreshUnreadCount]);

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
          {hasUnread ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              disabled={markAllLoading}
              style={styles.markAllBtn}
              hitSlop={8}
            >
              <Text style={[styles.markAllText, markAllLoading && styles.markAllTextDisabled]}>
                {markAllLoading ? '...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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

            const statusLabel = formatNotificationDate(item.createdAt || item.created_at || '');

            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead ? styles.cardUnread : styles.cardRead]}
                onPress={() => openNotificationDetail(item)}
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

      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetail}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {selectedNotification?.title || 'Notification'}
            </Text>
            <Text style={styles.modalMessage}>
              {selectedNotification?.message || ''}
            </Text>
            <Text style={styles.modalTime}>
              {selectedNotification
                ? formatNotificationDate(selectedNotification.createdAt || selectedNotification.created_at || '')
                : ''}
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeDetail} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  markAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    minWidth: 100,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontFamily: 'Kanit',
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  markAllTextDisabled: {
    color: '#9CA3AF',
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
    backgroundColor: '#E8F2FA',
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.primary,
  },
  cardRead: {
    backgroundColor: '#F9FAFB',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '700',
    color: '#031019',
    marginBottom: 12,
  },
  modalMessage: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  modalTime: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  modalButton: {
    height: 48,
    backgroundColor: APP_COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
