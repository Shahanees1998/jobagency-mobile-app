import { AUTH_COLORS, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface OrDividerProps {
  style?: ViewStyle;
}

export function OrDivider({ style }: OrDividerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <Text style={styles.text}>or</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.separator,
  },
  text: {
    color: AUTH_COLORS.separator,
    fontSize: AUTH_TYPO.bodySmall,
    fontWeight: '500',
    marginHorizontal: 16,
  },
});
