import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  iconName: string;
  iconColor: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  iconName,
  iconColor,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const handleCancelPress = () => {
    onCancel();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelPress}
        >
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: iconColor + '14' },
              ]}
            >
              <MaterialCommunityIcons name={iconName as any} size={28} color={iconColor} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              {message}
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmCancel,
                  { borderColor: colors.cardBorder, backgroundColor: colors.background },
                ]}
                onPress={handleCancelPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmit, { backgroundColor: iconColor }]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmSubmitText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmSubmit: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});