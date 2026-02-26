import { LogoutModal } from '@/components/ui/LogoutModal';
import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { imageUriForDisplay } from '@/lib/imageUri';
import {
  getLastFcmRegistrationResult,
  registerPushTokenWithBackend,
} from '@/lib/pushNotifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_ICON_COLOR = '#374151';
const PAGE_BACKGROUND = '#F2F4F7';
const MENU_ITEM_RADIUS = 10;
const ICON_CIRCLE_BG = '#325E73';
const ICON_CIRCLE_SIZE = 38;
const ICON_SIZE = 20;

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  highlighted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  highlighted?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, highlighted && styles.menuItemHighlighted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconCircle}>
        <Ionicons name={icon} size={ICON_SIZE} color="#FFFFFF" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={MENU_ICON_COLOR}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuth();
  const { showDialog } = useDialog();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fcmStatus, setFcmStatus] = useState(getLastFcmRegistrationResult());
  const [fcmRetrying, setFcmRetrying] = useState(false);
  const [pushBackendStatus, setPushBackendStatus] = useState<{
    ok: boolean;
    fcmConfigured: boolean;
    tokenCount: number;
    message: string;
  } | null>(null);
  const scrollPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;
  const isEmployer = user?.role === 'EMPLOYER';

  const refreshFcmStatus = () => setFcmStatus(getLastFcmRegistrationResult());
  const fetchPushBackendStatus = async () => {
    try {
      const res = await apiClient.getPushStatus();
      if (res.success && res.data && typeof res.data === 'object' && 'message' in res.data) {
        setPushBackendStatus({
          ok: !!res.data.ok,
          fcmConfigured: !!res.data.fcmConfigured,
          tokenCount: typeof res.data.tokenCount === 'number' ? res.data.tokenCount : 0,
          message: String(res.data.message ?? ''),
        });
      } else {
        setPushBackendStatus(null);
      }
    } catch {
      setPushBackendStatus(null);
    }
  };
  const handleFcmRetry = async () => {
    setFcmRetrying(true);
    await registerPushTokenWithBackend();
    setFcmStatus(getLastFcmRegistrationResult());
    await fetchPushBackendStatus();
    setFcmRetrying(false);
  };

  useEffect(() => {
    loadProfile();
  }, [isEmployer]);

  useFocusEffect(
    React.useCallback(() => {
      refreshFcmStatus();
      fetchPushBackendStatus();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const response = isEmployer
        ? await apiClient.getEmployerProfile()
        : await apiClient.getCandidateProfile();
      if (response.success && response.data) setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    if (isEmployer) return;
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        showDialog({
          title: 'Unavailable',
          message: 'Photo picker is not available in this app build.',
          primaryButton: { text: 'OK' },
        });
        return;
      }
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showDialog({
          title: 'Permission required',
          message: 'Please grant permission to access photos',
          primaryButton: { text: 'OK' },
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await uploadProfileImage(asset.uri, asset.mimeType || 'image/jpeg');
      }
    } catch (error) {
      showDialog({
        title: 'Error',
        message: 'Could not open photo picker. Please try again.',
        primaryButton: { text: 'OK' },
      });
    }
  };

  const uploadProfileImage = async (uri: string, mimeType: string = 'image/jpeg') => {
    setUploading(true);
    try {
      const response = await apiClient.uploadProfileImage(uri, mimeType);
      if (response.success) {
        await refreshUser();
        await loadProfile();
        showDialog({ title: 'Success', message: 'Profile image updated', primaryButton: { text: 'OK' } });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload image', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to upload image', primaryButton: { text: 'OK' } });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  const displayName = (`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User');
  const updatedDate = profile?.updatedAt || profile?.resumeUpdated
    ? new Date(profile.updatedAt || profile.resumeUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : 'Feb 01, 2026';

  // Employer: show company logo (from profile) so it matches company profile screen; fallback to user image
  const avatarUri = isEmployer
    ? (imageUriForDisplay(profile?.companyLogo) ?? profile?.user?.profileImage ?? user.profileImage)
    : user.profileImage;
  const companyName = isEmployer ? (profile?.companyName ?? '') : '';

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleImagePick} disabled={uploading || isEmployer} activeOpacity={isEmployer ? 1 : 0.8}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name={isEmployer ? 'business' : 'person'} size={44} color="#FFFFFF" />
                  </View>
                )}
                {uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{displayName}</Text>
            {companyName ? (
              <Text style={styles.companySubtitle}>{companyName}</Text>
            ) : null}
            <Text style={styles.email}>{user.email ?? ''}</Text>
          </View>

          <View style={styles.menuBlock}>
            <MenuRow
              icon="person-outline"
              label="Profile"
              onPress={() => router.push(isEmployer ? '/edit-employer-profile' : '/edit-profile')}
            />
          </View>

          <View style={styles.pushStatusBlock}>
            <Text style={styles.pushStatusLabel}>Push notifications</Text>
            <Text style={styles.pushStatusText}>
              {fcmStatus === null
                ? 'Not tried yet (login again or tap Retry)'
                : fcmStatus.status === 'success'
                  ? 'Registered'
                  : fcmStatus.status === 'no_token'
                    ? `No token: ${fcmStatus.message}`
                    : fcmStatus.status === 'permission_denied'
                      ? 'Permission denied'
                      : fcmStatus.status === 'backend_rejected'
                        ? `Backend rejected: ${fcmStatus.error}`
                        : `Error: ${fcmStatus.message}`}
            </Text>
            {pushBackendStatus !== null && (
              <Text style={styles.pushBackendStatusText}>
                Backend: {pushBackendStatus.message}
                {pushBackendStatus.tokenCount > 0
                  ? ` (${pushBackendStatus.tokenCount} device${pushBackendStatus.tokenCount !== 1 ? 's' : ''})`
                  : ''}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.pushRetryBtn, fcmRetrying && styles.pushRetryBtnDisabled]}
              onPress={handleFcmRetry}
              disabled={fcmRetrying}
            >
              <Text style={styles.pushRetryBtnText}>
                {fcmRetrying ? 'Retrying...' : 'Retry registration'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>
            {isEmployer ? 'Company' : 'Resume'}
          </Text>
          <View style={styles.menuBlock}>
            {isEmployer ? (
              <MenuRow
                icon="create-outline"
                label="Company details"
                subtitle={`Updated ${updatedDate}`}
                onPress={() => router.push('/edit-employer-profile')}
                highlighted
              />
            ) : (
              <MenuRow
                icon="document-text-outline"
                label="Next job resume"
                subtitle={`Updated ${updatedDate}`}
                onPress={() => router.push('/my-resume')}
                highlighted
              />
            )}
            <MenuRow
              icon="lock-closed-outline"
              label="Change password"
              onPress={() => router.push('/change-password')}
            />
            <MenuRow
              icon="star-outline"
              label="My reviews"
              subtitle={isEmployer ? 'Reviews your company received' : 'Reviews you wrote'}
              onPress={() => router.push('/my-reviews')}
            />
            <MenuRow
              icon="document-text-outline"
              label="Policies & terms"
              onPress={() => router.push('/policies-terms')}
            />
            <MenuRow
              icon="trash-outline"
              label="Delete account"
              onPress={() =>
                showDialog({
                  title: 'Delete account',
                  message: 'Contact support to delete your account.',
                  primaryButton: { text: 'OK' },
                })
              }
            />
            <MenuRow
              icon="log-out-outline"
              label="Logout"
              onPress={() => setLogoutModalVisible(true)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
        loading={loggingOut}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PAGE_BACKGROUND,
  },
  header: {
    backgroundColor: PAGE_BACKGROUND,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: APP_SPACING.screenPadding,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ADD8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  companySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
  },
  menuBlock: {
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 24,
  },
  pushStatusBlock: {
    marginHorizontal: APP_SPACING.screenPadding,
    marginTop: 16,
    padding: 14,
    backgroundColor: APP_COLORS.white,
    borderRadius: MENU_ITEM_RADIUS,
  },
  pushStatusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 6,
  },
  pushStatusText: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginBottom: 10,
  },
  pushBackendStatusText: {
    fontSize: 12,
    color: APP_COLORS.textMuted,
    marginBottom: 8,
  },
  pushRetryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: APP_COLORS.primary,
    borderRadius: 8,
  },
  pushRetryBtnDisabled: {
    opacity: 0.6,
  },
  pushRetryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: APP_SPACING.screenPadding,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: APP_SPACING.itemPadding,
    borderRadius: MENU_ITEM_RADIUS,
    marginBottom: 2,
  },
  menuItemDarker: {
    backgroundColor: APP_COLORS.surfaceGray,
  },
  menuItemHighlighted: {
    backgroundColor: '#E8F4FC',
  },
  menuIconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: ICON_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
});
