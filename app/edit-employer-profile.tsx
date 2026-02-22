import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmployerJobCard } from '@/components/jobs';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';

const PAGE_BACKGROUND = '#F5F5F5';
const PROFILE_SECTION_BG = '#F5F5F5';
const BANNER_PLACEHOLDER_COLOR = '#E0E0E0';
const ICON_CIRCLE_BG = '#325E73';
const ICON_CIRCLE_SIZE = 38;
const BANNER_HEIGHT = 140;
const CAROUSEL_CARD_WIDTH = 240;
const CAROUSEL_GAP = 10;
const CAROUSEL_PAD = 10;

export default function EditEmployerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { showDialog } = useDialog();
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    address: '',
    city: '',
    country: '',
    founded: '',
    revenue: '',
    headquarter: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyBanner, setCompanyBanner] = useState<string>('');
  const [profilePicModalVisible, setProfilePicModalVisible] = useState(false);
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string>('');
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [employerReviews, setEmployerReviews] = useState<any[]>([]);
  const jobsScrollRef = useRef<ScrollView>(null);
  const reviewsScrollRef = useRef<ScrollView>(null);
  const [jobsScrollIndex, setJobsScrollIndex] = useState(0);
  const [reviewsScrollIndex, setReviewsScrollIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoading) loadProfile();
    }, [initialLoading])
  );

  useEffect(() => {
    setJobsScrollIndex((i) => (employerJobs.length ? Math.min(i, employerJobs.length - 1) : 0));
  }, [employerJobs.length]);
  useEffect(() => {
    setReviewsScrollIndex((i) => (employerReviews.length ? Math.min(i, employerReviews.length - 1) : 0));
  }, [employerReviews.length]);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getEmployerProfile();
      if (response.success && response.data) {
        const d = response.data as any;
        const eid = d.id ?? d.employerId ?? '';
        if (eid) setEmployerId(eid);
        setCompanyLogo(d.companyLogo || '');
        setCompanyBanner(d.companyBanner || '');
        setFormData({
          companyName: d.companyName || '',
          companyDescription: d.companyDescription || '',
          companyWebsite: d.companyWebsite || '',
          industry: d.industry || '',
          companySize: d.companySize || '',
          address: d.address || '',
          city: d.city || '',
          country: d.country || '',
          founded: d.founded || '',
          revenue: d.revenue || '',
          headquarter: d.headquarter || [d.city, d.country].filter(Boolean).join(', ') || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadJobsAndReviews = useCallback(async () => {
    if (!employerId) return;
    try {
      if (__DEV__) console.log('[edit-employer-profile] getEmployerReviews employerId:', employerId);
      const [jobsRes, reviewsRes] = await Promise.all([
        apiClient.getEmployerJobs({ limit: 20 }),
        apiClient.getEmployerReviews(employerId),
      ]);
      if (__DEV__) console.log('[edit-employer-profile] getEmployerReviews response:', { success: reviewsRes.success, reviewCount: (reviewsRes.data as any)?.reviews?.length ?? 0 });
      if (jobsRes.success && jobsRes.data) {
        const list = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data as any)?.jobs ?? [];
        setEmployerJobs(list);
      }
      if (reviewsRes.success && reviewsRes.data?.reviews) {
        setEmployerReviews(reviewsRes.data.reviews);
      }
    } catch (e) {
      console.error('Error loading jobs/reviews:', e);
    }
  }, [employerId]);

  useEffect(() => {
    loadJobsAndReviews();
  }, [loadJobsAndReviews]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadProfile();
      await loadJobsAndReviews();
    } catch (e) {
      console.error('Refresh error:', e);
      showDialog({ title: 'Error', message: 'Failed to refresh. Please try again.', primaryButton: { text: 'OK' } });
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, loadJobsAndReviews, showDialog]);

  const pickImage = async () => {
    try {
      let ImagePicker: typeof import('expo-image-picker');
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (e) {
        console.warn('[EditEmployerProfile] ImagePicker module failed to load:', e);
        showDialog({
          title: 'Unavailable',
          message: 'Photo picker is not available in this app build.',
          primaryButton: { text: 'OK' },
        });
        return null;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        showDialog({ title: 'Permission needed', message: 'Allow photo access to upload images.', primaryButton: { text: 'OK' } });
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      const asset = !result.canceled ? result.assets?.[0] : undefined;
      return asset ?? null;
    } catch (error) {
      console.error('[EditEmployerProfile] pickImage error:', error);
      showDialog({ title: 'Error', message: 'Could not open photo picker. Please try again.', primaryButton: { text: 'OK' } });
      return null;
    }
  };

  const handleUploadLogo = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingLogo(true);
    try {
      const response = await apiClient.uploadEmployerLogo(asset.uri, asset.mimeType || 'image/jpeg');
      if (response.success) {
        showDialog({ title: 'Success', message: 'Company logo updated.', primaryButton: { text: 'OK' } });
        await loadProfile();
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload logo', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to upload logo', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingBanner(true);
    try {
      const response = await apiClient.uploadEmployerBanner(asset.uri, asset.mimeType || 'image/jpeg');
      if (response.success) {
        showDialog({ title: 'Success', message: 'Company banner updated.', primaryButton: { text: 'OK' } });
        await loadProfile();
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload banner', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: e.message || 'Failed to upload banner', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingBanner(false);
    }
  };

  const openProfilePicModal = () => {
    setProfilePicUri(null);
    setProfilePicModalVisible(true);
  };

  const handleProfilePicChange = async () => {
    const asset = await pickImage();
    if (asset) setProfilePicUri(asset.uri);
  };

  const handleProfilePicApply = async () => {
    if (!profilePicUri) {
      setProfilePicModalVisible(false);
      return;
    }
    setUploadingLogo(true);
    try {
      const response = await apiClient.uploadEmployerLogo(profilePicUri, 'image/jpeg');
      if (response.success) {
        await loadProfile();
        setProfilePicModalVisible(false);
        setProfilePicUri(null);
        showDialog({ title: 'Success', message: 'Company logo updated.', primaryButton: { text: 'OK' } });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload logo', primaryButton: { text: 'OK' } });
      }
    } catch (e: any) {
      showDialog({ title: 'Error', message: (e as Error).message || 'Failed to upload logo', primaryButton: { text: 'OK' } });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company profile</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.headerBtn}
          hitSlop={12}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={APP_COLORS.textPrimary} />
          ) : (
            <Ionicons name="refresh" size={22} color={APP_COLORS.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner image area – full width, no radius, edit button top right */}
        <View style={[styles.bannerWrap, { width: Dimensions.get('window').width}]}>
          <TouchableOpacity
            style={styles.bannerTouchable}
            onPress={handleUploadBanner}
            disabled={uploadingBanner}
            activeOpacity={0.9}
          >
            {companyBanner ? (
              <Image source={{ uri: companyBanner }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            {uploadingBanner && (
              <View style={styles.bannerOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerEditBtn}
            onPress={handleUploadBanner}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile block – white; profile image on top (half on banner), then company name, then link row */}
        <View style={styles.profileBlock}>
          <TouchableOpacity
            style={styles.profileBlockEditBtn}
            onPress={() => router.push('/employer-profile-details')}
          >
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openProfilePicModal} disabled={uploadingLogo} style={styles.profileImageWrap}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={styles.mainCardLogo} />
            ) : (
              <View style={styles.mainCardLogoPlaceholder}>
                <Ionicons name="person" size={32} color={APP_COLORS.textMuted} />
              </View>
            )}
            {uploadingLogo && (
              <View style={styles.mainCardLogoOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.mainCardNameLeft} numberOfLines={1}>{formData.companyName || 'Lorem ipsum'}</Text>
          <View style={styles.mainCardLinkRowLeft}>
            <TouchableOpacity onPress={() => formData.companyWebsite && Linking.openURL(formData.companyWebsite)} style={styles.mainCardLinkWrap}>
              <Text style={styles.mainCardLink} numberOfLines={1}>{formData.companyWebsite || 'Website link'}</Text>
              <Ionicons name="open-outline" size={14} color="#1e3a5f" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <Text style={styles.mainCardDot}>•</Text>
            <Text style={styles.mainCardRating}>No rating yet</Text>
          </View>
        </View>

        {/* Company overview card – read-only; edit via + redirect to page */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>Company overview</Text>
            <TouchableOpacity style={styles.sectionCardPlus} onPress={() => router.push('/employer-profile-overview')}>
              <Ionicons name="add" size={22} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionCardReadOnly}>
            <Text
              style={[styles.sectionCardReadOnlyText, !formData.companyDescription?.trim() && styles.sectionCardReadOnlyPlaceholder]}
              selectable={false}
            >
              {formData.companyDescription?.trim() || 'Your summary will appear here'}
            </Text>
          </View>
        </View>

        {/* About us – grid of 6 cards; edit via icon */}
        <View style={styles.aboutUsSection}>
          <View style={styles.aboutUsHeader}>
            <Text style={styles.aboutUsTitle}>About us</Text>
            <TouchableOpacity style={styles.aboutUsEditBtn} onPress={() => router.push('/employer-profile-about')} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={15} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.aboutUsGrid}>
            <View style={styles.aboutUsGridRow}>
              <View style={styles.aboutUsCard}>
                <Text style={styles.aboutUsCardLabel}>Founded</Text>
                <Text style={styles.aboutUsCardValue}>{formData.founded || '—'}</Text>
              </View>
              <View style={styles.aboutUsCard}>
                <Text style={styles.aboutUsCardLabel}>Company size</Text>
                <Text style={styles.aboutUsCardValue}>{formData.companySize || '—'}</Text>
              </View>
            </View>
            <View style={styles.aboutUsGridRow}>
              <View style={styles.aboutUsCard}>
                <Text style={styles.aboutUsCardLabel}>Revenue</Text>
                <Text style={styles.aboutUsCardValue} numberOfLines={2}>{formData.revenue || '—'}</Text>
              </View>
              <View style={styles.aboutUsCard}>
                <Text style={styles.aboutUsCardLabel}>Industry</Text>
                <Text style={styles.aboutUsCardValue} numberOfLines={2}>{formData.industry || '—'}</Text>
              </View>
            </View>
            <View style={styles.aboutUsGridRow}>
              <View style={styles.aboutUsCard}>
                <Text style={styles.aboutUsCardLabel}>Headquarters</Text>
                <Text style={styles.aboutUsCardValue}>{formData.headquarter || [formData.city, formData.country].filter(Boolean).join(', ') || '—'}</Text>
              </View>
              <TouchableOpacity
                style={styles.aboutUsCard}
                onPress={() => formData.companyWebsite && Linking.openURL(formData.companyWebsite)}
                disabled={!formData.companyWebsite}
                activeOpacity={0.85}
              >
                <Text style={styles.aboutUsCardLabel}>Link</Text>
                <View style={styles.aboutUsCardLinkRow}>
                  <Text style={[styles.aboutUsCardLink, !formData.companyWebsite && styles.aboutUsCardLinkDisabled]} numberOfLines={1}>
                    {formData.companyWebsite ? 'Visit website' : '—'}
                  </Text>
                  {formData.companyWebsite ? <Ionicons name="open-outline" size={18} color={APP_COLORS.primary} style={styles.aboutUsCardLinkIcon} /> : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Job listing card – carousel with move left/right buttons */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionCardTitle, styles.sectionCardTitleWithMargin]}>Job listing</Text>
          {employerJobs.length > 0 ? (
            <View style={styles.carouselWrap}>
              <TouchableOpacity
                style={[styles.carouselArrowBtn, jobsScrollIndex <= 0 && styles.carouselArrowBtnDisabled]}
                onPress={() => {
                  const next = Math.max(0, jobsScrollIndex - 1);
                  setJobsScrollIndex(next);
                  jobsScrollRef.current?.scrollTo({ x: next * (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP), animated: true });
                }}
                disabled={jobsScrollIndex <= 0}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.carouselScrollArea}>
                <ScrollView
                  ref={jobsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.carouselScrollContent, { paddingRight: APP_SPACING.screenPadding + CAROUSEL_PAD }]}
                  decelerationRate="fast"
                  snapToInterval={CAROUSEL_CARD_WIDTH + CAROUSEL_GAP}
                  snapToAlignment="start"
                  onMomentumScrollEnd={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const index = Math.round(x / (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP));
                    setJobsScrollIndex(Math.min(employerJobs.length - 1, Math.max(0, index)));
                  }}
                >
                  {employerJobs.map((job) => {
                    const jobId = job.id ?? job._id;
                    return (
                      <View key={jobId || job.title} style={[styles.carouselCardWrap, { width: CAROUSEL_CARD_WIDTH, marginRight: CAROUSEL_GAP }]}>
                        <EmployerJobCard
                          title={job.title || 'Job'}
                          companyName={formData.companyName || 'Company'}
                          location={job.location || job.city || '—'}
                          benefits={job.benefits || []}
                          companyLogoLetter={formData.companyName?.charAt(0)}
                          onPress={jobId ? () => router.push(`/job-details/${jobId}`) : undefined}
                          onEdit={jobId ? () => router.push(`/post-job?id=${jobId}`) : undefined}
                          style={styles.jobCardItem}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[styles.carouselArrowBtn, jobsScrollIndex >= employerJobs.length - 1 && styles.carouselArrowBtnDisabled]}
                onPress={() => {
                  const next = Math.min(employerJobs.length - 1, jobsScrollIndex + 1);
                  setJobsScrollIndex(next);
                  jobsScrollRef.current?.scrollTo({ x: next * (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP), animated: true });
                }}
                disabled={jobsScrollIndex >= employerJobs.length - 1}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sectionCardPlaceholder}>
              <Text style={styles.sectionCardPlaceholderText}>Your posted jobs will appear here</Text>
            </View>
          )}
        </View>

        {/* Company Reviews card – carousel with move left/right buttons */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionCardTitle, styles.sectionCardTitleWithMargin]}>Company Reviews</Text>
          {employerReviews.length > 0 ? (
            <View style={styles.carouselWrap}>
              <TouchableOpacity
                style={[styles.carouselArrowBtn, reviewsScrollIndex <= 0 && styles.carouselArrowBtnDisabled]}
                onPress={() => {
                  const next = Math.max(0, reviewsScrollIndex - 1);
                  setReviewsScrollIndex(next);
                  reviewsScrollRef.current?.scrollTo({ x: next * (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP), animated: true });
                }}
                disabled={reviewsScrollIndex <= 0}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.carouselScrollArea}>
                <ScrollView
                  ref={reviewsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.carouselScrollContent, { paddingHorizontal: CAROUSEL_PAD, paddingRight: APP_SPACING.screenPadding + CAROUSEL_PAD }]}
                  decelerationRate="fast"
                  snapToInterval={CAROUSEL_CARD_WIDTH + CAROUSEL_GAP}
                  snapToAlignment="start"
                  onMomentumScrollEnd={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const index = Math.round(x / (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP));
                    setReviewsScrollIndex(Math.min(employerReviews.length - 1, Math.max(0, index)));
                  }}
                >
                  {employerReviews.map((review) => (
                    <View key={review.id} style={[styles.carouselCardWrap, { width: CAROUSEL_CARD_WIDTH, marginRight: CAROUSEL_GAP }]}>
                      <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <Text style={styles.reviewCardMeta}>Reviewer • {review.rating ?? '—'}</Text>
                          <Text style={styles.reviewCardDate}>{review.date ? `On ${review.date}` : ''}</Text>
                        </View>
                        <Text style={styles.reviewCardTitle} numberOfLines={1}>{review.title || 'Review'}</Text>
                        <Text style={styles.reviewCardBody} numberOfLines={3}>{review.description || ''}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[styles.carouselArrowBtn, reviewsScrollIndex >= employerReviews.length - 1 && styles.carouselArrowBtnDisabled]}
                onPress={() => {
                  const next = Math.min(employerReviews.length - 1, reviewsScrollIndex + 1);
                  setReviewsScrollIndex(next);
                  reviewsScrollRef.current?.scrollTo({ x: next * (CAROUSEL_CARD_WIDTH + CAROUSEL_GAP), animated: true });
                }}
                disabled={reviewsScrollIndex >= employerReviews.length - 1}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sectionCardPlaceholder}>
              <Text style={styles.sectionCardPlaceholderText}>Reviews received will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profile pic modal */}
      <Modal visible={profilePicModalVisible} animationType="slide" onRequestClose={() => setProfilePicModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalHeaderCentered}>
            <Text style={styles.modalTitle}>Profile Pic</Text>
          </View>
          <View style={styles.profilePicPreviewWrap}>
            <View style={styles.profilePicImageWrap}>
              {(profilePicUri || companyLogo) ? (
                <Image source={{ uri: profilePicUri || companyLogo }} style={styles.profilePicImage} resizeMode="cover" />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="person" size={64} color={APP_COLORS.textMuted} />
                </View>
              )}
              <View style={styles.profilePicCropOverlay} pointerEvents="none" />
            </View>
          </View>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleProfilePicChange} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleProfilePicApply} disabled={uploadingLogo} activeOpacity={0.85}>
              {uploadingLogo ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveBtnText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: APP_COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  container: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  bannerWrap: {
    height: BANNER_HEIGHT,
    backgroundColor: BANNER_PLACEHOLDER_COLOR,
    overflow: 'hidden',
    borderRadius: 0,
    position: 'relative',
  },
  bannerTouchable: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  bannerEditBtn: {
    position: 'absolute',
    top: 12,
    right: APP_SPACING.screenPadding,
    width: ICON_CIRCLE_SIZE-5,
    height: ICON_CIRCLE_SIZE-5,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: ICON_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: BANNER_PLACEHOLDER_COLOR,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBlock: {
    backgroundColor: APP_COLORS.white,
    marginTop: -36,
    marginBottom: 20,
  paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 36,
    paddingBottom: 20,
    position: 'relative',
  },
  profileBlockEditBtn: {
    position: 'absolute',
    top: 12,
    right: APP_SPACING.screenPadding,
    width: ICON_CIRCLE_SIZE-5,
    height: ICON_CIRCLE_SIZE-5,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: ICON_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrap: {
    marginTop: -76,
    width: 72,
    height: 72,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#D3D3D3',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  mainCardLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#D3D3D3',
  },
  mainCardLogo: { width: '100%', height: '100%' },
  mainCardLogoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  mainCardLogoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  mainCardEditIcon: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: ICON_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardNameLeft: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'left' },
  mainCardLinkRowLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  mainCardLinkWrap: { flexDirection: 'row', alignItems: 'center' },
  mainCardLink: { fontSize: 13, color: APP_COLORS.primary, textDecorationLine: 'underline', fontWeight: '600' },
  mainCardDot: { fontSize: 13, color: '#6B7280' },
  mainCardRating: { fontSize: 13, color: '#6B7280' },
  inlineFields: { marginBottom: 16 },
  sectionCard: {
    backgroundColor: APP_COLORS.white,
    paddingHorizontal: APP_SPACING.screenPadding,
    padding: 16,
    marginBottom: 20,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionCardTitle: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textPrimary },
  sectionCardTitleWithMargin: { marginBottom: 12 },
  sectionCardPlus: { padding: 4 },
  sectionCardReadOnly: {
    backgroundColor: PROFILE_SECTION_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
  },
  sectionCardReadOnlyText: {
    fontSize: 15,
    color: APP_COLORS.textPrimary,
    lineHeight: 22,
  },
  sectionCardReadOnlyPlaceholder: { color: APP_COLORS.textMuted },
  readOnlyLabel: { fontSize: 12, fontWeight: '600', color: APP_COLORS.textMuted, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, color: APP_COLORS.textPrimary },
  readOnlyField: { flex: 1 },
  aboutUsSection: { marginBottom: 24 , backgroundColor:'white', paddingHorizontal: APP_SPACING.screenPadding, paddingVertical:15},
  aboutUsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  aboutUsTitle: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textPrimary },
  aboutUsEditBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: ICON_CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutUsGrid: { gap: 12 },
  aboutUsGridRow: { flexDirection: 'row', gap: 12 },
  aboutUsCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    padding: 16,
  },
  aboutUsCardLabel: { fontSize: 11, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 6 },
  aboutUsCardValue: { fontSize: 12, color: APP_COLORS.textPrimary, lineHeight: 20 },
  aboutUsCardLinkRow: { flexDirection: 'row', alignItems: 'center' },
  aboutUsCardLink: { fontSize: 12, color: APP_COLORS.primary, textDecorationLine: 'underline', flex: 1 },
  aboutUsCardLinkDisabled: { color: APP_COLORS.textMuted, textDecorationLine: 'none' },
  aboutUsCardLinkIcon: { marginLeft: 4 },
  sectionCardInput: {
    borderColor: '#E6E6E6',
    borderRadius: 5,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: PROFILE_SECTION_BG,
  },
  sectionCardPlaceholder: {
    backgroundColor: PROFILE_SECTION_BG,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  sectionCardPlaceholderText: { fontSize: 14, color: APP_COLORS.textMuted },
  sectionCardLink: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  sectionCardLinkText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.primary, marginRight: 4 },
  jobCardsList: { gap: 12 },
  jobCardItem: { marginBottom: 0 },
  carouselWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  carouselScrollArea: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  carouselScrollContent: {},
  carouselCardWrap: {},
  carouselArrowBtn: {
    height: 20,
    width:20,
    borderRadius: 14,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselArrowBtnDisabled: {
    opacity: 0.4,
  },
  reviewCard: {
    backgroundColor: PROFILE_SECTION_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
  },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewCardMeta: { fontSize: 13, color: APP_COLORS.textMuted, fontWeight: '600' },
  reviewCardDate: { fontSize: 12, color: APP_COLORS.textMuted },
  reviewCardTitle: { fontSize: 15, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 4 },
  reviewCardBody: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20 },
  aboutUsFields: { gap: 12, marginTop: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    fontSize: 28,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: PROFILE_SECTION_BG,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaBlock: {
    marginBottom: 24,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 10,
  },
  bannerPlaceholderText: { marginTop: 6, color: APP_COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  bannerBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: APP_COLORS.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  logoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  modalSafe: { flex: 1, backgroundColor: APP_COLORS.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderCentered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderBtn: { padding: 4, minWidth: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  modalInstruction: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalBody: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  modalInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: APP_COLORS.textPrimary },
  modalInputText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  modalTextAreaWrap: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 200 },
  modalTextAreaIcon: { marginRight: 12, marginTop: 4 },
  modalTextArea: { flex: 1, fontSize: 16, color: APP_COLORS.textPrimary, minHeight: 172, paddingVertical: 0, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCancelBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  modalSaveBtn: { flex: 1, backgroundColor: APP_COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  dropdownList: { marginTop: 4, backgroundColor: APP_COLORS.white, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', maxHeight: 220 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 16, color: APP_COLORS.textPrimary },
  profilePicPreviewWrap: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  profilePicImageWrap: { width: 280, height: 280, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  profilePicImage: { width: '100%', height: '100%' },
  profilePicPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  profilePicCropOverlay: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', top: 40, left: 40 },
});


