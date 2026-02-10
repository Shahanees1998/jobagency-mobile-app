import { InfoPopup } from '@/components/ui/InfoPopup';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import { SavedJobSummary, storage } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 160;
const LOGO_SIZE = 64;
const DESC_TRUNCATE_LINES = 4;

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [detailsHiddenVisible, setDetailsHiddenVisible] = useState(false);
  const { showDialog } = useDialog();

  const loadJob = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.getJobById(id);
      if (response.success && response.data) setJob(response.data);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    (async () => {
      const ids = await storage.getSavedJobIds();
      setSaved(ids.includes(id));
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const appliedIds = await storage.getAppliedJobIds();
      const applied = appliedIds.includes(id);
      setAlreadyApplied(applied);
      if (applied) setDetailsHiddenVisible(true);
    })();
  }, [id]);

  const toggleSaved = useCallback(async () => {
    if (!job) return;
    const summary: SavedJobSummary = {
      id: job.id,
      title: job.title || 'Job',
      companyName: job.employer?.companyName || job.companyName || 'Company',
      location: job.location || 'Location',
      benefits: Array.isArray(job.benefits) ? job.benefits : job.perks ? [].concat(job.perks) : undefined,
      companyLogoLetter: (job.employer?.companyName || job.companyName || '?').charAt(0).toUpperCase(),
    };
    if (saved) {
      await storage.removeSavedJobId(job.id);
      setSaved(false);
    } else {
      await storage.addSavedJob(summary);
      setSaved(true);
    }
  }, [job, saved]);

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      const response = await apiClient.applyToJob(id, undefined);
      if (response.success) {
        await storage.addAppliedJobId(id);
        setAlreadyApplied(true);
        const email = user?.email ?? '';
        router.replace(`/application-submitted${email ? `?email=${encodeURIComponent(email)}` : ''}`);
        return;
      }
      const errMsg = (response.error || '').toLowerCase();
      if (errMsg.includes('candidate profile') && errMsg.includes('not found')) {
        await storage.addAppliedJobId(id);
        const email = user?.email ?? '';
        router.replace(`/application-submitted${email ? `?email=${encodeURIComponent(email)}` : ''}`);
        return;
      }
      const errMsgLower = (response.error || '').toLowerCase();
      if (errMsgLower.includes('already applied')) {
        await storage.addAppliedJobId(id);
        setAlreadyApplied(true);
      }
      showDialog({
        title: 'Error',
        message: response.error || 'Failed to apply',
        primaryButton: { text: 'OK' },
      });
    } catch (error: any) {
      const errMsg = (error?.message || '').toLowerCase();
      if (errMsg.includes('candidate profile') && errMsg.includes('not found')) {
        await storage.addAppliedJobId(id);
        const email = user?.email ?? '';
        router.replace(`/application-submitted${email ? `?email=${encodeURIComponent(email)}` : ''}`);
        return;
      }
      const errMsgLower = (error?.message || '').toLowerCase();
      if (errMsgLower.includes('already applied')) {
        await storage.addAppliedJobId(id);
        setAlreadyApplied(true);
      }
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const companyName = job.employer?.companyName || job.companyName || 'Company';
  const location = job.location || job.employer?.location || 'Location';
  const benefits = Array.isArray(job.benefits) ? job.benefits : job.perks ? [].concat(job.perks) : [];
  const fallbackBenefits = ['Health Insurance', 'Paid time off', 'RSU', 'Life insurance', 'Disability insurance'];
  const displayBenefits = benefits.length ? benefits : fallbackBenefits;
  const letter = (companyName || '?').charAt(0).toUpperCase();
  const description = job.description || '';
  const showExpand = description.length > 180;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job description</Text>
        <TouchableOpacity onPress={toggleSaved} style={styles.headerBtn} hitSlop={12}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? APP_COLORS.primary : APP_COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerPlaceholder} />
          <View style={styles.logoOverlay}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>{letter}</Text>
            </View>
          </View>
        </View>

        {/* Title & Company */}
        <Text style={styles.jobTitle}>{job.title || 'Job Title'}</Text>
        <View style={styles.companyRow}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Ionicons name="open-outline" size={16} color={APP_COLORS.textSecondary} style={styles.linkIcon} />
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>4.6</Text>
          </View>
        </View>

        {/* Job details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job details</Text>
          {job.salaryRange ? (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{job.salaryRange} a year</Text>
            </View>
          ) : null}
          {job.employmentType ? (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{job.employmentType.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={APP_COLORS.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Perks & benefits card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perks & benefits</Text>
          <View style={styles.benefitsWrap}>
            {displayBenefits.slice(0, 8).map((b, i) => (
              <View key={i} style={styles.benefitTag}>
                <Text style={styles.benefitTagText}>{typeof b === 'string' ? b : b?.label ?? b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Full Job description card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Full Job description</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={descriptionExpanded ? undefined : DESC_TRUNCATE_LINES}
          >
            {description || 'No description provided.'}
          </Text>
          {showExpand && (
            <TouchableOpacity
              style={styles.showMoreWrap}
              onPress={() => setDescriptionExpanded((e) => !e)}
              activeOpacity={0.7}
            >
              <Text style={styles.showMoreText}>{descriptionExpanded ? 'Show less' : 'Show more'}</Text>
              <Ionicons
                name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={APP_COLORS.link}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Apply now / Already applied */}
        {user?.role === 'CANDIDATE' && job.status === 'APPROVED' && (
          alreadyApplied ? (
            <View style={styles.alreadyAppliedButton}>
              <Ionicons name="checkmark-circle" size={22} color={APP_COLORS.textMuted} style={styles.alreadyAppliedIcon} />
              <Text style={styles.alreadyAppliedText}>Already applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              disabled={applying}
              activeOpacity={0.85}
            >
              {applying ? (
                <ActivityIndicator color={APP_COLORS.white} />
              ) : (
                <Text style={styles.applyButtonText}>Apply now</Text>
              )}
            </TouchableOpacity>
          )
        )}

        {user?.role === 'EMPLOYER' && id && (
          <View style={styles.employerActions}>
            <TouchableOpacity style={styles.applyButton} onPress={() => router.push('/(tabs)/applications')} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>View Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/edit-job/${id}`)} activeOpacity={0.85}>
              <Text style={styles.editButtonText}>Edit Job</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <InfoPopup
        visible={detailsHiddenVisible}
        onClose={() => setDetailsHiddenVisible(false)}
        icon="lock-closed"
        title="Details temporarily hidden !!"
        message="Once your application is approved, you'll be able to view employer details and interview locations."
        buttonText="Got it"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 16, color: APP_COLORS.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.background,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 0 },
  banner: {
    height: BANNER_HEIGHT,
    marginBottom: LOGO_SIZE / 2 + 8,
    position: 'relative',
  },
  bannerPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: APP_COLORS.primary,
    opacity: 0.9,
    borderRadius: APP_SPACING.borderRadius,
  },
  logoOverlay: {
    position: 'absolute',
    left: APP_SPACING.screenPadding,
    bottom: -LOGO_SIZE / 2,
  },
  logoBox: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 28, fontWeight: '700', color: APP_COLORS.white },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  linkIcon: { marginLeft: 2 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary },
  card: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: APP_SPACING.itemPadding,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 12 },
  detailText: { fontSize: 15, color: APP_COLORS.textPrimary, flex: 1 },
  benefitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  benefitTag: {
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  benefitTagText: { fontSize: 14, color: APP_COLORS.textPrimary },
  descriptionText: { fontSize: 15, lineHeight: 24, color: APP_COLORS.textSecondary },
  showMoreWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  showMoreText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.link },
  applyButton: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  applyButtonText: { color: APP_COLORS.white, fontSize: 16, fontWeight: '600' },
  alreadyAppliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    marginTop: 8,
    minHeight: 52,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  alreadyAppliedIcon: { marginRight: 8 },
  alreadyAppliedText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textMuted },
  employerActions: { gap: 12, marginTop: 8 },
  editButton: {
    paddingVertical: 16,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: APP_COLORS.primary,
  },
  editButtonText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.primary },
  bottomPadding: { height: 32 },
});
