import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function InterviewUpdatedScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/interviews')} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interview updated</Text>
        <View style={styles.headerBtn} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={48} color={APP_COLORS.white} />
        </View>
        <Text style={styles.title}>Interview details updated successfully !!</Text>
        <Text style={styles.subtext}>
          The changes have been saved and the updated interview information is now available to the candidate.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/interviews')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Return to interview listing</Text>
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
