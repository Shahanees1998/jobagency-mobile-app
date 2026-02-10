import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { storage, type JobFilters } from '@/lib/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_FILTERS: JobFilters = {
  datePosted: 'all',
  remote: ['on-site'],
  jobType: ['FULL_TIME'],
  experienceLevel: 'all',
  salary: 'all',
  education: 'all',
  sortBy: 'relevance',
};

const DATE_OPTIONS: { value: JobFilters['datePosted']; label: string }[] = [
  { value: 'all', label: 'All Jobs' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
];

const REMOTE_OPTIONS: { value: string; label: string }[] = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const JOB_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
];

const EXPERIENCE_OPTIONS: { value: JobFilters['experienceLevel']; label: string }[] = [
  { value: 'all', label: 'All experience levels' },
  { value: 'senior', label: 'Senior level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'entry', label: 'Entry level' },
  { value: 'none', label: 'No experience required' },
];

const SALARY_OPTIONS: { value: JobFilters['salary']; label: string }[] = [
  { value: 'all', label: 'All Salaries' },
  { value: '70', label: '$70,000+' },
  { value: '90', label: '$90,000+' },
  { value: '110', label: '$110,000+' },
  { value: '120', label: '$120,000+' },
  { value: '140', label: '$140,000+' },
];

const EDUCATION_OPTIONS: { value: JobFilters['education']; label: string }[] = [
  { value: 'all', label: 'All education levels' },
  { value: 'high_school', label: "High school degree" },
  { value: 'bachelor', label: "Bachelor's degree" },
  { value: 'master', label: "Master's degree" },
  { value: 'doctoral', label: 'Doctoral degree' },
];

const SORT_OPTIONS: { value: JobFilters['sortBy']; label: string }[] = [
  { value: 'relevance', label: 'Sort by relevance' },
  { value: 'date', label: 'Sort by date' },
];

function RadioRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onSelect} activeOpacity={0.7}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={APP_COLORS.white} /> : null}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function JobFiltersScreen() {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    (async () => {
      const saved = await storage.getJobFilters();
      if (saved) setFilters(saved);
    })();
  }, []);

  const handleReset = async () => {
    setFilters(DEFAULT_FILTERS);
    await storage.setJobFilters(DEFAULT_FILTERS);
    router.back();
  };

  const handleUpdate = async () => {
    await storage.setJobFilters(filters);
    router.back();
  };

  const toggleRemote = (value: string) => {
    setFilters((f) => ({
      ...f,
      remote: f.remote.includes(value)
        ? f.remote.filter((v) => v !== value)
        : [...f.remote, value],
    }));
  };

  const toggleJobType = (value: string) => {
    setFilters((f) => ({
      ...f,
      jobType: f.jobType.includes(value)
        ? f.jobType.filter((v) => v !== value)
        : [...f.jobType, value],
    }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Date posted</Text>
        {DATE_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={filters.datePosted === opt.value}
            onSelect={() => setFilters((f) => ({ ...f, datePosted: opt.value }))}
          />
        ))}

        <Text style={styles.sectionTitle}>Remote</Text>
        {REMOTE_OPTIONS.map((opt) => (
          <CheckRow
            key={opt.value}
            label={opt.label}
            checked={filters.remote.includes(opt.value)}
            onToggle={() => toggleRemote(opt.value)}
          />
        ))}

        <Text style={styles.sectionTitle}>Job type</Text>
        {JOB_TYPE_OPTIONS.map((opt) => (
          <CheckRow
            key={opt.value}
            label={opt.label}
            checked={filters.jobType.includes(opt.value)}
            onToggle={() => toggleJobType(opt.value)}
          />
        ))}

        <Text style={styles.sectionTitle}>Experience level</Text>
        {EXPERIENCE_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={filters.experienceLevel === opt.value}
            onSelect={() => setFilters((f) => ({ ...f, experienceLevel: opt.value }))}
          />
        ))}

        <Text style={styles.sectionTitle}>Salary</Text>
        {SALARY_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={filters.salary === opt.value}
            onSelect={() => setFilters((f) => ({ ...f, salary: opt.value }))}
          />
        ))}

        <Text style={styles.sectionTitle}>Education</Text>
        {EDUCATION_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={filters.education === opt.value}
            onSelect={() => setFilters((f) => ({ ...f, education: opt.value }))}
          />
        ))}

        <Text style={styles.sectionTitle}>Sort by</Text>
        {SORT_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={filters.sortBy === opt.value}
            onSelect={() => setFilters((f) => ({ ...f, sortBy: opt.value }))}
          />
        ))}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.85}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85}>
            <Text style={styles.updateText}>Update</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  container: { flex: 1 },
  content: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: { borderColor: APP_COLORS.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: APP_COLORS.primary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  optionLabel: { fontSize: 16, color: APP_COLORS.textPrimary },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  resetButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  resetText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  updateButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
});
