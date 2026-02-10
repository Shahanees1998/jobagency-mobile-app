import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <Ionicons name={icon} size={24} color={MENU_ICON_COLOR} />
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1 },
  content: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: APP_SPACING.itemPadding,
    borderRadius: APP_SPACING.borderRadius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  iconWrap: { marginRight: 14 },
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
