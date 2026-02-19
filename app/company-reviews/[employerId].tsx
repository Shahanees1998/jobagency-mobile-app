import { JobCard } from '@/components/jobs';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { apiClient } from '@/lib/api';
import { imageUriForDisplay } from '@/lib/imageUri';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewItem {
  id: string;
  companyName: string;
  date: string;
  rating: number;
  title: string;
  description: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange?.(i)}
          style={styles.starBtn}
          activeOpacity={0.85}
          disabled={!onChange}
        >
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={32}
            color={i <= value ? '#FBBF24' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WriteReviewModal({
  visible,
  onClose,
  onSubmit,
  companyName,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, title: string, description: string) => void;
  companyName: string;
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setRating(5);
    setTitle('');
    setDescription('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Rate & review</Text>
          <Text style={styles.sheetSubTitle} numberOfLines={1}>{companyName}</Text>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Tap to rate</Text>
            <Stars value={rating} onChange={setRating} />

            <Text style={styles.fieldLabel}>Review title</Text>
            <TextInput
              style={styles.input}
              placeholder="Good experience & fun environment"
              placeholderTextColor={APP_COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Give a review</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share what you liked, what could improve, and any advice for others."
              placeholderTextColor={APP_COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, !title.trim() && { opacity: 0.6 }]}
              onPress={() => onSubmit(rating, title.trim(), description.trim())}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Submit review</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatReviewDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const DEFAULT_OVERVIEW = 'We are a technology-driven company delivering innovative solutions. Our expertise spans software development, web and mobile applications, and design.';

export default function CompanyProfileScreen() {
  const { employerId = '' } = useLocalSearchParams<{ employerId?: string }>();

  const [companyName, setCompanyName] = useState('Company');
  const [profile, setProfile] = useState<{
    companyDescription?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    city?: string;
    country?: string;
    companyBanner?: string;
    companyLogo?: string;
  }>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!employerId);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [writeVisible, setWriteVisible] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const res = await apiClient.getEmployerReviews(employerId);
      if (res.success && res.data) {
        const d = res.data as any;
        setCompanyName(d.companyName || 'Company');
        setProfile({
          companyDescription: d.companyDescription,
          companyWebsite: d.companyWebsite,
          industry: d.industry,
          companySize: d.companySize,
          city: d.city,
          country: d.country,
          companyBanner: d.companyBanner,
          companyLogo: d.companyLogo,
        });
        const list = (d.reviews || []).map((r: any) => ({
          id: r.id,
          companyName: d.companyName || 'Company',
          date: r.date ? formatReviewDate(r.date) : (r.createdAt ? formatReviewDate(r.createdAt) : ''),
          rating: r.rating ?? 0,
          title: r.title ?? '',
          description: r.description ?? '',
        }));
        setReviews(list);
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  const loadJobs = useCallback(async () => {
    if (!employerId) return;
    setLoadingJobs(true);
    try {
      const res = await apiClient.getJobs({ employerId, limit: 10 });
      if (res.success && res.data?.jobs) setJobs(res.data.jobs);
      else setJobs([]);
    } catch {
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [employerId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const refresh = useCallback(() => {
    loadReviews();
    loadJobs();
  }, [loadReviews, loadJobs]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={refresh} style={{ padding: 8 }} hitSlop={16}>
          <Ionicons name="refresh" size={22} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, refresh]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  const submitReview = async (rating: number, title: string, description: string) => {
    if (!employerId) {
      const next: ReviewItem = {
        id: String(Date.now()),
        companyName,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        rating,
        title,
        description,
      };
      setReviews((prev) => [next, ...prev]);
      setWriteVisible(false);
      return;
    }
    try {
      const res = await apiClient.createReview({ employerId, rating, title, description });
      if (res.success && res.data) {
        await loadReviews();
      }
    } catch (_) {}
    setWriteVisible(false);
  };

  const letter = (companyName || '?').charAt(0).toUpperCase();
  const overview = profile.companyDescription || DEFAULT_OVERVIEW;
  const headquarters = [profile.city, profile.country].filter(Boolean).join(', ') || '—';
  const websiteUrl = profile.companyWebsite || undefined;
  const bannerUri = imageUriForDisplay(profile.companyBanner);
  const logoUri = imageUriForDisplay(profile.companyLogo);

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner + Logo + Company name + Write a review */}
        <View style={styles.bannerContainer}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#FFFFFF40" />
            </View>
          )}
          <View style={styles.logoOverlay}>
            <View style={styles.logoBox}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" />
              ) : (
                <Text style={styles.logoLetter}>{letter}</Text>
              )}
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.companyNameHero} numberOfLines={1}>{companyName}</Text>
              <View style={styles.heroLinkRow}>
                <TouchableOpacity
                  onPress={() => websiteUrl && Linking.openURL(websiteUrl)}
                  style={styles.heroLinkWrap}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroLink} numberOfLines={1}>{companyName}</Text>
                  <Ionicons name="open-outline" size={14} color={APP_COLORS.link} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <Text style={styles.heroDot}>•</Text>
                <Text style={styles.heroRating}>{average.toFixed(1)}</Text>
                <Ionicons name="star" size={14} color="#FBBF24" />
              </View>
            </View>
            <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setWriteVisible(true)} activeOpacity={0.85}>
              <Text style={styles.writeReviewBtnText}>Write a review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company overview</Text>
          <Text style={styles.overviewText} numberOfLines={overviewExpanded ? undefined : 3}>
            {overview}
          </Text>
          <TouchableOpacity onPress={() => setOverviewExpanded(!overviewExpanded)} style={styles.showMoreWrap}>
            <View style={styles.showMoreRow}>
              <Text style={styles.showMoreLink}>{overviewExpanded ? 'Show less' : 'Show more'}</Text>
              <Ionicons name={overviewExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={APP_COLORS.link} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* About us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About us</Text>
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Founded</Text>
                <Text style={styles.gridValue}>—</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Company size</Text>
                <Text style={styles.gridValue}>{profile.companySize || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Revenue</Text>
                <Text style={styles.gridValue}>—</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Industry</Text>
                <Text style={styles.gridValue}>{profile.industry || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Headquarters</Text>
                <Text style={styles.gridValue}>{headquarters}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Link</Text>
                <TouchableOpacity onPress={() => websiteUrl && Linking.openURL(websiteUrl)} activeOpacity={0.8} style={styles.gridLinkRow}>
                  <Text style={styles.gridLink}>Visit website</Text>
                  <Ionicons name="open-outline" size={14} color={APP_COLORS.link} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Job listing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job listing</Text>
          {loadingJobs ? (
            <View style={styles.jobsLoading}>
              <ActivityIndicator size="small" color={APP_COLORS.primary} />
            </View>
          ) : jobs.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobsScroll}>
              {jobs.map((job) => (
                <View key={job.id} style={styles.jobCardWrap}>
                  <JobCard
                    title={job.title}
                    companyName={job.employer?.companyName || companyName}
                    location={job.location || ''}
                    benefits={job.benefits || []}
                    companyLogoLetter={letter}
                    onPress={() => router.push(`/job-details/${job.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noJobs}>No open positions</Text>
          )}
        </View>

        {/* Company Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first to write one.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{review.title}</Text>
                  <View style={styles.cardRating}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.cardRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>On {review.date}</Text>
                <Text style={styles.cardDesc}>{review.description}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <WriteReviewModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onSubmit={submitReview}
        companyName={companyName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, paddingHorizontal: 0 },

  bannerContainer: { marginBottom: 0 },
  bannerImage: { width: '100%', height: 140, backgroundColor: '#1e3a5f' },
  bannerPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: -36,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoImage: { width: '100%', height: '100%', borderRadius: 12 },
  logoLetter: { fontSize: 28, fontWeight: '800', color: APP_COLORS.white },
  heroMeta: { flex: 1, minWidth: 0 },
  companyNameHero: { fontSize: 18, fontWeight: '800', color: APP_COLORS.textPrimary, marginBottom: 4 },
  heroLinkRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  heroLinkWrap: { flexDirection: 'row', alignItems: 'center' },
  heroLink: { fontSize: 14, color: APP_COLORS.link, textDecorationLine: 'underline', fontWeight: '600' },
  heroDot: { fontSize: 14, color: APP_COLORS.textMuted },
  heroRating: { fontSize: 14, fontWeight: '700', color: APP_COLORS.textPrimary },
  writeReviewBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: APP_SPACING.borderRadius,
    marginLeft: 8,
  },
  writeReviewBtnText: { fontSize: 14, fontWeight: '700', color: APP_COLORS.white },

  section: { paddingHorizontal: APP_SPACING.screenPadding, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: APP_COLORS.textPrimary, marginBottom: 10 },
  overviewText: { fontSize: 15, color: APP_COLORS.textSecondary, lineHeight: 22, marginBottom: 6 },
  showMoreWrap: { marginTop: 4 },
  showMoreRow: { flexDirection: 'row', alignItems: 'center' },
  showMoreLink: { fontSize: 14, color: APP_COLORS.link, fontWeight: '600' },

  grid: { backgroundColor: APP_COLORS.surfaceGray, borderRadius: APP_SPACING.borderRadiusLg, borderWidth: 1, borderColor: APP_COLORS.border, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: APP_COLORS.border },
  gridItem: { flex: 1, padding: APP_SPACING.itemPadding },
  gridLabel: { fontSize: 12, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '700', color: APP_COLORS.textPrimary },
  gridLinkRow: { flexDirection: 'row', alignItems: 'center' },
  gridLink: { fontSize: 14, fontWeight: '600', color: APP_COLORS.link, textDecorationLine: 'underline' },

  jobsLoading: { paddingVertical: 24, alignItems: 'center' },
  jobsScroll: { paddingRight: APP_SPACING.screenPadding, gap: 12 },
  jobCardWrap: { width: 280, marginRight: 12 },
  noJobs: { fontSize: 14, color: APP_COLORS.textMuted, fontStyle: 'italic' },
  noReviews: { fontSize: 14, color: APP_COLORS.textMuted, fontStyle: 'italic' },

  starsRow: { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 2 },

  card: {
    backgroundColor: APP_COLORS.background,
    borderRadius: APP_SPACING.borderRadiusLg,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '800', color: APP_COLORS.textPrimary, marginRight: 10 },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardRatingText: { fontSize: 13, fontWeight: '800', color: APP_COLORS.textPrimary },
  cardMeta: { fontSize: 12, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    maxHeight: '85%',
  },
  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: { paddingBottom: 16 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSubTitle: { textAlign: 'center', fontSize: 14, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: APP_COLORS.white },
});

