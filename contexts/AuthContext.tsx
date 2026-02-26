import { apiClient } from '@/lib/api';
import { registerPushTokenWithBackend, unregisterPushToken } from '@/lib/pushNotifications';
import { storage } from '@/lib/storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/** Schedule multiple retries for FCM registration (on APK first launch token is often not ready for several seconds). */
function scheduleFcmRetries() {
  const delays = [2500, 6000, 12000];
  const ids = delays.map((ms) =>
    setTimeout(() => {
      registerPushTokenWithBackend().catch(() => {});
    }, ms)
  );
  return () => ids.forEach((id) => clearTimeout(id));
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYER' | 'CANDIDATE';
  status: string;
  phone?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'CANDIDATE' | 'EMPLOYER';
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Retry FCM registration when app comes to foreground (token may not have been ready at login)
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        registerPushTokenWithBackend().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [user]);

  const initializeAuth = async () => {
    try {
      const token = await storage.getAccessToken();
      const storedUser = await storage.getUser();

      if (token && storedUser) {
        apiClient.setAccessToken(token);
        setUser(storedUser);
        //console.log('[FCM device token] App start (restore session): registering...');
        registerPushTokenWithBackend().catch(() => {});
        scheduleFcmRetries();

        // Verify token is still valid
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          await storage.setUser(response.data);
        } else {
          // Token invalid, try refresh
          await tryRefreshToken();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tryRefreshToken = async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        const response = await apiClient.refreshToken(refreshToken);
        if (response.success && response.data) {
          await storage.setAccessToken(response.data.accessToken);
          await storage.setRefreshToken(response.data.refreshToken);
          apiClient.setAccessToken(response.data.accessToken);
          
          const userResponse = await apiClient.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            setUser(userResponse.data);
            await storage.setUser(userResponse.data);
          }
        } else {
          await logout();
        }
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        
        await storage.setAccessToken(accessToken);
        await storage.setRefreshToken(refreshToken);
        await storage.setUser(userData);
        
        apiClient.setAccessToken(accessToken);
        setUser(userData);
        console.log('[FCM device token] Login: registering FCM device token...');
        registerPushTokenWithBackend().catch(() => {});
        scheduleFcmRetries();

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'CANDIDATE' | 'EMPLOYER';
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.register(data);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        
        await storage.setAccessToken(accessToken);
        await storage.setRefreshToken(refreshToken);
        await storage.setUser(userData);
        
        apiClient.setAccessToken(accessToken);
        setUser(userData);
        console.log('[FCM device token] Register: registering FCM     device token...');
        registerPushTokenWithBackend().catch(() => {});
        scheduleFcmRetries();

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await unregisterPushToken();
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.clearAll();
      apiClient.setAccessToken(null);
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        const data = response.data;
        const prev = userRef.current;
        const merged: User = prev
          ? { ...prev, ...data, role: (data.role ?? prev.role ?? 'CANDIDATE') as User['role'] }
          : { ...data, role: (data.role ?? 'CANDIDATE') as User['role'] };
        setUser(merged);
        await storage.setUser(merged);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


