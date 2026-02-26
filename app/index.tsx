import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, View, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPLASH_BG = '#72A4BF';
const LOGO_SIZE = 150;

export default function SplashScreen() {
  const mounted = useRef(true);
  const spinValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Start rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      if (mounted.current) {
        router.replace('/onboarding');
      }
    }, 2500);
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: -insets.top }]}>
      <View style={styles.centered}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.footer}>
        <LinearGradient
          colors={['#FFFFFF', '#72A4BF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loaderButton}
        >
          <LinearGradient
            colors={['#1E4154', '#72A4BF']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.loaderButtonInner}
          >
            <Animated.View style={[styles.loaderDot, { transform: [{ rotate: spin }] }]} />
          </LinearGradient>
        </LinearGradient>
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
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E4154',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  loaderButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderTopColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
});
