import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.customHeader, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policies & terms</Text>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

const MENU_ICON_COLOR = APP_COLORS.primary;

function PolicyRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={APP_COLORS.white} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function PoliciesTermsScreen() {
  return (
    <View style={styles.container}>
      <CustomHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PolicyRow
          icon="document-text-outline"
          title="Privacy policy"
          subtitle="Information we receive & how it's used."
          onPress={() => router.push('/privacy-policy')}
        />
        <PolicyRow
          icon="document-text-outline"
          title="Terms of services"
          subtitle="Terms you agree, when you use app."
          onPress={() => router.push('/terms-of-services')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: APP_SPACING.itemPadding,
    borderRadius: APP_SPACING.borderRadius,
    marginBottom: 12,

    borderColor: APP_COLORS.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customHeader: {
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
  },
  rowContent: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
});
