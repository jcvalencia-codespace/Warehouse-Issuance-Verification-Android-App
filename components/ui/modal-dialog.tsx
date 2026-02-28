import { Colors } from '@/constants/theme';
import React from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const { width } = Dimensions.get('window');

export interface ModalDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  showCancelButton?: boolean;
}

const typeConfig = {
  success: {
    icon: '✓',
    light: '#10b981',
    dark: '#10b981',
  },
  error: {
    icon: '✕',
    light: '#ef4444',
    dark: '#ef4444',
  },
  warning: {
    icon: '!',
    light: '#f59e0b',
    dark: '#f59e0b',
  },
  info: {
    icon: 'ℹ',
    light: '#3b82f6',
    dark: '#3b82f6',
  },
};

export function ModalDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  isLoading = false,
  showCancelButton = true,
}: ModalDialogProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const config = typeConfig[type];
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;

  const borderColor = isDark
    ? `${config.dark}40`
    : `${config.light}30`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.centeredView}>
          <ThemedView
            style={[
              styles.modalView,
              {
                backgroundColor,
                borderColor,
              },
            ]}
          >
            {/* Icon Section */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.light },
              ]}
            >
              <ThemedText
                style={[
                  styles.icon,
                  { color: '#fff' },
                ]}
              >
                {config.icon}
              </ThemedText>
            </View>

            {/* Title */}
            <ThemedText
              type="title"
              style={[
                styles.title,
                { color: textColor },
              ]}
            >
              {title}
            </ThemedText>

            {/* Message */}
            <ThemedText
              style={[
                styles.message,
                { color: isDark ? Colors.dark.icon : Colors.light.icon },
              ]}
            >
              {message}
            </ThemedText>

            {/* Button Container */}
            <View style={styles.buttonContainer}>
              {showCancelButton && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      borderColor: isDark ? Colors.dark.icon : Colors.light.icon,
                      opacity: isLoading ? 0.6 : 1,
                    },
                  ]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <ThemedText
                    style={[
                      styles.cancelButtonText,
                      { color: isDark ? Colors.dark.text : Colors.light.text },
                    ]}
                  >
                    {cancelText}
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: config.light,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={onConfirm || onClose}
                disabled={isLoading}
              >
                <ThemedText
                  style={[
                    styles.confirmButtonText,
                    { color: '#fff' },
                  ]}
                >
                  {isLoading ? 'Loading...' : confirmText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalView: {
    width: Math.min(width - 40, 400),
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
  },
  iconContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    fontWeight: '600',
  },
  title: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
