import { LogoutModal } from '@/components/ui/LogoutModal';
import { APP_COLORS, APP_SPACING, TAB_BAR } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
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

function ProfileListRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.profileRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.profileRowIconCircle}>
        <Ionicons name={icon} size={20} color={APP_COLORS.white} />
      </View>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function ResumeCardRow({
  updatedText,
  onPress,
}: {
  updatedText: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.resumeCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.resumeIconWrap}>
        <Ionicons name="document-text-outline" size={28} color={APP_COLORS.primary} />
      </View>
      <View style={styles.resumeTextCol}>
        <Text style={styles.resumeTitle}>Next job resume</Text>
        <Text style={styles.resumeSubtitle}>{updatedText}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={APP_COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  darker,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  darker?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, darker && styles.menuItemDarker]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={22}
        color={MENU_ICON_COLOR}
        style={styles.menuIcon}
      />
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

function CandidateProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuth();
  const { showDialog } = useDialog();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const scrollPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getCandidateProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        console.warn('[Profile] ImagePicker module failed to load:', e);
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
      console.error('[Profile] handleImagePick error:', error);
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
        showDialog({
          title: 'Success',
          message: 'Profile image updated',
          primaryButton: { text: 'OK' },
        });
      } else {
        showDialog({
          title: 'Error',
          message: response.error || 'Failed to upload image',
          primaryButton: { text: 'OK' },
        });
      }
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error.message || 'Failed to upload image',
        primaryButton: { text: 'OK' },
      });
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  const displayName = user
    ? (`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User')
    : 'User';
  const resumeUpdated = profile?.resumeUpdated
    ? new Date(profile.resumeUpdated).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    : 'Feb 01, 2026';

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCandidate}>
            <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
              <View style={styles.avatarWrap}>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={44} color={MENU_ICON_COLOR} />
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
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>

          <View style={styles.profileList}>
            <ProfileListRow icon="person-outline" label="Profile" onPress={() => router.push('/edit-profile')} />
          </View>

          <Text style={styles.sectionLabelCandidate}>Resume</Text>
          <ResumeCardRow updatedText={`Updated ${resumeUpdated}`} onPress={() => router.push('/my-resume')} />

          <View style={styles.profileList}>
            <ProfileListRow icon="lock-closed-outline" label="Change password" onPress={() => router.push('/change-password')} />
            <ProfileListRow icon="star-outline" label="My reviews" onPress={() => router.push('/my-reviews')} />
            <ProfileListRow icon="document-text-outline" label="Policies & terms" onPress={() => router.push('/policies-terms')} />
            <ProfileListRow
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
            <ProfileListRow icon="log-out-outline" label="Logout" onPress={() => setLogoutModalVisible(true)} />
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

function EmployerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showDialog } = useDialog();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const scrollPaddingBottom = TAB_BAR.height + insets.bottom + TAB_BAR.extraBottom;

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.getEmployerProfile();
        if (response.success && response.data) setProfile(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  const displayName = user
    ? (`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User')
    : 'User';

  const companyDetailsUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'Feb 01, 2026';

  return (
    <>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.employerAvatarWrap}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color={MENU_ICON_COLOR} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.menuBlock}>
            <MenuRow
              icon="business-outline"
              label="Company details"
              subtitle={`Updated ${companyDetailsUpdated}`}
              onPress={() => router.push('/edit-employer-profile')}
            />
            <MenuRow
              icon="lock-closed-outline"
              label="Change password"
              onPress={() => router.push('/change-password')}
            />
            <MenuRow
              icon="star-outline"
              label="My reviews"
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

export default function ProfileScreen() {
  const { user } = useAuth();
  const role = user?.role;
  if (user && (role === 'CANDIDATE' || role === undefined)) {
    return <CandidateProfileScreen />;
  }
  if (user?.role === 'EMPLOYER') {
    return <EmployerProfileScreen />;
  }
  return null;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: APP_SPACING.screenPadding,
  },
  headerCandidate: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: APP_SPACING.screenPadding,
  },
  employerBannerWrap: {
    marginHorizontal: APP_SPACING.screenPadding,
    marginTop: 12,
    height: 140,
    borderRadius: APP_SPACING.borderRadiusLg,
    overflow: 'hidden',
    backgroundColor: APP_COLORS.surfaceGray,
  },
  employerBannerImage: { width: '100%', height: '100%' },
  employerBannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  employerBannerPlaceholderText: { marginTop: 6, fontSize: 13, fontWeight: '600', color: APP_COLORS.textMuted },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 12,
  },
  employerAvatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
  },
  companyLogoPreviewWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  companyLogoPreview: { width: '100%', height: '100%' },
  companyLogoPreviewPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5A8FA3',
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
  email: {
    fontSize: 14,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
  },
  profileList: {
    marginHorizontal: APP_SPACING.screenPadding,
    backgroundColor: APP_COLORS.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  profileRowIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileRowLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: APP_COLORS.textPrimary },
  sectionLabelCandidate: {
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: APP_SPACING.screenPadding,
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
  },
  resumeCard: {
    marginHorizontal: APP_SPACING.screenPadding,
    backgroundColor: '#E8EEF2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resumeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resumeTextCol: { flex: 1, minWidth: 0 },
  resumeTitle: { fontSize: 16, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 4 },
  resumeSubtitle: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textMuted },
  companyName: {
    fontSize: 15,
    fontWeight: '600',
    color: APP_COLORS.textSecondary,
    marginTop: 6,
  },
  menuBlock: {
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: APP_SPACING.itemPadding,
    borderRadius: APP_SPACING.borderRadius,
    marginBottom: 2,
  },
  menuItemDarker: {
    backgroundColor: APP_COLORS.surfaceGray,
  },
  menuIcon: {
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
