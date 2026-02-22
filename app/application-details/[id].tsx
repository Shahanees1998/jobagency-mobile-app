import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const CARD_BG = '#F8F8F8';
const CARD_RADIUS = 10;
const SECTION_TITLE_SIZE = 16;
const PILL_RADIUS = 10;

function parseJsonArray(str: string | null | undefined): any[] {
  if (!str || typeof str !== 'string') return [];
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseCertifications(input: string[] | any[] | null | undefined): { title: string; startDate?: string; endDate?: string; description?: string }[] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => {
    if (typeof item === 'string') {
      try {
        const o = JSON.parse(item);
        if (o && typeof o === 'object') {
          return {
            title: o.title ?? o.name ?? String(item),
            startDate: o.startDate ?? o.start,
            endDate: o.endDate ?? o.end,
            description: o.description,
          };
        }
      } catch {
        // not JSON
      }
      return { title: item };
    }
    if (item && typeof item === 'object') {
      return {
        title: item.title ?? item.name ?? 'Certification',
        startDate: item.startDate ?? item.start,
        endDate: item.endDate ?? item.end,
        description: item.description,
      };
    }
    return { title: String(item) };
  });
}

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicationDetails();
  }, [id]);

  const loadApplicationDetails = async () => {
    try {
      const response = await apiClient.getApplicationById(id);
      if (response.success && response.data) setApplication(response.data);
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = () => {
    if (application?.candidate?.cvUrl) Linking.openURL(application.candidate.cvUrl);
  };

  const handleApprove = async () => {
    try {
      const res = await apiClient.updateApplicationStatus(application.jobId, application.id, 'APPROVED');
      if (res.success) await loadApplicationDetails();
      else showDialog({ title: 'Error', message: res.error || 'Failed to approve', primaryButton: { text: 'OK' } });
    } catch (e: any) {
      showDialog({ title: 'Error', message: e?.message || 'Failed to approve', primaryButton: { text: 'OK' } });
    }
  };

  const handleReject = async () => {
    showDialog({
      title: 'Reject application',
      message: 'Reject this candidate? They will be notified.',
      primaryButton: { text: 'Yes, Reject', onPress: async () => {
        try {
          const res = await apiClient.updateApplicationStatus(application.jobId, application.id, 'REJECTED');
          if (res.success) await loadApplicationDetails();
          else showDialog({ title: 'Error', message: res.error || 'Failed to reject', primaryButton: { text: 'OK' } });
        } catch (e: any) {
          showDialog({ title: 'Error', message: (e as Error)?.message || 'Failed to reject', primaryButton: { text: 'OK' } });
        }
      } },
      secondaryButton: { text: 'Cancel' },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFound}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmployer = user?.role === 'EMPLOYER';
  const c = application.candidate;
  const u = c?.user;
  const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Candidate' : 'Candidate';
  const phone = u?.phone || '—';
  const email = u?.email || '—';
  const location = c?.location || '—';
  const experienceList = parseJsonArray(c?.experience);
  const educationList = parseJsonArray(c?.education);
  const skills: string[] = Array.isArray(c?.skills) ? c.skills : [];
  const languages: string[] = Array.isArray(c?.languages) ? c.languages : [];
  const certificationsList = parseCertifications(
    Array.isArray(c?.certifications) ? c.certifications : []
  );

  const renderEmployerCandidateProfile = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Profile</Text>
        <View style={styles.headerBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Candidate Contact Information Card - only section with coloured bg */}
        <View style={styles.cardFirst}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardMuted}>{phone}</Text>
          <Text style={styles.cardMuted}>{email}</Text>
          <Text style={styles.cardMuted}>{location}</Text>
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.cardRest}>
          {(c?.bio || application.coverLetter) ? (
            <>
              {(c?.bio || application.coverLetter)
                .split(/\n/)
                .map((line: string, idx: number) => (
                  <Text key={idx} style={line.trimStart().startsWith('•') ? styles.cardBullet : styles.cardBody}>
                    {line.trim() || ' '}
                  </Text>
                ))}
            </>
          ) : (
            <Text style={styles.cardBodyMuted}>No summary provided.</Text>
          )}
        </View>

        {/* Work experience - after Summary, white bg */}
        <Text style={styles.sectionTitle}>Work experience</Text>
        <View style={styles.cardRest}>
          {experienceList.length > 0 ? (
            experienceList.map((exp: any, i: number) => (
              <View key={i} style={i > 0 ? styles.cardBlock : undefined}>
                <Text style={styles.cardSubtitle}>{exp.title || exp.role || 'Role'}</Text>
                <Text style={styles.cardMeta}>
                  {[exp.company, exp.location].filter(Boolean).join(' - ') || '—'}
                </Text>
                <Text style={styles.cardMeta}>
                  {[exp.startDate, exp.endDate].filter(Boolean).join(' to ') || '—'}
                </Text>
                {exp.description ? (
                  exp.description.split(/\n/).map((line: string, idx: number) => (
                    <Text key={idx} style={line.trimStart().startsWith('•') ? styles.cardBullet : styles.cardBody}>
                      {line.trim() || ' '}
                    </Text>
                  ))
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.cardBodyMuted}>No work experience added.</Text>
          )}
        </View>

        {/* Education - white bg */}
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.cardRest}>
          {educationList.length > 0 ? (
            educationList.map((ed: any, i: number) => (
              <View key={i} style={i > 0 ? styles.cardBlock : undefined}>
                <Text style={styles.cardSubtitle}>{ed.degree || ed.school || 'Education'}</Text>
                <Text style={styles.cardMeta}>
                  {[ed.school || ed.institution || ed.university, ed.location || ed.city].filter(Boolean).join(' - ') || '—'}
                </Text>
                <Text style={styles.cardMeta}>
                  {[ed.startDate, ed.endDate].filter(Boolean).join(' to ') || '—'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardBodyMuted}>No education added.</Text>
          )}
        </View>

        {/* Skills - each skill in its own card, vertical stack, white bg */}
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.cardList}>
          {skills.length > 0 ? (
            skills.map((s: string, i: number) => (
              <View key={i} style={styles.cardItem}>
                <Text style={styles.cardItemText}>{s}</Text>
              </View>
            ))
          ) : (
            <View style={styles.cardItem}>
              <Text style={styles.cardItemTextMuted}>No skills added.</Text>
            </View>
          )}
        </View>

        {/* Languages - each language in its own card, vertical stack, white bg */}
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.cardList}>
          {languages.length > 0 ? (
            languages.map((lang: string, i: number) => (
              <View key={i} style={styles.cardItem}>
                <Text style={styles.cardItemText}>{lang}</Text>
              </View>
            ))
          ) : (
            <View style={styles.cardItem}>
              <Text style={styles.cardItemTextMuted}>No languages added.</Text>
            </View>
          )}
        </View>

        {/* Certifications & licenses - white bg */}
        <Text style={styles.sectionTitle}>Certifications & licenses</Text>
        <View style={styles.cardRest}>
          {certificationsList.length > 0 ? (
            certificationsList.map((cert: { title: string; startDate?: string; endDate?: string; description?: string }, i: number) => (
              <View key={i} style={i > 0 ? styles.cardBlock : undefined}>
                <Text style={styles.cardSubtitle}>{cert.title}</Text>
                {(cert.startDate || cert.endDate) && (
                  <Text style={styles.cardMeta}>
                    {[cert.startDate, cert.endDate].filter(Boolean).join(' to ') || '—'}
                  </Text>
                )}
                {cert.description ? <Text style={styles.cardBody}>{cert.description}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.cardBodyMuted}>No certifications or licenses added.</Text>
          )}
        </View>

        {/* View CV */}
        {c?.cvUrl ? (
          <TouchableOpacity style={styles.cvButton} onPress={handleViewCV} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={20} color={APP_COLORS.white} />
            <Text style={styles.cvButtonText}>View CV</Text>
          </TouchableOpacity>
        ) : null}

        {/* Actions for employer */}
        {application.status === 'APPLIED' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionReject} onPress={handleReject} activeOpacity={0.85}>
              <Text style={styles.actionRejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionApprove} onPress={handleApprove} activeOpacity={0.85}>
              <Text style={styles.actionApproveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
        {application.status === 'APPROVED' && (
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => {
              const jobId = application.jobId || application.job?.id;
              if (jobId) router.push(`/schedule-interview?jobId=${jobId}&applicationId=${application.id}`);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.actionPrimaryText}>Schedule interview</Text>
          </TouchableOpacity>
        )}
        {application.status === 'INTERVIEW_SCHEDULED' && (
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => router.push(`/edit-interview/${application.id}?jobId=${application.jobId || application.job?.id}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionPrimaryText}>Update interview</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );

  const renderCandidateView = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <View style={styles.headerBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Application Information</Text>
        <View style={styles.card}>
          <Text style={styles.cardMuted}>Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '—'}</Text>
          {application.reviewedAt && (
            <Text style={styles.cardMuted}>Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}</Text>
          )}
        </View>
        {application.coverLetter && (
          <>
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <View style={styles.card}>
              <Text style={styles.cardBody}>{application.coverLetter}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {isEmployer && c ? renderEmployerCandidateProfile() : renderCandidateView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: APP_COLORS.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: APP_COLORS.white,
  },
  headerBtn: { padding: 4, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: APP_SPACING.screenPadding, paddingTop: 20 },
  sectionTitle: {
    fontSize: SECTION_TITLE_SIZE,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginBottom: 10,
  },
  cardFirst: {
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  cardRest: {
    backgroundColor: APP_COLORS.white,
    borderRadius: CARD_RADIUS,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: CARD_RADIUS,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  cardBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8EAED' },
  cardName: { fontSize: 19, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 8 },
  cardSubtitle: { fontSize: 15, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: APP_COLORS.textMuted, marginBottom: 4 },
  cardMuted: { fontSize: 14, color: APP_COLORS.textMuted, marginBottom: 6 },
  cardBody: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 22, marginBottom: 4 },
  cardBodyMuted: { fontSize: 14, color: APP_COLORS.textMuted, lineHeight: 22, fontStyle: 'italic' },
  cardBullet: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 22, marginBottom: 4, paddingLeft: 4 },
  cardList: { marginBottom: 20 },
  cardItem: {
    backgroundColor: APP_COLORS.white,
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  cardItemText: { fontSize: 14, color: APP_COLORS.textPrimary },
  cardItemTextMuted: { fontSize: 14, color: APP_COLORS.textMuted },
  cvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: APP_COLORS.primary,
    marginBottom: 20,
    gap: 8,
  },
  cvButtonText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionReject: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRejectText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  actionApprove: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionApproveText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  actionPrimary: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionPrimaryText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
