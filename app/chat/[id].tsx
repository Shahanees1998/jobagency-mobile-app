import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Text,
  Alert,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const BUBBLE_MAX_WIDTH = '75%';
const OTHER_AVATAR_SIZE = 28;

function parseDateSafe(value: any) {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatTimeSafe(d: Date) {
  try {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

function formatDateLabelSafe(d: Date) {
  try {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInfo, setChatInfo] = useState<{ displayName: string; avatarLetter: string; avatarImage?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadChatAndMessages();
  }, [id]);

  const loadChatAndMessages = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [chatRes, messagesRes] = await Promise.all([
        apiClient.getChatById(id),
        apiClient.getChatMessages(id, { page: 1, limit: 100 }),
      ]);

      if (chatRes.success && chatRes.data) {
        const chat = chatRes.data as any;
        const isEmployer = user?.role === 'EMPLOYER';
        const other = isEmployer
          ? (chat.application?.candidate ?? chat.otherParticipant)
          : (chat.application?.job?.employer ?? chat.otherParticipant);
        const displayName = other?.companyName ?? [other?.user?.firstName, other?.user?.lastName].filter(Boolean).join(' ') ?? 'Chat';
        const letter = (displayName || '?').charAt(0).toUpperCase();
        const avatarImage = other?.user?.profileImage ?? other?.profileImage;
        setChatInfo({ displayName, avatarLetter: letter, avatarImage });
      } else {
        setChatInfo({ displayName: 'Chat', avatarLetter: '?' });
      }

      if (messagesRes.success && messagesRes.data) {
        const list = messagesRes.data.messages ?? [];
        setMessages(Array.isArray(list) ? list : []);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending || !id) return;
    const text = messageText.trim();
    setMessageText('');
    setSending(true);
    try {
      const response = await apiClient.sendMessage(id, text);
      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        setMessageText(text);
        showDialog({ title: 'Error', message: response.error || 'Failed to send', primaryButton: { text: 'OK' } });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(text);
      showDialog({ title: 'Error', message: (error as Error)?.message || 'Failed to send', primaryButton: { text: 'OK' } });
    } finally {
      setSending(false);
    }
  };

  const sendImageMessage = async (uri: string, mimeType: string) => {
    if (!id || sending) return;
    setSending(true);
    try {
      const uploadRes = await apiClient.uploadChatImage(uri, mimeType);
      if (!uploadRes.success || !uploadRes.data?.url) {
        showDialog({ title: 'Error', message: uploadRes.error || 'Failed to upload image', primaryButton: { text: 'OK' } });
        setSending(false);
        return;
      }
      const response = await apiClient.sendMessage(id, uploadRes.data.url, 'IMAGE');
      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to send image', primaryButton: { text: 'OK' } });
      }
    } catch (error) {
      showDialog({ title: 'Error', message: (error as Error)?.message || 'Failed to send image', primaryButton: { text: 'OK' } });
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentImage = async () => {
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        console.warn('[Chat] ImagePicker module failed to load:', e);
        showDialog({
          title: 'Unavailable',
          message: 'Attachments are not available in this app build.',
          primaryButton: { text: 'OK' },
        });
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showDialog({ title: 'Permission needed', message: 'Allow access to your photos to attach images.', primaryButton: { text: 'OK' } });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const asset = !result.canceled ? result.assets?.[0] : undefined;
      if (asset?.uri) {
        await sendImageMessage(asset.uri, asset.mimeType ?? 'image/jpeg');
      }
    } catch (error) {
      console.error('[Chat] handleAttachment error:', error);
      showDialog({ title: 'Error', message: 'Could not open attachments. Please try again.', primaryButton: { text: 'OK' } });
    }
  };

  const handleDocumentAttachment = async () => {
    if (!id || sending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setSending(true);
      const uploadRes = await apiClient.uploadChatDocument(
        asset.uri,
        asset.mimeType ?? 'application/octet-stream',
        asset.name ?? 'document'
      );
      if (!uploadRes.success || !uploadRes.data?.url) {
        showDialog({ title: 'Error', message: uploadRes.error || 'Failed to upload document', primaryButton: { text: 'OK' } });
        setSending(false);
        return;
      }
      const response = await apiClient.sendMessage(id, uploadRes.data.url, 'FILE');
      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to send document', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error?.message || 'Could not pick or send document.', primaryButton: { text: 'OK' } });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    Alert.alert(
      'Attach',
      'Choose attachment type',
      [
        { text: 'Image', onPress: handleAttachmentImage },
        { text: 'Document (PDF, Word, etc.)', onPress: handleDocumentAttachment },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleCamera = async () => {
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        console.warn('[Chat] ImagePicker module failed to load:', e);
        showDialog({
          title: 'Unavailable',
          message: 'Camera is not available in this app build.',
          primaryButton: { text: 'OK' },
        });
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showDialog({ title: 'Permission needed', message: 'Allow camera access to take photos.', primaryButton: { text: 'OK' } });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const asset = !result.canceled ? result.assets?.[0] : undefined;
      if (asset?.uri) {
        await sendImageMessage(asset.uri, asset.mimeType ?? 'image/jpeg');
      }
    } catch (error) {
      console.error('[Chat] handleCamera error:', error);
      showDialog({ title: 'Error', message: 'Could not open camera. Please try again.', primaryButton: { text: 'OK' } });
    }
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const groups: { type: 'date' | 'message'; key: string; dateLabel?: string; message?: any }[] = [];
    let lastDate = '';
    msgs.forEach((msg, idx) => {
      const d = parseDateSafe(msg?.createdAt);
      if (!d) {
        const fallbackKey = String(msg?.id ?? msg?._id ?? `idx-${idx}`);
        groups.push({ type: 'message', key: fallbackKey, message: msg });
        return;
      }

      const dateKey = d.toDateString();
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        let label = formatDateLabelSafe(d);
        if (dateKey === today.toDateString()) label = 'Today';
        else if (dateKey === yesterday.toDateString()) label = 'Yesterday';
        groups.push({ type: 'date', key: `date-${dateKey}`, dateLabel: label });
      }

      const msgKey = String(msg?.id ?? msg?._id ?? `idx-${idx}`);
      groups.push({ type: 'message', key: msgKey, message: msg });
    });
    return groups;
  };

  const renderItem = ({ item }: { item: { type: string; key: string; dateLabel?: string; message?: any } }) => {
    if (item.type === 'date' && item.dateLabel) {
      return (
        <View style={styles.dateSeparatorWrap}>
          <Text style={styles.dateSeparator}>{item.dateLabel}</Text>
        </View>
      );
    }
    if (item.type !== 'message' || !item.message) return null;
    const msg = item.message;
    const isMyMessage = (msg.senderId ?? msg.sender?.id) === user?.id;

    const dt = parseDateSafe(msg?.createdAt);
    const timeStr = dt ? formatTimeSafe(dt) : '';
    const contentStr = typeof msg?.content === 'string' ? msg.content : String(msg?.content ?? '');
    const isImage =
      msg?.messageType === 'IMAGE' &&
      typeof contentStr === 'string' &&
      (contentStr.startsWith('http://') ||
        contentStr.startsWith('https://') ||
        contentStr.startsWith('data:image') ||
        (contentStr.length > 100 && !/\s/.test(contentStr)));
    const imageUri =
      isImage && contentStr.startsWith('data:')
        ? contentStr
        : isImage && contentStr.length > 100 && !contentStr.startsWith('http')
          ? `data:image/jpeg;base64,${contentStr}`
          : contentStr;

    const isFile =
      msg?.messageType === 'FILE' &&
      typeof contentStr === 'string' &&
      (contentStr.startsWith('http://') || contentStr.startsWith('https://') || contentStr.startsWith('data:'));

    const openDocument = async () => {
      if (contentStr.startsWith('http')) {
        await Linking.openURL(contentStr);
        return;
      }
      if (contentStr.startsWith('data:')) {
        try {
          const match = contentStr.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) return;
          const mime = match[1];
          const base64 = match[2];
          const ext = mime.includes('pdf') ? 'pdf' : mime.includes('word') || mime.includes('msword') ? 'doc' : mime.includes('sheet') ? 'xls' : 'bin';
          const path = `${FileSystem.cacheDirectory}chat-doc-${Date.now()}.${ext}`;
          await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
          const uri = path.startsWith('file://') ? path : `file://${path}`;
          await Linking.openURL(uri);
        } catch (e) {
          console.warn('[Chat] openDocument error', e);
          showDialog({ title: 'Error', message: 'Could not open document.', primaryButton: { text: 'OK' } });
        }
      }
    };

    const renderFileBubble = () => (
      <TouchableOpacity onPress={openDocument} style={styles.fileBubble} activeOpacity={0.8}>
        <Ionicons name="document-attach-outline" size={24} color={isMyMessage ? APP_COLORS.white : APP_COLORS.primary} />
        <Text style={[styles.fileBubbleText, isMyMessage && styles.fileBubbleTextMy]} numberOfLines={1}>Document</Text>
        <Text style={[styles.myBubbleTime, !isMyMessage && styles.otherBubbleTime]}>{timeStr}</Text>
      </TouchableOpacity>
    );

    if (isMyMessage) {
      return (
        <View style={styles.myMessageRow}>
          <View style={styles.myBubble}>
            {isImage ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.chatImage} resizeMode="cover" />
                <Text style={styles.myBubbleTime}>{timeStr}</Text>
              </>
            ) : isFile ? (
              renderFileBubble()
            ) : (
              <>
                <Text style={styles.myBubbleText}>{contentStr}</Text>
                <Text style={styles.myBubbleTime}>{timeStr}</Text>
              </>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageRow}>
        <View style={styles.otherAvatarSmall}>
          {chatInfo?.avatarImage ? (
            <Image source={{ uri: chatInfo.avatarImage }} style={styles.otherAvatarImage} />
          ) : (
            <Text style={styles.otherAvatarLetter}>{chatInfo?.avatarLetter ?? '?'}</Text>
          )}
        </View>
        <View style={styles.otherBubble}>
          {isImage ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.chatImage} resizeMode="cover" />
              <Text style={styles.otherBubbleTime}>{timeStr}</Text>
            </>
          ) : isFile ? (
            renderFileBubble()
          ) : (
            <>
              <Text style={styles.otherBubbleText}>{contentStr}</Text>
              <Text style={styles.otherBubbleTime}>{timeStr}</Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const groupedData = groupMessagesByDate(messages);

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
        {/* Header: dark teal bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            {chatInfo?.avatarImage ? (
              <Image source={{ uri: chatInfo.avatarImage }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarLetter}>{chatInfo?.avatarLetter ?? '?'}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{chatInfo?.displayName ?? 'Chat'}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={groupedData}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>No messages yet. Say hello!</Text>
              </View>
            }
          />

          <View style={[styles.inputRow, { paddingBottom: Math.max(14, insets.bottom + 8) }]}>
            <TextInput
              style={styles.input}
              placeholder="Enter your message..."
              placeholderTextColor={APP_COLORS.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttachment} hitSlop={8} disabled={sending}>
              <Ionicons name="attach-outline" size={22} color={APP_COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleCamera} hitSlop={8} disabled={sending}>
              <Ionicons name="camera-outline" size={22} color={APP_COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, (!messageText.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={APP_COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={APP_COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1 },
  flex1: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  headerAvatarImage: { width: '100%', height: '100%' },
  headerAvatarLetter: { fontSize: 18, fontWeight: '700', color: APP_COLORS.white },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 17, fontWeight: '700', color: APP_COLORS.white },
  headerStatus: { fontSize: 13, color: APP_COLORS.success, marginTop: 2 },
  messagesList: { padding: 16, paddingBottom: 16 },
  dateSeparatorWrap: { alignItems: 'center', marginVertical: 16 },
  dateSeparator: { fontSize: 13, color: APP_COLORS.textMuted },
  myMessageRow: { alignItems: 'flex-end', marginBottom: 12 },
  myBubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  myBubbleText: { fontSize: 16, color: APP_COLORS.white, marginBottom: 4 },
  myBubbleTime: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  otherAvatarSmall: {
    width: OTHER_AVATAR_SIZE,
    height: OTHER_AVATAR_SIZE,
    borderRadius: OTHER_AVATAR_SIZE / 2,
    backgroundColor: APP_COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  otherAvatarImage: { width: '100%', height: '100%' },
  otherAvatarLetter: { fontSize: 12, fontWeight: '700', color: APP_COLORS.white },
  otherBubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    backgroundColor: APP_COLORS.surfaceGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  otherBubbleText: { fontSize: 16, color: APP_COLORS.textPrimary, marginBottom: 4 },
  otherBubbleTime: { fontSize: 11, color: APP_COLORS.textMuted },
  chatImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  fileBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  fileBubbleText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.primary, flex: 1 },
  fileBubbleTextMy: { color: APP_COLORS.white },
  emptyMessages: { paddingVertical: 32, alignItems: 'center' },
  emptyMessagesText: { fontSize: 15, color: APP_COLORS.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 14,
    backgroundColor: APP_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 100,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    marginRight: 8,
  },
  attachBtn: { padding: 8, marginRight: 4 },
  cameraBtn: { padding: 8, marginRight: 4 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
