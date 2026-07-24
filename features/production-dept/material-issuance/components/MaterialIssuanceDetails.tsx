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
  View
} from 'react-native';
import { ItemCodeModal } from '../components/ItemCodeModal';
import { DropdownOption, MaterialIssuanceService } from '../services/materialIssuanceService';
import {
  MaterialIssuanceLineItem,
  MaterialQuantityAllocation,
} from '../types/materialIssuance.types';

export interface MaterialIssuanceDetailsRef {
  clear: () => void;
  refreshItemQuantities: () => Promise<void>;
  validate: () => boolean;
}

interface MaterialIssuanceDetailsProps {
  value?: MaterialIssuanceLineItem[];
  onItemsChange?: (items: MaterialIssuanceLineItem[]) => void;
}

export const MaterialIssuanceDetails = forwardRef<MaterialIssuanceDetailsRef, MaterialIssuanceDetailsProps>(
  ({ value, onItemsChange }, ref) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [itemCodeOptions, setItemCodeOptions] = useState<DropdownOption[]>([]);
    const [selectedItemCode, setSelectedItemCode] = useState('');
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [items, setItems] = useState<MaterialIssuanceLineItem[]>(value ?? []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [requiredError, setRequiredError] = useState(false);

    const selectedItem = itemCodeOptions.find((o) => o.value === selectedItemCode);

    useEffect(() => {
      loadItemCodes();
    }, []);

    useEffect(() => {
      if (value !== undefined) {
        setItems(value);
      }
    }, [value]);

    useEffect(() => {
      if (items.length > 0) {
        setRequiredError(false);
      }
    }, [items]);

    const loadItemCodes = async () => {
      try {
        const options = await MaterialIssuanceService.getInstance().getItemCodes(user?.COMPANY);
        setItemCodeOptions(options);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch item codes.');
      }
    };

    const handleAdd = async () => {
      const newErrors: Record<string, string> = {};

      if (!selectedItemCode) {
        newErrors.itemCode = 'Item code is required';
      } else if (editIndex === null && items.some((item) => item.itemCode === selectedItemCode)) {
        newErrors.itemCode = 'Item code already added';
      }

      const quantityValue = Number(quantity);

      if (!quantity.trim() || isNaN(quantityValue) || quantityValue <= 0) {
        newErrors.quantity = 'Enter a valid quantity';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const selectedOption = itemCodeOptions.find((option) => option.value === selectedItemCode);
      const description = selectedOption?.label.split(' - ')[1] || '';

      let allocations: MaterialQuantityAllocation[] = [];
      try {
        allocations = await MaterialIssuanceService.getInstance().getAssignQuantityAllocation(
          selectedItemCode,
          quantityValue,
          user?.COMPANY
        );
      } catch (error) {
        allocations = [];
      }

      const newItem: MaterialIssuanceLineItem = {
        itemCode: selectedItemCode,
        description,
        quantity: quantity.trim(),
        allocations,
      };

      let updatedItems: MaterialIssuanceLineItem[];
      if (editIndex !== null) {
        updatedItems = items.map((item, i) => (i === editIndex ? newItem : item));
      } else {
        updatedItems = [...items, newItem];
      }
      setItems(updatedItems);
      onItemsChange?.(updatedItems);

      setSelectedItemCode('');
      setQuantity('');
      setErrors({});
      setEditIndex(null);
    };

    const handleEdit = (index: number) => {
      const item = items[index];
      if (!item) return;
      setSelectedItemCode(item.itemCode);
      setQuantity(item.quantity);
      setEditIndex(index);
    };

    const handleRemove = (index: number) => {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
    };

    const renderItem = ({ item, index }: { item: MaterialIssuanceLineItem; index: number }) => {
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
              <Text style={[styles.itemCode, { color: colors.text }]}>{item.itemCode}</Text>
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
          </View>
        </View>
      );
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        setItems([]);
        setSelectedItemCode('');
        setQuantity('');
        setErrors({});
        setEditIndex(null);
        setRequiredError(false);
        onItemsChange?.([]);
      },
      refreshItemQuantities: async () => {
        if (items.length === 0) return;
        const updatedItems = [...items];
        const uniqueItemCodes = [...new Set(updatedItems.map((item) => item.itemCode))];
        for (const itemCode of uniqueItemCodes) {
          const existingItem = updatedItems.find((i) => i.itemCode === itemCode);
          if (!existingItem) continue;
          try {
            const allocations = await MaterialIssuanceService.getInstance().getAssignQuantityAllocation(
              itemCode,
              Number(existingItem.quantity) || 0,
              user?.COMPANY
            );
            const itemIndex = updatedItems.findIndex((i) => i.itemCode === itemCode);
            if (itemIndex !== -1) {
              updatedItems[itemIndex] = { ...updatedItems[itemIndex], allocations };
            }
          } catch (error) {
            console.error(`Failed to refresh quantities for item ${itemCode}:`, error);
          }
        }
        setItems(updatedItems);
        onItemsChange?.(updatedItems);
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

    return (
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Item Details
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Add item codes and quantities for this material issuance.
          </Text>

          {requiredError && (
            <View style={[styles.requiredErrorContainer, { backgroundColor: colors.error + '14' }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.requiredErrorText, { color: colors.error }]}>
                Please add at least one item before submitting.
              </Text>
            </View>
          )}

          {/* Item Code Selection */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Item Code</Text>
              <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
            </View>
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
          </View>

          {/* Quantity Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
              <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: errors.quantity ? colors.error : colors.cardBorder,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <MaterialCommunityIcons name="numeric" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={quantity}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onChangeText={(text) => {
                  setQuantity(text);
                  if (errors.quantity) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.quantity;
                      return next;
                    });
                  }
                }}
              />
            </View>
            {errors.quantity ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.quantity}</Text>
              </View>
            ) : null}
          </View>

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
            setErrors((prev) => {
              if (!prev.itemCode) return prev;
              const next = { ...prev };
              delete next.itemCode;
              return next;
            });
          }}
          onClose={() => setItemModalVisible(false)}
        />
      </View>
    );
  }
);

MaterialIssuanceDetails.displayName = 'MaterialIssuanceDetails';

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
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
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
});
