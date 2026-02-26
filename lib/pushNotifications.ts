/**
 * Push notification registration for FCM.
 * Registers the device token with the backend so the server can send push notifications.
 * In Expo Go (SDK 53+) push is not supported – we no-op so the app still runs.
 * Handles notification taps: navigates to chat, notifications list, job/application details, etc.
 */
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { apiClient } from './api';

let lastRegisteredToken: string | null = null;

/** Call once at app start so notifications show in device notification bar (foreground + Android channel). */
export async function setupNotificationDisplay(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    // Show notifications in system tray when app is in foreground (otherwise they only appear in-app)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Android 8+: create "default" channel so FCM notifications appear in notification bar (backend sends channelId: 'default')
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E4154',
      });
    }
  } catch {
    // ignore
  }
}

/** Last FCM registration result for on-device diagnostic (e.g. in Profile). */
export type FcmRegistrationResult =
  | { status: 'success' }
  | { status: 'no_token'; message: string }
  | { status: 'permission_denied' }
  | { status: 'backend_rejected'; error: string }
  | { status: 'error'; message: string }
  | null;
let lastFcmResult: FcmRegistrationResult = null;

export function getLastFcmRegistrationResult(): FcmRegistrationResult {
  return lastFcmResult;
}

/** Lazy load expo-notifications so Expo Go doesn't throw at import time (SDK 53+). */
async function getNotificationsModule() {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/** Navigate to the right screen when user taps a notification. FCM data is always string values. */
export function handleNotificationTap(data: Record<string, string>): void {
  if (!data || typeof data !== 'object') return;
  const chatId = data.chatId ?? data.relatedId;
  const type = data.type ?? '';
  const relatedId = data.relatedId ?? '';
  const notificationId = data.notificationId ?? '';
  const relatedType = data.relatedType ?? '';

  if (chatId && (type === 'NEW_CHAT_MESSAGE' || relatedType === 'CHAT')) {
    router.push(`/chat/${chatId}`);
    return;
  }
  if (notificationId) {
    router.push(`/notifications?id=${encodeURIComponent(notificationId)}`);
    return;
  }
  if (relatedId) {
    if (type.includes('APPLICATION') || type === 'INTERVIEW_SCHEDULED' || type === 'INTERVIEW_UPDATED') {
      router.push(`/application-details/${relatedId}`);
      return;
    }
    if (type.includes('JOB') || type === 'JOB_APPROVED' || type === 'JOB_REJECTED') {
      router.push(`/job-details/${relatedId}`);
      return;
    }
  }
  const jobId = data.jobId ?? '';
  if (jobId) {
    router.push(`/job-details/${jobId}`);
    return;
  }
  router.push('/notifications');
}

/**
 * Set up listeners: (1) notification taps; (2) when a notification is received in foreground,
 * schedule it for immediate display so it appears in the device notification bar (status bar / tray).
 * Call once from root layout. Does nothing if expo-notifications is not available.
 */
export function setupNotificationHandlers(): () => void {
  let tapSubscription: { remove: () => void } | null = null;
  let receivedSubscription: { remove: () => void } | null = null;
  getNotificationsModule().then((Notifications) => {
    if (!Notifications) return;
    tapSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification?.request?.content?.data as Record<string, string> | undefined;
      if (data) handleNotificationTap(data);
    });
    // When app is in foreground, FCM may deliver to app without showing in device notification bar.
    // Schedule an immediate local copy so it always appears in the notification tray.
    receivedSubscription = Notifications.addNotificationReceivedListener((event) => {
      const content = event?.request?.content;
      if (!content) return;
      const title = content.title ?? 'Notification';
      const body = content.body ?? content.subtitle ?? '';
      const data = content.data && typeof content.data === 'object'
        ? Object.fromEntries(
            Object.entries(content.data).map(([k, v]) => [k, v != null ? String(v) : ''])
          )
        : undefined;
      Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null, // deliver immediately so it shows in device notification section
      }).catch(() => {});
    });
  });
  return () => {
    tapSubscription?.remove();
    receivedSubscription?.remove();
  };
}

/**
 * Handle app opened from killed state by tapping a notification.
 * Call from root layout after a short delay (e.g. 500ms) so router is ready.
 */
export async function handleLastNotificationResponseIfAny(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response?.notification?.request?.content?.data) return;
    const data = response.notification.request.content.data as Record<string, string>;
    handleNotificationTap(data);
  } catch {
    // ignore
  }
}

/**
 * Get device push token, with one retry after 2s if null (Android APK often needs a short delay on first launch).
 */
async function getDevicePushTokenWithRetry(Notifications: typeof import('expo-notifications')): Promise<string | null> {
  let tokenResult = await Notifications.getDevicePushTokenAsync();
  let token = tokenResult?.data ?? null;
  if (!token && Platform.OS === 'android') {
    await new Promise((r) => setTimeout(r, 2000));
    tokenResult = await Notifications.getDevicePushTokenAsync();
    token = tokenResult?.data ?? null;
  }
  return token;
}

/** Truncate token for safe logging (first 12 + ... + last 8). */
function tokenPreview(token: string): string {
  if (token.length <= 24) return `${token.length} chars`;
  return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

/**
 * Request permissions and get the device push token (FCM on Android, APNs on iOS).
 * Registers the token with the backend when user is logged in.
 * No-op in Expo Go (use a development build for real push).
 * On APK: ensure the EAS build was made *after* adding FCM v1 credentials in Expo dashboard.
 */
export async function registerPushTokenWithBackend(): Promise<void> {
  try {
    lastFcmResult = null;
    //console.log('[FCM device token] Registering: requesting token from device...');
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      lastFcmResult = { status: 'no_token', message: 'Push not available (e.g. Expo Go)' };
      console.warn('[FCM device token] Not received from mobile app: push not available (e.g. Expo Go). Use a dev build or APK.');
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') {
      lastFcmResult = { status: 'permission_denied' };
      console.warn('[FCM device token] Not received: notification permission not granted:', final);
      return;
    }

    const token = await getDevicePushTokenWithRetry(Notifications);
    if (!token) {
      lastFcmResult = { status: 'no_token', message: 'getDevicePushTokenAsync returned null' };
      console.warn('[FCM device token] Not received from mobile app: getDevicePushTokenAsync returned null (use dev build/APK; ensure EAS build has FCM v1 credentials).');
      return;
    }
    //console.log('[FCM device token] Received from mobile app:', tokenPreview(token));

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    //console.log('[FCM device token] Sending to backend...');
    const res = await apiClient.registerFcmToken(token, platform);
    if (res.success) {
      lastRegisteredToken = token;
      lastFcmResult = { status: 'success' };
      //console.log('[FCM device token] Saved successfully on backend.');
    } else {
      lastFcmResult = { status: 'backend_rejected', error: res.error ?? 'Unknown' };
      console.warn('[FCM device token] Not saved: backend rejected:', res.error);
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const isFirebaseNotInit =
      raw.includes('FirebaseApp is not initialized') ||
      raw.includes('FirebaseApp.initializeApp') ||
      raw.includes('fcm-credentials');
    const message = isFirebaseNotInit
      ? 'Firebase is not configured in this build. Add FCM credentials in Expo (expo.dev → your project → Credentials → Android → FCM), then rebuild the app with "eas build --platform android".'
      : raw;
    lastFcmResult = { status: 'error', message };
    console.warn('[FCM device token] Register failed:', raw);
  }
}

/**
 * Unregister the last known token (call on logout).
 */
export async function unregisterPushToken(): Promise<void> {
  if (!lastRegisteredToken) return;
  try {
    await apiClient.unregisterFcmToken(lastRegisteredToken);
  } catch (e) {
    // ignore
  } finally {
    lastRegisteredToken = null;
  }
}
