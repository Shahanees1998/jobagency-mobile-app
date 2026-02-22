import { PrimaryButton } from '@/components/auth';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  reviewerName?: string;
}

function formatReviewDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

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
  isEmployer,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  isEmployer?: boolean;
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
          <Text style={styles.sheetMessage}>
            {isEmployer
              ? 'Remove this review from your company page?'
              : 'Sure you want to delete your review?'}
          </Text>
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

function ViewReviewModal({
  visible,
  onClose,
  review,
}: {
  visible: boolean;
  onClose: () => void;
  review: ReviewItem | null;
}) {
  const insets = useSafeAreaInsets();
  if (!review) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.bottomOverlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, styles.viewSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Review</Text>
          <View style={styles.viewReviewMeta}>
            <Text style={styles.viewReviewName}>{review.reviewerName || 'Reviewer'}</Text>
            <Text style={styles.viewReviewDate}>On {review.date}</Text>
            <View style={styles.viewReviewStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= review.rating ? 'star' : 'star-outline'}
                  size={20}
                  color={i <= review.rating ? '#FBBF24' : '#D1D5DB'}
                />
              ))}
            </View>
          </View>
          <Text style={styles.viewReviewTitle}>{review.title}</Text>
          <ScrollView style={styles.viewReviewScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.viewReviewBody}>{review.description}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.viewReviewCloseBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.viewReviewCloseText}>Close</Text>
          </TouchableOpacity>
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
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const isEmployer = user?.role === 'EMPLOYER';
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      if (isEmployer) {
        const profileRes = await apiClient.getEmployerProfile();
        const employerId = (profileRes.success && profileRes.data) ? ((profileRes.data as any).id ?? (profileRes.data as any).employerId) : '';
        if (!employerId) {
          setReviews([]);
          return;
        }
        if (__DEV__) console.log('[my-reviews] employer getEmployerReviews employerId:', employerId);
        const res = await apiClient.getEmployerReviews(employerId);
        if (__DEV__) console.log('[my-reviews] getEmployerReviews response:', { success: res.success, reviewCount: res.data?.reviews?.length ?? 0 });
        if (res.success && res.data?.reviews) {
          const list = (res.data.reviews as any[]).map((r: any) => ({
            id: r.id,
            companyName: res.data?.companyName || 'Company',
            date: r.date ? formatReviewDate(r.date) : (r.createdAt ? formatReviewDate(r.createdAt) : ''),
            rating: r.rating ?? 0,
            title: r.title ?? '',
            description: r.description ?? '',
            reviewerName: r.reviewerName ?? r.candidateName ?? r.authorName ?? undefined,
          }));
          setReviews(list);
        } else {
          setReviews([]);
        }
      } else if (!isEmployer) {
        const res = await apiClient.getMyReviews();
        if (res.success && res.data?.reviews) {
          const list = res.data.reviews.map((r: any) => ({
            id: r.id,
            companyName: r.companyName || 'Company',
            date: r.date ? formatReviewDate(r.date) : (r.createdAt ? formatReviewDate(r.createdAt) : ''),
            rating: r.rating ?? 0,
            title: r.title ?? '',
            description: r.description ?? '',
          }));
          setReviews(list);
        } else {
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [isEmployer]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
      const res = await apiClient.updateReview(selectedReview.id, { rating, title, description });
      if (res.success) {
        await loadReviews();
        setEditModalVisible(false);
        setSelectedReview(null);
        showDialog({ title: 'Success', message: 'Review updated.', primaryButton: { text: 'OK' } });
      } else {
        showDialog({ title: 'Error', message: res.error ?? 'Failed to update review', primaryButton: { text: 'OK' } });
      }
    } catch {
      showDialog({ title: 'Error', message: 'Failed to update review', primaryButton: { text: 'OK' } });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    setDeleting(true);
    try {
      const res = isEmployer
        ? await apiClient.deleteEmployerReview(selectedReview.id)
        : await apiClient.deleteReview(selectedReview.id);
      if (res.success) {
        await loadReviews();
        setDeleteModalVisible(false);
        setSelectedReview(null);
        showDialog({ title: 'Success', message: isEmployer ? 'Review removed.' : 'Review deleted.', primaryButton: { text: 'OK' } });
      } else {
        showDialog({ title: 'Error', message: res.error ?? 'Failed to delete review', primaryButton: { text: 'OK' } });
      }
    } catch {
      showDialog({ title: 'Error', message: 'Failed to delete review', primaryButton: { text: 'OK' } });
    } finally {
      setDeleting(false);
    }
  };

  const openView = (review: ReviewItem) => {
    setSelectedReview(review);
    setViewModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <CustomHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color={APP_COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              {isEmployer
                ? 'Reviews from candidates about your company will appear here.'
                : 'Reviews you write for companies will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            {reviews.map((review) => (
              <View key={review.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {(review.reviewerName || review.companyName).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.companyName}>
                      {isEmployer ? (review.reviewerName || 'Reviewer') : review.companyName}
                    </Text>
                    <Text style={styles.dateRating}>
                      On {review.date} • {review.rating}{' '}
                      <Ionicons name="star" size={14} color={APP_COLORS.textPrimary} />
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  {isEmployer ? (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openView(review)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-outline" size={18} color={APP_COLORS.white} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEdit(review)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil" size={15} color={APP_COLORS.white} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => openDelete(review)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={15} color={APP_COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
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
        isEmployer={isEmployer}
      />

      <ViewReviewModal
        visible={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 0, paddingTop: 16, paddingBottom: 32 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: APP_COLORS.textMuted,
    textAlign: 'center',
  },
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
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
    marginBottom: 4,
  },
  dateRating: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
  },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 35,
    height: 35,
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
  viewSheet: { maxHeight: '85%' },
  viewReviewMeta: { marginBottom: 12 },
  viewReviewName: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 4 },
  viewReviewDate: { fontSize: 14, color: APP_COLORS.textMuted, marginBottom: 8 },
  viewReviewStars: { flexDirection: 'row', gap: 4 },
  viewReviewTitle: { fontSize: 16, fontWeight: '600', color: APP_COLORS.textPrimary, marginBottom: 8 },
  viewReviewScroll: { maxHeight: 200, marginBottom: 16 },
  viewReviewBody: { fontSize: 15, color: APP_COLORS.textSecondary, lineHeight: 22 },
  viewReviewCloseBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 14,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewReviewCloseText: { fontSize: 16, fontWeight: '600', color: APP_COLORS.white },
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
