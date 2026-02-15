import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface JobCardProps {
  title: string;
  companyName: string;
  location: string;
  benefits?: string[];
  companyLogoLetter?: string;
  saved?: boolean;
  showRemoveIcon?: boolean;
  hideDislike?: boolean;
  hideBookmark?: boolean;
  footerButton?: {
    text: string;
    onPress: () => void;
  };
  onPress?: () => void;
  onBookmark?: () => void;
  onDislike?: () => void;
  style?: ViewStyle;
}

export function JobCard({
  title,
  companyName,
  location,
  benefits = [],
  companyLogoLetter,
  saved,
  showRemoveIcon,
  hideDislike,
  hideBookmark,
  footerButton,
  onPress,
  onBookmark,
  onDislike,
  style,
}: JobCardProps) {
  const letter = (companyLogoLetter || companyName?.charAt(0) || '?').toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top Row: Title and Bookmark */}
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!hideBookmark && (
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onBookmark?.(); }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons
              name={showRemoveIcon ? "remove-circle-outline" : (saved ? "bookmark" : "bookmark-outline")}
              size={22}
              color="#031019"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Middle Row: Logo, Company Info, and Dislike */}
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
        {!hideDislike && (
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onDislike?.(); }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="thumbs-down-outline" size={22} color="#031019" />
          </TouchableOpacity>
        )}
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

      {/* Footer Button (Interview Tab) */}
      {footerButton && (
        <TouchableOpacity
          style={styles.footerButton}
          onPress={(e) => { e?.stopPropagation?.(); footerButton.onPress(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.footerButtonText}>{footerButton.text}</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#031019',
    flex: 1,
    marginRight: 8,
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
    borderRadius: 6,
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
  iconBtn: {
    padding: 2,
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
  footerButton: {
    backgroundColor: '#1E4154',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  footerButtonText: {
    fontFamily: 'Kanit',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
