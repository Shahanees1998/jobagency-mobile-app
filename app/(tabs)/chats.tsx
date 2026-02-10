import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  TextInput,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_SIZE = 48;
const EMPTY_ICON_BG = '#E8F4FC';

export default function ChatsScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await apiClient.getChats();
      if (response.success && response.data) {
        setChats(response.data || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const getOtherParticipant = (chat: any) => {
    if (user?.role === 'CANDIDATE') {
      return chat.application?.job?.employer ?? chat.otherParticipant;
    }
    return chat.application?.candidate ?? chat.otherParticipant;
  };

  const getDisplayName = (chat: any) => {
    const other = getOtherParticipant(chat);
    if (!other) return 'Chat';
    if (other.companyName) return other.companyName;
    const u = other.user ?? other;
    return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Chat';
  };

  const getAvatarLetter = (chat: any) => {
    const name = getDisplayName(chat);
    return (name || '?').charAt(0).toUpperCase();
  };

  const getAvatarImage = (chat: any) => {
    const other = getOtherParticipant(chat);
    const u = other?.user ?? other;
    return u?.profileImage;
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  const filteredChats = searchQuery.trim()
    ? chats.filter((c) =>
        getDisplayName(c).toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : chats;

  const renderChatItem = ({ item }: { item: any }) => {
    const displayName = getDisplayName(item);
    const lastMsg = item.lastMessage?.content ?? '';
    const truncatedMsg = lastMsg.length > 28 ? lastMsg.slice(0, 25) + '...' : lastMsg;
    const avatarImage = getAvatarImage(item);
    const letter = getAvatarLetter(item);
    const unreadCount = item.unreadCount ?? 0;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: APP_COLORS.textPrimary }]}>
          {avatarImage ? (
            <Image source={{ uri: avatarImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLetter}>{letter}</Text>
          )}
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.companyName} numberOfLines={1}>{displayName}</Text>
          {lastMsg ? (
            <Text style={styles.lastMessage} numberOfLines={1}>{truncatedMsg}</Text>
          ) : null}
        </View>
        <View style={styles.chatMeta}>
          {item.lastMessageAt ? (
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageAt)}</Text>
          ) : null}
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const emptyState = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color={APP_COLORS.textPrimary} />
      </View>
      <Text style={styles.emptyTitleLine1}>No updates yet.</Text>
      <Text style={styles.emptyTitleLine2}>Apply to chat !!</Text>
      <Text style={styles.emptySubtext}>
        Discover opportunities, apply to jobs, and connect with employers while staying informed about your applications.
      </Text>
      <TouchableOpacity
        style={styles.findJobsBtn}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={styles.findJobsBtnText}>Find Jobs</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
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
          <Text style={styles.pageTitle}>Messages</Text>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.bellBtn}
            hitSlop={12}
          >
            <Ionicons name="notifications-outline" size={24} color={APP_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {chats.length > 0 ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={20} color={APP_COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Chats..."
                placeholderTextColor={APP_COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <FlatList
              data={filteredChats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.primary} />
              }
              ListEmptyComponent={
                searchQuery.trim() ? (
                  <View style={styles.emptySearch}>
                    <Text style={styles.emptySearchText}>No chats match your search.</Text>
                  </View>
                ) : null
              }
            />
          </>
        ) : (
          <View style={styles.emptyWrapper}>{emptyState}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: APP_COLORS.textPrimary },
  bellBtn: { padding: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: APP_SPACING.screenPadding,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    paddingVertical: 2,
  },
  list: { paddingHorizontal: APP_SPACING.screenPadding, paddingBottom: 24 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: APP_COLORS.white },
  chatContent: { flex: 1, minWidth: 0 },
  companyName: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 4 },
  lastMessage: { fontSize: 15, color: APP_COLORS.textSecondary },
  chatMeta: { alignItems: 'flex-end', marginLeft: 8 },
  timestamp: { fontSize: 13, color: APP_COLORS.textMuted, marginBottom: 4 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 12, fontWeight: '700', color: APP_COLORS.white },
  emptyWrapper: { flex: 1, paddingHorizontal: APP_SPACING.screenPadding },
  emptyContainer: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: EMPTY_ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
  },
  emptyTitleLine1: { fontSize: 18, color: APP_COLORS.textPrimary, marginBottom: 4 },
  emptyTitleLine2: { fontSize: 20, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 16 },
  emptySubtext: {
    fontSize: 15,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  findJobsBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: APP_SPACING.borderRadius,
  },
  findJobsBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  emptySearch: { paddingVertical: 32, alignItems: 'center' },
  emptySearchText: { fontSize: 15, color: APP_COLORS.textMuted },
});
