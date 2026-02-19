import { JobCard } from '@/components/jobs';
import { APP_COLORS } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { SavedJobSummary, storage } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

const DESC_TRUNCATE_LINES = 4;

const DUMMY_JOBS_DATA: Record<string, any> = {
  '1': { id: '1', employerId: '1', title: 'Senior Software Engineer', companyName: 'Zoox Pvt. Ltd.', location: 'Sunnyvale, CA 94089', description: 'Detailed description for Zoox...' },
  '2': { id: '2', employerId: '2', title: 'Junior Software Engineer', companyName: 'BA House Cleaning', location: 'Richmond, TX 27501', description: 'Detailed description for BA House Cleaning...' },
  'a1': { id: 'a1', employerId: 'a1', title: 'Mobile App Developer', companyName: 'Tech Innovators', location: 'Austin, TX', description: 'Tech Innovators is looking for a mobile dev...' },
  'a2': { id: 'a2', employerId: 'a2', title: 'UI/UX Designer', companyName: 'Creative Minds', location: 'Remote', description: 'Creative Minds needs a designer...' },
  'i1': {
    id: 'i1',
    employerId: 'i1',
    title: 'Full Stack Engineer',
    companyName: 'Cloud Systems',
    location: 'San Francisco, CA',
    description: 'Cloud Systems is scaling fast! We need a Full Stack Engineer to join our core team. You will be working on React, Node.js, and multi-cloud infrastructure.\n\nRequirements:\n- 5+ years of experience\n- Strong TypeScript skills\n- Experience with AWS/GCP\n\nBenefits:\n- Daily Lunch\n- Gym Membership\n- Health Insurance',
    companyOverview: 'We are a technology company focused on cloud infrastructure and developer productivity. Our mission is to simplify the cloud for everyone.',
    founded: 'Founded 2012',
    size: '100 to 1,000 workers',
    revenue: '$20 to $50 million',
    industry: 'Business Service',
    headquarters: 'Sunnyvale, CA',
    website: 'Visit website'
  },
  'i2': {
    id: 'i2',
    employerId: 'i2',
    title: 'Product Designer',
    companyName: 'Creative Studio',
    location: 'New York, NY',
    description: 'Join our design-first studio in NYC. We build beautiful digital products for startups and enterprise clients.\n\nRequirements:\n- Portfolio demonstrating UX/UI excellence\n- Proficient in Figma\n- Collaborative mindset',
    companyOverview: 'Creative Studio is a boutique design agency specializing in product strategy and digital experiences.',
    founded: 'Founded 2015',
    size: '10 to 50 workers',
    revenue: '$1 to $5 million',
    industry: 'Design Agency',
    headquarters: 'New York, NY',
    website: 'Visit website'
  },
};

export default function JobDetailsScreen() {
  const { id, expandDescription, viewMode } = useLocalSearchParams<{ id: string; expandDescription?: string; viewMode?: 'standard' | 'company' }>();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [detailsHiddenVisible, setDetailsHiddenVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewDescription, setReviewDescription] = useState('');
  const { showDialog } = useDialog();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (expandDescription === 'true' || viewMode === 'company') {
      setDescriptionExpanded(true);
    }
  }, [expandDescription, viewMode]);

  const loadJob = useCallback(async () => {
    if (!id) return;

    // Check dummy data first for testing
    if (DUMMY_JOBS_DATA[id]) {
      setJob(DUMMY_JOBS_DATA[id]);
      setLoading(false);
      return;
    }

    try {
      const isEmployer = user?.role === 'EMPLOYER';
      const response = isEmployer
        ? await apiClient.getEmployerJobById(id)
        : await apiClient.getJobById(id);
      if (response.success && response.data) {
        const data = response.data as any;
        setJob(data);
        if (typeof data.hasApplied === 'boolean') {
          setAlreadyApplied(data.hasApplied);
          if (data.hasApplied) await storage.addAppliedJobId(id);
        }
      } else setJob(null);
    } catch (error) {
      console.error('Error loading job:', error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.role]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    const checkSaved = async () => {
      if (id) {
        const savedIds = await storage.getSavedJobIds();
        setSaved(savedIds.includes(id));
      }
    };
    const checkApplied = async () => {
      if (id) {
        const appliedIds = await storage.getAppliedJobIds();
        setAlreadyApplied(appliedIds.includes(id));
      }
    };
    checkSaved();
    checkApplied();
  }, [id]);

  const toggleSaved = async () => {
    if (!job || !id) return;
    try {
      if (saved) {
        await storage.removeSavedJobId(id);
        setSaved(false);
      } else {
        const summary: SavedJobSummary = {
          id: id,
          title: job.title || '',
          companyName: job.companyName || '',
          location: job.location || '',
          companyLogoLetter: job.companyLogoLetter || '',
        };
        await storage.addSavedJob(summary);
        setSaved(true);
      }
    } catch (error) {
      console.error('Error toggling saved state:', error);
    }
  };

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      const response = await apiClient.applyToJob(id, undefined);
      if (response.success) {
        await storage.addAppliedJobId(id);
        setAlreadyApplied(true);
        const email = user?.email ?? '';
        router.replace({ pathname: '/application-submitted', params: { email } });
        return;
      }
      const errMsg = (response.error || '').toLowerCase();
      if (errMsg.includes('already applied')) {
        await storage.addAppliedJobId(id);
        setAlreadyApplied(true);
        showDialog({
          title: 'Already applied',
          message: 'You have already applied to this job.',
          primaryButton: { text: 'OK' },
        });
        return;
      }
      showDialog({
        title: 'Error',
        message: response.error || 'Failed to apply',
        primaryButton: { text: 'OK' },
      });
    } catch (error: any) {
      showDialog({
        title: 'Error',
        message: error?.message || 'Failed to apply',
        primaryButton: { text: 'OK' },
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const companyName = job.employer?.companyName || job.companyName || 'Company';
  const employerId = job.employer?.id ?? job.employerId ?? '';
  const location = job.location || job.employer?.city || job.employer?.address || 'Location';
  const benefits = Array.isArray(job.benefits) ? job.benefits : job.perks ? [].concat(job.perks) : [];
  const fallbackBenefits = ['Health Insurance', 'Paid time off', 'RSU', 'Life insurance', 'Disability insurance'];
  const displayBenefits = benefits.length ? benefits : fallbackBenefits;
  const letter = (companyName || '?').charAt(0).toUpperCase();

  // Company profile view: prefer employer fields from API, fallback to job (dummy) fields
  const companyOverview = job.employer?.companyDescription ?? job.companyOverview ?? 'We are a leading technology company...';
  const companySize = job.employer?.companySize ?? job.size ?? '100+ workers';
  const companyIndustry = job.employer?.industry ?? job.industry ?? 'Tech';
  const headquarters = [job.employer?.city, job.employer?.country].filter(Boolean).join(', ') || job.employer?.address || job.headquarters || 'San Francisco, CA';
  const companyWebsite = job.employer?.companyWebsite ?? job.website;
  const companyBanner = job.employer?.companyBanner;
  const companyLogo = job.employer?.companyLogo;

  const renderStandardView = () => (
    <>
      <View style={styles.bannerContainer}>
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="image-outline" size={40} color="#FFFFFF40" />
        </View>
        <View style={styles.logoOverlay}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>{letter}</Text>
          </View>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}>{job.title || 'Job Title'}</Text>
        <TouchableOpacity
          style={styles.companyRow}
          onPress={() => employerId && router.push(`/company-reviews/${employerId}`)}
          activeOpacity={employerId ? 0.7 : 1}
          disabled={!employerId}
        >
          <Text style={styles.companyName}>{companyName}</Text>
          <Ionicons name="open-outline" size={16} color={APP_COLORS.link} style={styles.linkIcon} />
          <Text style={styles.dot}>•</Text>
          <Text style={styles.ratingText}>4.6</Text>
          <Ionicons name="star" size={16} color="#031019" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job details</Text>
        <View style={styles.detailItem}>
          <View style={styles.iconBox}>
            <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>
            {job.salaryRange ? `${job.salaryRange} a year` : '$70,000 - $90,000 a year'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.iconBox}>
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>
            {job.employmentType ? job.employmentType.replace(/_/g, ' ') : 'Full-time'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.iconBox}>
            <Ionicons name="location-outline" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.detailText}>{location}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perks & benefits</Text>
        <View style={styles.benefitsWrap}>
          {displayBenefits.map((b: any, i: number) => (
            <View key={i} style={styles.benefitTag}>
              <Text style={styles.benefitTagText}>{typeof b === 'string' ? b : ''}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Job Description</Text>
        <Text
          style={styles.descriptionText}
          numberOfLines={descriptionExpanded ? undefined : DESC_TRUNCATE_LINES}
        >
          {job.description || 'No description provided.'}
        </Text>
        <TouchableOpacity
          onPress={() => setDescriptionExpanded(!descriptionExpanded)}
          style={styles.showMoreBtn}
        >
          <Text style={styles.showMoreText}>
            {descriptionExpanded ? 'Show less' : 'Show more'}
          </Text>
          <Ionicons
            name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={APP_COLORS.link}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderCompanyProfileView = () => (
    <>
      <View style={styles.bannerContainer}>
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="image-outline" size={40} color="#FFFFFF40" />
        </View>
        <View style={styles.logoOverlayComplex}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>{letter}</Text>
          </View>
          <View style={styles.companyMetaRow}>
            <View style={styles.companyMeta}>
              <Text style={styles.companyNameHero}>{companyName}</Text>
              <View style={styles.ratingHero}>
                <Text style={styles.ratingTextHero}>{companyName} 2.7 • 45</Text>
                <Ionicons name="star" size={14} color="#031019" style={{ marginLeft: 4 }} />
              </View>
            </View>
            <TouchableOpacity style={styles.writeReviewBtnInline} onPress={() => setReviewModalVisible(true)}>
              <Text style={styles.writeReviewText}>Write a review..</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sectionCompany}>
        <Text style={styles.sectionTitle}>Company overview</Text>
        <Text style={styles.descriptionText} numberOfLines={descriptionExpanded ? undefined : 3}>
          {job.companyOverview || 'We are a leading technology company...'}
        </Text>
        <TouchableOpacity style={styles.showMoreBtnInline} onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
          <Text style={styles.showMoreLink}>{descriptionExpanded ? 'Show less' : 'Show more'} <Ionicons name={descriptionExpanded ? "chevron-up" : "chevron-down"} size={14} color={APP_COLORS.link} /></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Founded</Text>
            <Text style={styles.gridValue}>{job.founded || '2012'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Company size</Text>
            <Text style={styles.gridValue}>{job.size || '100+ workers'}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Revenue</Text>
            <Text style={styles.gridValue}>{job.revenue || '$10M+'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Industry</Text>
            <Text style={styles.gridValue}>{job.industry || 'Tech'}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Headquarters</Text>
            <Text style={styles.gridValue}>{job.headquarters || 'San Francisco, CA'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Link</Text>
            <View style={styles.gridWebRow}>
              <Text style={styles.gridWebLink}>{job.website || 'Visit website'}</Text>
              <Ionicons name="open-outline" size={14} color={APP_COLORS.link} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.carouselSection}>
        <Text style={styles.carouselTitle}>Job Posting</Text>
        <View style={styles.carouselContainer}>
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
          <View style={styles.carouselCard}>
            <JobCard
              title={job.title}
              companyName={job.companyName}
              location={job.location}
              benefits={job.benefits}
              companyLogoLetter={job.companyLogoLetter}
              hideBookmark
              hideDislike
            />
          </View>
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselSection}>
        <Text style={styles.carouselTitle}>Company Reviews</Text>
        <View style={styles.carouselContainer}>
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatarCircle} />
              <View style={styles.reviewerMeta}>
                <Text style={styles.reviewerName}>Naveed Mansur 5.0 <Ionicons name="star" size={12} color="#031019" /></Text>
                <Text style={styles.reviewDate}>Oct, 24th, 2024 - ABC Company</Text>
              </View>
            </View>
            <Text style={styles.reviewText} numberOfLines={4}>
              Greatest digital solution with high professional... This company offers growth opportunities and a healthy work environment.
            </Text>
          </View>
          <TouchableOpacity style={styles.carouselArrow}>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{viewMode === 'company' ? 'Company profiles' : 'Job description'}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'company' ? renderCompanyProfileView() : renderStandardView()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!alreadyApplied && !loading && job && viewMode !== 'company' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.applyButtonText}>Apply now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <WriteReviewModal
        visible={reviewModalVisible}
        onClose={() => {
          setReviewModalVisible(false);
          setReviewRating(5);
          setReviewTitle('');
          setReviewDescription('');
        }}
        rating={reviewRating}
        setRating={setReviewRating}
        title={reviewTitle}
        setTitle={setReviewTitle}
        description={reviewDescription}
        setDescription={setReviewDescription}
        onSubmit={() => {
          if (!reviewTitle.trim()) return;
          setReviewModalVisible(false);
          setReviewRating(5);
          setReviewTitle('');
          setReviewDescription('');
          router.push('/review-submitted');
        }}
      />
    </View>
  );
}

function WriteReviewModal({
  visible,
  onClose,
  rating,
  setRating,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  rating: number;
  setRating: (rating: number) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onSubmit: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalSheet}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Rate & review</Text>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalLabel}>Tap to rate</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  style={styles.starBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={i <= rating ? '#FBBF24' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Review Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Good experience & fun environment"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.modalLabel}>Give a review</Text>
            <TextInput
              style={styles.modalTextArea}
              placeholder="This company offers a supportive and growth-oriented work environment..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, !title.trim() && styles.modalSubmitBtnDisabled]}
              onPress={onSubmit}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSubmitText}>Add Review</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerContainer: {
    height: 140,
    marginBottom: 100,
  },
  bannerPlaceholder: {
    height: 120,
    backgroundColor: '#1E4154',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOverlay: {
    position: 'absolute',
    left: 20,
    bottom: -15,
  },
  logoOverlayComplex: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: -80,
    alignItems: 'flex-start',
    gap: 12,
  },
  companyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  writeReviewBtnInline: {
    backgroundColor: '#1E4154',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#031019',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  companyMeta: {
    paddingBottom: 4,
  },
  companyNameHero: {
    fontFamily: 'Kanit',
    fontSize: 18,
    fontWeight: '700',
    color: '#031019',
  },
  ratingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingTextHero: {
    fontFamily: 'Kanit',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  writeReviewBtn: {
    position: 'absolute',
    right: 20,
    bottom: -10,
    backgroundColor: '#1E4154',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  writeReviewText: {
    color: '#FFF',
    fontFamily: 'Kanit',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  jobTitle: {
    fontFamily: 'Kanit',
    fontSize: 22,
    fontWeight: '700',
    color: '#031019',
    marginBottom: 6,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '500',
    color: APP_COLORS.link,
    textDecorationLine: 'underline',
  },
  linkIcon: {
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 8,
    color: '#6B7280',
    fontSize: 18,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#031019',
    marginRight: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 8,
    borderTopColor: '#F9FAFB',
  },
  sectionCompany: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#031019',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 15,
    color: '#031019',
    fontWeight: '500',
    flex: 1,
  },
  benefitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benefitTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  benefitTagText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  descriptionText: {
    fontFamily: 'Kanit',
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    fontWeight: '300',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  showMoreBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreLink: {
    color: APP_COLORS.link,
    fontFamily: 'Kanit',
    fontSize: 14,
    fontWeight: '600',
  },
  showMoreText: {
    color: APP_COLORS.link,
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 12,
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  gridLabel: {
    fontFamily: 'Kanit',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  gridValue: {
    fontFamily: 'Kanit',
    fontSize: 14,
    color: '#031019',
    fontWeight: '600',
  },
  gridWebRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridWebLink: {
    fontFamily: 'Kanit',
    fontSize: 14,
    color: APP_COLORS.link,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  carouselSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  carouselTitle: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#031019',
    marginBottom: 20,
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carouselArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCard: {
    flex: 1,
  },
  reviewCard: {
    flex: 1,
    backgroundColor: '#F2F7FB',
    padding: 16,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },
  reviewerMeta: {
    flex: 1,
  },
  reviewerName: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '600',
    color: '#031019',
  },
  reviewDate: {
    fontFamily: 'Kanit',
    fontSize: 12,
    color: '#6B7280',
  },
  reviewText: {
    fontFamily: 'Kanit',
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applyButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Kanit',
    fontSize: 22,
    fontWeight: '700',
    color: '#1E4154',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontFamily: 'Kanit',
    fontSize: 14,
    fontWeight: '600',
    color: '#031019',
    marginBottom: 8,
    marginTop: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starBtn: {
    padding: 4,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Kanit',
    color: '#031019',
  },
  modalTextArea: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Kanit',
    color: '#031019',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E4154',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
