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
        color="#6B7280"
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder="Find jobs near you ...."
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 56,
    paddingHorizontal: 20,
    height: 52,
    borderWidth: 0,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Kanit',
    color: '#031019',
    paddingVertical: 0,
  },
});
