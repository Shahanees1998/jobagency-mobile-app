import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  showArrow = true,
  disabled,
  style,
  textStyle,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={AUTH_COLORS.white} size="small" />
      ) : (
        <>
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {showArrow ? <Text style={[styles.arrow, textStyle]}> →</Text> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: '#1E4154',
    borderRadius: 56,
    borderWidth: 1,
    borderColor: '#1E4154',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Kanit_500Medium',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 3,
  },
  arrow: {
    color: '#FFFFFF',
    fontFamily: 'Kanit_500Medium',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 3,
    marginLeft: 2,
  },
});
