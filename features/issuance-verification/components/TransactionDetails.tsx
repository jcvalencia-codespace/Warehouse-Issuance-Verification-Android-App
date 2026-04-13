/**
 * Transaction Details Component
 * Form fields for transaction reference, area selection, and item number
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { issuanceService } from '../services/issuanceService';
import { AreaOption, FormErrors, IssuanceVerificationFormData } from '../types/issuance.types';
import { AllocationTable } from './AllocationTable';

interface TransactionDetailsProps {
  colors: any;
  isTablet: boolean;
  formData: IssuanceVerificationFormData;
  errors: FormErrors;
  filteredAreaOptions: AreaOption[];
  itemOptions: AreaOption[];
  lotOptions: AreaOption[];
  filteredLotOptions: AreaOption[];
  selectedAreaLabel: string | null;
  showAreaPicker: boolean;
  showItemPicker: boolean;
  showLotPicker: boolean;
  isLoadingItems: boolean;
  isLoadingLots: boolean;
  areaSearchQuery: string;
  itemSearchQuery: string;
  lotSearchQuery: string;
  onFormDataChange: (data: Partial<IssuanceVerificationFormData>) => void;
  onErrorsChange: (errors: Partial<FormErrors>) => void;
  onShowAreaPickerChange: (show: boolean) => void;
  onShowItemPickerChange: (show: boolean) => void;
  onShowLotPickerChange: (show: boolean) => void;
  onAreaSearchQueryChange: (query: string) => void;
  onItemSearchQueryChange: (query: string) => void;
  onLotSearchQueryChange: (query: string) => void;
  onItemOptionsChange: (items: AreaOption[]) => void;
  onLotOptionsChange: (items: AreaOption[]) => void;
  onFilteredLotOptionsChange: (items: AreaOption[]) => void;
  onIsLoadingItemsChange: (loading: boolean) => void;
  onIsLoadingLotsChange: (loading: boolean) => void;
  onAvailableLotsLoaded: (lots: any[]) => void;
  selectedItemNumber?: string;
  onItemSelect?: (itemNumber: string, itemRemarks?: string) => void;
  showItemColumn?: boolean;
  // Quantity props
  isAllocating: boolean;
  allocationResults: any[];
  currentPage: number;
  totalPages: number;
  paginatedResults: any[];
  onNumberOfBagsChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  palletWeightInputRaw?: string;
  onPalletWeightChange: (value: string) => void;
  weightInputRaw?: string;
  onCalculateAllocation: () => void;
  onPageChange: (page: number) => void;
  isViewingAvailableLots?: boolean;
  scrollToField?: (fieldName: string) => void;
  onScanForkliftOperator?: () => void;
}

export function TransactionDetails({
  colors,
  isTablet,
  formData,
  errors,
  filteredAreaOptions,
  itemOptions,
  lotOptions,
  filteredLotOptions,
  selectedAreaLabel,
  showAreaPicker,
  showItemPicker,
  showLotPicker,
  isLoadingItems,
  isLoadingLots,
  areaSearchQuery,
  itemSearchQuery,
  lotSearchQuery,
  onFormDataChange,
  onErrorsChange,
  onShowAreaPickerChange,
  onShowItemPickerChange,
  onShowLotPickerChange,
  onAreaSearchQueryChange,
  onItemSearchQueryChange,
  onLotSearchQueryChange,
  onItemOptionsChange,
  onLotOptionsChange,
  onFilteredLotOptionsChange,
  onIsLoadingItemsChange,
  onIsLoadingLotsChange,
  onAvailableLotsLoaded,
  selectedItemNumber,
  onItemSelect,
  showItemColumn = true,
  // Quantity props
  isAllocating,
  allocationResults,
  currentPage,
  totalPages,
  paginatedResults,
  onNumberOfBagsChange,
  onWeightChange,
  palletWeightInputRaw = '',
  onPalletWeightChange,
  weightInputRaw = '',
  onCalculateAllocation,
  onPageChange,
  isViewingAvailableLots = false,
  scrollToField,
  onScanForkliftOperator,
}: TransactionDetailsProps) {
  return (
    <>
      {/* Transaction Details Card */}
      <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transaction Details</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary, fontStyle: 'italic', marginLeft: 4 }]}>(Enter the issuance verification information below) </Text>
        {/* Reference Numbers Row */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Reference Numbers
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>
          <View style={styles.referenceRow}>
            {/* Issuance Reference Number */}
            <View style={styles.referenceField}>
              <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>
                Issuance Ref #
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.referenceInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.issuanceRefNumber ? colors.error : colors.cardBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 123456789"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.issuanceRefNumber}
                  readOnly
                  onChangeText={(text) => {
                    onFormDataChange({ issuanceRefNumber: text });
                    if (errors.issuanceRefNumber) {
                      onErrorsChange({ issuanceRefNumber: undefined });
                    }
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {formData.issuanceRefNumber ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.success}
                  />
                ) : null}
              </View>
              {errors.issuanceRefNumber && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={12} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.issuanceRefNumber}
                  </Text>
                </View>
              )}
            </View>

            {/* Transaction Reference Number */}
            <View style={styles.referenceField}>
              <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>
                Transaction Ref #
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.referenceInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.transactionRefNumber ? colors.error : colors.cardBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 123456789"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.transactionRefNumber}
                  readOnly
                  onChangeText={(text) => {
                    onFormDataChange({ transactionRefNumber: text });
                    if (errors.transactionRefNumber) {
                      onErrorsChange({ transactionRefNumber: undefined });
                    }
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {formData.transactionRefNumber ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.success}
                  />
                ) : null}
              </View>
              {errors.transactionRefNumber && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={12} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.transactionRefNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Floor Scale */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Floor Scale
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                {
                  backgroundColor: formData.floorScale === 'PAWHRM-FS1' ? colors.primary + '20' : colors.background,
                  borderColor: errors.floorScale ? colors.error : (formData.floorScale === 'PAWHRM-FS1' ? colors.primary : colors.cardBorder),
                },
              ]}
              onPress={() => {
                onFormDataChange({ floorScale: 'PAWHRM-FS1', transType: 'RECV FROM WHSE - FS1 APP' });
                if (errors.floorScale) {
                  onErrorsChange({ floorScale: undefined });
                }
              }}
            >
              <MaterialCommunityIcons
                name={formData.floorScale === 'PAWHRM-FS1' ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={formData.floorScale === 'PAWHRM-FS1' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.radioLabel, { color: colors.text }]}>Floor Scale 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                {
                  backgroundColor: formData.floorScale === 'PAWHRM-FS2' ? colors.primary + '20' : colors.background,
                  borderColor: errors.floorScale ? colors.error : (formData.floorScale === 'PAWHRM-FS2' ? colors.primary : colors.cardBorder),
                },
              ]}
              onPress={() => {
                onFormDataChange({ floorScale: 'PAWHRM-FS2',  transType: 'RECV FROM WHSE - FS2 APP' });
                if (errors.floorScale) {
                  onErrorsChange({ floorScale: undefined });
                }
              }}
            >
              <MaterialCommunityIcons
                name={formData.floorScale === 'PAWHRM-FS2' ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={formData.floorScale === 'PAWHRM-FS2' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.radioLabel, { color: colors.text }]}>Floor Scale 2</Text>
            </TouchableOpacity>
          </View>
          {errors.floorScale && (
            <View style={[styles.errorContainer, { marginTop: 8 }]}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.floorScale}</Text>
            </View>
          )}
        </View>

        {/* Item Number Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Item Number
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.inputContainer,
              styles.dropdownContainer,
              {
                backgroundColor: colors.background,
                borderColor: errors.itemNumber ? colors.error : colors.cardBorder,
              },
            ]}
            onPress={() => {
              onShowItemPickerChange(!showItemPicker);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="package-variant"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.dropdownText,
                { color: formData.itemNumber ? colors.text : colors.textTertiary },
              ]}
            >
              {(() => {
                const selectedItem = itemOptions.find(opt => 
                  opt.label === formData.itemNumber && 
                  (formData.itemRemarks === '' ? !opt.remarks : opt.remarks === formData.itemRemarks)
                );
                if (selectedItem && selectedItem.remarks && selectedItem.remarks.trim()) {
                  return `${selectedItem.label}-${selectedItem.remarks}`;
                }
                if (formData.itemRemarks && formData.itemRemarks.trim()) {
                  return `${formData.itemNumber}-${formData.itemRemarks}`;
                }
                return formData.itemNumber || 'Select item';
              })()}
            </Text>
            <MaterialCommunityIcons
              name={showItemPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showItemPicker && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <View style={[styles.searchInputContainer, { borderBottomColor: colors.divider }]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search item..."
                  placeholderTextColor={colors.textTertiary}
                  value={itemSearchQuery}
                  onChangeText={onItemSearchQueryChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {itemSearchQuery ? (
                  <Pressable onPress={() => onItemSearchQueryChange('')}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {(() => {
                  const filteredItems = itemSearchQuery
                    ? itemOptions.filter(option =>
                      option.label.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                      option.value.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                      (option.remarks && option.remarks.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                    )
                    : itemOptions;

                  return filteredItems.length > 0 ? (
                    filteredItems.map((option, index) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          index !== filteredItems.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.divider,
                          },
                          formData.itemNumber === option.label && 
                          ((!formData.itemRemarks && !option.remarks) || formData.itemRemarks === option.remarks) && {
                            backgroundColor: colors.primary + '10',
                          },
                        ]}
                        onPress={() => {
                          const baseItemNumber = option.label;
                          onFormDataChange({ 
                            itemNumber: baseItemNumber, 
                            itemRemarks: option.remarks || '',
                            area: '',
                            lotNumber: '' 
                          });
                          onShowItemPickerChange(false);
                          if (errors.itemNumber) {
                            onErrorsChange({ itemNumber: undefined });
                          }
                        }}
                      >
                        <View style={styles.dropdownOptionContent}>
                          <MaterialCommunityIcons
                            name="package-variant"
                            size={18}
                            color={formData.itemNumber === option.label && 
                            ((!formData.itemRemarks && !option.remarks) || formData.itemRemarks === option.remarks) 
                              ? colors.primary : colors.textSecondary}
                            style={styles.dropdownOptionIcon}
                          />
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              {
                                color: formData.itemNumber === option.label && 
                                ((!formData.itemRemarks && !option.remarks) || formData.itemRemarks === option.remarks) 
                                  ? colors.primary : colors.text,
                                fontWeight: formData.itemNumber === option.label && 
                                ((!formData.itemRemarks && !option.remarks) || formData.itemRemarks === option.remarks) 
                                  ? '600' : '400',
                              },
                            ]}
                          >
                            {option.remarks && option.remarks.trim() 
                              ? `${option.label}-${option.remarks}` 
                              : option.label}
                          </Text>
                        </View>
                        {formData.itemNumber === option.label && 
                        ((!formData.itemRemarks && !option.remarks) || formData.itemRemarks === option.remarks) && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={colors.primary}
                            style={{ marginLeft: 'auto' }}
                          />
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.emptyDropdown}>
                      <MaterialCommunityIcons
                        name="magnify-close"
                        size={32}
                        color={colors.textTertiary}
                      />
                      <Text style={[styles.emptyDropdownText, { color: colors.textTertiary }]}>
                        {itemSearchQuery ? 'No items match your search' : 'No items available'}
                      </Text>
                    </View>
                  );
                })()}
              </ScrollView>
            </View>
          )}
          {errors.itemNumber && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.itemNumber}</Text>
            </View>
          )}
        </View>

        {/* Area Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Area / Location
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.inputContainer,
              styles.dropdownContainer,
              {
                backgroundColor: colors.background,
                borderColor: errors.area ? colors.error : (formData.itemNumber ? colors.cardBorder : colors.textTertiary),
                opacity: formData.itemNumber ? 1 : 0.5,
              },
            ]}
            onPress={() => formData.itemNumber && onShowAreaPickerChange(!showAreaPicker)}
            activeOpacity={0.7}
            disabled={!formData.itemNumber}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.dropdownText,
                { color: formData.area ? colors.text : colors.textTertiary },
              ]}
            >
              {formData.itemNumber ? (selectedAreaLabel || 'Select warehouse area') : 'Select item first'}
            </Text>
            <MaterialCommunityIcons
              name={formData.itemNumber ? (showAreaPicker ? 'chevron-up' : 'chevron-down') : 'lock'}
              size={20}
              color={formData.itemNumber ? colors.textSecondary : colors.textTertiary}
            />
          </TouchableOpacity>

          {showAreaPicker && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              {/* Search Input */}
              <View style={[styles.searchInputContainer, { borderBottomColor: colors.divider }]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search area..."
                  placeholderTextColor={colors.textTertiary}
                  value={areaSearchQuery}
                  onChangeText={onAreaSearchQueryChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {areaSearchQuery ? (
                  <Pressable onPress={() => onAreaSearchQueryChange('')}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                ) : null}
              </View>

              {/* Scrollable Options List */}
              <ScrollView
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {filteredAreaOptions.length > 0 ? (
                  filteredAreaOptions.map((option, index) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        index !== filteredAreaOptions.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.divider,
                        },
                        formData.area === option.value && {
                          backgroundColor: colors.primary + '10',
                        },
                      ]}
onPress={() => {
                        onFormDataChange({ area: option.value, lotNumber: '' });
                        onShowAreaPickerChange(false);
                        // Fetch lots for the selected area and item (full details for allocation)
                        onIsLoadingLotsChange(true);
                        issuanceService.getLotsByAreaAndItem(option.value, formData.itemNumber, formData.itemRemarks || undefined)
                          .then(response => {
                            if (response.success && response.data) {
                              onAvailableLotsLoaded(response.data);
                              const lotsForPicker = response.data.map((lot: any) => ({
                                label: lot.LOTNUMBER,
                                value: lot.LOTNUMBER,
                                itemNumber: lot.ITEMNMBR,
                                remarks: lot.REMARKS
                              }));
                              onLotOptionsChange(lotsForPicker);
                              onFilteredLotOptionsChange(lotsForPicker);
                            }
                            onIsLoadingLotsChange(false);
                          })
                          .catch(err => {
                            console.error('Error fetching available lots:', err);
                            onIsLoadingLotsChange(false);
                          });
                        if (errors.area) {
                           onErrorsChange({ area: undefined });
                       }
                       }}
                     >
                       <MaterialCommunityIcons
                         name="warehouse"
                         size={18}
                        color={formData.area === option.label ? colors.primary : colors.textSecondary}
                        style={styles.dropdownOptionIcon}
                      />
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          {
                            color: formData.area === option.label ? colors.primary : colors.text,
                            fontWeight: formData.area === option.label ? '600' : '400',
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {/* </View> */}
                      {formData.area === option.value && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={colors.primary}
                          style={{ marginLeft: 'auto' }}
                        />
                      )}
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyDropdown}>
                    <MaterialCommunityIcons
                      name="magnify-close"
                      size={32}
                      color={colors.textTertiary}
                    />
                    <Text style={[styles.emptyDropdownText, { color: colors.textTertiary }]}>
                      {areaSearchQuery ? 'No areas match your search' : 'No areas available'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          {errors.area && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.area}</Text>
            </View>
          )}
        </View>

        {/* Lot Number Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Lot Number
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.inputContainer,
              styles.dropdownContainer,
              {
                backgroundColor: colors.background,
                borderColor: errors.lotNumber ? colors.error : colors.cardBorder,
              },
            ]}
            onPress={() => {
              if (formData.area && formData.itemNumber) {
                onShowLotPickerChange(!showLotPicker);
              }
            }}
            activeOpacity={0.7}
            disabled={!formData.area || !formData.itemNumber}
          >
            <MaterialCommunityIcons
              name="barcode"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.dropdownText,
                { color: formData.lotNumber ? colors.text : colors.textTertiary },
              ]}
            >
              {formData.lotNumber || 'Select lot number'}
            </Text>
            {formData.area && formData.itemNumber && (
              <MaterialCommunityIcons
                name={showLotPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          {showLotPicker && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              {/* Search Input */}
              <View style={[styles.searchInputContainer, { borderBottomColor: colors.divider }]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search lot..."
                  placeholderTextColor={colors.textTertiary}
                  value={lotSearchQuery}
                  onChangeText={onLotSearchQueryChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {lotSearchQuery ? (
                  <Pressable onPress={() => onLotSearchQueryChange('')}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                ) : null}
              </View>

              {/* Scrollable Options List */}
              <ScrollView
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {(() => {
                  const filteredLots = lotSearchQuery
                    ? filteredLotOptions.filter(option =>
                        option.label.toLowerCase().includes(lotSearchQuery.toLowerCase()) ||
                        option.value.toLowerCase().includes(lotSearchQuery.toLowerCase())
                      )
                    : filteredLotOptions;

                  return filteredLots.length > 0 ? (
                    filteredLots.map((option, index) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          index !== filteredLots.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.divider,
                          },
                          formData.lotNumber === option.value && {
                            backgroundColor: colors.primary + '10',
                          },
                        ]}
                        onPress={() => {
                          onFormDataChange({ lotNumber: option.value });
                          onShowLotPickerChange(false);
                          if (errors.lotNumber) {
                            onErrorsChange({ lotNumber: undefined });
                          }
                        }}
                      >
                        <MaterialCommunityIcons
                          name="barcode"
                          size={18}
                          color={formData.lotNumber === option.value ? colors.primary : colors.textSecondary}
                          style={styles.dropdownOptionIcon}
                        />
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            {
                              color: formData.lotNumber === option.value ? colors.primary : colors.text,
                              fontWeight: formData.lotNumber === option.value ? '600' : '400',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {formData.lotNumber === option.value && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={colors.primary}
                            style={{ marginLeft: 'auto' }}
                          />
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.emptyDropdown}>
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={32}
                        color={colors.textTertiary}
                      />
                      <Text style={[styles.emptyDropdownText, { color: colors.textTertiary }]}>
                        {lotSearchQuery ? 'No lots match your search' : 'No lots available for selected item'}
                      </Text>
                    </View>
                  );
                })()}
              </ScrollView>
            </View>
          )}
          {errors.lotNumber && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.lotNumber}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quantity Card */}
      <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quantity Information
        </Text>
        {/* <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Specify the bag count and weight
        </Text> */}

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.column]}>
            <Text style={[styles.label, { color: colors.text }]}>Pallet Weight
              <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.palletWeight ? colors.error : colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="forklift"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                value={palletWeightInputRaw}
                onChangeText={onPalletWeightChange}
                keyboardType="numeric"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>pallet kg</Text>
            </View>
            {errors.palletWeight && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.palletWeight}</Text>
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, styles.column]}>
            <Text style={[styles.label, { color: colors.text }]}>Number of Bags
              <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.numberOfBags ? colors.error : colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="package-variant"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={formData.numberOfBags?.toString() || ''}
                onChangeText={onNumberOfBagsChange}
                keyboardType="number-pad"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>bags</Text>
            </View>
            {errors.numberOfBags && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.numberOfBags}</Text>
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, styles.column]}>
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg)
              <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.weightInKg ? colors.error : colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="scale-bathroom"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                value={weightInputRaw || formData.weightInKg?.toString() || ''}
                onChangeText={onWeightChange}
                keyboardType="numeric"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>kg</Text>
            </View>
            {errors.weightInKg && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.weightInKg}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Summary - 3 Columns: Bags, Allocated Weight, Avg Weight */}
        {formData.numberOfBags && (
          <View style={[styles.quickSummaryGrid, { backgroundColor: 'orange' + '10', borderColor: 'orange' }]}>
            <View style={styles.quickSummaryCol}>
              <MaterialCommunityIcons
                name="scale-bathroom"
                size={30}
                color={'orange'}
              />
              <Text style={[styles.quickSummaryLabel, { color: 'orange' }]}>RM TO ISSUE</Text>
              <Text style={[styles.quickSummaryValue, { color: 'orange' }]}>
                {(() => {
                  const allocatedItems = allocationResults.filter((item: any) => item.KGS !== null);
                  const totalAllocatedKgs = allocatedItems.reduce((sum: number, item: any) => sum + (item.KGS || 0), 0);
                  return totalAllocatedKgs > 0 ? totalAllocatedKgs.toFixed(2) : '-';
                })()}
              </Text>
            </View>
            <View style={styles.quickSummaryCol}>
              <MaterialCommunityIcons
                name="package-variant"
                size={30}
                color={'orange'}
              />
              <Text style={[styles.quickSummaryLabel, { color: 'orange' }]}>PREP TO RECEIVE</Text>
              <Text style={[styles.quickSummaryValue, { color: 'orange' }]}>
                {(formData.weightInKg || 0) - (formData.palletWeight || 0)}
              </Text>
            </View>
            
          </View>
        )}

        {/* Forklift Operator */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Forklift Operator
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>
          <View style={styles.forkliftRow}>
            <View
              style={[
                styles.inputContainer,
                styles.forkliftInput,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.forkliftOperator ? colors.error : colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter forklift operator name"
                placeholderTextColor={colors.textTertiary}
                value={formData.forkliftOperator || ''}
                onChangeText={(text) => {
                  onFormDataChange({ forkliftOperator: text });
                  if (errors.forkliftOperator) {
                    onErrorsChange({ forkliftOperator: undefined });
                  }
                }}
                autoCapitalize="words"
                readOnly
              />
            </View>
            {onScanForkliftOperator && (
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={onScanForkliftOperator}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="barcode-scan"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
          {errors.forkliftOperator && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.forkliftOperator}</Text>
            </View>
          )}
        </View>

        {/* Allocation Error Display */}
        {errors.allocationError && (
          <View style={[styles.errorContainer, { marginTop: 16, padding: 12, backgroundColor: colors.error + '15', borderRadius: 8 }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error, flex: 1 }]}>
              {errors.allocationError}
            </Text>
          </View>
        )}

        {/* Allocation Results */}
        <View style={[styles.allocationResults, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>

          {/* Summary */}
          {/* <View style={[styles.allocationSummary, { backgroundColor: colors.primary + '08' }]}>
            {(() => {
              const allocatedItems = allocationResults.filter(item => item.BAGS !== null);
              const totalBags = allocatedItems.reduce((sum: number, item) => sum + (item.BAGS || 0), 0);
              const totalKgs = allocatedItems.reduce((sum: number, item) => sum + (item.KGS || 0), 0);
              const totalAvailableBags = allocationResults.reduce((sum: number, item) => sum + item['AVAILABLE BAGS'], 0);
              const totalAvailableKgs = allocationResults.reduce((sum: number, item) => sum + item['AVAILABLE KGS'], 0);

              return (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Lot:</Text>
                    <Text style={[styles.summaryValue2, { color: colors.text }]}>{allocationResults.length} lot(s)</Text>
                  </View>
                  {isViewingAvailableLots ? (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Available Bags:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{Number(totalAvailableBags.toFixed(2)).toLocaleString()} bags</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Available Kgs:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{Number(totalAvailableKgs.toFixed(2)).toLocaleString()} kg</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Required:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{formData.numberOfBags ?? 0} bags</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Estimated Weight:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.success }]}>{Number(totalBags.toFixed(2)).toLocaleString()} bags ({totalKgs.toFixed(2)} kg)</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Actual Weight:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{formData.weightInKg?.toFixed(2) || 0} kg</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Available Bags:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{Number(totalAvailableBags.toFixed(2)).toLocaleString()} bags</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Available Kgs:</Text>
                        <Text style={[styles.summaryValue2, { color: colors.text }]}>{Number(totalAvailableKgs.toFixed(2)).toLocaleString()} kg</Text>
                      </View>
                    </>
                  )}
                </>
              );
            })()}
          </View> */}

          {/* Allocation Table */}
          {(paginatedResults.length > 0 || allocationResults.length > 0) && (
            <AllocationTable
              colors={colors}
              isTablet={isTablet}
              items={paginatedResults}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allocationResults.length}
              itemsPerPage={5}
              onPageChange={onPageChange}
              selectedItemNumber={selectedItemNumber}
              selectedItemRemarks={formData.itemRemarks}
              selectedArea={formData.area}
              onItemSelect={onItemSelect}
              showItemColumn={showItemColumn}
              allocationError={errors.allocationError}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={currentPage === 1 ? colors.textTertiary : colors.primary}
                />
              </TouchableOpacity>
              <Text style={[styles.pageText, { color: colors.text }]}>
                Page {currentPage} of {totalPages}
              </Text>
              <TouchableOpacity
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={currentPage === totalPages ? colors.textTertiary : colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredStar: {
    fontSize: 18,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    height: 64,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  dropdownContainer: {
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
  },
  dropdown: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 0,
  },
  dropdownScrollView: {
    maxHeight: 240,
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dropdownOptionIcon: {
    marginRight: 4,
  },
  dropdownOptionText: {
    fontSize: 18,
  },
  emptyDropdown: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDropdownText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
  },
  // Reference numbers row styles
  referenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  referenceField: {
    flex: 1,
  },
  forkliftRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  forkliftInput: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  referenceInput: {
    flex: 1,
  },
  // Quantity card styles
  row: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    minWidth: 160,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
  },
  summaryValue: {
    fontWeight: '700',
    fontSize: 18,
  },
  avgWeightBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  avgWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avgWeightLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  avgWeightValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  quickSummaryGrid: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 16,
  },
  quickSummaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickSummaryLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickSummaryValue: {
    fontSize: 30,
    fontWeight: '800',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  allocationResults: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  allocationTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  allocationSummary: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue2: {
    fontSize: 15,
    fontWeight: '700',
  },
  tableContainer: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 14,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  pageButton: {
    padding: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Card styles for allocation results
  cardsContainer: {
    gap: 12,
  },
  allocationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  cardBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  allocatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allocatedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardContent: {
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Radio button styles
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },

  red: {
    color: '#D32F2F',
  }
});

