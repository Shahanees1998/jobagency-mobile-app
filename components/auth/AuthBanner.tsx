import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

const BANNER_IMAGE = require('@/assets/images/auth-banner.png');
const LOGO_IMAGE = require('@/assets/images/white-logo.png');

interface AuthBannerProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  googleButton?: React.ReactNode;
  style?: ViewStyle;
}

export function AuthBanner({ title, subtitle, showLogo = true, googleButton, style }: AuthBannerProps) {
  return (
    <ImageBackground
      source={BANNER_IMAGE}
      style={[styles.banner, style]}
      resizeMode="cover"
      imageStyle={styles.bannerImageStyle}
    >
      <View style={styles.bannerInner}>
        {showLogo && (
          <View style={styles.logoWrap}>
            <Image
              source={LOGO_IMAGE}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
        {googleButton && (
          <View style={styles.googleButtonWrap}>
            {googleButton}
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: AUTH_COLORS.bannerBg,
    paddingHorizontal: AUTH_SPACING.bannerPaddingH + 20,
    paddingTop: AUTH_SPACING.bannerPaddingV + 30,
    paddingBottom: AUTH_SPACING.bannerPaddingV + 50,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    minHeight: 300,
  },
  bannerImageStyle: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerInner: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: 18,
  },
  logo: {
    width: 48,
    height: 48,
  },
  googleButtonWrap: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: AUTH_COLORS.white,
    fontFamily: 'Kanit_500SemiBold',
    fontSize: 27,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: AUTH_COLORS.white,
    fontFamily: 'Kanit_200Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0,
    opacity: 0.95,
    textAlign: 'center',
  },
});
