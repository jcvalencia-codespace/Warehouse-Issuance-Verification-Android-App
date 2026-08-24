import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, useColorScheme } from 'react-native';

interface MaterialUtilizationDetailModalProps {
  visible: boolean;
  record: any | null;
  onClose: () => void;
}

export const MaterialUtilizationDetailModal: React.FC<MaterialUtilizationDetailModalProps> = ({
  visible,
  record,
  onClose,
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const formatDateDisplay = (dateValue: string | Date): string => {
    if (!dateValue) return '—';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!record) return null;

  const details = [
    { label: 'Usage No', value: `PMU-${record.USAGENO || '—'}` },
    { label: 'Machine Line', value: record.MACHINELINENO || '—' },
    { label: 'Shift', value: record.SHIFT || '—' },
    { label: 'Feed Type', value: record.FEEDTYPE || '—' },
    { label: 'Variant', value: record.VARIANTCODE || '—' },
    { label: 'Formulation No', value: record.FORMULATIONNO || '—' },
    { label: 'Batch No', value: record.BATCHNO || '—' },
    { label: 'Date', value: formatDateDisplay(record.USAGEDATE) },
    { label: 'Created By', value: record.CREATEDBY || '—' },
  ];

  const message = details.map((d) => `${d.label}: ${d.value}`).join('\n');

  return (
    <ConfirmModal
      visible={visible}
      title="Record Details"
      message={message}
      iconName="eye-outline"
      iconColor={colors.primary}
      cancelText="Close"
      confirmText="OK"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
};
