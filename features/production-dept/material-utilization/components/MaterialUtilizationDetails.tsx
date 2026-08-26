
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BarcodeScanner } from '@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

import { MaterialUtilizationTagService } from '../../material-utilization-tag/services/materialUtilizationTagService';
import { MaterialUtilizationService } from '../services/materialUtilizationService';
import {
  MaterialUtilizationDetailsRef,
  MaterialUtilizationLineItem,
  MaterialUtilizationSubDetail
} from '../types/materialUtilization.types';

export { MaterialUtilizationDetailsRef };

interface MaterialUtilizationDetailsProps {
  value?: MaterialUtilizationLineItem[];
  onItemsChange?: (items: MaterialUtilizationLineItem[]) => void;
  onSave?: () => void;
  initialData?: {
    usageRefNo?: string;
    batchNo?: number;
    itemnmbr?: string;
    weighedBy?: string;
    validatedBy?: string;
  };
  isDosingMachine?: boolean;
}

export const MaterialUtilizationDetails = forwardRef<MaterialUtilizationDetailsRef, MaterialUtilizationDetailsProps>(
  ({ value, onItemsChange, initialData, isDosingMachine = false }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user, isAdmin } = useAuth();

    const [batchNo, setBatchNo] = useState('');
    const [randomSampled, setRandomSampled] = useState(0);
    const [qaName, setQaName] = useState('');
    const [weighedBy, setWeighedBy] = useState('');
    const [validatedBy, setValidatedBy] = useState('');
    const [items, setItems] = useState<MaterialUtilizationLineItem[]>(value ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [requiredError, setRequiredError] = useState(false);
    const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
    const [tagEnabled, setTagEnabled] = useState(false);
    const [allocationDataMap, setAllocationDataMap] = useState<Map<string, any[]>>(new Map());
    const [loadingAllocationMap, setLoadingAllocationMap] = useState<Set<string>>(new Set());
    const [tagLoading, setTagLoading] = useState(true);


    const formatKg = (value?: string | number) =>
      `${Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kg`;

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
        loadTagStatus();
      }
    }, [user?.COMPANY]);

    useEffect(() => {
      if (value !== undefined) {
        setItems(value);
      }
    }, [value]);

    const fetchAllocationForItem = async (itemNo: string, weightLoaded: number, isAdmin: boolean) => {
      if (!isAdmin) return;
      const itemKey = `${itemNo}:${weightLoaded}`;
      if (allocationDataMap.has(itemKey)) return;

      setLoadingAllocationMap(prev => new Set(prev).add(itemKey));
      try {
        const data = await MaterialUtilizationService.getInstance().getAllocation(
          user?.COMPANY,
          itemNo,
          weightLoaded
        );
        setAllocationDataMap(prev => {
          const next = new Map(prev);
          next.set(itemKey, data);
          return next;
        });
      } catch (error) {
        console.error('Failed to fetch allocation:', error);
        setAllocationDataMap(prev => {
          const next = new Map(prev);
          next.set(itemKey, []);
          return next;
        });
      } finally {
        setLoadingAllocationMap(prev => {
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });
      }
    };

    useEffect(() => {
      if (items.length > 0 && tagEnabled) {
        setRequiredError(false);
        items.forEach(item => {
          if (!allocationDataMap.has(`${item.itemNo}:${item.weightLoaded}`)) {
            fetchAllocationForItem(item.itemNo, item.weightLoaded, isAdmin ?? false);
          }
        });
      }
    }, [items, tagEnabled]);

    useEffect(() => {
      if (initialData) {
        const baseBatch = Number(initialData.batchNo) || 0;
        setBatchNo(String(baseBatch + 1));
      }
      if (initialData?.weighedBy) {
        setWeighedBy(initialData.weighedBy);
      }
      if (initialData?.validatedBy) {
        setValidatedBy(initialData.validatedBy);
      }
    }, [initialData]);

    const seededRef = useRef(false);
    useEffect(() => {
      if (initialData && !seededRef.current && items.length > 0) {
        setRandomSampled(items[0].randomSampled);
        setQaName(items[0].qaName || '');
        seededRef.current = true;
      }
    }, [initialData, items]);

    const [rawWeightText, setRawWeightText] = useState<Record<number, string>>({});

    const updateItemWeight = (index: number, weight: string) => {
      // reject invalid characters outright; allow empty, digits, one optional decimal point
      if (weight !== '' && !/^\d*\.?\d*$/.test(weight)) {
        return;
      }

      // always track what the user is literally typing
      setRawWeightText((prev) => ({ ...prev, [index]: weight }));

      // only commit a numeric value to items when it actually parses to a finished number
      const parsed = parseFloat(weight);
      const next = [...items];
      next[index] = { ...next[index], weightLoaded: isNaN(parsed) ? 0 : parsed };
      setItems(next);
      onItemsChange?.(next);

      setErrors((prev) => {
        if (!prev[`weight_${index}`]) return prev;
        const nextErrors = { ...prev };
        delete nextErrors[`weight_${index}`];
        return nextErrors;
      });
    };

    const handleWeighedByChange = (text: string) => {
      setWeighedBy(text);
      const next = items.map((item) => ({ ...item, weighedBy: text }));
      setItems(next);
      onItemsChange?.(next);
      if (errors.weighedBy) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.weighedBy;
          return next;
        });
      }
    };

    const handleValidatedByChange = (text: string) => {
      setValidatedBy(text);
      const next = items.map((item) => ({ ...item, ValidatedBy: text }));
      setItems(next);
      onItemsChange?.(next);
      if (errors.validatedBy) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.validatedBy;
          return next;
        });
      }
    };

    const handleProcessTypeChange = (index: number, newProcess: 'Prepared and Loaded' | 'Oil') => {
      const next = [...items];
      next[index] = { ...next[index], processType: newProcess };
      setItems(next);
      onItemsChange?.(next);
    };

    const handleRandomSampledChange = (value: number) => {
      setRandomSampled(value);
      const next = items.map((item) => ({
        ...item,
        randomSampled: value,
        qaName: value === 1 ? item.qaName : '',
      }));
      setItems(next);
      onItemsChange?.(next);
    };

    const handleQaNameChange = (text: string) => {
      setQaName(text);
      const next = items.map((item) => ({ ...item, qaName: text }));
      setItems(next);
      onItemsChange?.(next);
      if (errors.qaName) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.qaName;
          return next;
        });
      }
    };

    const handleBarcodeScanned = (data: string) => {
      setBarcodeScannerVisible(false);
      setQaName(data);
      setRandomSampled(1);
      const next = items.map((item) => ({ ...item, qaName: data, randomSampled: 1 }));
      setItems(next);
      onItemsChange?.(next);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.qaName;
        return next;
      });
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        setItems([]);
        setBatchNo('');
        setWeighedBy('');
        setValidatedBy('');
        setRequiredError(false);
        onItemsChange?.([]);
      },
      validate: () => {
        const newErrors: Record<string, string> = {};

        if (items.length === 0) {
          setRequiredError(true);
          return false;
        }

        items.forEach((item, index) => {
          if (!item.weightLoaded || item.weightLoaded <= 0) {
            newErrors[`weight_${index}`] = 'Weight loaded is required';
          }
        });

        if (!weighedBy.trim()) {
          newErrors.weighedBy = 'Weighed by is required';
        }

        if (!validatedBy.trim()) {
          newErrors.validatedBy = 'Validated by is required';
        }

        if (randomSampled === 1 && !qaName.trim()) {
          newErrors.qaName = 'QA name is required';
        }

        setErrors(newErrors);
        setRequiredError(false);
        return Object.keys(newErrors).length === 0;
      },
      getBatchNo: () => batchNo,
      getSubDetails: () => {
        const allSubDetails: MaterialUtilizationSubDetail[] = [];
        const validKeys = new Set(
          items.map(item => `${item.itemNo}:${item.weightLoaded}`)
        );
        allocationDataMap.forEach((allocations, itemKey) => {
          if (!validKeys.has(itemKey)) return;
          allocations.forEach((row) => {
            const kgsAllocated = Number(row.KGS_ALLOCATED) || 0;
            const quantityTrans = Number(row.QUANTITY_TRANS) || 0;
            const bagTrans = Number(row.BAG_TRANS) || 0;
            const bagsOut = quantityTrans > 0
              ? (kgsAllocated / quantityTrans) * bagTrans
              : 0;
            allSubDetails.push({
              pudRowId: 0,
              qm4dRowId: Number(row.QM4DROWID) || 0,
              fromIssuanceNoId: Number(row.FROMISSUANCENOID) || 0,
              itemNo: row.ITEMNMBR || '',
              lotNumber: row.LOTNUMBER || '',
              qtyOut: kgsAllocated,
              bagsOut: bagsOut,
            });
          });
        });
        return allSubDetails;
      },
    }));

    const isDetailMode = Boolean(initialData);

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
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Required Weight</Text>
              <Text style={[styles.detailValue, { color: colors.preparing }]}>{item.requiredWeight} kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Weight Loaded <Text style={{ color: colors.error, fontSize: 15 }}>*</Text></Text>
              {isDetailMode ? (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor: errors[`weight_${index}`] ? colors.error : colors.cardBorder,
                        backgroundColor: colors.background,
                        height: 44,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text, fontSize: 16 }]}
                      value={rawWeightText[index] ?? (item.weightLoaded ? String(item.weightLoaded) : '')}
                      placeholder="0.00"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                      onChangeText={(text) => updateItemWeight(index, text)}
                    />
                  </View>
                  {errors[`weight_${index}`] ? (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors[`weight_${index}`]}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>{item.weightLoaded} kg</Text>
              )}
            </View>

          </View>

          <View style={styles.detailsRow}>
            <View style={[styles.detailItem, isDetailMode && styles.detailProcessItem]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Process</Text>
              {isDetailMode ? (
                <View style={[styles.detailToggleContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[
                      styles.detailToggleOption,
                      item.processType === 'Prepared and Loaded' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleProcessTypeChange(index, 'Prepared and Loaded')}
                  >
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={18}
                      color={item.processType === 'Prepared and Loaded' ? '#fff' : colors.textSecondary}
                      style={styles.detailToggleIcon}
                    />
                    <Text
                      style={[
                        styles.detailToggleOptionText,
                        { color: item.processType === 'Prepared and Loaded' ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      Prepared and Loaded
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.detailToggleOption,
                      item.processType === 'Oil' && { backgroundColor: colors.warning },
                    ]}
                    onPress={() => handleProcessTypeChange(index, 'Oil')}
                  >
                    <MaterialCommunityIcons
                      name="oil"
                      size={18}
                      color={item.processType === 'Oil' ? '#fff' : colors.textSecondary}
                      style={styles.detailToggleIcon}
                    />
                    <Text
                      style={[
                        styles.detailToggleOptionText,
                        { color: item.processType === 'Oil' ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      Oil
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
              )}
            </View>
            {!isDetailMode && (
              <>
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
                    {item.randomSampled === 1 && item.qaName ? (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>QA Name</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{item.qaName}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </View>

          {tagEnabled && isAdmin && (() => {
            const itemKey = `${item.itemNo}:${item.weightLoaded}`;
            const itemAllocationData = allocationDataMap.get(itemKey) || [];
            const isLoading = loadingAllocationMap.has(itemKey);
            return (
              <View style={styles.allocationSection}>
                <Text style={[styles.allocationTitle, { color: colors.text }]}>
                  Stock Allocation (Admin View Only)
                </Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.allocationLoading} />
                ) : itemAllocationData.length > 0 ? (
                  <View style={[styles.allocationTable, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={[styles.allocationHeader, { borderBottomColor: colors.cardBorder, backgroundColor: colors.background }]}>
                      <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>LOT NO.</Text>
                      <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>BALANCE</Text>
                      <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>ALLOCATED</Text>
                      <Text style={[styles.allocationHeaderText, { color: colors.textTertiary }]}>REMAINING</Text>
                    </View>
                    {itemAllocationData.map((row, i) => (
                      <View
                        key={row.QM4DROWID}
                        style={[
                          styles.allocationRow,
                          { borderBottomColor: colors.cardBorder },
                          i % 2 === 1 && { backgroundColor: colors.background },
                        ]}
                      >
                        <Text style={[styles.allocationCell, { color: colors.text }]}>{row.LOTNUMBER || '—'}</Text>
                        <Text style={[styles.allocationCell, { color: colors.textSecondary }]}>{formatKg(row.BALANCE)}</Text>
                        <Text style={[styles.allocationCell, { color: colors.success }]}>{formatKg(row.KGS_ALLOCATED)}</Text>
                        <Text style={[styles.allocationCell, { color: colors.text }]}>{formatKg(row.REMAINING_QTY)}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.allocationEmpty, { color: colors.textSecondary }]}>
                    No allocation data available for the selected item.
                  </Text>
                )}
              </View>
            );
          })()}
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.batchNoHeader}>
          <Text style={[styles.batchNoHeader, { color: colors.primary }]}>
            Usage No: PMU-<Text style={{ fontWeight: '900' }}>{initialData?.usageRefNo ?? 0}</Text>
          </Text>
          <Text style={[styles.batchNoHeader, { color: colors.primary }]}>
            Batch No: <Text style={{ fontWeight: '900' }}>{batchNo || 0}</Text>
          </Text>
        </View>
        {!isDetailMode && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Material Details
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.textSecondary }]}
            >
              Record material usage based on the selected formulation.
            </Text>

            {tagLoading && (
              <View style={styles.tagLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.tagLoadingText, { color: colors.textSecondary }]}>
                  Loading stock allocation data…
                </Text>
              </View>
            )}

            {requiredError && (
              <View style={[styles.requiredErrorContainer, { backgroundColor: colors.error + '14' }]}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.requiredErrorText, { color: colors.error }]}>
                  Please add at least one material before submitting.
                </Text>
              </View>
            )}

            {/*  */}
          </View>
        )}

        {items.length > 0 && (
          <View style={[styles.itemsListContainer, isDetailMode && styles.detailViewContainer]}>
            {!isDetailMode && (
              <Text style={[styles.itemsListTitle, { color: colors.text }]}>
                Added Materials ({items.length})
              </Text>
            )}
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.itemsListContent}
            />
          </View>
        )}

        {isDetailMode && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Material Details
              </Text>
            </View>
            <View style={styles.rowContainer}>
              <View style={[styles.weightColumn, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Weighed By <Text style={{ color: colors.error, fontSize: 15 }}>*</Text></Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: errors.weighedBy ? colors.error : colors.cardBorder,
                      backgroundColor: colors.background,
                    }
                  ]}
                >
                  <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={weighedBy}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textTertiary}
                    onChangeText={handleWeighedByChange}
                  />
                </View>
                {errors.weighedBy ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{errors.weighedBy}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.weightColumn, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Validated By <Text style={{ color: colors.error, fontSize: 15 }}>*</Text></Text>
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
                  <MaterialCommunityIcons name="shield-account-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={validatedBy}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textTertiary}
                    onChangeText={handleValidatedByChange}
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

            <View style={styles.rowContainer}>
              <View style={[styles.weightColumn, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Random Sampled</Text>
                </View>
                <View
                  style={[
                    styles.switchContainer,
                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                  ]}
                >
                  <Switch
                    value={randomSampled === 1}
                    onValueChange={(value) => handleRandomSampledChange(value ? 1 : 0)}
                    trackColor={{ false: colors.textSecondary + '40', true: colors.success }}
                    thumbColor="#ffffff"
                    style={styles.switch}
                  />
                  <Text
                    style={[
                      styles.switchValueText,
                      { color: randomSampled === 1 ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {randomSampled === 1 ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>

              {randomSampled === 1 && (
                <View style={[styles.weightColumn, { flex: 2 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>QA Name <Text style={{ color: colors.error, fontSize: 15 }}>*</Text></Text>
                  </View>
                  <View style={styles.qaRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        { borderColor: errors.qaName ? colors.error : colors.cardBorder, backgroundColor: colors.background, flex: 1 },
                      ]}
                    >
                      <MaterialCommunityIcons name="account" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={qaName}
                        placeholder="Scan or enter QA name"
                        placeholderTextColor={colors.textTertiary}
                        onChangeText={handleQaNameChange}
                      />
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
                  {errors.qaName ? (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                      <Text style={[styles.errorText, { color: colors.error }]}>{errors.qaName}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        )}

        <BarcodeScanner
          visible={barcodeScannerVisible}
          onClose={() => setBarcodeScannerVisible(false)}
          onScan={handleBarcodeScanned}
          title="Scan QA Barcode"
        />
      </View>
    );
  }
);

MaterialUtilizationDetails.displayName = 'MaterialUtilizationDetails';

const styles = StyleSheet.create({
  container: {
    // marginBottom: 16,
    // marginTop: 16,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batchNoHeader: {
    fontSize: 25,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tagLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tagLoadingText: {
    fontSize: 13,
  },
  card: {
    marginTop: 20,
    borderRadius: 20,
    borderTopWidth: 1,
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
    paddingVertical: 3,
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
    // marginBottom: 16,
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
    gap: 8,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 22,
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  detailItem: {
    minWidth: '30%',
    marginBottom: 12,
  },
  detailProcessItem: {
    width: '100%',
    minWidth: '100%',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  detailToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  detailToggleOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailToggleIcon: {
    marginRight: 6,
  },
  detailToggleOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  switchValueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  processBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  processBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sampledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sampledBadgeText: {
    fontSize: 16,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  allocationHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
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
    paddingVertical: 12,
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
  detailViewContainer: {
    marginTop: 16,
  },
});
