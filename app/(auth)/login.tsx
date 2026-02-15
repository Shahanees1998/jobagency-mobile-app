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
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showDialog } = useDialog();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  const handleGoogle = () => {
    showDialog({ title: 'Coming Soon', message: 'Google sign-in will be available soon.', primaryButton: { text: 'OK' } });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showDialog({ title: 'Error', message: 'Please enter your email and password', primaryButton: { text: 'OK' } });
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        showDialog({ title: 'Login Failed', message: result.error || 'Invalid credentials', primaryButton: { text: 'OK' } });
      }
    } catch (e: unknown) {
      showDialog({ title: 'Error', message: e instanceof Error ? e.message : 'An error occurred', primaryButton: { text: 'OK' } });
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
            title="Sign in to your account"
            subtitle="Enter your email and password to login your account"
          />
          <View style={styles.content}>
            <Text style={styles.info}>
              Access verified jobs and trusted employers in one secure place.
            </Text>
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
              icon="password"
              placeholder="Security Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              containerStyle={styles.input}
            />
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? (
                    <Ionicons name="checkmark" size={14} color={AUTH_COLORS.white} />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotLink}>Forget Password?</Text>
              </TouchableOpacity>
            </View>
            <OrDivider style={styles.or} />
            <GoogleButton onPress={handleGoogle} style={styles.googleBtn} />
            <PrimaryButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              showArrow
              style={styles.primaryBtn}
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.footerLink}>Sign up</Text>
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
    backgroundColor: AUTH_COLORS.formBg,
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
    paddingTop: AUTH_SPACING.contentPaddingV + 12,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  info: {
    fontFamily: 'Kanit_400Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#031019',
    marginBottom: AUTH_SPACING.gapInputs + 4,
    lineHeight: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  input: {
    marginBottom: AUTH_SPACING.gapInputs,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AUTH_COLORS.primary,
    borderColor: AUTH_COLORS.primary,
  },
  rememberText: {
    fontSize: AUTH_TYPO.bodySmall,
    color: AUTH_COLORS.textSecondary,
  },
  forgotLink: {
    fontSize: AUTH_TYPO.bodySmall,
    fontWeight: '600',
    color: '#1E4154',
    textDecorationLine: 'underline',
  },
  or: {
    marginTop: 4,
    marginBottom: 12,
  },
  googleBtn: {
    marginBottom: AUTH_SPACING.gapInputs,
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
    color: AUTH_COLORS.link,
  },
});
