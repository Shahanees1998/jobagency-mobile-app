import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadApplicationDetails();
  }, [id]);

  const loadApplicationDetails = async () => {
    try {
      const response = await apiClient.getApplicationById(id);
      if (response.success && response.data) {
        setApplication(response.data);
      }
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'REVIEWING':
        return '#FF9800';
      default:
        return colors.icon;
    }
  };

  const handleViewCV = () => {
    if (application?.candidate?.cvUrl) {
      Linking.openURL(application.candidate.cvUrl);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!application) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Application not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {application.job?.title || 'Application Details'}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <ThemedText style={styles.statusText}>{application.status}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.companyName}>
          {application.job?.employer?.companyName}
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Application Information</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Applied Date:</ThemedText>
            <ThemedText style={styles.value}>
              {new Date(application.appliedAt).toLocaleDateString()}
            </ThemedText>
          </View>
          {application.reviewedAt && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Reviewed Date:</ThemedText>
              <ThemedText style={styles.value}>
                {new Date(application.reviewedAt).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
          {application.interviewScheduled && application.interviewDate && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Interview Date:</ThemedText>
              <ThemedText style={styles.value}>
                {new Date(application.interviewDate).toLocaleString()}
              </ThemedText>
            </View>
          )}
          {application.interviewLocation && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Interview Location:</ThemedText>
              <ThemedText style={styles.value}>{application.interviewLocation}</ThemedText>
            </View>
          )}
        </View>

        {user?.role === 'EMPLOYER' && application.candidate && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Candidate Information</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Name:</ThemedText>
              <ThemedText style={styles.value}>
                {application.candidate.user?.firstName} {application.candidate.user?.lastName}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <ThemedText style={styles.value}>{application.candidate.user?.email}</ThemedText>
            </View>
            {application.candidate.bio && (
              <View style={styles.bioContainer}>
                <ThemedText style={styles.label}>Bio:</ThemedText>
                <ThemedText style={styles.bioText}>{application.candidate.bio}</ThemedText>
              </View>
            )}
            {application.candidate.skills && application.candidate.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <ThemedText style={styles.label}>Skills:</ThemedText>
                <View style={styles.skillsList}>
                  {application.candidate.skills.map((skill: string, index: number) => (
                    <View key={index} style={[styles.skillTag, { backgroundColor: colors.tint }]}>
                      <ThemedText style={styles.skillText}>{skill}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {application.candidate.cvUrl && (
              <TouchableOpacity
                style={[styles.cvButton, { backgroundColor: colors.tint }]}
                onPress={handleViewCV}
              >
                <IconSymbol name="doc.fill" size={20} color="#fff" />
                <ThemedText style={styles.cvButtonText}>View CV</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {application.coverLetter && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Cover Letter</ThemedText>
            <ThemedText style={styles.coverLetterText}>{application.coverLetter}</ThemedText>
          </View>
        )}

        {application.rejectionReason && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Rejection Reason</ThemedText>
            <ThemedText style={styles.rejectionText}>{application.rejectionReason}</ThemedText>
          </View>
        )}

        {application.interviewNotes && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Interview Notes</ThemedText>
            <ThemedText style={styles.notesText}>{application.interviewNotes}</ThemedText>
          </View>
        )}

        {user?.role === 'EMPLOYER' && application.status === 'APPLIED' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={async () => {
                try {
                  const response = await apiClient.updateApplicationStatus(
                    application.jobId,
                    application.id,
                    'APPROVED'
                  );
                  if (response.success) {
                    await loadApplicationDetails();
                  }
                } catch (error: any) {
                  showDialog({ title: 'Error', message: error.message || 'Failed to approve application', primaryButton: { text: 'OK' } });
                }
              }}
            >
              <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={async () => {
                try {
                  const response = await apiClient.updateApplicationStatus(
                    application.jobId,
                    application.id,
                    'REJECTED'
                  );
                  if (response.success) {
                    await loadApplicationDetails();
                  }
                } catch (error: any) {
                  showDialog({ title: 'Error', message: error.message || 'Failed to reject application', primaryButton: { text: 'OK' } });
                }
              }}
            >
              <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'EMPLOYER' && application.status === 'APPROVED' && (
          <View style={[styles.actionButtons, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                const jobId = application.jobId || application.job?.id;
                if (jobId) router.push(`/schedule-interview?jobId=${jobId}&applicationId=${application.id}`);
              }}
            >
              <ThemedText style={styles.actionButtonText}>Schedule interview</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {user?.role === 'EMPLOYER' && application.status === 'INTERVIEW_SCHEDULED' && (
          <View style={[styles.actionButtons, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push(`/edit-interview/${application.id}?jobId=${application.jobId || application.job?.id}`)}
            >
              <ThemedText style={styles.actionButtonText}>Update interview</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  companyName: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  bioContainer: {
    marginTop: 12,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.8,
  },
  skillsContainer: {
    marginTop: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  cvButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  coverLetterText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  rejectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#F44336',
    opacity: 0.8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

