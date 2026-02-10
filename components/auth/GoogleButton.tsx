import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

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
        <Text style={styles.iconText}>G</Text>
      </View>
      <Text style={styles.text}>Continue With Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: AUTH_SPACING.buttonHeight,
    backgroundColor: AUTH_COLORS.white,
    borderRadius: AUTH_SPACING.buttonBorderRadius,
    borderWidth: 1,
    borderColor: AUTH_COLORS.googleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.googleBorder,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  text: {
    color: AUTH_COLORS.googleText,
    fontSize: AUTH_TYPO.button,
    fontWeight: '500',
  },
});
