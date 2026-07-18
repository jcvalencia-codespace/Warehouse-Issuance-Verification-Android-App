/**
 * Custom Date Picker
 * A scroll-based year/month/day picker rendered in a modal (avoids native module issues).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomDatePickerProps {
  visible: boolean;
  initialDate: Date;
  onDateSelect: (date: Date) => void;
  onCancel: () => void;
  colors: any;
  maximumDate?: Date;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 54;

export function CustomDatePicker({
  visible,
  initialDate,
  onDateSelect,
  onCancel,
  colors,
  maximumDate,
}: CustomDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const years = [currentYear];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialDate.getMonth());
  const [selectedDayIndex, setSelectedDayIndex] = useState(initialDate.getDate() - 1);

  useEffect(() => {
    if (monthScrollRef.current) {
      monthScrollRef.current.scrollTo({ y: selectedMonthIndex * ITEM_HEIGHT, animated: false });
    }
    if (dayScrollRef.current) {
      dayScrollRef.current.scrollTo({ y: selectedDayIndex * ITEM_HEIGHT, animated: false });
    }
    // Only run on mount / when the picker becomes visible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const maxDayIndex = days.length - 1;
    const clampedDayIndex = Math.min(selectedDayIndex, maxDayIndex);
    if (clampedDayIndex !== selectedDayIndex) {
      setSelectedDayIndex(clampedDayIndex);
      const newDate = new Date(selectedDate);
      newDate.setDate(days[clampedDayIndex]);
      setSelectedDate(newDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  const handleMonthScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const selectedIndex = Math.round(scrollY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(selectedIndex, MONTHS.length - 1));
    if (clampedIndex !== selectedMonthIndex) {
      setSelectedMonthIndex(clampedIndex);
      const newDate = new Date(selectedDate);
      newDate.setMonth(clampedIndex);
      setSelectedDate(newDate);
    }
  };

  const handleDayScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const selectedIndex = Math.round(scrollY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(selectedIndex, days.length - 1));
    if (clampedIndex !== selectedDayIndex) {
      setSelectedDayIndex(clampedIndex);
      const newDate = new Date(selectedDate);
      newDate.setDate(days[clampedIndex]);
      setSelectedDate(newDate);
    }
  };

  const validateDate = (date: Date): string | null => {
    if (maximumDate && date > maximumDate) {
      return 'Date cannot be in the future';
    }
    return null;
  };

  const handleConfirm = () => {
    const error = validateDate(selectedDate);
    if (error) {
      setDateError(error);
    } else {
      setDateError(null);
      onDateSelect(selectedDate);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.datePickerContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.customDatePicker, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date</Text>

            <View style={styles.pickerRow}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                <View style={styles.pickerContainer}>
                  <View style={[styles.selectionWindow, { borderColor: colors.primary }]} />
                  <View style={[styles.pickerScrollSlot, { paddingTop: 73 }]}>
                    {years.map((year) => (
                      <View key={year} style={styles.pickerItem}>
                        <Text style={[styles.pickerItemText, { color: colors.primary, fontWeight: '700' }]}>
                          {year}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                <View style={styles.pickerContainer}>
                  <View style={[styles.selectionWindow, { borderColor: colors.primary }]} />
                  <ScrollView
                    ref={monthScrollRef}
                    style={styles.pickerScrollSlot}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    contentContainerStyle={styles.pickerScrollContent}
                    onMomentumScrollEnd={handleMonthScroll}
                    onScrollEndDrag={handleMonthScroll}
                    scrollEventThrottle={16}
                  >
                    {MONTHS.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={styles.pickerItem}
                        onPress={() => {
                          monthScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                        }}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          {
                            color: index === selectedMonthIndex ? colors.primary : colors.text,
                            fontWeight: index === selectedMonthIndex ? '700' : '500'
                          }
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Day</Text>
                <View style={styles.pickerContainer}>
                  <View style={[styles.selectionWindow, { borderColor: colors.primary }]} />
                  <ScrollView
                    ref={dayScrollRef}
                    style={styles.pickerScrollSlot}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    contentContainerStyle={styles.pickerScrollContent}
                    onMomentumScrollEnd={handleDayScroll}
                    onScrollEndDrag={handleDayScroll}
                    scrollEventThrottle={16}
                  >
                    {days.map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        style={styles.pickerItem}
                        onPress={() => {
                          dayScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
                        }}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          {
                            color: index === selectedDayIndex ? colors.primary : colors.text,
                            fontWeight: index === selectedDayIndex ? '700' : '500'
                          }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {dateError && (
              <View style={[styles.dateErrorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.dateErrorText, { color: colors.error }]}>{dateError}</Text>
              </View>
            )}

            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.cancelButton, { borderColor: colors.cardBorder }]}
                onPress={onCancel}
              >
                <Text style={[styles.datePickerButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  styles.confirmButton,
                  { backgroundColor: !validateDate(selectedDate) ? colors.primary : colors.textTertiary }
                ]}
                onPress={handleConfirm}
                disabled={!!validateDate(selectedDate)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  datePickerContainer: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 16,
    padding: 16,
  },
  customDatePicker: {
    borderRadius: 16,
    padding: 10,
    width: '100%',
    maxWidth: 600,
    maxHeight: '100%',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  pickerContainer: {
    position: 'relative',
    height: 200,
    width: 100,
  },
  selectionWindow: {
    position: 'absolute',
    top: 73,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    zIndex: 1,
    pointerEvents: 'none',
    borderRadius: 4,
  },
  pickerScrollSlot: {
    height: 200,
    width: 100,
  },
  pickerScrollContent: {
    paddingVertical: 73,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '500',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  datePickerButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  dateErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  dateErrorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
