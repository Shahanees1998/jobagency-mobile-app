import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewItem {
  id: string;
  companyName: string;
  date: string;
  rating: number;
  title: string;
  description: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange?.(i)}
          style={styles.starBtn}
          activeOpacity={0.85}
          disabled={!onChange}
        >
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={32}
            color={i <= value ? '#FBBF24' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WriteReviewModal({
  visible,
  onClose,
  onSubmit,
  companyName,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, title: string, description: string) => void;
  companyName: string;
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setRating(5);
    setTitle('');
    setDescription('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Rate & review</Text>
          <Text style={styles.sheetSubTitle} numberOfLines={1}>{companyName}</Text>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Tap to rate</Text>
            <Stars value={rating} onChange={setRating} />

            <Text style={styles.fieldLabel}>Review title</Text>
            <TextInput
              style={styles.input}
              placeholder="Good experience & fun environment"
              placeholderTextColor={APP_COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Give a review</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share what you liked, what could improve, and any advice for others."
              placeholderTextColor={APP_COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, !title.trim() && { opacity: 0.6 }]}
              onPress={() => onSubmit(rating, title.trim(), description.trim())}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Submit review</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CompanyReviewsScreen() {
  const { employerId = '' } = useLocalSearchParams<{ employerId?: string }>();

  // Backend reviews are not implemented yet; show a clean UI with mock data for now.
  const companyName = useMemo(() => 'Company', [employerId]);

  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: '1',
      companyName: 'Company',
      date: 'January 28, 2026',
      rating: 4,
      title: 'Good experience & fun environment',
      description:
        'Supportive and growth-oriented environment with a strong focus on quality and innovation.',
    },
    {
      id: '2',
      companyName: 'Company',
      date: 'January 12, 2026',
      rating: 5,
      title: 'Great team and leadership',
      description:
        'Friendly culture, fast learning, and good mentorship. Work-life balance could be improved slightly.',
    },
  ]);

  const [writeVisible, setWriteVisible] = useState(false);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  const submitReview = (rating: number, title: string, description: string) => {
    const next: ReviewItem = {
      id: String(Date.now()),
      companyName,
      date: new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }),
      rating,
      title,
      description,
    };
    setReviews((prev) => [next, ...prev]);
    setWriteVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{(companyName || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
              <Text style={styles.summarySub}>{reviews.length} reviews</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.avgText}>{average.toFixed(1)}</Text>
            <Stars value={Math.round(average)} />
          </View>
        </View>

        <TouchableOpacity style={styles.writeBtn} onPress={() => setWriteVisible(true)} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={18} color={APP_COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.writeBtnText}>Write a review</Text>
        </TouchableOpacity>

        {reviews.map((review) => (
          <View key={review.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{review.title}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.cardRatingText}>{review.rating}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>On {review.date}</Text>
            <Text style={styles.cardDesc}>{review.description}</Text>
          </View>
        ))}
      </ScrollView>

      <WriteReviewModal
        visible={writeVisible}
        onClose={() => setWriteVisible(false)}
        onSubmit={submitReview}
        companyName={companyName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },

  summaryCard: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadiusLg,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: APP_SPACING.itemPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: { fontSize: 20, fontWeight: '800', color: APP_COLORS.white },
  companyName: { fontSize: 16, fontWeight: '800', color: APP_COLORS.textPrimary, marginBottom: 4 },
  summarySub: { fontSize: 13, color: APP_COLORS.textMuted, fontWeight: '600' },
  summaryRight: { alignItems: 'flex-end', marginLeft: 10 },
  avgText: { fontSize: 22, fontWeight: '900', color: APP_COLORS.textPrimary, marginBottom: 2 },

  starsRow: { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 2 },

  writeBtn: {
    height: 52,
    borderRadius: APP_SPACING.borderRadius,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  writeBtnText: { fontSize: 16, fontWeight: '700', color: APP_COLORS.white },

  card: {
    backgroundColor: APP_COLORS.background,
    borderRadius: APP_SPACING.borderRadiusLg,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '800', color: APP_COLORS.textPrimary, marginRight: 10 },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: APP_COLORS.surfaceGray,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardRatingText: { fontSize: 13, fontWeight: '800', color: APP_COLORS.textPrimary },
  cardMeta: { fontSize: 12, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    maxHeight: '85%',
  },
  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: { paddingBottom: 16 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSubTitle: { textAlign: 'center', fontSize: 14, color: APP_COLORS.textMuted, fontWeight: '600', marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: APP_COLORS.textPrimary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: APP_COLORS.white },
});

