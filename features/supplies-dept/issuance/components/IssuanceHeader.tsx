/**
 * Supplies Issuance Header Form
 */

import { DatePickerModal } from '@/components/DatePickerModal';
import { TimePickerModal } from '@/components/TimePickerModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarcodeScanner } from '@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { DropdownOption, IssuanceService } from '../services/issuanceService';

type IssuanceMode = 'manual' | 'realtime';

interface IssuanceFormData {
  referenceNo: string;
  miNo: string;
  issuanceMode: IssuanceMode;
  dateIssued: Date;
  shift: string;
  timeRequest: Date;
  timeIssued: Date;
  transactionType: string;
  issuanceType: string;
  contactPerson: string;
  issuedBy: string;
  approvedBy: string;
  deptCode: string;
  area: string;
  project: string;
  poNo: string;
  workOrderNo: string;
  otherDocNo: string;
}

interface IssuanceHeaderProps {
  onSubmit?: (data: IssuanceFormData) => void;
}

export interface IssuanceHeaderRef {
  submit: () => void;
}

const ISSUANCE_MODE_OPTIONS: DropdownOption[] = [
  { label: 'Realtime Issuance', value: 'realtime' },
  { label: 'Manual Issuance', value: 'manual' },
];

const SHIFT_OPTIONS: DropdownOption[] = [
  { label: '1st Shift', value: '1st Shift' },
  { label: '2nd Shift', value: '2nd Shift' },
];

const ISSUANCE_TYPE_OPTIONS: DropdownOption[] = [
  { label: 'General Used', value: 'General Used' },
  { label: 'Preventive Maintenance', value: 'Preventive Maintenance' },
  { label: 'Project/CAPEX', value: 'Project/CAPEX' },
  { label: 'Regular Repairs and Maintenance', value: 'Regular Repairs and Maintenance' },
  { label: 'Service Vehicle', value: 'Service Vehicle' },
];

const AREA_OPTIONS: DropdownOption[] = [
  { label: 'Warehouse A', value: 'Warehouse A' },
  { label: 'Warehouse B', value: 'Warehouse B' },
  { label: 'Production Floor', value: 'Production Floor' },
  { label: 'Maintenance', value: 'Maintenance' },
];

const PROJECT_OPTIONS: DropdownOption[] = [
  { label: 'Project Alpha', value: 'Project Alpha' },
  { label: 'Project Beta', value: 'Project Beta' },
  { label: 'General Operations', value: 'General Operations' },
];

const formatDate = (date: Date) =>
  date.toISOString().split('T')[0];

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const IssuanceHeader = forwardRef<IssuanceHeaderRef, IssuanceHeaderProps>(
  ({ onSubmit }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [formData, setFormData] = useState<IssuanceFormData>({
      referenceNo: '',
      miNo: '',
      issuanceMode: 'realtime',
      dateIssued: new Date(),
      shift: '',
      timeRequest: new Date(),
      timeIssued: new Date(),
      transactionType: '',
      issuanceType: '',
      contactPerson: '',
      issuedBy: user?.NAME || user?.USERNAME || '',
      approvedBy: '',
      deptCode: '',
      area: '',
      project: '',
      poNo: '',
      workOrderNo: '',
      otherDocNo: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [scannerTarget, setScannerTarget] = useState<
      'contactPerson' | 'approvedBy' | null
    >(null);
    const [transactionTypeOptions, setTransactionTypeOptions] = useState<DropdownOption[]>([]);

    useEffect(() => {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          issuedBy: user.NAME || user.USERNAME || prev.issuedBy,
        }));
      }
    }, [user]);

    const updateField = (field: keyof IssuanceFormData, value: string | Date) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

    const handleScan = async (data: string) => {
      if (scannerTarget === 'contactPerson') {
        updateField('contactPerson', data);
      } else if (scannerTarget === 'approvedBy') {
        updateField('approvedBy', data);
        try {
          const deptCode = await IssuanceService.getInstance().getDeptCodeByScannedApprover(data, user?.COMPANY);
          if (deptCode) {
            updateField('deptCode', deptCode);
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch department code for the scanned approver.');
        }
      }
      setScannerTarget(null);
    };

    const nextReferenceNumber = async () => {
      try {
        const referenceNo = await IssuanceService.getInstance().getNextReferenceNumber(user?.COMPANY);
        if (referenceNo) {
          updateField('referenceNo', referenceNo);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch next reference number.');
      }
    };

    useEffect(() => {
      nextReferenceNumber();
    }, []);

    const getTransactionType = async () => {
      try {
        const types = await IssuanceService.getInstance().getTransactionTypes(user?.COMPANY);
        setTransactionTypeOptions(types);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch transaction type.');
      }
    };

    useEffect(() => {
      getTransactionType();
    }, []);

    const handleSubmit = () => {
      const required: { field: keyof IssuanceFormData; label: string }[] = [
        { field: 'referenceNo', label: 'Reference No.' },
        { field: 'shift', label: 'Shift' },
        { field: 'transactionType', label: 'Transaction Type' },
        { field: 'issuanceType', label: 'Issuance Type' },
        { field: 'contactPerson', label: 'Contact Person' },
        { field: 'approvedBy', label: 'Approved By' },
        { field: 'area', label: 'Area' },
        { field: 'project', label: 'Project' },
      ];

      const newErrors: Record<string, string> = {};
      const missing: string[] = [];
      required.forEach(({ field, label }) => {
        const value = formData[field];
        const isEmpty =
          typeof value === 'string' ? value.trim() === '' : value == null;
        if (isEmpty) {
          newErrors[field] = `${label} is required`;
          missing.push(label);
        }
      });

      setErrors(newErrors);

      if (missing.length > 0) {
        Alert.alert(
          'Required Fields',
          `Please complete the following: ${missing.join(', ')}.`
        );
        return;
      }

      Alert.alert('Success', 'Supplies issuance submitted successfully.', [
        {
          text: 'OK',
          onPress: () => onSubmit?.(formData),
        },
      ]);
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Supplies Issuance
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Fill in the details below to create a new issuance.
          </Text>

          {/* Issuance Mode */}
          <RadioGroup
            label="Issuance Mode"
            required
            options={ISSUANCE_MODE_OPTIONS}
            value={formData.issuanceMode}
            onSelect={(v) => updateField('issuanceMode', v as IssuanceMode)}
            colors={colors}
          />

          {/* Reference */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <FormInput
                label="Reference No."
                required
                value={formData.referenceNo}
                placeholder="Enter reference no."
                onChangeText={(t) => updateField('referenceNo', t)}
                error={errors.referenceNo}
                colors={colors}
              />
            </View>
            <View style={styles.halfWidth}>
              <Dropdown
                label="Shift"
                required
                placeholder="Select shift"
                value={formData.shift}
                options={SHIFT_OPTIONS}
                onSelect={(v) => updateField('shift', v)}
                error={errors.shift}
                colors={colors}
              />
            </View>
          </View>

          {/* Date Issued & Shift */}
          {formData.issuanceMode === 'manual' && (
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <DateTimeField
                  label="Date Issued"
                  required
                  mode="date"
                  value={formData.dateIssued}
                  onChange={(d) => updateField('dateIssued', d)}
                  colors={colors}
                />
              </View>
              <View style={styles.halfWidth}>
                <DateTimeField
                  label="Time Request"
                  mode="time"
                  value={formData.timeRequest}
                  onChange={(d) => updateField('timeRequest', d)}
                  colors={colors}
                />
              </View>
              <View style={styles.halfWidth}>
                <DateTimeField
                  label="Time Issued"
                  mode="time"
                  value={formData.timeIssued}
                  onChange={(d) => updateField('timeIssued', d)}
                  colors={colors}
                />
              </View>
            </View>
          )}

          {/* Transaction Type & Issuance Type */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Dropdown
                label="Transaction Type"
                required
                placeholder="Select type"
                value={formData.transactionType}
                options={transactionTypeOptions}
                onSelect={(v) => updateField('transactionType', v)}
                error={errors.transactionType}
                colors={colors}
              />
            </View>
            <View style={styles.halfWidth}>
              <Dropdown
                label="Issuance Type"
                required
                placeholder="Select type"
                value={formData.issuanceType}
                options={ISSUANCE_TYPE_OPTIONS}
                onSelect={(v) => updateField('issuanceType', v)}
                error={errors.issuanceType}
                colors={colors}
              />
            </View>
          </View>
          <View style={styles.row}>
            {/* Contact Person (scanner) */}
            <View style={styles.halfWidth}>
              <ScannerField
                label="Contact Person"
                required
                value={formData.contactPerson}
                onScanPress={() => setScannerTarget('contactPerson')}
                error={errors.contactPerson}
                colors={colors}
              />
            </View>

            {/* Issued By (auto) */}
            <View style={styles.halfWidth}>
              <ReadOnlyField
                label="Issued By"
                value={formData.issuedBy}
                icon="account-arrow-right"
                colors={colors}
              />
            </View>
          </View>

          <View style={styles.row}>
            {/* Approved By (scanner) */}
            <View style={styles.halfWidth}>
              <ScannerField
                label="Approved By"
                required
                value={formData.approvedBy}
                onScanPress={() => setScannerTarget('approvedBy')}
                error={errors.approvedBy}
                colors={colors}
              />
            </View>

            {/* Department (auto) */}
            <View style={styles.halfWidth}>
              <ReadOnlyField
                label="Department"
                value={formData.deptCode}
                icon="office-building"
                colors={colors}
              />
            </View>
          </View>

          {/* Area & Project */}
          <View style={styles.halfWidth}>
            <Dropdown
              label="Area"
              required
              placeholder="Select area"
              value={formData.area}
              options={AREA_OPTIONS}
              onSelect={(v) => updateField('area', v)}
              error={errors.area}
              colors={colors}
            />

            <Dropdown
              label="Project"
              required
              placeholder="Select project"
              value={formData.project}
              options={PROJECT_OPTIONS}
              onSelect={(v) => updateField('project', v)}
              error={errors.project}
              colors={colors}
            />
          </View>
        </View>

        {/* Barcode Scanner */}
        <BarcodeScanner
          visible={scannerTarget !== null}
          onClose={() => setScannerTarget(null)}
          onScan={handleScan}
          title={
            scannerTarget === 'approvedBy'
              ? 'Scan Approved By Badge'
              : 'Scan Contact Person Badge'
          }
          validateForkliftOperator={false}
        />
      </>
    );
  }
);

IssuanceHeader.displayName = 'IssuanceHeader';

interface FieldBaseProps {
  label: string;
  required?: boolean;
  colors: typeof Colors.light;
}

function FormInput({
  label,
  required,
  value,
  placeholder,
  onChangeText,
  error,
  colors,
}: FieldBaseProps & {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.error : colors.cardBorder,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onChangeText={onChangeText}
        />
      </View>
      {error ? <ErrorText message={error} colors={colors} /> : null}
    </View>
  );
}

function RadioGroup({
  label,
  required,
  options,
  value,
  onSelect,
  colors,
}: FieldBaseProps & {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <View style={styles.radioRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioOption,
                {
                  borderColor: selected ? colors.primary : colors.cardBorder,
                  backgroundColor: selected
                    ? colors.primary + '14'
                    : colors.background,
                },
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: selected ? colors.primary : colors.textTertiary,
                  },
                ]}
              >
                {selected && (
                  <View
                    style={[styles.radioInner, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  { color: selected ? colors.primary : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Dropdown({
  label,
  required,
  placeholder,
  value,
  options,
  onSelect,
  error,
  colors,
}: FieldBaseProps & {
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);
  const selected = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setOpen(false);
  };

  const toggle = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height + 4,
          left: pageX,
          width: width,
        });
      });
    }
    setOpen((prev) => !prev);
  };

  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <View ref={triggerRef}>
        <TouchableOpacity
          style={[
            styles.inputContainer,
            styles.dropdownContainer,
            {
              borderColor: error
                ? colors.error
                : open
                  ? colors.primary
                  : colors.cardBorder,
              backgroundColor: colors.background,
            },
          ]}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: selected ? colors.text : colors.textTertiary },
            ]}
          >
            {selected ? selected.label : placeholder}
          </Text>
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              menuPosition,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownOption}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: colors.text }]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {error ? <ErrorText message={error} colors={colors} /> : null}
    </View>
  );
}

function DateTimeField({
  label,
  required,
  mode,
  value,
  onChange,
  colors,
}: FieldBaseProps & {
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [show, setShow] = useState(false);
  const display = mode === 'date' ? formatDate(value) : formatTime(value);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.inputGroup}>
        <FieldLabel label={label} required={required} colors={colors} />
        <View
          style={[
            styles.inputContainer,
            { borderColor: colors.cardBorder, backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            {display}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TouchableOpacity
        style={[
          styles.inputContainer,
          styles.dropdownContainer,
          { borderColor: colors.cardBorder, backgroundColor: colors.background },
        ]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={mode === 'date' ? 'calendar-blank' : 'clock-outline'}
          size={20}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <Text style={[styles.dropdownText, { color: colors.text }]}>
          {display}
        </Text>
      </TouchableOpacity>

      {mode === 'date' ? (
        <DatePickerModal
          visible={show}
          mode="start"
          selectedDate={value}
          onClose={() => setShow(false)}
          onConfirm={(date) => onChange(date)}
          colors={{
            primary: colors.primary,
            cardBackground: colors.cardBackground,
            divider: colors.divider,
            text: colors.text,
            textSecondary: colors.textSecondary,
          }}
        />
      ) : (
        <TimePickerModal
          visible={show}
          selectedTime={value}
          onClose={() => setShow(false)}
          onConfirm={(date) => onChange(date)}
          colors={{
            primary: colors.primary,
            cardBackground: colors.cardBackground,
            divider: colors.divider,
            text: colors.text,
            textSecondary: colors.textSecondary,
          }}
        />
      )}
    </View>
  );
}

function ScannerField({
  label,
  required,
  value,
  onScanPress,
  error,
  colors,
}: FieldBaseProps & {
  value: string;
  onScanPress: () => void;
  error?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <View
        style={[
          styles.inputContainer,
          styles.dropdownContainer,
          {
            borderColor: error ? colors.error : colors.cardBorder,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text
          style={[
            styles.dropdownText,
            { color: value ? colors.text : colors.textTertiary },
            styles.flex1,
          ]}
          numberOfLines={1}
        >
          {value || 'Tap to scan barcode'}
        </Text>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={onScanPress}
        >
          <MaterialCommunityIcons name="barcode-scan" size={18} color="#fff" />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      {error ? <ErrorText message={error} colors={colors} /> : null}
    </View>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
  colors,
}: FieldBaseProps & {
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} colors={colors} />
      <View
        style={[
          styles.inputContainer,
          { borderColor: colors.cardBorder, backgroundColor: colors.cardBackground },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <Text style={[styles.dropdownText, { color: colors.text }]} numberOfLines={1}>
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

function FieldLabel({
  label,
  required,
  colors,
}: {
  label: string;
  required?: boolean;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {required && <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>}
    </View>
  );
}

function ErrorText({
  message,
  colors,
}: {
  message: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  requiredStar: {
    fontSize: 16,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dropdownContainer: {
    justifyContent: 'space-between',
  },
  dropdown: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  flex1: {
    flex: 1,
  },
  
  dropdownScrollView: {
    maxHeight: 220,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  radioOuter: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  halfWidth: {
    flex: 1,
  },
});
