import { Kanit_400Regular, Kanit_500Medium, Kanit_600SemiBold, Kanit_700Bold } from '@expo-google-fonts/kanit';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';

export const unstable_settings = {
  initialRouteName: 'index',
};

function EditProfileHeaderBack() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/(tabs)/profile')}
      style={{ paddingLeft: Math.max(16, insets.left), paddingRight: 8, paddingVertical: 8 }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
}

function FiltersHeaderClose() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16, paddingVertical: 8 }} hitSlop={12}>
      <Ionicons name="close" size={24} color="#111827" />
    </TouchableOpacity>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Kanit_400Regular,
    Kanit_500Medium,
    Kanit_600SemiBold,
    Kanit_700Bold,
  });

  useEffect(() => {
    if (isLoading) return;
    // Avoid redirect during initial mount or when segments are empty
    const segmentsArray = segments as string[];
    const first = segmentsArray[0];
    if (segmentsArray.length === 0 || first == null) return;

    const onSplash = first === 'index' || first === '';
    const onOnboarding = first === 'onboarding';
    const onLogin = first === 'login';
    if (onSplash || onOnboarding || onLogin) return;

    const inAuthGroup = first === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="change-password"
        options={{ title: 'Change password', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-employer-profile"
        options={{ title: 'Edit Company Profile', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="post-job"
        options={{ title: 'Post New Job', headerBackTitle: 'Back', headerShown: false }}
      />
      <Stack.Screen
        name="job-posted"
        options={{ title: 'Job posted', headerShown: false }}
      />
      <Stack.Screen
        name="job-updated"
        options={{ title: 'Job updated', headerShown: false }}
      />
      <Stack.Screen
        name="schedule-interview"
        options={{ title: 'Schedule interview', headerShown: false }}
      />
      <Stack.Screen
        name="interview-scheduled"
        options={{ title: 'Interview scheduled', headerShown: false }}
      />
      <Stack.Screen
        name="edit-interview/[applicationId]"
        options={{ title: 'Update interview', headerShown: false }}
      />
      <Stack.Screen
        name="interview-updated"
        options={{ title: 'Interview updated', headerShown: false }}
      />
      <Stack.Screen
        name="job-filters"
        options={{
          title: 'Filters',
          headerShown: true,
          headerBackTitle: 'Back',
          headerRight: () => <FiltersHeaderClose />,
        }}
      />
      <Stack.Screen
        name="job-details/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="view-candidates/[jobId]"
        options={{ title: 'View candidates', headerShown: false }}
      />
      <Stack.Screen
        name="edit-job/[id]"
        options={{ title: 'Edit Job', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="application-details/[id]"
        options={{ title: 'Application Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="upload-cv"
        options={{ title: 'Upload CV', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="my-resume"
        options={{ title: 'My resume', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="support"
        options={{ title: 'Support', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="my-reviews"
        options={{ title: 'My reviews', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="company-reviews/[employerId]"
        options={{ title: 'Company reviews', headerShown: true, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="policies-terms"
        options={{ title: 'Policies & terms', headerShown: false, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{ title: 'Privacy policy', headerShown: false, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="terms-of-services"
        options={{ title: 'Terms of services', headerShown: false, headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="application-submitted"
        options={{ title: 'Application submitted', headerShown: false }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notifications', headerShown: false }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <DialogProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar hidden={true} />
        </ThemeProvider>
      </DialogProvider>
    </AuthProvider>
  );
}
