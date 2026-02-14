import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface EmployerJobCardProps {
  title: string;
  companyName: string;
  location: string;
  benefits?: string[];
  companyLogoLetter?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export function EmployerJobCard({
  title,
  companyName,
  location,
  benefits = [],
  companyLogoLetter,
  onPress,
  onEdit,
  onDelete,
  style,
}: EmployerJobCardProps) {
  const letter = (companyLogoLetter || companyName?.charAt(0) || '?').toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onEdit?.(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
          >
            <Ionicons name="pencil-outline" size={22} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onDelete?.(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.iconBtn}
          >
            <Ionicons name="trash-outline" size={22} color={APP_COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.companyRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{letter}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
          <Text style={styles.location} numberOfLines={1}>{location}</Text>
        </View>
      </View>
      {benefits.length > 0 && (
        <View style={styles.tags}>
          {benefits.slice(0, 6).map((b, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: APP_SPACING.borderRadiusLg,
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: APP_COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  companyInfo: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 15,
    color: APP_COLORS.textPrimary,
    fontWeight: '500',
  },
  location: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: APP_COLORS.surfaceGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
    maxWidth: 120,
  },
});
