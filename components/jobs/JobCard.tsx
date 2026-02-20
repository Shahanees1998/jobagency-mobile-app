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
  liked?: boolean;
  showRemoveIcon?: boolean;
  hideDislike?: boolean;
  hideBookmark?: boolean;
  hideLike?: boolean;
  /** Smaller font, padding, and icons (e.g. company profile carousel) */
  compact?: boolean;
  footerButton?: {
    text: string;
    onPress: () => void;
  };
  onPress?: () => void;
  onBookmark?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  style?: ViewStyle;
}

const iconSize = { default: 22, compact: 16 };
const iconSizeNum = (c: boolean) => (c ? iconSize.compact : iconSize.default);

export function JobCard({
  title,
  companyName,
  location,
  benefits = [],
  companyLogoLetter,
  saved,
  liked,
  showRemoveIcon,
  hideDislike,
  hideBookmark,
  hideLike,
  compact = false,
  footerButton,
  onPress,
  onBookmark,
  onLike,
  onDislike,
  style,
}: JobCardProps) {
  const letter = (companyLogoLetter || companyName?.charAt(0) || '?').toUpperCase();
  const iconSz = iconSizeNum(compact);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top Row: Title, Bookmark (save), Like */}
      <View style={[styles.topRow, compact && styles.topRowCompact]}>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.topRowIcons}>
          {!hideLike && onLike != null && (
            <TouchableOpacity
              onPress={(e) => { e?.stopPropagation?.(); onLike?.(); }}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={iconSz}
                color={liked ? '#DC2626' : '#031019'}
              />
            </TouchableOpacity>
          )}
          {!hideBookmark && (
            <TouchableOpacity
              onPress={(e) => { e?.stopPropagation?.(); onBookmark?.(); }}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <Ionicons
                name={showRemoveIcon ? "remove-circle-outline" : (saved ? "bookmark" : "bookmark-outline")}
                size={iconSz}
                color="#031019"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Middle Row: Logo, Company Info, and Dislike */}
      <View style={[styles.middleRow, compact && styles.middleRowCompact]}>
        <View style={styles.logoAndInfo}>
          <View style={[styles.logo, compact && styles.logoCompact]}>
            <Text style={[styles.logoText, compact && styles.logoTextCompact]}>{letter}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, compact && styles.companyNameCompact]} numberOfLines={1}>{companyName}</Text>
            <Text style={[styles.location, compact && styles.locationCompact]} numberOfLines={1}>{location}</Text>
          </View>
        </View>
        {!hideDislike && (
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onDislike?.(); }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="thumbs-down-outline" size={iconSz} color="#031019" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Row: Tags */}
      {benefits.length > 0 && (
        <View style={[styles.tags, compact && styles.tagsCompact]}>
          {benefits.slice(0, 6).map((b, i) => (
            <View key={i} style={[styles.tag, compact && styles.tagCompact]}>
              <Text style={[styles.tagText, compact && styles.tagTextCompact]} numberOfLines={1}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Button (Interview Tab) */}
      {footerButton && (
        <TouchableOpacity
          style={[styles.footerButton, compact && styles.footerButtonCompact]}
          onPress={(e) => { e?.stopPropagation?.(); footerButton.onPress(); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.footerButtonText, compact && styles.footerButtonTextCompact]}>{footerButton.text}</Text>
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
  cardCompact: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topRowCompact: { marginBottom: 8 },
  topRowIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#031019',
    flex: 1,
    marginRight: 8,
  },
  titleCompact: { fontSize: 14, marginRight: 4 },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  middleRowCompact: { marginBottom: 8 },
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
  logoCompact: {
    width: 36,
    height: 36,
    borderRadius: 5,
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  logoTextCompact: { fontSize: 14 },
  companyInfo: { flex: 1, minWidth: 0 },
  companyName: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '700',
    color: '#031019',
  },
  companyNameCompact: { fontSize: 12 },
  location: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  locationCompact: { fontSize: 11, marginTop: 1 },
  iconBtn: { padding: 2 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagsCompact: { gap: 4 },
  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  tagCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  tagTextCompact: { fontSize: 10 },
  footerButton: {
    backgroundColor: '#1E4154',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  footerButtonCompact: { height: 40, marginTop: 10, borderRadius: 20 },
  footerButtonText: {
    fontFamily: 'Kanit',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footerButtonTextCompact: { fontSize: 13 },
});
