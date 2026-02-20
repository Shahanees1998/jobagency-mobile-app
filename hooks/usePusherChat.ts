import { getPusherClient, chatChannelName } from '@/lib/realtime';
import { useEffect, useRef } from 'react';

export interface NewMessagePayload {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender?: { id: string; firstName?: string; lastName?: string };
}

/**
 * Subscribe to Pusher chat channel for real-time messages (same as admin panel).
 * Call onNewMessage when a new-message event is received (append to list if not from current send).
 */
export function usePusherChat(
  chatId: string | undefined,
  onNewMessage: (payload: NewMessagePayload) => void
) {
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!chatId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const channelName = chatChannelName(chatId);
    const channel = pusher.subscribe(channelName);
    const handler = (data: NewMessagePayload) => {
      onNewMessageRef.current(data);
    };
    channel.bind('new-message', handler);
    return () => {
      channel.unbind('new-message', handler);
      pusher.unsubscribe(channelName);
    };
  }, [chatId]);
}
