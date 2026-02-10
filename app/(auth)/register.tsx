import {
  AuthBanner,
  PrimaryButton,
  SegmentedControl,
  type SegmentOption,
} from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [role, setRole] = useState<SegmentOption>('candidate');
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  const handleCreateAccount = () => {
    router.push({
      pathname: '/(auth)/create-account',
      params: { role: role === 'candidate' ? 'CANDIDATE' : 'EMPLOYER' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isNarrow && styles.scrollNarrow]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthBanner
          title="How do you want to register?"
          subtitle="Please select whether you are registering as a candidate or an employer."
        />
        <View style={styles.content}>
          <Text style={styles.headline}>
            Find, Manage, & Pay Talent, All In One Place.
          </Text>
          <SegmentedControl value={role} onChange={setRole} style={styles.segment} />
          <PrimaryButton
            title="Create Account"
            onPress={handleCreateAccount}
            showArrow
            style={styles.primaryBtn}
          />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: AUTH_SPACING.contentPaddingV * 2,
  },
  scrollNarrow: {
    paddingHorizontal: 0,
  },
  content: {
    paddingHorizontal: AUTH_SPACING.contentPaddingH,
    paddingTop: AUTH_SPACING.contentPaddingV + 8,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.textPrimary,
    marginBottom: AUTH_SPACING.gapSection,
    lineHeight: 26,
  },
  segment: {
    marginBottom: AUTH_SPACING.gapSection,
  },
  primaryBtn: {
    marginBottom: AUTH_SPACING.gapSection,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
  },
  footerLink: {
    fontSize: AUTH_TYPO.bodySmall,
    fontWeight: '600',
    color: AUTH_COLORS.primary,
  },
});
