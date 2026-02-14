import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Placeholder for employer FAB tab. Tapping the FAB goes to /post-job;
 * if user lands here directly, redirect to home.
 */
export default function PostTabPlaceholder() {
  const { user } = useAuth();
  if (user?.role === 'EMPLOYER') {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(tabs)" />;
}
