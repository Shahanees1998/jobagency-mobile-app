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
      {/* Title and action buttons in one row */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onEdit?.(); }}
            hitSlop={8}
            style={styles.iconBtnEdit}
          >
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onDelete?.(); }}
            hitSlop={8}
            style={styles.iconBtnDelete}
          >
            <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Row: Logo and Company Info */}
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
    borderRadius: 5,
    padding: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Kanit',
    fontSize: 15,
    fontWeight: '800',
    color: '#031019',
    flex: 1,
    marginRight: 8,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoAndInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#031019',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  companyInfo: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontFamily: 'Kanit',
    fontSize: 12,
    color: '#031019',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtnEdit: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4154',
    borderRadius: 50,
  },
  iconBtnDelete: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 50,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  tagText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
});
