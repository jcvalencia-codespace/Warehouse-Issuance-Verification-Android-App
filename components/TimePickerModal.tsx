import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  colors?: {
    primary?: string;
    cardBackground?: string;
    divider?: string;
    text?: string;
    textSecondary?: string;
  };
}

export function TimePickerModal({
  visible,
  selectedTime,
  onClose,
  onConfirm,
  colors = {},
}: TimePickerModalProps) {
  const {
    primary = '#007AFF',
    cardBackground = '#FFFFFF',
    divider = '#E5E5E5',
    text = '#000000',
    textSecondary = '#8E8E93',
  } = colors;

  const [selectedHour, setSelectedHour] = useState<number>(() => selectedTime.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(() => selectedTime.getMinutes());

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const ITEM_HEIGHT = 44;
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const centerOffset = (200 - ITEM_HEIGHT) / 2;
    hourScrollRef.current?.scrollTo({ y: selectedHour * ITEM_HEIGHT - centerOffset, animated: false });
    minuteScrollRef.current?.scrollTo({ y: selectedMinute * ITEM_HEIGHT - centerOffset, animated: false });
  }, [visible, selectedHour, selectedMinute]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleConfirm = () => {
    const newDate = new Date(selectedTime);
    newDate.setHours(selectedHour, selectedMinute, 0, 0);
    onConfirm(newDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <SafeAreaView style={[styles.container, { backgroundColor: cardBackground }]} edges={['bottom']}>
          <Pressable
            style={[styles.content, { backgroundColor: cardBackground }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.header, { borderBottomColor: divider }]}>
              <Text style={[styles.title, { color: text }]}>Select Time</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={text} />
              </TouchableOpacity>
            </View>

            <View style={styles.preview}>
              <Text style={[styles.previewText, { color: textSecondary }]}>
                {pad(selectedHour)}:{pad(selectedMinute)}
              </Text>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <View style={[styles.pickerLabelContainer, { backgroundColor: primary + '12' }]}>
                  <Text style={[styles.pickerLabel, { color: primary }]}>Hour</Text>
                </View>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        selectedHour === hour && { backgroundColor: primary + '20' },
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedHour === hour ? primary : text },
                        ]}
                      >
                        {pad(hour)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <View style={[styles.pickerLabelContainer, { backgroundColor: primary + '12' }]}>
                  <Text style={[styles.pickerLabel, { color: primary }]}>Minute</Text>
                </View>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator
                  snapToInterval={44}
                  decelerationRate="fast"
                >
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        selectedMinute === minute && { backgroundColor: primary + '20' },
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedMinute === minute ? primary : text },
                        ]}
                      >
                        {pad(minute)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: divider }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: primary }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  preview: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabelContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerScroll: {
    height: 200,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
