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
      {/* Top Row: Title */}
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Middle Row: Logo, Company Info, and Actions */}
      <View style={styles.middleRow}>
        <View style={styles.logoAndInfo}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{letter}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onEdit?.(); }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="pencil-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onDelete?.(); }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Row: Tags */}
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
    backgroundColor: '#F2F7FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#031019',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoAndInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#031019',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  companyInfo: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '700',
    color: '#031019',
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});
