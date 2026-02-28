/**
 * Transaction Details Component
 * Form fields for transaction reference, area selection, and item number
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AllocationTable } from '.';
import { issuanceService } from '../services/issuanceService';
import { AreaOption, FormErrors, IssuanceVerificationFormData } from '../types/issuance.types';

interface TransactionDetailsProps {
  colors: any;
  isTablet: boolean;
  formData: IssuanceVerificationFormData;
  errors: FormErrors;
  areaOptions: AreaOption[];
  filteredAreaOptions: AreaOption[];
  itemOptions: AreaOption[];
  selectedAreaLabel: string | null;
  showAreaPicker: boolean;
  isLoadingItems: boolean;
  areaSearchQuery: string;
  onFormDataChange: (data: Partial<IssuanceVerificationFormData>) => void;
  onErrorsChange: (errors: Partial<FormErrors>) => void;
  onShowAreaPickerChange: (show: boolean) => void;
  onAreaSearchQueryChange: (query: string) => void;
  onItemOptionsChange: (items: AreaOption[]) => void;
  onIsLoadingItemsChange: (loading: boolean) => void;
  // Quantity props
  isAllocating: boolean;
  allocationResults: any[];
  currentPage: number;
  totalPages: number;
  paginatedResults: any[];
  onNumberOfBagsChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onCalculateAllocation: () => void;
  onPageChange: (page: number) => void;
}

export function TransactionDetails({
  colors,
  isTablet,
  formData,
  errors,
  areaOptions,
  filteredAreaOptions,
  itemOptions,
  selectedAreaLabel,
  showAreaPicker,
  isLoadingItems,
  areaSearchQuery,
  onFormDataChange,
  onErrorsChange,
  onShowAreaPickerChange,
  onAreaSearchQueryChange,
  onItemOptionsChange,
  onIsLoadingItemsChange,
  // Quantity props
  isAllocating,
  allocationResults,
  currentPage,
  totalPages,
  paginatedResults,
  onNumberOfBagsChange,
  onWeightChange,
  onCalculateAllocation,
  onPageChange,
}: TransactionDetailsProps) {
  return (
    <>
      {/* Transaction Details Card */}
      <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transaction Details
          <Text style={[styles.sectionDescription, { color: colors.textSecondary, fontStyle: 'italic', marginLeft: 4 }]}> (Enter the issuance verification information below)
          </Text>
        </Text>

        {/* Transaction Reference Number */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Transaction Reference Number
            <Text style={[styles.requiredStar, { color: colors.error }]}> *</Text>
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background,
                borderColor: errors.transactionRefNumber ? colors.error : colors.cardBorder,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g., ISS-2024-001234"
              placeholderTextColor={colors.textTertiary}
              value={formData.transactionRefNumber}
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
                size={18}
                color={colors.success}
              />
            ) : null}
          </View>
          {errors.transactionRefNumber && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.transactionRefNumber}
              </Text>
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
                borderColor: errors.area ? colors.error : colors.cardBorder,
              },
            ]}
            onPress={() => onShowAreaPickerChange(!showAreaPicker)}
            activeOpacity={0.7}
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
              {selectedAreaLabel || 'Select warehouse area'}
            </Text>
            <MaterialCommunityIcons
              name={showAreaPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
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
                        onFormDataChange({ area: option.value, itemNumber: '' });
                        onShowAreaPickerChange(false);
                        // Fetch items for the selected area
                        onIsLoadingItemsChange(true);
                        issuanceService.getItemsByArea(option.value)
                          .then(items => {
                            onItemOptionsChange(items);
                            onIsLoadingItemsChange(false);
                          })
                          .catch(err => {
                            console.error('Error fetching items:', err);
                            onIsLoadingItemsChange(false);
                          });
                        if (errors.area) {
                          onErrorsChange({ area: undefined });
                        }
                      }}
                    >
                      <View style={styles.dropdownOptionContent}>
                        <MaterialCommunityIcons
                          name="warehouse"
                          size={18}
                          color={formData.area === option.value ? colors.primary : colors.textSecondary}
                          style={styles.dropdownOptionIcon}
                        />
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            {
                              color: formData.area === option.value ? colors.primary : colors.text,
                              fontWeight: formData.area === option.value ? '600' : '400',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                      {formData.area === option.value && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={colors.primary}
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

        {/* Item Number Input - Read Only */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Item Number</Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="package-variant"
              size={20}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
            <Text style={[styles.input, { color: colors.text }]}>
              {itemOptions[0]?.label || 'N/A'}
            </Text>
          </View>
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
          {/* Number of Bags */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
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
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.numberOfBags}
                </Text>
              </View>
            )}
          </View>

          {/* Weight in KG */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
            <Text style={[styles.requiredStar, { color: colors.error }]}>*</Text>
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
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                value={formData.weightInKg?.toString() || ''}
                onChangeText={onWeightChange}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>kg</Text>
            </View>
            {errors.weightInKg && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.weightInKg}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Summary */}
        {formData.numberOfBags && formData.weightInKg && (
          <View style={[styles.summaryBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons
              name="calculator"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              Average weight per bag:{' '}
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {(formData.weightInKg / (formData.numberOfBags || 1)).toFixed(2)} kg
              </Text>
            </Text>
          </View>
        )}

        {/* Calculate Allocation Button
        <TouchableOpacity
          style={[styles.calculateButton, { backgroundColor: colors.secondary }]}
          onPress={onCalculateAllocation}
          disabled={isAllocating || !formData.numberOfBags}
          activeOpacity={0.8}
        >
          {isAllocating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialCommunityIcons name="package-variant-closed-check" size={20} color="#ffffff" />
              <Text style={styles.calculateButtonText}>Calculate Allocation</Text>
            </>
          )}
        </TouchableOpacity> */}

        {/* Allocation Results */}
        <View style={[styles.allocationResults, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.allocationTitle, { color: colors.text }]}>
            Bag Allocation Results
          </Text>

          {/* Summary */}
          <View style={[styles.allocationSummary, { backgroundColor: colors.primary + '08' }]}>
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
                    <Text style={[styles.summaryValue2, { color: colors.text }]}>{allocatedItems.length} lot(s)</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Required:</Text>
                    <Text style={[styles.summaryValue2, { color: colors.text }]}>{formData.numberOfBags ?? 0} bags</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Estimated Weight:</Text>
                    <Text style={[styles.summaryValue2, { color: colors.success }]}>{Number(totalBags.toFixed(2)).toLocaleString()} bags ({totalKgs.toFixed(2)} kg)</Text>
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
              );
            })()}
          </View>

          {/* Allocation Table */}
          {paginatedResults.length > 0 && (
            <AllocationTable
              colors={colors}
              isTablet={isTablet}
              items={paginatedResults}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allocationResults.length}
              itemsPerPage={5}
              onPageChange={onPageChange}
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
    justifyContent: 'space-between',
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
  // Quantity card styles
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
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
});
