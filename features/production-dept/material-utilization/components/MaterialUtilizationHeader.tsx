import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { MaterialUtilizationService } from '../services/materialUtilizationService';
import {
  DropdownOption,
  FeedTypeVariantRow,
  MaterialUtilizationFormData,
  MaterialUtilizationHeaderRef,
} from '../types/materialUtilization.types';

export { MaterialUtilizationHeaderRef };

const SHIFT_OPTIONS = [
  { label: '1st Shift', value: '1st Shift' },
  { label: '2nd Shift', value: '2nd Shift' },
];

type FieldBaseProps = {
  label: string;
  required?: boolean;
  colors: typeof Colors.light;
};

type DropdownProps = FieldBaseProps & {
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
};

interface MaterialUtilizationHeaderProps {
  onValidSubmit?: (data: MaterialUtilizationFormData) => void;
  onFormulationChange?: (formulationNo: string) => void;
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
  disabled = false,
}: DropdownProps) {
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
    if (!disabled) {
      setOpen((prev) => !prev);
      setSearch('');
    }
  };

  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {required && <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>}
      </View>
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
              backgroundColor: disabled ? colors.cardBackground : colors.background,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
          onPress={toggle}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Text
            style={[
              styles.dropdownText,
              { color: selected ? colors.text : colors.textTertiary },
            ]}
            numberOfLines={1}
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

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const MaterialUtilizationHeader = forwardRef<MaterialUtilizationHeaderRef, MaterialUtilizationHeaderProps>(
  ({ onValidSubmit, onFormulationChange }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [formData, setFormData] = useState<MaterialUtilizationFormData>({
      usageDate: new Date().toISOString().split('T')[0],
      usageRefNo: '',
      machineLineName: '',
      shift: '',
      feedType: '',
      variant: '',
      formulationNo: '',
      batchNo: '',
      remarks: '',
      validatedBy: '',
      weighedBy: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [machineLineOptions, setMachineLineOptions] = useState<DropdownOption[]>([]);
    const [feedTypeOptions, setFeedTypeOptions] = useState<DropdownOption[]>([]);
    const [variantOptions, setVariantOptions] = useState<DropdownOption[]>([]);
    const [formulationOptions, setFormulationOptions] = useState<DropdownOption[]>([]);
    const [feedTypeVariantRows, setFeedTypeVariantRows] = useState<FeedTypeVariantRow[]>([]);

    const updateField = (field: keyof MaterialUtilizationFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

    const fetchMachineLines = useCallback(async () => {
      try {
        const options = await MaterialUtilizationService.getInstance().getMachineLines(user?.COMPANY);
        setMachineLineOptions(options);
      } catch (error) {
        console.error('Failed to fetch machine lines:', error);
      }
    }, [user?.COMPANY]);

    const fetchFeedTypesAndVariants = useCallback(async () => {
      try {
        const rows = await MaterialUtilizationService.getInstance().getFeedTypesAndVariant(user?.COMPANY);
        setFeedTypeVariantRows(rows);

        const uniqueFeedTypes = Array.from(
          new Map(rows.map((row) => [row.ITEMNMBR, row])).values()
        ).map((row) => ({
          label: row.ITEMDESC || row.ITEMNMBR,
          value: row.ITEMNMBR,
        }));
        setFeedTypeOptions(uniqueFeedTypes);
      } catch (error) {
        console.error('Failed to fetch feed types and variants:', error);
      }
    }, [user?.COMPANY]);

    const fetchFormulations = useCallback(async (feedType: string, variant: string) => {
      try {
        if (!feedType || !variant) {
          setFormulationOptions([]);
          return;
        }
        const options = await MaterialUtilizationService.getInstance().getFormulations(feedType, variant, user?.COMPANY);
        setFormulationOptions(options);
      } catch (error) {
        console.error('Failed to fetch formulations:', error);
        setFormulationOptions([]);
      }
    }, [user?.COMPANY]);

    useEffect(() => {
      fetchMachineLines();
      fetchFeedTypesAndVariants();
    }, [fetchMachineLines, fetchFeedTypesAndVariants]);

    useEffect(() => {
      if (formData.feedType && feedTypeVariantRows.length > 0) {
        const variantRows = feedTypeVariantRows.filter((row) => row.ITEMNMBR === formData.feedType);
        const uniqueVariants = Array.from(
          new Map(variantRows.map((row) => [row.VARIANTCODE, row])).values()
        ).map((row) => ({
          label: row.VARIANTCODE,
          value: row.VARIANTCODE,
        }));
        setVariantOptions(uniqueVariants);
      } else {
        setVariantOptions([]);
      }
    }, [formData.feedType, feedTypeVariantRows]);

    useEffect(() => {
      fetchFormulations(formData.feedType, formData.variant);
    }, [fetchFormulations, formData.feedType, formData.variant]);

    useEffect(() => {
      if (formData.formulationNo) {
        onFormulationChange?.(formData.formulationNo);
      }
    }, [formData.formulationNo, onFormulationChange]);

    useEffect(() => {
      const fetchNextRefNo = async () => {
        try {
          const refNos = await MaterialUtilizationService.getInstance().getNextUsageRefNo(user?.COMPANY);
          if (refNos && refNos.length > 0) {
            setFormData((prev) => ({ ...prev, usageRefNo: refNos[0] }));
          }
        } catch (error) {
          console.error('Failed to fetch next usage ref no:', error);
        }
      };
      fetchNextRefNo();
    }, [user?.COMPANY]);

    const handleSubmit = () => {
      const required: { field: keyof MaterialUtilizationFormData; label: string }[] = [
        { field: 'usageDate', label: 'Usage Date' },
        { field: 'usageRefNo', label: 'Usage Ref. No.' },
        { field: 'machineLineName', label: 'Machine Line Name' },
        { field: 'shift', label: 'Shift' },
        { field: 'feedType', label: 'Feed Type' },
        { field: 'variant', label: 'Variant' },
        { field: 'formulationNo', label: 'Formulation No.' },
        { field: 'batchNo', label: 'Batch No.' },
        { field: 'validatedBy', label: 'Validated By' },
        { field: 'weighedBy', label: 'Weighed By' },
      ];

      const newErrors: Record<string, string> = {};
      const missing: string[] = [];
      required.forEach(({ field, label }) => {
        const value = formData[field];
        if (typeof value === 'string' && value.trim() === '') {
          newErrors[field] = `${label} is required`;
          missing.push(label);
        }
      });

      setErrors(newErrors);

      if (missing.length > 0) {
        return;
      }

      onValidSubmit?.(formData);
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      clear: () => {
        setFormData({
          usageDate: new Date().toISOString().split('T')[0],
          usageRefNo: '',
          machineLineName: '',
          shift: '',
          feedType: '',
          variant: '',
          formulationNo: '',
          batchNo: '',
          remarks: '',
          validatedBy: '',
          weighedBy: '',
        });
        setErrors({});
      },
      refreshUsageRefNo: async () => {
        try {
          const refNos = await MaterialUtilizationService.getInstance().getNextUsageRefNo(user?.COMPANY);
          if (refNos && refNos.length > 0) {
            setFormData((prev) => ({ ...prev, usageRefNo: refNos[0] }));
          }
        } catch (error) {
          console.error('Failed to refresh usage ref no:', error);
        }
      },
      setField: (field: keyof MaterialUtilizationFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      },
      getField: (field: keyof MaterialUtilizationFormData) => {
        return formData[field];
      },
    }));

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Material Utilization
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.textSecondary }]}
            >
              Record material usage per machine line. Fill in the header details below.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Usage Date</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.usageDate ? colors.error : colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.usageDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={(text) => updateField('usageDate', text)}
                />
              </View>
              {errors.usageDate ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.usageDate}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Usage Ref. No.</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.cardBackground,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="identifier"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {formData.usageRefNo || 'Fetching...'}
                </Text>
              </View>
              {errors.usageRefNo ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.usageRefNo}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Dropdown
              label="Machine Line Name"
              required
              placeholder="Select machine line"
              value={formData.machineLineName}
              options={machineLineOptions}
              onSelect={(v) => updateField('machineLineName', v)}
              error={errors.machineLineName}
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

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Dropdown
              label="Feed Type"
              required
              placeholder="Select feed type"
              value={formData.feedType}
              options={feedTypeOptions}
              onSelect={(v) => {
                updateField('feedType', v);
                updateField('variant', '');
                updateField('formulationNo', '');
              }}
              error={errors.feedType}
              colors={colors}
            />
          </View>
          <View style={styles.halfWidth}>
            <Dropdown
              label="Variant"
              required
              placeholder="Select variant"
              value={formData.variant}
              options={variantOptions}
              onSelect={(v) => {
                updateField('variant', v);
                updateField('formulationNo', '');
              }}
              error={errors.variant}
              colors={colors}
              disabled={!formData.feedType}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Dropdown
              label="Formulation No."
              required
              placeholder="Select formulation"
              value={formData.formulationNo}
              options={formulationOptions}
              onSelect={(v) => updateField('formulationNo', v)}
              error={errors.formulationNo}
              colors={colors}
              disabled={!formData.feedType || !formData.variant}
            />
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Batch No.</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.batchNo ? colors.error : colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="package-variant"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.batchNo}
                  placeholder="Enter batch no."
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={(text) => updateField('batchNo', text)}
                />
              </View>
              {errors.batchNo ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.batchNo}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Remarks</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.cardBorder,
                backgroundColor: colors.background,
                height: 80,
                alignItems: 'flex-start',
              },
            ]}
          >
            <MaterialCommunityIcons
              name="text"
              size={20}
              color={colors.textSecondary}
              style={[styles.inputIcon, { marginTop: 8 }]}
            />
            <TextInput
              style={[styles.input, { color: colors.text, height: 72 }]}
              value={formData.remarks}
              placeholder="Enter remarks"
              placeholderTextColor={colors.textTertiary}
              onChangeText={(text) => updateField('remarks', text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Validated By</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.validatedBy ? colors.error : colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-check"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.validatedBy}
                  placeholder="Enter validator name"
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={(text) => updateField('validatedBy', text)}
                />
              </View>
              {errors.validatedBy ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.validatedBy}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Weighed By</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.weighedBy ? colors.error : colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="scale"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={formData.weighedBy}
                  placeholder="Enter weigher name"
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={(text) => updateField('weighedBy', text)}
                />
              </View>
              {errors.weighedBy ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.weighedBy}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  }
);

MaterialUtilizationHeader.displayName = 'MaterialUtilizationHeader';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
});
