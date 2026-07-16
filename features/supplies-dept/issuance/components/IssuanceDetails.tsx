/**
 * Supplies Issuance Details
 * Form for selecting item codes and quantities, and listing added items.
 */

import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
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
import { useAuth } from '@/features/auth/context/AuthContext';

interface IssuanceDetailsProps {
  company?: string;
  onItemsChange?: (items: IssuanceLineItem[]) => void;
}

export interface IssuanceLineItem {
  itemCode: string;
  description: string;
  quantity: string;
}

export function IssuanceDetails({ company: companyProp, onItemsChange }: IssuanceDetailsProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();
  const company = companyProp || user?.COMPANY;

  const [itemCodeOptions, setItemCodeOptions] = useState<DropdownOption[]>([]);
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<IssuanceLineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadItemCodes();
  }, [company]);

  const loadItemCodes = async () => {
    try {
      const options = await IssuanceService.getInstance().getItemCodes(company);
      setItemCodeOptions(options);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch item codes.');
    }
  };

  const handleAdd = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedItemCode) {
      newErrors.itemCode = 'Item code is required';
    }

    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Enter a valid quantity';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedOption = itemCodeOptions.find(
      (option) => option.value === selectedItemCode
    );
    const description = selectedOption?.label.split(' - ')[1] || '';

    const newItem: IssuanceLineItem = {
      itemCode: selectedItemCode,
      description,
      quantity: quantity.trim(),
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onItemsChange?.(updatedItems);

    setSelectedItemCode('');
    setQuantity('');
    setErrors({});
  };

  const handleRemove = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onItemsChange?.(updatedItems);
  };

  const renderItem = ({ item, index }: { item: IssuanceLineItem; index: number }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleContainer}>
          <Text style={[styles.itemCode, { color: colors.text }]}>
            {item.itemCode}
          </Text>
          <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.error + '14' }]}
          onPress={() => handleRemove(index)}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.itemFooter}>
        <View style={styles.quantityContainer}>
          <MaterialCommunityIcons name="numeric" size={18} color={colors.textSecondary} />
          <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Qty:</Text>
          <Text style={[styles.quantityValue, { color: colors.text }]}>{item.quantity}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        {/* Item Code Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Item Code <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
          </Text>
          <ItemCodeDropdown
            options={itemCodeOptions}
            selectedValue={selectedItemCode}
            onSelect={setSelectedItemCode}
            error={errors.itemCode}
            colors={colors}
          />
        </View>

        {/* Quantity Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Quantity <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
          </Text>
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

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Item</Text>
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
    </View>
  );
}

function ItemCodeDropdown({
  options,
  selectedValue,
  onSelect,
  error,
  colors,
}: {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  error?: string;
  colors: typeof Colors.light;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<View>(null);
  const selected = options.find((o) => o.value === selectedValue);

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
    <View>
      <View ref={triggerRef}>
        <TouchableOpacity
          style={[
            styles.inputContainer,
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
          <MaterialCommunityIcons name="barcode" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <Text
            style={[
              styles.dropdownText,
              { color: selected ? colors.text : colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : 'Select item code'}
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
                  {selectedValue === option.value && (
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
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
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
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
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
