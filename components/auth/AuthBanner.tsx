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
const LOGO_IMAGE = require('@/assets/images/logo.png');

interface AuthBannerProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  style?: ViewStyle;
}

export function AuthBanner({ title, subtitle, showLogo = true, style }: AuthBannerProps) {
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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: AUTH_COLORS.bannerBg,
    paddingHorizontal: AUTH_SPACING.bannerPaddingH,
    paddingTop: AUTH_SPACING.bannerPaddingV,
    paddingBottom: AUTH_SPACING.bannerPaddingV + 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    minHeight: 220,
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
  title: {
    color: AUTH_COLORS.white,
    fontSize: AUTH_TYPO.bannerTitle,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: AUTH_COLORS.white,
    fontSize: AUTH_TYPO.bannerSubtitle,
    opacity: 0.95,
    lineHeight: 20,
    textAlign: 'center',
  },
});
