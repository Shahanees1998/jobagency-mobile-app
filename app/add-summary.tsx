import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddSummaryScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getCandidateProfile();
        if (res.success && res.data) {
          const d = res.data as any;
          setSummary(d.bio ?? '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const insertAtCursor = (text: string) => {
    const { start, end } = selection;
    const before = summary.slice(0, start);
    const after = summary.slice(end);
    const next = before + text + after;
    setSummary(next);
    const newPos = start + text.length;
    setSelection({ start: newPos, end: newPos });
    setTimeout(() => inputRef.current?.setNativeProps({ selection: { start: newPos, end: newPos } }), 0);
  };

  const onBullet = () => {
    const atLineStart = selection.start === 0 || summary[selection.start - 1] === '\n';
    insertAtCursor(atLineStart ? '• ' : '\n• ');
  };

  const onNumbered = () => {
    const atLineStart = selection.start === 0 || summary[selection.start - 1] === '\n';
    const before = summary.slice(0, selection.start);
    const nums = (before.match(/^\d+\.\s/gm) || []).length;
    insertAtCursor(atLineStart ? `${nums + 1}. ` : `\n${nums + 1}. `);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.updateCandidateProfile({ bio: summary.trim() || undefined });
      if (res.success) router.back();
    } finally {
      setSaving(false);
    }
  };

  const isEdit = summary.trim().length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit summary' : 'Add summary'}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.instruction}>
            Give a brief overview of your past experience, focusing on top skills and achievements.
          </Text>

          <View style={styles.descWrap}>
            <View style={styles.descToolbarRow}>
              <TouchableOpacity style={styles.descToolbarIcon} onPress={onBullet} activeOpacity={0.7}>
                <Ionicons name="list" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.descToolbarIcon} onPress={onNumbered} activeOpacity={0.7}>
                <Ionicons name="reorder-three" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.descToolbarBorder} />
            <TextInput
              ref={inputRef}
              style={styles.textArea}
              placeholder="Enter summary description..."
              placeholderTextColor={APP_COLORS.textMuted}
              value={summary}
              onChangeText={setSummary}
              onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
              selection={selection}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: APP_COLORS.white,
  },
  backBtn: { padding: 4, minWidth: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 16 },
  instruction: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  descWrap: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    minHeight: 200,
    maxHeight: 320,
  },
  descToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  descToolbarIcon: { padding: 6, marginRight: 4 },
  descToolbarBorder: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 160,
    maxHeight: 260,
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
