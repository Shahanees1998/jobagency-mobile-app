import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function LogoutModal({ visible, onClose, onConfirm, loading }: LogoutModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Logout</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.message}>Sure you want to log out?</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>
                {loading ? 'Logging out...' : 'Yes, logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: APP_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: APP_COLORS.primary,
    textAlign: 'center',
    marginBottom: 0,
  },
  titleUnderline: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -APP_SPACING.screenPadding,
    marginTop: 16,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.textPrimary,
  },
  confirmButton: {
    flex: 1,
    height: 52,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.white,
  },
});
