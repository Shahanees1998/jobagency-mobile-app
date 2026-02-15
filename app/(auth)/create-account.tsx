import {
    AuthBanner,
    AuthInput,
    GoogleButton,
    OrDivider,
    PrimaryButton,
} from '@/components/auth';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TITLES = {
  CANDIDATE: 'Sign up to find work you love',
  EMPLOYER: 'Sign up to hire talent & professionals',
} as const;

export default function CreateAccountScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';
  const { register } = useAuth();
  const { showDialog } = useDialog();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  const handleGoogle = () => {
    showDialog({ title: 'Coming Soon', message: 'Google sign-in will be available soon.', primaryButton: { text: 'OK' } });
  };

  const handleCreateAccount = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showDialog({ title: 'Error', message: 'Please enter your full name', primaryButton: { text: 'OK' } });
      return;
    }
    if (!email.trim()) {
      showDialog({ title: 'Error', message: 'Please enter your email address', primaryButton: { text: 'OK' } });
      return;
    }
    if (!password) {
      showDialog({ title: 'Error', message: 'Please enter a password', primaryButton: { text: 'OK' } });
      return;
    }
    if (password.length < 6) {
      showDialog({ title: 'Error', message: 'Password must be at least 6 characters', primaryButton: { text: 'OK' } });
      return;
    }
    const [firstName, ...rest] = trimmedName.split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    setLoading(true);
    const payload = {
      firstName,
      lastName,
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      role,
    };
    try {
      const result = await register(payload);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        showDialog({ title: 'Registration Failed', message: result.error || 'Could not create account', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'An error occurred';
      showDialog({ title: 'Error', message: msg, primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, isNarrow && styles.scrollNarrow]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthBanner
            title={TITLES[role]}
            showLogo={true}
            subtitle={undefined}
            googleButton={<GoogleButton onPress={handleGoogle} />}
          />
          <View style={styles.content}>
            <AuthInput
              icon="person"
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              containerStyle={styles.input}
            />
            <AuthInput
              icon="email"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.input}
            />
            <AuthInput
              icon="phone"
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              containerStyle={styles.input}
            />
            <AuthInput
              icon="password"
              placeholder="Security Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              containerStyle={styles.input}
            />
            <PrimaryButton
              title="Create my account"
              onPress={handleCreateAccount}
              loading={loading}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  keyboard: {
    flex: 1,
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
  input: {
    marginTop: AUTH_SPACING.gapInputs,
  },
  primaryBtn: {
    marginTop: AUTH_SPACING.gapSection,
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
