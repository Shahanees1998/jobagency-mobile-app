/**
 * Pusher client for real-time chat. Config is fetched from backend GET /api/config.
 */
import Pusher from 'pusher-js';
import { apiClient } from '@/lib/api';

export const CHAT_CHANNEL_PREFIX = 'chat-';
export const CHAT_EVENT_NEW_MESSAGE = 'new-message';

let cachedClient: Pusher | null = null;
let cachedKey: string | null = null;

export function chatChannelName(chatId: string): string {
  return `${CHAT_CHANNEL_PREFIX}${chatId}`;
}

export interface PusherConfig {
  pusherKey: string | null;
  pusherCluster: string;
}

export async function getPusherConfig(): Promise<PusherConfig | null> {
  try {
    const res = await apiClient.getConfig();
    if (res.success && res.data) {
      return {
        pusherKey: res.data.pusherKey ?? null,
        pusherCluster: res.data.pusherCluster || 'mt1',
      };
    }
  } catch (e) {
    if (__DEV__) console.warn('[Pusher] getConfig failed', e);
  }
  return null;
}

/**
 * Get or create a Pusher client. Returns null if no key is configured.
 */
export async function getPusherClient(): Promise<Pusher | null> {
  const config = await getPusherConfig();
  if (!config?.pusherKey) return null;
  if (cachedClient && cachedKey === config.pusherKey) return cachedClient;
  try {
    const client = new Pusher(config.pusherKey, {
      cluster: config.pusherCluster,
      forceTLS: true,
    });
    cachedClient = client;
    cachedKey = config.pusherKey;
    return client;
  } catch (e) {
    if (__DEV__) console.warn('[Pusher] create client failed', e);
    return null;
  }
}

export type NewMessagePayload = {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender?: { id: string; firstName?: string; lastName?: string; profileImage?: string };
};

/**
 * Subscribe to a chat channel and call onNewMessage when a message is received.
 * Returns unsubscribe function.
 */
export async function subscribeToChat(
  chatId: string,
  onNewMessage: (message: NewMessagePayload) => void
): Promise<() => void> {
  const client = await getPusherClient();
  if (!client) return () => {};
  const channelName = chatChannelName(chatId);
  const channel = client.subscribe(channelName);

  const handler = (data: NewMessagePayload) => {
    if (data && typeof data.id === 'string') {
      onNewMessage({
        id: data.id,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        createdAt: data.createdAt,
        sender: data.sender,
      });
    }
  };

  channel.bind(CHAT_EVENT_NEW_MESSAGE, handler);

  return () => {
    channel.unbind(CHAT_EVENT_NEW_MESSAGE, handler);
    client.unsubscribe(channelName);
  };
}

export const USER_NOTIFICATION_CHANNEL_PREFIX = 'user-';
export const USER_NOTIFICATION_EVENT = 'new-notification';

export type NewNotificationPayload = {
  id: string;
  title: string;
  message: string;
  type?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt?: string;
};

/**
 * Subscribe to the current user's notification channel so new notifications (e.g. job approved)
 * appear in real time on the notifications list screen.
 * Returns unsubscribe function.
 */
export async function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (payload: NewNotificationPayload) => void
): Promise<() => void> {
  const client = await getPusherClient();
  if (!client || !userId) return () => {};
  const channelName = `${USER_NOTIFICATION_CHANNEL_PREFIX}${userId}`;
  const channel = client.subscribe(channelName);

  const handler = (data: NewNotificationPayload) => {
    if (data && typeof data.id === 'string') {
      onNewNotification({
        id: data.id,
        title: data.title ?? '',
        message: data.message ?? '',
        type: data.type,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        createdAt: data.createdAt,
      });
    }
  };

  channel.bind(USER_NOTIFICATION_EVENT, handler);

  return () => {
    channel.unbind(USER_NOTIFICATION_EVENT, handler);
    client.unsubscribe(channelName);
  };
}
