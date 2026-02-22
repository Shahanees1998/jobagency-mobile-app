import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  level?: string;
  fieldOfStudy?: string;
  school?: string;
  country?: string;
  cityState?: string;
  dates: string;
  currentlyEnrolled?: boolean;
  fromMonth?: string;
  fromYear?: string;
  toMonth?: string;
  toYear?: string;
  description: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - 29 + i)).reverse();

function parseEducation(d: any): EducationItem[] {
  if (Array.isArray(d)) return d as EducationItem[];
  if (typeof d === 'string' && d) {
    try {
      const arr = JSON.parse(d);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {}
  }
  return [];
}

export default function AddEducationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<EducationItem[]>([]);

  const [level, setLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [school, setSchool] = useState('');
  const [country, setCountry] = useState('USA');
  const [cityState, setCityState] = useState('');
  const [currentlyEnrolled, setCurrentlyEnrolled] = useState(false);
  const [fromMonth, setFromMonth] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [toYear, setToYear] = useState('');
  const [description, setDescription] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [fromMonthOpen, setFromMonthOpen] = useState(false);
  const [fromYearOpen, setFromYearOpen] = useState(false);
  const [toMonthOpen, setToMonthOpen] = useState(false);
  const [toYearOpen, setToYearOpen] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getCandidateProfile();
        if (res.success && res.data) {
          const d = res.data as any;
          const edu = parseEducation(d.education);
          setList(edu);
          if (editId) {
            const item = edu.find((e) => e.id === editId);
            if (item) {
              setLevel(item.level ?? item.degree ?? '');
              setFieldOfStudy(item.fieldOfStudy ?? '');
              setSchool(item.school ?? item.institution ?? '');
              setCountry(item.country ?? 'USA');
              setCityState(item.cityState ?? '');
              setCurrentlyEnrolled(!!item.currentlyEnrolled);
              setFromMonth(item.fromMonth ?? '');
              setFromYear(item.fromYear ?? '');
              setToMonth(item.toMonth ?? '');
              setToYear(item.toYear ?? '');
              setDescription(item.description ?? '');
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const buildDates = () => {
    const from = [fromMonth, fromYear].filter(Boolean).join(' ') || undefined;
    const to = currentlyEnrolled ? 'Present' : [toMonth, toYear].filter(Boolean).join(' ') || undefined;
    return from && to ? `${from} to ${to}` : from ?? to ?? '';
  };

  const handleSave = async () => {
    const degreeText = level.trim() || fieldOfStudy.trim() ? `${level.trim()}${level && fieldOfStudy ? ' in ' : ''}${fieldOfStudy.trim()}`.trim() : '';
    if (!degreeText && !school.trim()) return;
    setSaving(true);
    try {
      const dates = buildDates();
      const item: EducationItem = {
        id: editId ?? `e-${Date.now()}`,
        degree: degreeText || level || fieldOfStudy || 'Education',
        institution: school.trim() || '',
        level: level.trim() || undefined,
        fieldOfStudy: fieldOfStudy.trim() || undefined,
        school: school.trim() || undefined,
        country: country || undefined,
        cityState: cityState.trim() || undefined,
        dates,
        currentlyEnrolled,
        fromMonth: fromMonth || undefined,
        fromYear: fromYear || undefined,
        toMonth: toMonth || undefined,
        toYear: toYear || undefined,
        description: description.trim(),
      };
      const nextList = editId
        ? list.map((e) => (e.id === editId ? item : e))
        : [...list, item];
      setList(nextList);
      const res = await apiClient.updateCandidateProfile({ education: JSON.stringify(nextList) });
      if (res.success) router.back();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editId ? 'Edit education' : 'Add education'}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.subtitle}>
            List your education, including degrees, institutions, and key achievements.
          </Text>

          <Text style={styles.label}>Level of education</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter level of education"
            placeholderTextColor={APP_COLORS.textMuted}
            value={level}
            onChangeText={setLevel}
          />

          <Text style={styles.label}>Field of study</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter field of study"
            placeholderTextColor={APP_COLORS.textMuted}
            value={fieldOfStudy}
            onChangeText={setFieldOfStudy}
          />

          <Text style={styles.label}>School or training provider</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter school name"
            placeholderTextColor={APP_COLORS.textMuted}
            value={school}
            onChangeText={setSchool}
          />

          <Text style={styles.label}>Country</Text>
          <TouchableOpacity style={styles.inputRow} onPress={() => setCountryDropdownOpen(true)} activeOpacity={0.85}>
            <Text style={styles.inputText}>{country || 'Select country'}</Text>
            <Ionicons name="chevron-down" size={20} color={APP_COLORS.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>City, State</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter city or state name"
            placeholderTextColor={APP_COLORS.textMuted}
            value={cityState}
            onChangeText={setCityState}
          />

          <Text style={styles.label}>Time Period</Text>
          <TouchableOpacity style={styles.checkRow} onPress={() => setCurrentlyEnrolled((c) => !c)} activeOpacity={0.85}>
            <View style={[styles.checkbox, currentlyEnrolled && styles.checkboxChecked]}>
              {currentlyEnrolled ? <Ionicons name="checkmark" size={16} color={APP_COLORS.white} /> : null}
            </View>
            <Text style={styles.checkLabel}>I am currently enrolled</Text>
          </TouchableOpacity>

          <Text style={styles.labelSmall}>From</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.inputRow, styles.half]} onPress={() => setFromMonthOpen(true)} activeOpacity={0.85}>
              <Text style={styles.inputText}>{fromMonth || 'Month'}</Text>
              <Ionicons name="chevron-down" size={18} color={APP_COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inputRow, styles.half]} onPress={() => setFromYearOpen(true)} activeOpacity={0.85}>
              <Text style={styles.inputText}>{fromYear || 'Year'}</Text>
              <Ionicons name="chevron-down" size={18} color={APP_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.labelSmall}>To</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.inputRow, styles.half]} onPress={() => setToMonthOpen(true)} activeOpacity={0.85} disabled={currentlyEnrolled}>
              <Text style={[styles.inputText, currentlyEnrolled && styles.inputTextMuted]}>{currentlyEnrolled ? '—' : (toMonth || 'Month')}</Text>
              <Ionicons name="chevron-down" size={18} color={APP_COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inputRow, styles.half]} onPress={() => setToYearOpen(true)} activeOpacity={0.85} disabled={currentlyEnrolled}>
              <Text style={[styles.inputText, currentlyEnrolled && styles.inputTextMuted]}>{currentlyEnrolled ? '—' : (toYear || 'Year')}</Text>
              <Ionicons name="chevron-down" size={18} color={APP_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Optional details..."
            placeholderTextColor={APP_COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {countryDropdownOpen && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setCountryDropdownOpen(false)} activeOpacity={1}>
          <View style={styles.dropdownCard}>
            {['USA', 'Canada', 'UK', 'India', 'Other'].map((c) => (
              <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setCountry(c); setCountryDropdownOpen(false); }} activeOpacity={0.7}>
                <Text style={styles.dropdownItemText}>{c}</Text>
                {country === c ? <Ionicons name="checkmark" size={20} color={APP_COLORS.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      {fromMonthOpen && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFromMonthOpen(false)} activeOpacity={1}>
          <View style={styles.dropdownCard}>
            {MONTHS.map((m) => (
              <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => { setFromMonth(m); setFromMonthOpen(false); }} activeOpacity={0.7}>
                <Text style={styles.dropdownItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
      {fromYearOpen && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFromYearOpen(false)} activeOpacity={1}>
          <View style={[styles.dropdownCard, { maxHeight: 300 }]}>
            {YEARS.map((y) => (
              <TouchableOpacity key={y} style={styles.dropdownItem} onPress={() => { setFromYear(y); setFromYearOpen(false); }} activeOpacity={0.7}>
                <Text style={styles.dropdownItemText}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
      {toMonthOpen && !currentlyEnrolled && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setToMonthOpen(false)} activeOpacity={1}>
          <View style={styles.dropdownCard}>
            {MONTHS.map((m) => (
              <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => { setToMonth(m); setToMonthOpen(false); }} activeOpacity={0.7}>
                <Text style={styles.dropdownItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
      {toYearOpen && !currentlyEnrolled && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setToYearOpen(false)} activeOpacity={1}>
          <View style={[styles.dropdownCard, { maxHeight: 300 }]}>
            {YEARS.map((y) => (
              <TouchableOpacity key={y} style={styles.dropdownItem} onPress={() => { setToYear(y); setToYearOpen(false); }} activeOpacity={0.7}>
                <Text style={styles.dropdownItemText}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  backBtn: { padding: 4, minWidth: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.textPrimary },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: APP_SPACING.screenPadding, paddingTop: 16 },
  subtitle: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  labelSmall: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8, marginTop: 4 },
  inputField: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputText: { fontSize: 16, color: APP_COLORS.textPrimary, flex: 1 },
  inputTextMuted: { color: APP_COLORS.textMuted },
  half: { flex: 1 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  checkLabel: { fontSize: 16, color: APP_COLORS.textPrimary },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  dropdownCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 120,
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 8,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 16, color: APP_COLORS.textPrimary },
});
