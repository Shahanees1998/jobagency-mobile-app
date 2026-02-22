import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';

export default function EmployerProfileOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const inputRef = useRef<TextInput>(null);
  const [companyDescription, setCompanyDescription] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const insertAtCursor = (textToInsert: string) => {
    const start = selection.start;
    const end = selection.end;
    const before = companyDescription.slice(0, start);
    const after = companyDescription.slice(end);
    const newText = before + textToInsert + after;
    setCompanyDescription(newText);
    const newCursor = start + textToInsert.length;
    setSelection({ start: newCursor, end: newCursor });
    setTimeout(() => {
      inputRef.current?.setNativeProps({ selection: { start: newCursor, end: newCursor } });
    }, 0);
  };

  const handleNumberedList = () => {
    const atLineStart = selection.start === 0 || companyDescription[selection.start - 1] === '\n';
    const textBeforeCursor = companyDescription.slice(0, selection.start);
    const numberedMatches = textBeforeCursor.match(/^\d+\.\s/gm) || [];
    const nextNum = numberedMatches.length + 1;
    const toInsert = atLineStart ? `${nextNum}. ` : `\n${nextNum}. `;
    insertAtCursor(toInsert);
  };

  const handleBulletList = () => {
    const atLineStart = selection.start === 0 || companyDescription[selection.start - 1] === '\n';
    const toInsert = atLineStart ? '• ' : '\n• ';
    insertAtCursor(toInsert);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        setCompanyDescription(response.data.companyDescription || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showDialog({ title: 'Error', message: 'Failed to load profile', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await apiClient.updateEmployerProfile({ companyDescription });
      if (res.success) {
        showDialog({
          title: 'Success',
          message: 'Company overview updated',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: res.error || 'Failed to save', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to save', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company overview</Text>
        <View style={styles.headerBtn} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.instruction}>
            Add a company overview, including primary services, industry focus, and key milestones.
          </Text>
          <View style={styles.inputWrap}>
            <View style={styles.toolbarRow}>
              <TouchableOpacity style={styles.toolbarIcon} onPress={handleNumberedList} activeOpacity={0.7}>
                <Ionicons name="reorder-three" size={24} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarIcon} onPress={handleBulletList} activeOpacity={0.7}>
                <Ionicons name="list" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.toolbarBorder} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={companyDescription}
              onChangeText={setCompanyDescription}
              onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
              selection={selection}
              placeholder="Enter company overview"
              placeholderTextColor={APP_COLORS.textMuted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8 },
  instruction: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputWrap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 200,
    marginBottom: 24,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbarIcon: {
    padding: 6,
    marginRight: 4,
  },
  toolbarBorder: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  input: {
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 172,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
