import { APP_COLORS } from '@/constants/appTheme';
import { useNotifications } from '@/contexts/NotificationsContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationBellProps {
  size?: number;
  color?: string;
  hitSlop?: number;
  style?: object;
}

export function NotificationBell({ size = 24, color = APP_COLORS.textPrimary, hitSlop = 12, style }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={[styles.wrap, style]}
      hitSlop={hitSlop}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: APP_COLORS.white,
  },
});
