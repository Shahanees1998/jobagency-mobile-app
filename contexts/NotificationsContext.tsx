import { apiClient } from '@/lib/api';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiClient.getNotifications({ page: 1, limit: 100 });
      const raw = res.success && res.data ? (res.data as any) : {};
      const list = Array.isArray(raw.notifications) ? raw.notifications : Array.isArray(raw) ? raw : [];
      const total = typeof raw.unreadCount === 'number' ? raw.unreadCount : list.filter((n: any) => !n.isRead).length;
      setUnreadCount(Math.min(total, 99));
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, user?.id]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
