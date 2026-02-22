import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

const ICON_BG = '#6B9BA3';
const BTN_BG = '#2A5A6A';

export default function JobPostedScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job posted</Text>
        <View style={styles.headerBtn} />
      </View>
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase-outline" size={56} color={APP_COLORS.textPrimary} />
        </View>
        <Text style={styles.title}>Your job is live and ready for applications !!</Text>
        <Text style={styles.subtext}>
          Your job has been published and is now visible to potential candidates. You'll start receiving applications soon.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Return to job listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.white,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  content: {
    flex: 1,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  subtext: {
    fontSize: 15,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: BTN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
});
