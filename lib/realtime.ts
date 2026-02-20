/**
 * Pusher real-time (aligned with admin panel).
 * Channel names and events must match backend: lib/realtime.ts and chat messages route.
 */
import Constants from 'expo-constants';
import Pusher from 'pusher-js';

const PUSHER_KEY =
  (typeof Constants.expoConfig?.extra !== 'undefined' && (Constants.expoConfig.extra as any).pusherKey) ||
  process.env.EXPO_PUBLIC_PUSHER_KEY ||
  '';
const PUSHER_CLUSTER =
  (typeof Constants.expoConfig?.extra !== 'undefined' && (Constants.expoConfig.extra as any).pusherCluster) ||
  process.env.EXPO_PUBLIC_PUSHER_CLUSTER ||
  'mt1';

export const chatChannelName = (chatRoomId: string) => `chat-${chatRoomId}`;
export const userChannelName = (userId: string) => `user-${userId}`;

let pusherClient: Pusher | null = null;

/** Get Pusher client (same key/cluster as admin). Create once, reuse. */
export function getPusherClient(): Pusher | null {
  if (!PUSHER_KEY) return null;
  if (!pusherClient) {
    (Pusher as any).logToConsole = false;
    pusherClient = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  }
  return pusherClient;
}
