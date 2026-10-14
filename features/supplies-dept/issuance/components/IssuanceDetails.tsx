/**
 * Supplies Issuance Details
 * Form for selecting item codes and quantities, and listing added items.
 */

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
import { DropdownOption, IssuanceService } from '../services/issuanceService';
import { AssignQuantityAllocation, ItemCodeDetails } from '../types/issuance.types';
import { ItemCodeModal } from './ItemCodeModal';
import { MachineNoModal } from './MachineNoModal';

interface IssuanceDetailsProps {
  company?: string;
  value?: IssuanceLineItem[];
  onItemsChange?: (items: IssuanceLineItem[]) => void;
  onTimeRequestUpdate?: (date: Date) => void;
}

export interface IssuanceLineItem {
  itemCode: string;
  description: string;
  quantity: string;
  machineNo: string;
  remarks: string;
  details: ItemCodeDetails[];
  allocations: AssignQuantityAllocation[];
  selectedLots: Record<string, number>;
}

export interface IssuanceDetailsRef {
  clear: () => void;
  refreshItemQuantities: () => Promise<void>;
}

export const IssuanceDetails = forwardRef<IssuanceDetailsRef, IssuanceDetailsProps>(
  ({ company: companyProp, value, onItemsChange, onTimeRequestUpdate }: IssuanceDetailsProps, ref) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();
  const company = companyProp || user?.COMPANY;

  const [itemCodeOptions, setItemCodeOptions] = useState<DropdownOption[]>([]);
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [items, setItems] = useState<IssuanceLineItem[]>(value ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemDetails, setItemDetails] = useState<ItemCodeDetails[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [machineNoOptions, setMachineNoOptions] = useState<DropdownOption[]>([]);
  const [selectedMachineNo, setSelectedMachineNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [machineModalVisible, setMachineModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedLotQuantities, setSelectedLotQuantities] = useState<Record<string, number>>({});

  const selectedItem = itemCodeOptions.find((o) => o.value === selectedItemCode);

  const selectedLotTotal = Object.values(selectedLotQuantities).reduce((sum, q) => sum + Number(q || 0), 0);

  useEffect(() => {
    loadItemCodes();
  }, [company]);

  useEffect(() => {
    if (value !== undefined) {
      setItems(value);
    }
  }, [value]);

  useEffect(() => {
    if (!selectedItemCode) {
      setItemDetails([]);
      setMachineNoOptions([]);
      setSelectedMachineNo('');
      setSelectedLotQuantities({});
      return;
    }
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const details = await IssuanceService.getInstance().getItemCodeDetails(selectedItemCode, company);
        setItemDetails(details);
      } catch (error) {
        setItemDetails([]);
      } finally {
        setDetailsLoading(false);
      }
    };
    const fetchMachineNos = async () => {
      try {
        const options = await IssuanceService.getInstance().getMachineNoOptions();
        setMachineNoOptions(options);
      } catch (error) {
        setMachineNoOptions([]);
      }
    };
    fetchDetails();
    fetchMachineNos();
  }, [selectedItemCode, company]);

  const resetFormState = () => {
    setSelectedItemCode('');
    setErrors({});
    setItemDetails([]);
    setSelectedLotQuantities({});
    setExpandedItems({});
    setSelectedMachineNo('');
    setRemarks('');
    setEditIndex(null);
  };

  const loadItemCodes = async () => {
    try {
      const options = await IssuanceService.getInstance().getItemCodes(company);
      setItemCodeOptions(options);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch item codes.');
    }
  };

  const handleAdd = async () => {
    const newErrors: Record<string, string> = {};

    if (!selectedItemCode) {
      newErrors.itemCode = 'Item code is required';
    } else if (
      editIndex === null &&
      items.some((item) => item.itemCode === selectedItemCode)
    ) {
      newErrors.itemCode = 'Item code already added';
    }

    const hasLotQuantities = Object.keys(selectedLotQuantities).length > 0;
    if (!hasLotQuantities) {
      newErrors.lotAllocation = 'Select quantities for at least one lot';
    } else {
      for (const [lotNumber, lotQty] of Object.entries(selectedLotQuantities)) {
        const detail = itemDetails.find((d) => d.LOTNUMBER === lotNumber);
        if (detail && lotQty > Number(detail.QUANTITY)) {
          newErrors.lotAllocation = `Quantity for lot ${lotNumber} (${lotQty}) exceeds available (${Number(detail.QUANTITY)})`;
          break;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedOption = itemCodeOptions.find(
      (option) => option.value === selectedItemCode
    );
    const description = selectedOption?.label.split(' - ')[1] || '';

    const selectedLots: Record<string, number> = { ...selectedLotQuantities };
    const totalQuantity = selectedLotTotal;

    const newItem: IssuanceLineItem = {
      itemCode: selectedItemCode,
      description,
      quantity: String(totalQuantity),
      machineNo: selectedMachineNo,
      remarks: remarks.trim(),
      details: itemDetails,
      allocations: [],
      selectedLots,
    };

    let updatedItems: IssuanceLineItem[];
    if (editIndex !== null) {
      updatedItems = items.map((item, i) => (i === editIndex ? newItem : item));
    } else {
      updatedItems = [...items, newItem];
    }
    setItems(updatedItems);
    onItemsChange?.(updatedItems);

    resetFormState();
  };

  const handleLotQuantityChange = (lotNumber: string, value: string) => {
    const numValue = value === '' ? NaN : Number(value);
    const detail = itemDetails.find((d) => d.LOTNUMBER === lotNumber);
    const maxAvailable = detail ? Number(detail.QUANTITY) : 0;
    let finalValue: number | '' = value === '' ? '' : numValue;
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      if (numValue < 0) {
        finalValue = 0;
      } else if (numValue > maxAvailable) {
        finalValue = maxAvailable;
      }
    }
    setSelectedLotQuantities((prev) => {
      const next = { ...prev };
      if (finalValue === '' || (typeof finalValue === 'number' && isNaN(finalValue))) {
        delete next[lotNumber];
      } else {
        next[lotNumber] = finalValue as number;
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev.lotAllocation) return prev;
      const next = { ...prev };
      delete next.lotAllocation;
      return next;
    });
  };

  const handleEdit = (index: number) => {
    const item = items[index];
    if (!item) return;
    setSelectedItemCode(item.itemCode);
    setItemDetails(item.details);
    setSelectedLotQuantities(item.selectedLots || {});
    setSelectedMachineNo(item.machineNo);
    setRemarks(item.remarks);
    setEditIndex(index);
  };

  const handleRemove = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setExpandedItems((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const key = Number(k);
        if (key < index) next[key] = v;
        else if (key > index) next[key - 1] = v;
      });
      return next;
    });
    onItemsChange?.(updatedItems);
  };

   const handleScanned = (data: string) => {
    setSelectedLotQuantities({});
    const matched = itemCodeOptions.find((o) => o.value === data);
    if (matched) {
      setSelectedItemCode(matched.value);
      setErrors((prev) => {
        if (!prev.itemCode) return prev;
        const next = { ...prev };
        delete next.itemCode;
        return next;
      });
      onTimeRequestUpdate?.(new Date());
    } else {
      Alert.alert('Invalid Item Code', `Scanned code "${data}" is not available.`);
    }
    setScannerVisible(false);
  };

  const renderItem = ({ item, index }: { item: IssuanceLineItem; index: number }) => {
    const expanded = expandedItems[index];
    const totalItemAvailable = item.details.reduce((sum, d) => sum + Number(d.QUANTITY), 0);
    return (
      <View style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, borderLeftColor: colors.primary }]}>
        <View style={styles.itemHeader}>
          <View style={[styles.itemAvatar, { backgroundColor: colors.primary + '14' }]}>
            <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primary} />
          </View>
          <View style={styles.itemTitleContainer}>
            <Text style={[styles.itemCode, { color: colors.text }]}>
              {item.itemCode}
            </Text>
            <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description || 'No description'}
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
              style={[styles.iconButton, { backgroundColor: colors.error + '14' }]}
              onPress={() => handleRemove(index)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemMetaRow}>
          <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="numeric" size={16} color={colors.primary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Qty</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{item.quantity}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="warehouse" size={16} color={colors.primary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Available</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{totalItemAvailable}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="cog-outline" size={16} color={colors.primary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Machine</Text>
            <Text style={[styles.metaValue, { color: item.machineNo ? colors.text : colors.textTertiary }]}>
              {item.machineNo || '—'}
            </Text>
        </View>

        {item.remarks ? (
          <View style={styles.itemRemarksRow}>
            <MaterialCommunityIcons name="text-box-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.itemRemarksText, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.remarks}
            </Text>
          </View>
        ) : null}

        {item.details.length > 0 && (
            <TouchableOpacity
              style={[styles.detailsToggle, { backgroundColor: colors.primary + '14' }]}
              onPress={() => setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }))}
              activeOpacity={0.8}
            >
              <Text style={[styles.detailsToggleText, { color: colors.primary }]}>
                {expanded ? 'Hide' : 'Details'}
              </Text>
              <MaterialCommunityIcons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        {expanded && item.details.length > 0 && (
          <View style={[styles.itemDetailsTable, { borderColor: colors.cardBorder }]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>PRBY</Text>
              <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>REFERENCE</Text>
              <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>AVAILABLE</Text>
              <Text style={[styles.tableHeaderRight, { color: colors.textTertiary }]}>SELECTED</Text>
            </View>
            {item.details.map((detail, dIndex) => {
              const selectedQty = item.selectedLots?.[detail.LOTNUMBER] ?? 0;
              const isSelected = selectedQty > 0;
              return (
                <View
                  key={`${detail.LOTNUMBER}-${dIndex}`}
                  style={[
                    styles.tableRow,
                    dIndex % 2 === 1 && { backgroundColor: colors.background },
                  ]}
                >
                  <Text style={[styles.tableCell, { color: colors.text }]} numberOfLines={1}>
                    {detail.PRBY}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.textSecondary }]} numberOfLines={1}>
                    {detail.REFERENCENO}
                  </Text>
                  <View style={[styles.qtyPill, { backgroundColor: colors.primary + '14' }]}>
                    <Text style={[styles.qtyPillText, { color: colors.primary }]}>{detail.QUANTITY}</Text>
                  </View>
                  <View style={styles.lotSelectContainer}>
                    <TextInput
                      style={[
                        styles.lotQtyInput,
                        {
                          color: colors.text,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                          backgroundColor: isSelected ? colors.primary + '14' : colors.background,
                        },
                      ]}
                      value={item.selectedLots?.[detail.LOTNUMBER] !== undefined ? String(item.selectedLots[detail.LOTNUMBER]) : ''}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newSelectedLots = { ...(item.selectedLots || {}) };
                        const numVal = text === '' ? NaN : Number(text);
                        if (text === '' || isNaN(numVal)) {
                          delete newSelectedLots[detail.LOTNUMBER];
                        } else {
                          const clamped = Math.max(0, Math.min(numVal, Number(detail.QUANTITY)));
                          if (clamped > 0) {
                            newSelectedLots[detail.LOTNUMBER] = clamped;
                          } else {
                            delete newSelectedLots[detail.LOTNUMBER];
                          }
                        }
                        const updatedItems = [...items];
                        updatedItems[index] = {
                          ...updatedItems[index],
                          selectedLots: newSelectedLots,
                        };
                        setItems(updatedItems);
                        onItemsChange?.(updatedItems);
                      }}
                    />
                  </View>
                </View>
              );
            })}
            <View style={styles.lotTotalRow}>
              <Text style={[styles.lotTotalLabel, { color: colors.textSecondary }]}>Total Selected</Text>
              <Text style={[styles.lotTotalValue, { color: colors.primary }]}>
                {Object.values(item.selectedLots || {}).reduce((sum, q) => sum + Number(q || 0), 0)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const refreshItemQuantities = async () => {
    if (items.length === 0) return;

    const updatedItems = [...items];
    const uniqueItemCodes = [...new Set(updatedItems.map((item) => item.itemCode))];

    for (const itemCode of uniqueItemCodes) {
      const existingItem = updatedItems.find((i) => i.itemCode === itemCode);
      if (!existingItem) continue;

      try {
        const details = await IssuanceService.getInstance().getItemCodeDetails(itemCode, company);
        const itemIndex = updatedItems.findIndex((i) => i.itemCode === itemCode);
        if (itemIndex !== -1) {
          const preservedLots: Record<string, number> = {};
          for (const detail of details) {
            const prevQty = existingItem.selectedLots?.[detail.LOTNUMBER];
            if (prevQty && prevQty > 0 && prevQty <= Number(detail.QUANTITY)) {
              preservedLots[detail.LOTNUMBER] = prevQty;
            }
          }
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            details,
            selectedLots: preservedLots,
          };
        }
      } catch (error) {
        console.error(`Failed to refresh quantities for item ${itemCode}:`, error);
      }
    }

    setItems(updatedItems);
    onItemsChange?.(updatedItems);
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      setItems([]);
      setSelectedItemCode('');
      setErrors({});
      setItemDetails([]);
      setSelectedLotQuantities({});
      setExpandedItems({});
      setSelectedMachineNo('');
      setRemarks('');
      setEditIndex(null);
      onItemsChange?.([]);
    },
    refreshItemQuantities,
  }));

  return (
    <View style={styles.container}>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        {/* Item Code Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Item Code <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
          </Text>
          <View style={styles.itemCodeRow}>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                styles.itemCodeField,
                {
                  borderColor: errors.itemCode ? colors.error : colors.cardBorder,
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
                {selectedItemCode || 'Select item code'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanButton, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
              onPress={() => setScannerVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {errors.itemCode ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.itemCode}</Text>
            </View>
          ) : null}

          {selectedItem && selectedItem.description ? (
            <View style={[styles.readOnlyField, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name="text" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>
                {selectedItem.description}
              </Text>
            </View>
          ) : null}

          {/* Available Lots with per-lot quantity selection (replaces standalone quantity input) */}

        {/* Machine No */}

          {selectedItemCode ? (
            <View style={[styles.detailsTable, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={[styles.detailsTitleRow, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.detailsTitleWrap}>
                  <MaterialCommunityIcons name="package-variant-closed" size={18} color={colors.primary} />
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>Available Lots</Text>
                </View>
                <View style={[styles.detailsCountBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.detailsCountText, { color: colors.primary }]}>{itemDetails.length}</Text>
                </View>
              </View>

              {detailsLoading ? (
                <View style={styles.detailsLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.detailsLoadingText, { color: colors.textSecondary }]}>Loading Item Details…</Text>
                </View>
              ) : itemDetails.length > 0 ? (
                <View>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>PRBY</Text>
                    <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>REFERENCE</Text>
                    {/* <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>UOM</Text> */}
                    <Text style={[styles.tableHeader, { color: colors.textTertiary }]}>AVAILABLE</Text>
                    <Text style={[styles.tableHeaderRight, { color: colors.textTertiary }]}>SELECT</Text>
                  </View>
                  <FlatList
                    data={itemDetails}
                    keyExtractor={(_, index) => `detail-${index}`}
                    scrollEnabled={false}
                    renderItem={({ item, index }) => {
                      const lotKey = item.LOTNUMBER;
                      const selectedQty = selectedLotQuantities[lotKey] !== undefined ? String(selectedLotQuantities[lotKey]) : '';
                      const isSelected = selectedLotQuantities[lotKey] && selectedLotQuantities[lotKey] > 0;
                      return (
                        <View
                          style={[
                            styles.tableRow,
                            index % 2 === 1 && { backgroundColor: colors.background },
                          ]}
                        >
                          <Text style={[styles.tableCell, { color: colors.text }]} numberOfLines={1}>
                            {item.PRBY}
                          </Text>
                          <Text style={[styles.tableCell, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.REFERENCENO}
                          </Text>
                          {/* <Text style={[styles.tableCell, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.UOFM}
                          </Text> */}
                          <View style={[styles.qtyPill, { backgroundColor: colors.primary + '14' }]}>
                            <Text style={[styles.qtyPillText, { color: colors.primary }]}>{item.QUANTITY}</Text>
                          </View>
                          <View style={styles.lotSelectContainer}>
                            <TextInput
                              style={[
                                styles.lotQtyInput,
                                {
                                  color: colors.text,
                                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                                  backgroundColor: isSelected ? colors.primary + '14' : colors.background,
                                },
                              ]}
                              value={selectedQty}
                              placeholder="0"
                              placeholderTextColor={colors.textTertiary}
                              keyboardType="numeric"
                              onChangeText={(text) => handleLotQuantityChange(lotKey, text)}
                            />
                          </View>
                        </View>
                      );
                    }}
                  />
                  <View style={styles.lotTotalRow}>
                    <Text style={[styles.lotTotalLabel, { color: colors.textSecondary }]}>Total Selected: {selectedLotTotal}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.detailsEmpty}>
                  <MaterialCommunityIcons name="package-variant" size={32} color={colors.textTertiary} />
                  <Text style={[styles.detailsEmptyText, { color: colors.textSecondary }]}>No available lots for this item</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Machine No */}
        {selectedItemCode ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Machine No
            </Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={() => setMachineModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedMachineNo ? colors.text : colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {selectedMachineNo || 'Select machine no'}
              </Text>
              {selectedMachineNo ? (
                <TouchableOpacity
                  onPress={() => setSelectedMachineNo('')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Remarks */}
        {selectedItemCode ? (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Remarks
            </Text>
            <View
              style={[
                styles.inputContainer,
                styles.remarksField,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <MaterialCommunityIcons name="text-box-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.remarksInput, { color: colors.text }]}
                value={remarks}
                placeholder="Add remarks (optional)"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                onChangeText={setRemarks}
              />
            </View>
          </View>
        ) : null}

        {/* Add / Update Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name={editIndex !== null ? 'check' : 'plus'} size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>{editIndex !== null ? 'Update Item' : 'Add Item'}</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {items.length > 0 && (
        <View style={styles.itemsListContainer}>
          <Text style={[styles.itemsListTitle, { color: colors.text }]}>
            Added Items ({items.length})
          </Text>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.itemCode}-${index}`}
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
          setSelectedLotQuantities({});
          setErrors((prev) => {
            if (!prev.itemCode) return prev;
            const next = { ...prev };
            delete next.itemCode;
            return next;
          });
        }}
        onClose={() => setItemModalVisible(false)}
      />

      <MachineNoModal
        visible={machineModalVisible}
        options={machineNoOptions}
        selectedValue={selectedMachineNo}
        onSelect={(value) => setSelectedMachineNo(value)}
        onClose={() => setMachineModalVisible(false)}
      />

      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScanned}
        title="Scan Item Code"
      />
    </View>
    );
});

IssuanceDetails.displayName = 'IssuanceDetails';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
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
  itemCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCodeField: {
    flex: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  remarksField: {
    height: 'auto',
    minHeight: 56,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  remarksInput: {
    textAlignVertical: 'top',
    marginTop: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  detailsTable: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailsCountBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  detailsCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  detailsLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  detailsEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tableHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableHeaderRight: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  qtyPill: {
    flex: 1,
    alignItems: 'flex-end',
  },
  qtyPillText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'right',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  detailsToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemRemarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  itemRemarksText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  itemDetailsTable: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lotSelectContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lotQtyInput: {
    width: 72,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  lotTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  lotTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  lotTotalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
