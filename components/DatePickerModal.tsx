import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;
const IS_PORTRAIT = SCREEN_HEIGHT > SCREEN_WIDTH;
const IS_LANDSCAPE = !IS_PORTRAIT;

interface DatePickerModalProps {
  visible: boolean;
  mode: 'start' | 'end';
  selectedDate: Date;
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

export function DatePickerModal({
  visible,
  mode,
  selectedDate,
  onClose,
  onConfirm,
  colors = {}
}: DatePickerModalProps) {
  const {
    primary = '#007AFF',
    cardBackground = '#FFFFFF',
    divider = '#E5E5E5',
    text = '#000000',
    textSecondary = '#8E8E93',
  } = colors;

  // Initialize state directly - avoid useEffect delay
  const [selectedYear, setSelectedYear] = useState<number>(() => selectedDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => selectedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(() => selectedDate.getDate());

  // Reset state when modal opens with new date
  useEffect(() => {
    setSelectedYear(selectedDate.getFullYear());
    setSelectedMonth(selectedDate.getMonth());
    setSelectedDay(selectedDate.getDate());
  }, [visible]);

  // Use useMemo to avoid recalculating on every render
  const { years: yearOptions, months: monthOptions, days: dayOptions } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearList = Array.from({ length: 6 }, (_, i) => currentYear - i);
    
    const monthList = [
      { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
      { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
      { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
      { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
    ];
    
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dayList = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return { years: yearList, months: monthList, days: dayList };
  }, [selectedYear, selectedMonth]);

  const handleConfirm = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const day = Math.min(selectedDay, daysInMonth);
    const newDate = new Date(selectedYear, selectedMonth, day);
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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: divider }]}>
            <Text style={[styles.title, { color: text }]}>
              Select {mode === 'start' ? 'Start' : 'End'} Date
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={text} />
            </TouchableOpacity>
          </View>

          {/* Selected Date Preview */}
          <View style={styles.preview}>
            <Text style={[styles.previewText, { color: textSecondary }]}>
              {monthOptions[selectedMonth]?.label || 'January'} {selectedDay}, {selectedYear}
            </Text>
          </View>

          {/* Pickers */}
          <View style={[
            styles.pickerRow, 
            IS_TABLET && styles.pickerRowTablet, 
            !IS_TABLET && IS_PORTRAIT && styles.pickerRowPortrait,
            IS_LANDSCAPE && styles.pickerRowLandscape
          ]}>
            {/* Month Picker */}
            <View style={[
              styles.pickerColumn, 
              IS_TABLET && styles.pickerColumnTablet, 
              !IS_TABLET && IS_PORTRAIT && styles.pickerColumnPortrait,
              IS_LANDSCAPE && styles.pickerColumnLandscape
            ]}>
              <View style={[styles.pickerLabelContainer, { backgroundColor: primary + '12' }]}>
                <Text style={[styles.pickerLabel, { color: primary }]}>Month</Text>
              </View>
              <ScrollView 
                style={[styles.pickerScroll, !IS_TABLET && IS_PORTRAIT && styles.pickerScrollPortrait, IS_LANDSCAPE && styles.pickerScrollLandscape]} 
                showsVerticalScrollIndicator={true}
                snapToInterval={44}
                decelerationRate="fast"
              >
                {monthOptions.map((month: { value: number; label: string }) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[
                      styles.pickerItem,
                      selectedMonth === month.value && { backgroundColor: primary + '20' }
                    ]}
                    onPress={() => setSelectedMonth(month.value)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: selectedMonth === month.value ? primary : text }
                    ]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Day Picker */}
            <View style={[
              styles.pickerColumn, 
              IS_TABLET && styles.pickerColumnTablet, 
              !IS_TABLET && IS_PORTRAIT && styles.pickerColumnPortrait,
              IS_LANDSCAPE && styles.pickerColumnLandscape
            ]}>
              <View style={[styles.pickerLabelContainer, { backgroundColor: primary + '12' }]}>
                <Text style={[styles.pickerLabel, { color: primary }]}>Day</Text>
              </View>
              <ScrollView 
                style={[styles.pickerScroll, !IS_TABLET && IS_PORTRAIT && styles.pickerScrollPortrait, IS_LANDSCAPE && styles.pickerScrollLandscape]} 
                showsVerticalScrollIndicator={true}
                snapToInterval={44}
                decelerationRate="fast"
              >
                {dayOptions.map((day: number) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && { backgroundColor: primary + '20' }
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: selectedDay === day ? primary : text }
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Year Picker */}
            <View style={[
              styles.pickerColumn, 
              IS_TABLET && styles.pickerColumnTablet, 
              !IS_TABLET && IS_PORTRAIT && styles.pickerColumnPortrait,
              IS_LANDSCAPE && styles.pickerColumnLandscape
            ]}>
              <View style={[styles.pickerLabelContainer, { backgroundColor: primary + '12' }]}>
                <Text style={[styles.pickerLabel, { color: primary }]}>Year</Text>
              </View>
              <ScrollView 
                style={[styles.pickerScroll, !IS_TABLET && IS_PORTRAIT && styles.pickerScrollPortrait, IS_LANDSCAPE && styles.pickerScrollLandscape]} 
                showsVerticalScrollIndicator={true}
                snapToInterval={44}
                decelerationRate="fast"
              >
                {yearOptions.map((year: number) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && { backgroundColor: primary + '20' }
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: selectedYear === year ? primary : text }
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttons, IS_TABLET && styles.buttonsTablet]}>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  pickerRowPortrait: {
    flexDirection: 'column',
    paddingHorizontal: 24,
    gap: 12,
  },
  pickerRowLandscape: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 16,
  },
  pickerRowTablet: {
    paddingHorizontal: 40,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerColumnTablet: {
    flex: 1,
  },
  pickerColumnPortrait: {
    flex: undefined,
    width: '100%',
  },
  pickerColumnLandscape: {
    flex: 1,
    minWidth: 150,
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
    marginBottom: 8,
  },
  pickerScroll: {
    height: 200,
  },
  pickerScrollPortrait: {
    height: 150,
  },
  pickerScrollLandscape: {
    height: 180,
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
  buttonsTablet: {
    paddingHorizontal: 60,
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
