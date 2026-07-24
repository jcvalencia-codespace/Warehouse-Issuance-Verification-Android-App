import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
import { MaterialIssuanceService } from '../services/materialIssuanceService';

export interface MaterialIssuanceHeaderRef {
  submit: () => void;
  clear: () => void;
  refreshMirNo: () => Promise<void>;
  setField: (field: keyof MaterialIssuanceFormData, value: string | Date) => void;
}

interface MaterialIssuanceHeaderProps {
  onSubmit?: (data: MaterialIssuanceFormData) => void;
  onValidSubmit?: (data: MaterialIssuanceFormData) => void;
  onSearchPress?: () => void;
  searchable?: boolean;
}

interface MaterialIssuanceFormData {
  mirNo: string;
  shift: string;
  reviewedBy: string;
  dateCreated: Date;
}

const SHIFT_OPTIONS = [
  { label: '1st Shift', value: '1st Shift' },
  { label: '2nd Shift', value: '2nd Shift' },
];

type FieldBaseProps = {
  label: string;
  required?: boolean;
  colors: typeof Colors.light;
};

type DropdownOption = {
  label: string;
  value: string;
};

export const MaterialIssuanceHeader = forwardRef<MaterialIssuanceHeaderRef, MaterialIssuanceHeaderProps>(
  ({ onSubmit, onValidSubmit, onSearchPress, searchable = false }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [formData, setFormData] = useState<MaterialIssuanceFormData>({
      mirNo: '',
      shift: '',
      reviewedBy: '',
      dateCreated: new Date(),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
      const fetchNextMIR = async () => {
        try {
          const mirNos = await MaterialIssuanceService.getInstance().getNextMIRNo(user?.COMPANY);
          if (mirNos && mirNos.length > 0) {
            setFormData((prev) => ({ ...prev, mirNo: mirNos[0] }));
          }
        } catch (error) {
          console.error('Failed to fetch next MIR number:', error);
        }
      };
      fetchNextMIR();
    }, [user?.COMPANY]);

    useEffect(() => {
      const timer = setInterval(() => {
        setFormData((prev) => ({ ...prev, dateCreated: new Date() }));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const updateField = (field: keyof MaterialIssuanceFormData, value: string | Date) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

    const formatDateTime = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const handleSubmit = () => {
      const required: { field: keyof MaterialIssuanceFormData; label: string }[] = [
        { field: 'mirNo', label: 'MIR No.' },
        { field: 'shift', label: 'Shift' },
        { field: 'reviewedBy', label: 'Reviewed By' },
      ];

      const newErrors: Record<string, string> = {};
      const missing: string[] = [];
      required.forEach(({ field, label }) => {
        const value = formData[field];
        const isEmpty = typeof value === 'string' ? value.trim() === '' : value == null;
        if (isEmpty) {
          newErrors[field] = `${label} is required`;
          missing.push(label);
        }
      });

      setErrors(newErrors);

      if (missing.length > 0) {
        return;
      }

      onValidSubmit?.(formData);
      onSubmit?.(formData);
    };

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      clear: () => {
        setFormData((prev) => ({
          ...prev,
          mirNo: '',
          shift: '',
          reviewedBy: '',
          dateCreated: new Date(),
        }));
        setErrors({});
      },
      refreshMirNo: async () => {
        try {
          const mirNos = await MaterialIssuanceService.getInstance().getNextMIRNo(user?.COMPANY);
          if (mirNos && mirNos.length > 0) {
            setFormData((prev) => ({ ...prev, mirNo: mirNos[0] }));
          }
        } catch (error) {
          console.error('Failed to refresh MIR number:', error);
        }
      },
      setField: (field: keyof MaterialIssuanceFormData, value: string | Date) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
              Material Issuance
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.textSecondary }]}
            >
              Fill in the details below to create a new material issuance.
            </Text>
          </View>
          {searchable && onSearchPress && (
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary + '14' }]}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>MIR No.</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.mirNo ? colors.error : colors.cardBorder,
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
                  {formData.mirNo || 'Fetching...'}
                </Text>
              </View>
              {errors.mirNo ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.mirNo}</Text>
                </View>
              ) : null}
            </View>
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
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Reviewed By</Text>
                <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: errors.reviewedBy ? colors.error : colors.cardBorder,
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
                  value={formData.reviewedBy}
                  placeholder="Enter reviewer name"
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={(text) => updateField('reviewedBy', text)}
                />
              </View>
              {errors.reviewedBy ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errors.reviewedBy}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.halfWidth}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Date Created</Text>
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
                  name="clock-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {formatDateTime(formData.dateCreated)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

MaterialIssuanceHeader.displayName = 'MaterialIssuanceHeader';

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

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
