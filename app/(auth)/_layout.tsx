import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="login"
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp-sent" />
      <Stack.Screen name="enter-otp" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="reset-password-success" />
    </Stack>
  );
}


