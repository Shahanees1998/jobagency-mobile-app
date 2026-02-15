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

type IconName = keyof typeof Ionicons.glyphMap;

interface InfoPopupProps {
  visible: boolean;
  onClose: () => void;
  icon: IconName;
  title: string;
  message: string;
  children?: React.ReactNode;
  buttonText: string;
  onButtonPress?: () => void;
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  primaryVariant?: 'primary' | 'danger';
  iconBgColor?: string;
}

export function InfoPopup({
  visible,
  onClose,
  icon,
  title,
  message,
  children,
  buttonText,
  onButtonPress,
  secondaryButton,
  primaryVariant = 'primary',
  iconBgColor,
}: InfoPopupProps) {
  const handlePrimaryPress = () => {
    (onButtonPress || onClose)();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
            <Ionicons name={icon} size={32} color="#000" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {children}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                primaryVariant === 'danger' ? styles.buttonDanger : styles.buttonPrimary
              ]}
              onPress={handlePrimaryPress}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>

            {secondaryButton && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={secondaryButton.onPress}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>{secondaryButton.text}</Text>
              </TouchableOpacity>
            )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#72A4BF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E4154',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Kanit',
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Kanit',
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '300',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#1E4154',
  },
  buttonDanger: {
    backgroundColor: '#CA4040', // Red for withdraw
  },
  buttonSecondary: {
    backgroundColor: '#1E3A49', // Dark teal for keep
  },
  buttonText: {
    fontFamily: 'Kanit',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
