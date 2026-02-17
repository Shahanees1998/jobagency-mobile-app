import { PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useDialog } from '@/contexts/DialogContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewItem {
  id: string;
  companyName: string;
  date: string;
  rating: number;
  title: string;
  description: string;
}

const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: '1',
    companyName: 'Zoox Pvt. Ltd.',
    date: 'January 28, 2026',
    rating: 4,
    title: 'Good experience & fun environment',
    description:
      'This company offers a supportive and growth-oriented work environment with a strong focus on innovation and quality.',
  },
  {
    id: '2',
    companyName: 'BA House Cleaning',
    date: 'January 28, 2026',
    rating: 4,
    title: 'Good experience & fun environment',
    description:
      'This company offers a supportive and growth-oriented work environment with a strong focus on innovation and quality.',
  },
];

function CustomHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.customHeader, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My reviews</Text>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

function DeleteReviewModal({
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.bottomOverlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Delete review</Text>
          <Text style={styles.sheetMessage}>Sure you want to delete your review?</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteConfirmButton}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>{loading ? 'Deleting...' : 'Yes, Delete'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditReviewModal({
  visible,
  onClose,
  onSubmit,
  review,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, title: string, description: string) => void;
  review: ReviewItem | null;
  loading?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [title, setTitle] = useState(review?.title ?? '');
  const [description, setDescription] = useState(review?.description ?? '');

  React.useEffect(() => {
    if (review) {
      setRating(review.rating);
      setTitle(review.title);
      setDescription(review.description);
    } else {
      setRating(5);
      setTitle('');
      setDescription('');
    }
  }, [review, visible]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(rating, title.trim(), description.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.editSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Rate & review</Text>

          <ScrollView
            style={styles.editSheetScroll}
            contentContainerStyle={styles.editSheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Tap to rate</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  style={styles.starBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={i <= rating ? '#FBBF24' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Review Title</Text>
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
              placeholder="This company offers a supportive and growth-oriented work environment with a strong focus on innovation and quality."
              placeholderTextColor={APP_COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                title="Update review"
                onPress={handleSubmit}
                loading={loading}
                disabled={!title.trim()}
                showArrow={false}
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal >
  );
}

export default function MyReviewsScreen() {
  const { showDialog } = useDialog();
  const [reviews, setReviews] = useState<ReviewItem[]>(MOCK_REVIEWS);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (review: ReviewItem) => {
    setSelectedReview(review);
    setEditModalVisible(true);
  };

  const openDelete = (review: ReviewItem) => {
    setSelectedReview(review);
    setDeleteModalVisible(true);
  };

  const handleUpdate = async (rating: number, title: string, description: string) => {
    if (!selectedReview) return;
    setUpdating(true);
    try {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id ? { ...r, rating, title, description } : r
        )
      );
      setEditModalVisible(false);
      setSelectedReview(null);
      showDialog({ title: 'Success', message: 'Review updated.', primaryButton: { text: 'OK' } });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    setDeleting(true);
    try {
      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
      setDeleteModalVisible(false);
      setSelectedReview(null);
      showDialog({ title: 'Success', message: 'Review deleted.', primaryButton: { text: 'OK' } });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reviews.map((review) => (
          <View key={review.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {review.companyName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.companyName}>{review.companyName}</Text>
                <Text style={styles.dateRating}>
                  On {review.date} • {review.rating}{' '}
                  <Ionicons name="star" size={14} color={APP_COLORS.textPrimary} />
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEdit(review)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={18} color={APP_COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => openDelete(review)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color={APP_COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <EditReviewModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedReview(null);
        }}
        onSubmit={handleUpdate}
        review={selectedReview}
        loading={updating}
      />

      <DeleteReviewModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedReview(null);
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: APP_SPACING.screenPadding, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    padding: APP_SPACING.itemPadding,
    marginBottom: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: APP_COLORS.white },
  cardBody: { flex: 1 },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  dateRating: {
    fontSize: 13,
    color: APP_COLORS.textMuted,
  },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: APP_SPACING.screenPadding,
  },
  sheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  customHeader: {
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
  },
  editSheet: {
    width: '100%',
    backgroundColor: APP_COLORS.white,
    borderRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
    maxHeight: '80%',
  },
  editSheetScroll: { flexGrow: 0 },
  editSheetScrollContent: { paddingBottom: 16 },
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
    fontWeight: '700',
    color: APP_COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetMessage: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary },
  deleteConfirmButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.danger,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
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
    minHeight: 100,
    textAlignVertical: 'top',
  },

});
