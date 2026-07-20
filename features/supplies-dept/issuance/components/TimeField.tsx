/**
 * Reusable Time Field with a bottom-sheet time picker.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TimePickerModal } from '@/components/TimePickerModal';

interface FieldBaseProps {
  label: string;
  required?: boolean;
  colors: {
    primary: string;
    cardBackground: string;
    divider: string;
    text: string;
    textSecondary: string;
    cardBorder: string;
    textTertiary: string;
    background: string;
  };
}

interface TimeFieldProps extends FieldBaseProps {
  value: Date;
  onChange: (date: Date) => void;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export function TimeField({ label, required, value, onChange, colors }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const manualTimeRef = useRef<Date>(value);

  useEffect(() => {
    if (manual) return;
    const id = setInterval(() => onChange(new Date()), 1000);
    return () => clearInterval(id);
  }, [manual, onChange]);

  const displayTime = manual ? manualTimeRef.current : new Date();
  const pickerTime = manual ? manualTimeRef.current : value;

  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {required && <Text style={[styles.requiredStar, { color: colors.textSecondary }]}>*</Text>}
      </View>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          styles.dropdownContainer,
          { borderColor: colors.cardBorder, backgroundColor: colors.background },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={20}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <Text style={[styles.dropdownText, { color: colors.text }]}>
          {formatTime(displayTime)}
        </Text>
      </TouchableOpacity>

      <TimePickerModal
        visible={open}
        selectedTime={pickerTime}
        onClose={() => setOpen(false)}
        onConfirm={(date) => {
          manualTimeRef.current = date;
          setManual(true);
          onChange(date);
        }}
        colors={{
          primary: colors.primary,
          cardBackground: colors.cardBackground,
          divider: colors.divider,
          text: colors.text,
          textSecondary: colors.textSecondary,
        }}
      />
    </View>
  );
}

const styles = {
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  requiredStar: {
    fontSize: 16,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  dropdownContainer: {
    justifyContent: 'space-between' as const,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
};
