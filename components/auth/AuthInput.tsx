import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

export type AuthInputIcon = 'email' | 'password' | 'person' | 'phone' | 'location';

const ICON_MAP: Record<AuthInputIcon, keyof typeof Ionicons.glyphMap> = {
  email: 'mail-outline',
  password: 'lock-closed-outline',
  person: 'person-outline',
  phone: 'call-outline',
  location: 'location-outline',
};

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  icon: AuthInputIcon;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function AuthInput({
  icon,
  containerStyle,
  isPassword,
  secureTextEntry,
  ...inputProps
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isSecret = isPassword ?? secureTextEntry;
  const showPassword = isSecret && visible;

  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons
        name={ICON_MAP[icon]}
        size={20}
        color="#031019"
        style={styles.iconLeft}
      />
      <TextInput
        style={styles.input}
        placeholderTextColor="#031019"
        secureTextEntry={isSecret && !showPassword}
        multiline={false}
        scrollEnabled={false}
        {...inputProps}
      />
      {isSecret ? (
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => setVisible((v) => !v)}
          style={styles.iconRight}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#031019"
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: AUTH_SPACING.inputHeight,
    backgroundColor: AUTH_COLORS.inputBg,
    borderRadius: AUTH_SPACING.inputBorderRadius,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: 16,
  },
  iconLeft: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Kanit_300Light',
    fontSize: 14,
    fontWeight: '300',
    color: AUTH_COLORS.textPrimary,
    paddingVertical: 0,
  },
  iconRight: {
    paddingLeft: 8,
  },
});
