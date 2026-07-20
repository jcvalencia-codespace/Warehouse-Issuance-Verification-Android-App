/**
 * Supplies Issuance Header Form
 */

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarcodeScanner } from '@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { DropdownOption, IssuanceService } from '../services/issuanceService';
import { ValidPersonnel } from '../types/issuance.types';
import { CustomDatePicker } from './CustomDatePicker';
import { TimeField } from './TimeField';

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
  onValidSubmit?: (data: IssuanceFormData) => void;
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

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseLocalDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const IssuanceHeader = forwardRef<IssuanceHeaderRef, IssuanceHeaderProps>(
  ({ onSubmit, onValidSubmit }, ref) => {
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
    const [areaOptions, setAreaOptions] = useState<DropdownOption[]>([]);
    const [projectOptions, setProjectOptions] = useState<DropdownOption[]>([]);
    const [projectNameOptions, setProjectNameOptions] = useState<DropdownOption[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);
    const [departmentOptions, setDepartmentOptions] = useState<DropdownOption[]>([]);
    const [isDeptFromScan, setIsDeptFromScan] = useState(false);
    const [validPersonnel, setValidPersonnel] = useState<ValidPersonnel[]>([]);

    useEffect(() => {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          issuedBy: user.NAME || user.USERNAME || prev.issuedBy,
        }));
      }
    }, [user]);

    useEffect(() => {
      if (formData.issuanceMode === 'realtime') {
        const now = new Date();
        setFormData((prev) => ({
          ...prev,
          dateIssued: now,
          timeRequest: now,
          timeIssued: now,
        }));
      }
    }, [formData.issuanceMode]);

    useEffect(() => {
      if (formData.dateIssued && formData.timeIssued) {
        const dateOnly = new Date(formData.dateIssued);
        dateOnly.setHours(0, 0, 0, 0);
        const synced = new Date(dateOnly);
        synced.setHours(
          formData.timeIssued.getHours(),
          formData.timeIssued.getMinutes(),
          formData.timeIssued.getSeconds(),
          formData.timeIssued.getMilliseconds()
        );
        if (synced.getTime() !== formData.dateIssued.getTime()) {
          updateField('dateIssued', synced);
        }
      }
    }, [formData.timeIssued]);

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
      const scanned = data.trim();
      const isPersonnelValid = validPersonnel.some(
        (p) => p.NAME.trim().toLowerCase() === scanned.toLowerCase()
      );

      if (scannerTarget === 'contactPerson') {
        if (isPersonnelValid) {
          updateField('contactPerson', scanned);
          setErrors((prev) => {
            if (!prev.contactPerson) return prev;
            const next = { ...prev };
            delete next.contactPerson;
            return next;
          });
        } else {
          Alert.alert('Invalid Contact Person', `Scanned code "${data}" is not a valid personnel.`);
        }
        setScannerTarget(null);
      } else if (scannerTarget === 'approvedBy') {
        if (!isPersonnelValid) {
          Alert.alert('Invalid Approver', `Scanned code "${data}" is not a valid personnel.`);
          setScannerTarget(null);
          return;
        }
        try {
          const deptCode = await IssuanceService.getInstance().getDeptCodeByScannedApprover(data, user?.COMPANY);
          if (deptCode) {
            const trimmedApprover = scanned;
            const trimmed = deptCode.trim();
            updateField('approvedBy', trimmedApprover);
            setErrors((prev) => {
              if (!prev.approvedBy) return prev;
              const next = { ...prev };
              delete next.approvedBy;
              return next;
            });
            setDepartmentOptions((prev) => {
              if (prev.some((o) => o.value === trimmed)) return prev;
              return [...prev, { label: trimmed, value: trimmed }];
            });
            setIsDeptFromScan(true);
            updateField('deptCode', trimmed);
          } else {
            Alert.alert('Invalid Approver', `Scanned code "${data}" is not a valid approver.`);
          }
        } catch (error) {
          Alert.alert('Invalid Approver', `Scanned code "${data}" is not a valid approver.`);
        }
        setScannerTarget(null);
      }
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

    const getDepartmentOption = async () => {
      try {
        const departments = await IssuanceService.getInstance().getDepartmentOption(user?.COMPANY);
        if (departments && departments.length > 0) {
          const seen = new Set<string>();
          const unique = departments
            .map((dept) => dept.trim())
            .filter((dept) => {
              if (!dept || seen.has(dept)) return false;
              seen.add(dept);
              return true;
            });
          setDepartmentOptions(
            unique.map((dept) => ({
              label: dept,
              value: dept,
            }))
          );
        } else {
          setDepartmentOptions([]);
        }
      } catch (error) {
        setDepartmentOptions([]);
      }
    };

    useEffect(() => {
      getDepartmentOption();
    }, []);

    const getValidPersonnel = async () => {
      try {
        const personnel = await IssuanceService.getInstance().getValidPersonnel();
        setValidPersonnel(personnel);
      } catch (error) {
        setValidPersonnel([]);
      }
    };

    useEffect(() => {
      getValidPersonnel();
    }, []);

    const getAreaOptions = async (department: string) => {
      if (!department) {
        setAreaOptions([]);
        return;
      }
      try {
        const areas = await IssuanceService.getInstance().getAreaOption(department, user?.COMPANY);
        setAreaOptions(
          areas.map((item) => ({
            label: item.AREA.trim(),
            value: item.AREA.trim(),
          }))
        );
      } catch (error) {
        setAreaOptions([]);
      }
    };

    useEffect(() => {
      getAreaOptions(formData.deptCode);
      if (!formData.deptCode) {
        updateField('area', '');
      }
    }, [formData.deptCode]);

    const getProjectOptions = async (department: string, area: string) => {
      if (!department || !area) {
        setProjectOptions([]);
        return;
      }
      try {
        const projects = await IssuanceService.getInstance().getProjectNameOption(department, area, user?.COMPANY);
        setProjectOptions(
          projects.map((item) => ({
            label: item.PROJECTNAME.trim(),
            value: item.PROJECTNAME.trim(),
          }))
        );
      } catch (error) {
        setProjectOptions([]);
      }
    };

    useEffect(() => {
      getProjectOptions(formData.deptCode, formData.area);
      if (!formData.area) {
        updateField('project', '');
      }
    }, [formData.deptCode, formData.area]);

    const getProjectNameOption = async (department: string, area: string) => {
      if(!department) {
        setProjectNameOptions([]);
        return;
      }
      try{
        const projectNames = await IssuanceService.getInstance().getProjectNameOption(department, area, user?.COMPANY);
        setProjectNameOptions(
          projectNames.map((item) => ({
            label: item.PROJECTNAME.trim(),
            value: item.PROJECTNAME.trim(),
          }))
        );
      } catch (error) {
        setProjectNameOptions([]);
      }
    }

    useEffect(() => {
      getProjectNameOption(formData.deptCode, formData.area);
    }, [formData.deptCode, formData.area]);

    const handleSubmit = () => {
      const required: { field: keyof IssuanceFormData; label: string }[] = [
        { field: 'shift', label: 'Shift' },
        { field: 'transactionType', label: 'Transaction Type' },
        { field: 'issuanceType', label: 'Issuance Type' },
        { field: 'contactPerson', label: 'Contact Person' },
        { field: 'approvedBy', label: 'Approved By' },
        { field: 'deptCode', label: 'Department' },
        { field: 'area', label: 'Area' },
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

      onValidSubmit?.(formData);
      onSubmit?.(formData);
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
              <ReadOnlyField
                label="Reference No."
                value={formData.referenceNo}
                icon="identifier"
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
                  value={formData.dateIssued}
                  onPress={() => {
                    setTempDate(formData.dateIssued || new Date());
                    setShowDatePicker(true);
                  }}
                  colors={colors}
                />
              </View>
              <View style={styles.halfWidth}>
                <TimeField
                  label="Time Request"
                  value={formData.timeRequest}
                  onChange={(d) => updateField('timeRequest', d)}
                  colors={colors}
                />
              </View>
              <View style={styles.halfWidth}>
                <TimeField
                  label="Time Issued"
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

            {/* Department (selectable) */}
            <View style={styles.halfWidth}>
              <Dropdown
                label="Department"
                required
                placeholder="Select department"
                value={formData.deptCode}
                options={departmentOptions}
                onSelect={(v) => {
                  setIsDeptFromScan(false);
                  updateField('deptCode', v);
                }}
                error={errors.deptCode}
                colors={colors}
              />
            </View>
          </View>

          {/* Area & Project */}
          <View style={styles.halfWidth}>
              <Dropdown
                label="Area"
                required
                placeholder={formData.deptCode ? "Select area" : "Select department first"}
                value={formData.area}
                options={areaOptions}
                onSelect={(v) => updateField('area', v)}
                error={errors.area}
                colors={colors}
              />

            <Dropdown
              label="Project"
              placeholder={formData.area ? "Select project" : "Select area first"}
              value={formData.project}
              options={projectOptions}
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

        {/* Custom Date Picker Modal for Date Issued */}
        <CustomDatePicker
          visible={showDatePicker}
          initialDate={formData.dateIssued}
          onDateSelect={async (date) => {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            try {
              const posted = await IssuanceService.getInstance().isMonthPosted(
                month,
                year,
                user?.COMPANY
              );
              if (posted) {
                Alert.alert(
                  'Month Already Posted',
                  `The selected month (${month}/${year}) has already been posted and cannot be used.`
                );
                setTempDate(null);
                return;
              }
            } catch (error) {
              // Allow selection if the check fails (network/backend issue)
            }
            updateField('dateIssued', date);
            setTempDate(null);
            setShowDatePicker(false);
          }}
          onCancel={() => {
            setTempDate(null);
            setShowDatePicker(false);
          }}
          colors={colors}
          maximumDate={new Date()}
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
  searchable = true,
}: FieldBaseProps & {
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState('');
  const triggerRef = useRef<View>(null);
  const selected = options.find((o) => o.value === value);

  const filteredOptions = search.trim() === ''
    ? options
    : options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase())
      );

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setOpen(false);
    setSearch('');
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
    setSearch('');
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
            {searchable && (
              <View style={[styles.dropdownSearchContainer, { borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dropdownSearchInput, { color: colors.text }]}
                  placeholder="Search..."
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
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
                ))
              ) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={[styles.dropdownOptionText, { color: colors.textSecondary }]}>
                    No results found
                  </Text>
                </View>
              )}
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
  value,
  onPress,
  colors,
  placeholder,
}: FieldBaseProps & {
  value: Date;
  onPress?: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TouchableOpacity
        style={[
          styles.inputContainer,
          styles.dropdownContainer,
          { borderColor: colors.cardBorder, backgroundColor: colors.background },
        ]}
        onPress={onPress ?? (() => {})}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="calendar-blank"
          size={20}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <Text style={[styles.dropdownText, { color: colors.text }]}>
          {formatLocalDate(value)}
        </Text>
      </TouchableOpacity>
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
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dropdownEmpty: {
    paddingHorizontal: 18,
    paddingVertical: 16,
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
