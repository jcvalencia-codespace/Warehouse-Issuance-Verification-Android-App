import { ConfirmModal } from '@/components/ConfirmModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarcodeScanner } from '@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
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
import { MaterialUtilizationTagService } from '../../material-utilization-tag/services/materialUtilizationTagService';
import {
  DropdownOption,
  MaterialUtilizationDetailsRef,
  MaterialUtilizationLineItem,
} from '../types/materialUtilization.types';

export { MaterialUtilizationDetailsRef };

interface MaterialUtilizationDetailsProps {
  value?: MaterialUtilizationLineItem[];
  onItemsChange?: (items: MaterialUtilizationLineItem[]) => void;
}

export const MaterialUtilizationDetails = forwardRef<MaterialUtilizationDetailsRef, MaterialUtilizationDetailsProps>(
  ({ value, onItemsChange }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [itemCodeOptions, setItemCodeOptions] = useState<DropdownOption[]>([]);
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [weightLoaded, setWeightLoaded] = useState('');
    const [processType, setProcessType] = useState<'Prepared and Loaded' | 'Oil'>('Prepared and Loaded');
    const [randomSampled, setRandomSampled] = useState(0);
    const [qaName, setQaName] = useState('');
    const [remarks, setRemarks] = useState('');
    const [items, setItems] = useState<MaterialUtilizationLineItem[]>(value ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [requiredError, setRequiredError] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tagEnabled, setTagEnabled] = useState(false);
    const [allocationData, setAllocationData] = useState<any[]>([]);
    const [loadingAllocation, setLoadingAllocation] = useState(false);
    const [tagLoading, setTagLoading] = useState(true);

    const selectedItem = itemCodeOptions.find((o) => o.value === selectedItemCode);

    const loadTagStatus = async () => {
      setTagLoading(true);
      try {
        const tags = await MaterialUtilizationTagService.getInstance().getTag(user?.COMPANY);
        if (tags && tags.length > 0) {
          setTagEnabled(Boolean(tags[0].IS_TAGGED_IN_QM4D));
        }
      } catch (error) {
        console.error('Failed to load tag status:', error);
      } finally {
        setTagLoading(false);
      }
    };

    useEffect(() => {
      if (user?.COMPANY) {
        loadItemCodes();
        loadTagStatus();
      }
    }, [user?.COMPANY]);

    useEffect(() => {
      if (value !== undefined) {
        setItems(value);
      }
    }, [value]);

    useEffect(() => {
      if (items.length > 0) {
        setRequiredError(false);
        if (tagEnabled) {
          fetchAllocation(items[items.length - 1].itemNo, items[items.length - 1].weightLoaded);
        }
      }
    }, [items, tagEnabled]);

    const fetchAllocation = async (itemNo: string, weightLoaded: number) => {
      setLoadingAllocation(true);
      try {
        const data = await MaterialUtilizationService.getInstance().getAllocation(
          user?.COMPANY,
          itemNo,
          weightLoaded
        );
        setAllocationData(data);
      } catch (error) {
        console.error('Failed to fetch allocation:', error);
        setAllocationData([]);
      } finally {
        setLoadingAllocation(false);
      }
    };

    const loadItemCodes = async () => {
      try {
        const options = await MaterialUtilizationService.getInstance().getItemCode(user?.COMPANY);
        setItemCodeOptions(options);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch item codes.');
      }
    };

    const resetForm = () => {
      setSelectedItemCode('');
      setWeightLoaded('');
      setProcessType('Prepared and Loaded');
      setRandomSampled(0);
      setQaName('');
      setRemarks('');
      setErrors({});
      setEditIndex(null);
      setIsEditMode(false);
    };

    const handleAdd = () => {
      const newErrors: Record<string, string> = {};

      if (!selectedItemCode) {
        newErrors.material = 'Material is required';
      }

      const weightLoadedValue = Number(weightLoaded);
      if (!weightLoaded.trim() || isNaN(weightLoadedValue) || weightLoadedValue <= 0) {
        newErrors.weightLoaded = 'Enter a valid weight loaded';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const newItem: MaterialUtilizationLineItem = {
        id: editIndex !== null ? items[editIndex].id : Date.now().toString(),
        itemNo: selectedItemCode,
        itemDescription: selectedItem?.description || '',
        requiredWeight: 0,
        weightLoaded: weightLoadedValue,
        processType,
        randomSampled,
        qaName: randomSampled === 1 ? qaName : '',
        remarks,
      };

      let updatedItems: MaterialUtilizationLineItem[];
      if (editIndex !== null) {
        updatedItems = items.map((item, i) => (i === editIndex ? newItem : item));
      } else {
        updatedItems = [...items, newItem];
      }

      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      resetForm();
    };

    const handleEdit = (index: number) => {
      const item = items[index];
      if (!item) return;
      setSelectedItemCode(item.itemNo);
      setWeightLoaded(String(item.weightLoaded));
      setProcessType(item.processType);
      setRandomSampled(item.randomSampled);
      setQaName(item.qaName || '');
      setRemarks(item.remarks || '');
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

    const handleBarcodeScanned = (data: string) => {
      setBarcodeScannerVisible(false);
      setQaName(data);
      setRandomSampled(1);
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
    }));

    const renderItem = ({ item, index }: { item: MaterialUtilizationLineItem; index: number }) => {
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
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: (colors.error || '#ef4444') + '14' }]}
                onPress={() => handleDelete(index)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error || '#ef4444'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Required Weight</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.requiredWeight} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Weight Loaded</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.weightLoaded} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Process</Text>
              <View style={[
                styles.processBadge,
                { backgroundColor: item.processType === 'Oil' ? colors.warning + '20' : colors.primary + '20' }
              ]}>
                <Text style={[
                  styles.processBadgeText,
                  { color: item.processType === 'Oil' ? colors.warning : colors.primary }
                ]}>
                  {item.processType}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Random Sampled</Text>
              <View style={[
                styles.sampledBadge,
                 { backgroundColor: item.randomSampled === 1 ? colors.success + '20' : colors.textSecondary + '20' }
              ]}>
                <Text style={[
                  styles.sampledBadgeText,
                   { color: item.randomSampled === 1 ? colors.success : colors.textSecondary }
                ]}>
                   {item.randomSampled === 1 ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
             {item.randomSampled === 1 && item.qaName ? (
               <View style={styles.detailItem}>
                 <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>QA Name</Text>
                 <Text style={[styles.detailValue, { color: colors.text }]}>{item.qaName}</Text>
               </View>
             ) : null}
             {item.remarks ? (
               <View style={styles.detailItem}>
                 <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Remarks</Text>
                 <Text style={[styles.detailValue, { color: colors.text }]}>{item.remarks}</Text>
               </View>
             ) : null}
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
              <View style={styles.weightColumn}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Required Weight (kg)</Text>
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
                  <MaterialCommunityIcons name="numeric" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>
                    {'0.00'}
                  </Text>
                </View>
              </View>

              <View style={styles.weightColumn}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Weight Loaded (kg)</Text>
                  <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: errors.weightLoaded ? colors.error : colors.cardBorder,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="numeric" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={weightLoaded}
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    onChangeText={(text) => {
                      setWeightLoaded(text);
                      if (errors.weightLoaded) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.weightLoaded;
                          return next;
                        });
                      }
                    }}
                  />
                </View>
                {errors.weightLoaded ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{errors.weightLoaded}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Process</Text>
                <View style={[
                  styles.toggleContainer,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder }
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      processType === 'Prepared and Loaded' && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => setProcessType('Prepared and Loaded')}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        {
                          color: processType === 'Prepared and Loaded' ? '#fff' : colors.textSecondary,
                        },
                      ]}
                    >
                      Prepared and Loaded
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      processType === 'Oil' && {
                        backgroundColor: colors.warning,
                      },
                    ]}
                    onPress={() => setProcessType('Oil')}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        {
                          color: processType === 'Oil' ? '#fff' : colors.textSecondary,
                        },
                      ]}
                    >
                      Oil
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleItem}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Random Sampled</Text>
                <View style={[
                  styles.toggleContainer,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder }
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      !randomSampled && {
                        backgroundColor: colors.error,
                      },
                    ]}
                    onPress={() => {
                      setRandomSampled(0);
                      setQaName('');
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        {
                          color: !randomSampled ? '#fff' : colors.textSecondary,
                        },
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      randomSampled === 1 && {
                        backgroundColor: colors.success,
                      },
                    ]}
                    onPress={() => setRandomSampled(1)}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        {
                          color: randomSampled ? '#fff' : colors.textSecondary,
                        },
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {randomSampled === 1 && (
              <View style={styles.qaRow}>
                <View style={styles.qaInputContainer}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>QA Name</Text>
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: colors.cardBorder,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={qaName}
                      placeholder="Scan or enter QA name"
                      placeholderTextColor={colors.textTertiary}
                      onChangeText={setQaName}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.scanButton, { backgroundColor: colors.primary }]}
                  onPress={() => setBarcodeScannerVisible(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="barcode-scan" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
              </View>
            )}

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
                  value={remarks}
                  placeholder="Enter remarks"
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={setRemarks}
                  multiline
                  textAlignVertical="top"
                />
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

        {tagEnabled && (
          <View style={styles.allocationSection}>
            <Text style={[styles.allocationTitle, { color: colors.text }]}>
              Stock Allocation
            </Text>
            {loadingAllocation ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.allocationLoading} />
            ) : allocationData.length > 0 ? (
              <View style={[styles.allocationTable, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={[styles.allocationHeader, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>LOT NO.</Text>
                  <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>QTY TRANS</Text>
                  <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>ALLOCATED</Text>
                  <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>REMAINING</Text>
                </View>
                {allocationData.map((row) => (
                  <View key={row.QM4DROWID} style={[styles.allocationRow, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.allocationCell, { color: colors.text }]}>{row.LOTNUMBER || '—'}</Text>
                    <Text style={[styles.allocationCell, { color: colors.textSecondary }]}>{row.QUANTITY_TRANS} kg</Text>
                    <Text style={[styles.allocationCell, { color: colors.success }]}>{row.KGS_ALLOCATED} kg</Text>
                    <Text style={[styles.allocationCell, { color: colors.text }]}>{row.REMAINING_QTY} kg</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.allocationEmpty, { color: colors.textSecondary }]}>
                No allocation data available for the selected item.
              </Text>
            )}
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

        <BarcodeScanner
          visible={barcodeScannerVisible}
          onClose={() => setBarcodeScannerVisible(false)}
          onScan={handleBarcodeScanned}
          title="Scan QA Barcode"
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

MaterialUtilizationDetails.displayName = 'MaterialUtilizationDetails';

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
  materialRow: {
    gap: 12,
  },
  materialField: {
    flex: 1,
  },
  chipList: {
    gap: 8,
    paddingVertical: 4,
  },
  materialChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  materialChipText: {
    fontSize: 13,
    fontWeight: '600',
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
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  toggleItem: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  qaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  qaInputContainer: {
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    gap: 12,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  detailItem: {
    minWidth: '45%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  processBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  processBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sampledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sampledBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 4,
  },
  allocationSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  allocationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  allocationLoading: {
    marginTop: 16,
    alignSelf: 'center',
  },
  allocationTable: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  allocationHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  allocationHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  allocationRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  allocationCell: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  allocationEmpty: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
