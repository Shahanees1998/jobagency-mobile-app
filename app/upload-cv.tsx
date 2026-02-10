import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useDialog } from '@/contexts/DialogContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function UploadCVScreen() {
  const { showDialog } = useDialog();
  const [uploading, setUploading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadCV(result.assets[0].uri);
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to pick document', primaryButton: { text: 'OK' } });
    }
  };

  const uploadCV = async (uri: string) => {
    setUploading(true);
    try {
      const response = await apiClient.uploadCV(uri);
      if (response.success) {
        showDialog({
          title: 'Success',
          message: 'CV uploaded successfully',
          primaryButton: { text: 'OK', onPress: () => router.back() },
        });
      } else {
        showDialog({ title: 'Error', message: response.error || 'Failed to upload CV', primaryButton: { text: 'OK' } });
      }
    } catch (error: any) {
      showDialog({ title: 'Error', message: error.message || 'Failed to upload CV', primaryButton: { text: 'OK' } });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Upload CV</ThemedText>
        <ThemedText style={styles.subtitle}>
          Upload your resume/CV in PDF format. This will be used when applying to jobs.
        </ThemedText>

        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.tint }]}
          onPress={handlePickDocument}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="doc.fill" size={24} color="#fff" />
              <ThemedText style={styles.uploadButtonText}>Select PDF File</ThemedText>
            </>
          )}
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


