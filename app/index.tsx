import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const SPLASH_BG = '#E8EEF4';
const LOGO_SIZE = 80;

export default function SplashScreen() {
  const mounted = useRef(true);

  useEffect(() => {
    // Always show onboarding when app opens (for now)
    const timer = setTimeout(() => {
      if (mounted.current) {
        router.replace('/onboarding');
      }
    }, 2500);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>NextJob</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.loaderDot}>
          <View style={styles.loaderDotInner} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderDotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
});
