import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServicesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of services</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: 29 October, 2024</Text>

        <Text style={styles.paragraph}>
          Welcome to our Job Portal. By accessing or using our application, you agree to be bound by
          these Terms of Service. Please read them carefully.
        </Text>

        <Text style={styles.heading}>Acceptance of terms</Text>
        <Text style={styles.paragraph}>
          By using our services, you acknowledge that you have read, understood, and agree to
          comply with these terms. If you do not agree, please do not use our app.
        </Text>

        <Text style={styles.heading}>Services</Text>
        <Text style={styles.paragraph}>
          We provide a platform connecting job seekers with employers. We reserve the right to
          modify, suspend, or discontinue any part of our services at any time with or without
          notice.
        </Text>

        <Text style={styles.heading}>User conduct</Text>
        <Text style={styles.paragraph}>
          You agree to use our services only for lawful purposes. You must not post false
          information, harass others, or violate any applicable laws. We may suspend or terminate
          accounts that breach these terms.
        </Text>

        <Text style={styles.heading}>Intellectual property</Text>
        <Text style={styles.paragraph}>
          Content provided through our services, including text, graphics, logos, and software, is
          owned by us or our licensors. You may not copy, modify, or distribute this content
          without permission.
        </Text>
      </ScrollView>
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
    borderBottomColor: '#E5E7EB',
    backgroundColor: APP_COLORS.background,
  },
  backBtn: { padding: 8, minWidth: 40, minHeight: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary, fontFamily: 'Kanit' },
  container: { flex: 1 },
  content: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  updated: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: APP_COLORS.textPrimary,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
});
