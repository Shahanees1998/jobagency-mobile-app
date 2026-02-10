import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style) || {};
  const { tintColor, ...styleWithoutTint } = flatStyle as Record<string, unknown>;
  return (
    <PlatformPressable
      {...rest}
      style={[styleWithoutTint, { overflow: 'visible' }]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
