import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  autoCloseDelay?: number;
  onDone: () => void;
}

export function SuccessModal({
  visible,
  title,
  message,
  buttonText = 'Done',
  autoCloseDelay,
  onDone,
}: SuccessModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  useEffect(() => {
    if (!visible || !autoCloseDelay) {
      return;
    }
    const timer = setTimeout(() => {
      onDone();
    }, autoCloseDelay);
    return () => clearTimeout(timer);
  }, [visible, autoCloseDelay, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.successCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View
            style={[
              styles.successIconWrapper,
              { backgroundColor: '#22C55E14' },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={40} color="#22C55E" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <TouchableOpacity
            style={[styles.successButton, { backgroundColor: '#22C55E' }]}
            onPress={onDone}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  successCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
