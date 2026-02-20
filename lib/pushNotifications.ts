/**
 * FCM / push notifications for mobile app (aligned with admin panel FCM).
 * Registers device token with backend so server can send FCM via firebase-admin.
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
import { apiClient } from './api';
import { storage } from './storage';

/** Request permission and get device push token (FCM on Android, APNs/FCM on iOS). */
export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return null;
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData?.data;
    return typeof token === 'string' ? token : null;
  } catch (e) {
    console.warn('[Push] getDevicePushToken failed:', (e as Error).message);
    return null;
  }
}

const platform = (): 'ios' | 'android' | undefined =>
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : undefined;

/**
 * Register current device push token with backend (call after login).
 * Backend stores it and uses it for FCM when sending notifications (e.g. new chat message).
 */
export async function registerFcmTokenWithBackend(): Promise<void> {
  try {
    const token = await getDevicePushToken();
    if (!token) return;
    const res = await apiClient.registerFcmToken({
      token,
      platform: platform(),
    });
    if (res.success) {
      await storage.setFcmToken(token);
    }
  } catch (e) {
    console.warn('[Push] registerFcmTokenWithBackend failed:', (e as Error).message);
  }
}

/**
 * Unregister FCM token from backend (call on logout).
 */
export async function unregisterFcmTokenFromBackend(): Promise<void> {
  try {
    const token = await storage.getFcmToken();
    if (token) {
      await apiClient.unregisterFcmToken(token);
    }
    await storage.setFcmToken(null);
  } catch (e) {
    console.warn('[Push] unregisterFcmTokenFromBackend failed:', (e as Error).message);
    await storage.setFcmToken(null);
  }
}
