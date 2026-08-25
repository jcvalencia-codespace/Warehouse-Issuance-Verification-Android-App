import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { ItemCodeModal } from '../../../../components/ItemCodeModal';
import { MaterialUtilizationService } from '../services/materialUtilizationService';
import {
  DropdownOption,
  MaterialUtilizationBaseItemDetails,
  MaterialUtilizationDetailsRef,
} from '../types/materialUtilization.types';

export { MaterialUtilizationDetailsRef };

interface MaterialUtilizationBaseDetailsProps {
  value?: MaterialUtilizationBaseItemDetails[];
  onItemsChange?: (items: MaterialUtilizationBaseItemDetails[]) => void;
}

export const MaterialUtilizationBaseDetails = forwardRef<MaterialUtilizationDetailsRef, MaterialUtilizationBaseDetailsProps>(
  ({ value, onItemsChange }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [itemCodeOptions, setItemCodeOptions] = useState<DropdownOption[]>([]);
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [requiredWeight, setRequiredWeight] = useState('');
    const [isAutoDosing, setIsAutoDosing] = useState(0);
    const [items, setItems] = useState<MaterialUtilizationBaseItemDetails[]>(value ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [requiredError, setRequiredError] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const selectedItem = itemCodeOptions.find((o) => o.value === selectedItemCode);

    useEffect(() => {
      if (user?.COMPANY) {
        loadItemCodes();
      }
    }, [user?.COMPANY]);

    useEffect(() => {
      if (value !== undefined) {
        setItems(value);
      }
    }, [value]);

    const loadItemCodes = async () => {
      try {
        const options = await MaterialUtilizationService.getInstance().getItemCode(user?.COMPANY);
        setItemCodeOptions(options);
      } catch {
        Alert.alert('Error', 'Failed to fetch item codes.');
      }
    };

    const resetForm = () => {
      setSelectedItemCode('');
      setRequiredWeight('');
      setIsAutoDosing(0);
      setErrors({});
      setEditIndex(null);
      setIsEditMode(false);
    };

    const handleAdd = () => {
      const newErrors: Record<string, string> = {};

      if (!selectedItemCode) {
        newErrors.material = 'Material is required';
      } else if (items.some((item, i) => item.itemNo === selectedItemCode && i !== (editIndex ?? -1))) {
        newErrors.material = 'This material has already been added!';
      }

      const requiredWeightValue = Number(requiredWeight);
      if (!requiredWeight.trim() || isNaN(requiredWeightValue) || requiredWeightValue <= 0) {
        newErrors.requiredWeight = 'Enter a valid required weight';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const newItem: MaterialUtilizationBaseItemDetails = {
        id: editIndex !== null ? items[editIndex].id : Date.now().toString(),
        itemNo: selectedItemCode,
        itemDescription: selectedItem?.description || '',
        requiredWeight: requiredWeightValue,
        isAutoDosing,
      };

      let updatedItems: MaterialUtilizationBaseItemDetails[];
      if (editIndex !== null) {
        updatedItems = items.map((item, i) => (i === editIndex ? newItem : item));
      } else {
        updatedItems = [newItem, ...items];
      }

      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      resetForm();
    };

    const handleEdit = (index: number) => {
      const item = items[index];
      if (!item) return;
      setSelectedItemCode(item.itemNo);
      setRequiredWeight(String(item.requiredWeight));
      setIsAutoDosing(item.isAutoDosing ?? 0);
      setEditIndex(index);
      setIsEditMode(true);
    };

    const handleDelete = (index: number) => {
      setDeleteIndex(index);
      setDeleteModalVisible(true);
    };

    const handleConfirmDelete = () => {
      if (deleteIndex === null) return;
      const updatedItems = items.filter((_, i) => i !== deleteIndex);
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      setDeleteModalVisible(false);
      setDeleteIndex(null);
      resetForm();
    };

    const handleCancelDelete = () => {
      setDeleteModalVisible(false);
      setDeleteIndex(null);
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        setItems([]);
        setSelectedItemCode('');
        setItemModalVisible(false);
        resetForm();
        setRequiredError(false);
        onItemsChange?.([]);
      },
      validate: () => {
        if (items.length === 0) {
          setRequiredError(true);
          return false;
        }
        setRequiredError(false);
        return true;
      },
      getSubDetails: () => {
        return [];
      },
    }));

    const renderItem = ({ item, index }: { item: MaterialUtilizationBaseItemDetails; index: number }) => {
      return (
        <View
          style={[
            styles.itemCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, borderLeftColor: colors.primary },
          ]}
        >
          <View style={styles.itemHeader}>
            <View style={[styles.itemAvatar, { backgroundColor: colors.primary + '14' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primary} />
            </View>
            <View style={styles.itemTitleContainer}>
              <Text style={[styles.itemCode, { color: colors.text }]}>{item.itemNo}</Text>
              <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.itemDescription || 'No description'}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.primary + '14' }]}
                onPress={() => handleEdit(index)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: (colors.error || '#ef4444') + '14' }]}
                onPress={() => handleDelete(index)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error || '#ef4444'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Required Weight</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.requiredWeight} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Auto Dosing Machine</Text>
              <Text style={[
                styles.detailValue,
                { color: item.isAutoDosing === 1 ? colors.success : colors.textSecondary }
              ]}>
                {item.isAutoDosing === 1 ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Material Details
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Record material usage based on the selected formulation.
          </Text>

          {requiredError && (
            <View style={[styles.requiredErrorContainer, { backgroundColor: colors.error + '14' }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.requiredErrorText, { color: colors.error }]}>
                Please add at least one material before submitting.
              </Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.rowContainer}>
              <View style={styles.materialColumn}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Material</Text>
                  <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    styles.materialField,
                    {
                      borderColor: errors.material ? colors.error : colors.cardBorder,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => setItemModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="barcode" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <Text
                    style={[
                      styles.dropdownText,
                      { color: selectedItemCode ? colors.text : colors.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedItemCode || 'Select material'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
                {selectedItem?.description ? (
                  <View
                    style={[
                      styles.materialDescriptionContainer,
                      styles.inputContainer,
                      {
                        borderColor: colors.cardBorder,
                        backgroundColor: colors.cardBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.materialDescription, { color: colors.textSecondary }]}>
                      {selectedItem.description}
                    </Text>
                  </View>
                ) : null}
                {errors.material ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{errors.material}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.weightColumn, { flex: 2 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Required Weight (kg)</Text>
                  <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: errors.requiredWeight ? colors.error : colors.cardBorder,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="numeric" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={requiredWeight}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    onChangeText={(text) => {
                      setRequiredWeight(text);
                      if (errors.requiredWeight) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.requiredWeight;
                          return next;
                        });
                      }
                    }}
                  />
                </View>
                {errors.requiredWeight ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{errors.requiredWeight}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.toggleItem, { justifyContent: 'flex-end' }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Auto Dosing Machine</Text>
                </View>
                <View style={[
                  styles.toggleContainer,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder }
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      !isAutoDosing && { backgroundColor: colors.error },
                    ]}
                    onPress={() => setIsAutoDosing(0)}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        { color: !isAutoDosing ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      isAutoDosing === 1 && { backgroundColor: colors.success },
                    ]}
                    onPress={() => setIsAutoDosing(1)}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        { color: isAutoDosing === 1 ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={isEditMode ? 'check' : 'plus'} size={20} color="#ffffff" />
              <Text style={styles.addButtonText}>{isEditMode ? 'Update Material' : 'Add Material'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {items.length > 0 && (
          <View style={styles.itemsListContainer}>
            <Text style={[styles.itemsListTitle, { color: colors.text }]}>
              Added Materials ({items.length})
            </Text>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.itemsListContent}
            />
          </View>
        )}

        <ItemCodeModal
          visible={itemModalVisible}
          options={itemCodeOptions}
          selectedValue={selectedItemCode}
          onSelect={(value) => {
            setSelectedItemCode(value);
            setErrors((prev) => {
              if (!prev.material) return prev;
              const next = { ...prev };
              delete next.material;
              return next;
            });
          }}
          onClose={() => setItemModalVisible(false)}
        />

        <ConfirmModal
          visible={deleteModalVisible}
          title="Delete Material"
          message="Are you sure you want to remove this material?"
          iconName="alert-outline"
          iconColor={colors.error || '#ef4444'}
          cancelText="Cancel"
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </View>
    );
  }
);

MaterialUtilizationBaseDetails.displayName = 'MaterialUtilizationBaseDetails';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginTop: 16,
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  materialColumn: {
    flex: 1,
  },
  materialField: {
    flex: 1,
  },
  materialDescription: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  materialDescriptionContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
    height: 56,
    justifyContent: 'center',
  },
  weightColumn: {
    flex: 1,
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
  dropdownText: {
    flex: 1,
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
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  requiredErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  requiredErrorText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  itemsListContainer: {
    marginTop: 16,
  },
  itemsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemsListContent: {
    gap: 8,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    borderLeftWidth: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  itemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemCode: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  detailItem: {
    minWidth: '30%',
    // marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    // marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 22,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 4,
  },
  toggleItem: {
    width: 160,
    maxWidth: '40%',
    minWidth: '30%',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    // marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MaterialUtilizationBaseDetails;
