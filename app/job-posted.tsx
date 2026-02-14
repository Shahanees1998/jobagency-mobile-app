import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function JobPostedScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job posted</Text>
        <View style={styles.headerBtn} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase" size={48} color={APP_COLORS.white} />
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={20} color={APP_COLORS.primary} />
          </View>
        </View>
        <Text style={styles.title}>Your job is live and ready for applications !!</Text>
        <Text style={styles.subtext}>
          Candidates can now find and apply to your job. You can edit or close it anytime from your job listing.
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
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  content: { flex: 1, paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 48, alignItems: 'center' },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtext: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  primaryBtn: {
    height: 54,
    paddingHorizontal: 32,
    borderRadius: APP_SPACING.borderRadiusLg,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
