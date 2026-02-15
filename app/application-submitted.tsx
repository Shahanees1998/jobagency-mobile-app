import { useAuth } from '@/contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ApplicationSubmittedScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? user?.email ?? '';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application submitted</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconWrap}>
            <Ionicons name="paper-plane-outline" size={32} color="#000" />
          </View>
        </View>

        <Text style={styles.title}>
          Your application has{'\n'}been submitted !!
        </Text>

        <Text style={styles.message}>
          Your job application has been submitted successfully. A confirmation email will be sent shortly to{' '}
          <Text style={styles.email}>{email || 'your email'}</Text>.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Return to job search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#72A4BF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E4154',
  },
  title: {
    fontFamily: 'Kanit',
    fontWeight: '700',
    fontSize: 32,
    textAlign: 'center',
    color: '#000',
    marginBottom: 20,
    lineHeight: 38,
  },
  message: {
    fontFamily: 'Kanit',
    fontWeight: '300',
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  email: {
    fontWeight: '500',
    color: '#000',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E4154',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
