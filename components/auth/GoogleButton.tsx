import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const GOOGLE_ICON = require('@/assets/images/google.png');

interface GoogleButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function GoogleButton({ onPress, style }: GoogleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrap}>
        <Image
          source={GOOGLE_ICON}
          style={styles.googleIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.text}>Continue With Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 56,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  text: {
    color: AUTH_COLORS.googleText,
    fontSize: AUTH_TYPO.button,
    fontWeight: '500',
  },
});
