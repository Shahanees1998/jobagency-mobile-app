import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface AppDialogButton {
  text: string;
  onPress: () => void;
  primary?: boolean;
}

export interface AppDialogProps {
  visible: boolean;
  onRequestClose?: () => void;
  title: string;
  message: string;
  /** Optional icon name (Ionicons) shown above title in a rounded box. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Primary CTA (e.g. "Go to Profile"). If primary: true, styled as primary button. */
  primaryButton: AppDialogButton;
  /** Optional secondary (e.g. "Cancel"). */
  secondaryButton?: AppDialogButton;
}

function AppDialogComponent({
  visible,
  onRequestClose,
  title,
  message,
  icon,
  primaryButton,
  secondaryButton,
}: AppDialogProps) {
  const handleClose = () => {
    onRequestClose?.();
    secondaryButton?.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onRequestClose ?? handleClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            {icon ? (
              <View style={styles.iconWrap}>
                <Ionicons name={icon} size={44} color={APP_COLORS.primary} />
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.actions}>
            {secondaryButton && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryButton.onPress}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, secondaryButton ? null : styles.primaryButtonFull]}
              onPress={primaryButton.onPress}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{primaryButton.text}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: APP_COLORS.white,
    borderRadius: APP_SPACING.borderRadiusLg,
    paddingHorizontal: APP_SPACING.screenPadding,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    marginBottom: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: APP_COLORS.surfaceGray,
    borderRadius: APP_SPACING.borderRadius + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.textPrimary,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: APP_COLORS.primary,
    borderRadius: APP_SPACING.borderRadius + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.white,
  },
});

export const AppDialog = AppDialogComponent;
export default AppDialog;
