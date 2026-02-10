import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_COLORS } from '@/constants/appTheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
];

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    salaryRange: '',
    employmentType: 'FULL_TIME',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (user?.role !== 'EMPLOYER' || !id) {
      router.back();
      return;
    }
    loadJob();
  }, [id, user?.role]);

  const loadJob = async () => {
    if (!id) return;
    try {
      const response = await apiClient.getEmployerJobById(id);
      if (response.success && response.data) {
        const j = response.data;
        setFormData({
          title: j.title || '',
          description: j.description || '',
          requirements: j.requirements || '',
          responsibilities: j.responsibilities || '',
          location: j.location || '',
          salaryRange: j.salaryRange || '',
          employmentType: j.employmentType || 'FULL_TIME',
          category: j.category || '',
        });
      }
    } catch (error) {
      console.error('Error loading job:', error);
      showDialog({ title: 'Error', message: 'Failed to load job', primaryButton: { text: 'OK' } });
    } finally {
      setInitialLoading(false);
    }
  };

  const doCloseJob = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.updateJob(id, { status: 'CLOSED' });
      if (response.success) {
        showDialog({
          title: 'Job closed',
          message: 'This job has been delisted successfully.',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to close job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to close job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async () => {
    showDialog({
      title: 'Close this job?',
      message: 'This will delist the job and candidates will no longer be able to apply. You can’t undo this from the mobile app.',
      primaryButton: { text: 'Close job', onPress: doCloseJob },
      secondaryButton: { text: 'Cancel' },
    });
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!formData.title.trim() || !formData.description.trim()) {
      showDialog({ title: 'Error', message: 'Please fill in title and description', primaryButton: { text: 'OK' } });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.updateJob(id, formData);
      if (response.success) {
        showDialog({
          title: 'Success',
          message: 'Job updated successfully',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to update job', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to update job', primaryButton: { text: 'OK' } });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Edit Job</ThemedText>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Job Title *</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              placeholder="e.g., Senior Software Engineer"
              placeholderTextColor={colors.icon}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Job description..."
              placeholderTextColor={colors.icon}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Requirements</ThemedText>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Job requirements..."
              placeholderTextColor={colors.icon}
              value={formData.requirements}
              onChangeText={(text) => setFormData({ ...formData, requirements: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Responsibilities</ThemedText>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Job responsibilities..."
              placeholderTextColor={colors.icon}
              value={formData.responsibilities}
              onChangeText={(text) => setFormData({ ...formData, responsibilities: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Location</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              placeholder="e.g., New York, NY"
              placeholderTextColor={colors.icon}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Salary Range</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              placeholder="e.g., $50k - $70k"
              placeholderTextColor={colors.icon}
              value={formData.salaryRange}
              onChangeText={(text) => setFormData({ ...formData, salaryRange: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Employment Type</ThemedText>
            <View style={[styles.pickerContainer, { borderColor: colors.icon }]}>
              {EMPLOYMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    {
                      backgroundColor:
                        formData.employmentType === type ? colors.tint : 'transparent',
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, employmentType: type })}
                >
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      { color: formData.employmentType === type ? '#fff' : colors.text },
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              placeholder="e.g., Technology, Healthcare"
              placeholderTextColor={colors.icon}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.tint }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Update Job</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseJob}
            disabled={loading}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.closeButtonText}>Close job (Delist)</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 28, marginBottom: 24 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerOptionText: { fontSize: 16 },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.danger,
    backgroundColor: 'transparent',
  },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.danger },
});
