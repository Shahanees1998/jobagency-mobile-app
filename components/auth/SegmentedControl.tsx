import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPO } from '@/constants/authTheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export type SegmentOption = 'candidate' | 'employer';

interface SegmentedControlProps {
  value: SegmentOption;
  onChange: (value: SegmentOption) => void;
  style?: ViewStyle;
}

const LABELS: Record<SegmentOption, string> = {
  candidate: "I'm a Candidate",
  employer: "I'm an Employer",
};

export function SegmentedControl({ value, onChange, style }: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.segment, styles.segmentLeft, value === 'candidate' && styles.segmentActive]}
        onPress={() => onChange('candidate')}
        activeOpacity={0.85}
      >
        <Text
          style={[styles.label, value === 'candidate' && styles.labelActive]}
          numberOfLines={1}
        >
          {LABELS.candidate}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, styles.segmentRight, value === 'employer' && styles.segmentActive]}
        onPress={() => onChange('employer')}
        activeOpacity={0.85}
      >
        <Text
          style={[styles.label, value === 'employer' && styles.labelActive]}
          numberOfLines={1}
        >
          {LABELS.employer}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AUTH_COLORS.inputBg,
    borderRadius: AUTH_SPACING.inputBorderRadius,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentLeft: {},
  segmentRight: {},
  segmentActive: {
    backgroundColor: AUTH_COLORS.primary,
  },
  label: {
    fontSize: AUTH_TYPO.bodySmall,
    fontWeight: '500',
    color: AUTH_COLORS.textSecondary,
  },
  labelActive: {
    color: AUTH_COLORS.white,
    fontWeight: '600',
  },
});
