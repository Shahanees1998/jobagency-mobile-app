import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ApplicationSubmittedScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? user?.email ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="paper-plane" size={40} color={APP_COLORS.white} />
        </View>
        <Text style={styles.title}>Your application has been submitted !!</Text>
        <Text style={styles.message}>
          Your job application has been submitted successfully. A confirmation email will be sent
          shortly to{' '}
          <Text style={styles.email}>{email || 'your email'}</Text>.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Return to job search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  email: {
    fontWeight: '600',
    color: APP_COLORS.primary,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.white,
  },
});
