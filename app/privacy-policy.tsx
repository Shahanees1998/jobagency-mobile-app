import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: 29 October, 2024</Text>

        <Text style={styles.paragraph}>
          Your privacy is important to us. This Privacy Policy outlines how we collect, use, and
          protect your information when you use our job portal application.
        </Text>

        <Text style={styles.heading}>Information we collect</Text>
        <Text style={styles.subHeading}>Personal information</Text>
        <Text style={styles.paragraph}>
          We may collect your name, email address, phone number, resume, and other details you
          provide when creating an account or applying for jobs.
        </Text>
        <Text style={styles.subHeading}>Usage data</Text>
        <Text style={styles.paragraph}>
          We gather information about how you interact with our app, including pages visited,
          features used, and device information to improve our services.
        </Text>

        <Text style={styles.heading}>How we use your information</Text>
        <Text style={styles.subHeading}>To provide services</Text>
        <Text style={styles.paragraph}>
          We use your information to process job applications, match you with employers, and
          deliver relevant job recommendations.
        </Text>
        <Text style={styles.subHeading}>For marketing purposes</Text>
        <Text style={styles.paragraph}>
          With your consent, we may send you updates about new jobs, tips, and promotional
          content. You can opt out at any time.
        </Text>

        <Text style={styles.heading}>Data protection</Text>
        <Text style={styles.paragraph}>
          We implement a variety of security measures to protect your personal information,
          including encryption and secure servers. We do not sell your data to third parties.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
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
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
});
