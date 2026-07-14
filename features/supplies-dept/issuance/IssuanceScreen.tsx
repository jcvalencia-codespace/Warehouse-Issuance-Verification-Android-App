/**
 * Supplies Issuance Screen
 * Form for creating a new supplies issuance transaction.
 */

import { DatePickerModal } from '@/components/DatePickerModal';
import { TimePickerModal } from '@/components/TimePickerModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarcodeScanner } from '@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface DropdownOption {
  label: string;
  value: string;
}

interface IssuanceFormData {
  referenceNo: string;
  miNo: string;
  dateIssued: Date;
  shift: string;
  timeRequest: Date;
  timeIssued: Date;
  transactionType: string;
  issuanceType: string;
  contactPerson: string;
  issuedBy: string;
  approvedBy: string;
  department: string;
  area: string;
  project: string;
  poNo: string;
  workOrderNo: string;
  otherDocNo: string;
}

const SHIFT_OPTIONS: DropdownOption[] = [
  { label: '1st Shift', value: '1st Shift' },
  { label: '2nd Shift', value: '2nd Shift' },
];

const TRANSACTION_TYPE_OPTIONS: DropdownOption[] = [
  { label: 'Regular', value: 'Regular' },
  { label: 'Emergency', value: 'Emergency' },
  { label: 'Transfer', value: 'Transfer' },
  { label: 'Return', value: 'Return' },
];

const ISSUANCE_TYPE_OPTIONS: DropdownOption[] = [
  { label: 'Direct Issuance', value: 'Direct Issuance' },
  { label: 'Requisition', value: 'Requisition' },
  { label: 'Consignment', value: 'Consignment' },
  { label: 'Loan', value: 'Loan' },
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

interface IssuanceScreenProps {
  onCancel?: () => void;
  onSubmit?: (data: IssuanceFormData) => void;
}

export function IssuanceScreen({ onCancel, onSubmit }: IssuanceScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [formData, setFormData] = useState<IssuanceFormData>({
    referenceNo: '',
    miNo: '',
    dateIssued: new Date(),
    shift: '',
    timeRequest: new Date(),
    timeIssued: new Date(),
    transactionType: '',
    issuanceType: '',
    contactPerson: '',
    issuedBy: user?.NAME || user?.USERNAME || '',
    approvedBy: '',
    department: user?.DEPARTMENT || '',
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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        issuedBy: user.NAME || user.USERNAME || prev.issuedBy,
        department: user.DEPARTMENT || prev.department,
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

  const handleScan = (data: string) => {
    if (scannerTarget === 'contactPerson') {
      updateField('contactPerson', data);
    } else if (scannerTarget === 'approvedBy') {
      updateField('approvedBy', data);
    }
    setScannerTarget(null);
  };

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

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

            {/* Reference & MI */}
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
                <FormInput
                  label="M. I. No."
                  value={formData.miNo}
                  placeholder="Enter M.I. no."
                  onChangeText={(t) => updateField('miNo', t)}
                  colors={colors}
                />
              </View>
            </View>

            {/* Date Issued & Shift */}
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

            {/* Time Request & Time Issued */}
            <View style={styles.row}>
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

            {/* Transaction Type & Issuance Type */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Dropdown
                  label="Transaction Type"
                  required
                  placeholder="Select type"
                  value={formData.transactionType}
                  options={TRANSACTION_TYPE_OPTIONS}
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

            {/* Contact Person (scanner) */}
            <ScannerField
              label="Contact Person"
              required
              value={formData.contactPerson}
              onScanPress={() => setScannerTarget('contactPerson')}
              error={errors.contactPerson}
              colors={colors}
            />

            {/* Issued By (auto) */}
            <ReadOnlyField
              label="Issued By"
              value={formData.issuedBy}
              icon="account-arrow-right"
              colors={colors}
            />

            {/* Approved By (scanner) */}
            <ScannerField
              label="Approved By"
              required
              value={formData.approvedBy}
              onScanPress={() => setScannerTarget('approvedBy')}
              error={errors.approvedBy}
              colors={colors}
            />

            {/* Department (auto) */}
            <ReadOnlyField
              label="Department"
              value={formData.department}
              icon="office-building"
              colors={colors}
            />

            {/* Area & Project */}
            <View style={styles.row}>
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
              </View>
              <View style={styles.halfWidth}>
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

            {/* P.O. No., Work Order No., Other Doc No. */}
            <FormInput
              label="P.O. No."
              value={formData.poNo}
              placeholder="Enter P.O. number"
              onChangeText={(t) => updateField('poNo', t)}
              colors={colors}
            />
            <FormInput
              label="Work Order No."
              value={formData.workOrderNo}
              placeholder="Enter work order no."
              onChangeText={(t) => updateField('workOrderNo', t)}
              colors={colors}
            />
            <FormInput
              label="Other Doc No."
              value={formData.otherDocNo}
              placeholder="Enter other document no."
              onChangeText={(t) => updateField('otherDocNo', t)}
              colors={colors}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.cardBorder },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={onCancel}
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.text} />
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="send-check" size={20} color="#ffffff" />
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

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
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
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
        onPress={() => setOpen((o) => !o)}
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

      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
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
      )}

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
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
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
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  flex1: {
    flex: 1,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
  halfWidth: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1.3,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default IssuanceScreen;
