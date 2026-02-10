import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: ViewStyle;
}

export function SearchBar({ containerStyle, ...inputProps }: SearchBarProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons
        name="search-outline"
        size={22}
        color={APP_COLORS.textMuted}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder="Find jobs near you ...."
        placeholderTextColor={APP_COLORS.textMuted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    paddingVertical: 0,
  },
});
