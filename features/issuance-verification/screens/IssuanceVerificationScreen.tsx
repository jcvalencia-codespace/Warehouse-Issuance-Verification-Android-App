/**
 * Issuance Verification Screen
 * Professional full-page form for warehouse issuance verification
 */

import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IssuanceHeader, TransactionDetails } from '../components';
import { AreaOption, issuanceService } from '../services/issuanceService';
import {
  AREA_OPTIONS,
  BagAllocationItem,
  FormErrors,
  FormStatus,
  IssuanceVerificationFormData
} from '../types/issuance.types';

interface IssuanceVerificationScreenProps {
  // Props for potential future use
}

export function IssuanceVerificationScreen(props: IssuanceVerificationScreenProps) {
  const router = useRouter();
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = Colors[scheme ?? 'light'];
  const isTablet = width >= 768;

  const [formData, setFormData] = useState<IssuanceVerificationFormData>({
    transactionRefNumber: '',
    area: '',
    itemNumber: '',
    numberOfBags: null,
    weightInKg: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationResults, setAllocationResults] = useState<BagAllocationItem[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);
  const [itemOptions, setItemOptions] = useState<AreaOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset page when allocation results change
  useEffect(() => {
    setCurrentPage(1);
  }, [allocationResults]);

  // Auto-calculate allocation when number of bags changes
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the allocation calculation
    debounceTimer.current = setTimeout(() => {
      // Only auto-calculate if:
      // 1. Number of bags is valid (> 0)
      // 2. Area is selected
      // 3. Item options are available
      // 4. Not already allocating
      if (
        formData.numberOfBags && 
        formData.numberOfBags > 0 && 
        formData.area && 
        itemOptions.length > 0 && 
        !isAllocating
      ) {
        handleCalculateAllocation();
      }
    }, 800); // 800ms debounce delay

    // Cleanup timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData.numberOfBags, formData.area, itemOptions, isAllocating]);

  // Fetch areas on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areas = await issuanceService.getAreas();
        if (areas && areas.length > 0) {
          setAreaOptions(areas);
        } else {
          // Fallback to default options if API returns empty
          setAreaOptions(AREA_OPTIONS);
        }
      } catch (error) {
        console.error('Error fetching areas:', error);
        // Fallback to default options on error
        setAreaOptions(AREA_OPTIONS);
      }
    };
    fetchAreas();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.transactionRefNumber.trim()) {
      newErrors.transactionRefNumber = 'Transaction reference number is required';
    }

    if (!formData.area) {
      newErrors.area = 'Please select an area';
    }

    if (formData.numberOfBags === null || formData.numberOfBags === undefined) {
      newErrors.numberOfBags = 'Number of bags is required';
    } else if (formData.numberOfBags < 0) {
      newErrors.numberOfBags = 'Number of bags cannot be negative';
    }

    if (formData.weightInKg === null || formData.weightInKg === undefined) {
      newErrors.weightInKg = 'Weight is required';
    } else if (formData.weightInKg < 0) {
      newErrors.weightInKg = 'Weight cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle bag allocation calculation
  const handleCalculateAllocation = useCallback(async () => {
    if (!formData.numberOfBags || formData.numberOfBags <= 0) {
      Alert.alert('Required', 'Please enter the number of bags to allocate');
      return;
    }

    // Validate area and itemNumber are selected
    if (!formData.area) {
      Alert.alert('Required', 'Please select an area');
      return;
    }

    if (!itemOptions.length || !itemOptions[0]?.value) {
      Alert.alert('Required', 'Please select an item');
      return;
    }

    const area = formData.area;
    const itemNumber = itemOptions[0].value;

    setIsAllocating(true);
    try {
      const response = await issuanceService.allocateBags(formData.numberOfBags, area, itemNumber);

      if (response.success && response.data) {
        setAllocationResults(response.data);

      } else {
        Alert.alert('Error', response.message || 'Failed to allocate bags');
      }
    } catch (error: any) {
      console.error('Allocation error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to allocate bags. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  }, [formData, itemOptions]);

  const handlePost = useCallback(async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Post',
      'Are you sure you want to post this issuance verification? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          style: 'destructive',
          onPress: async () => {
            setStatus('posting');
            try {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              setStatus('posted');
              Alert.alert('Success', 'Issuance verification posted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              setStatus('error');
              Alert.alert('Error', 'Failed to post verification. Please try again.');
            }
          },
        },
      ]
    );
  }, [formData, validateForm, router]);

  const handleCancel = useCallback(() => {
    if (formData.transactionRefNumber || formData.area || formData.numberOfBags || formData.weightInKg) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [formData, router]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear All Inputs?',
      'This will clear all form data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setFormData({
              transactionRefNumber: '',
              area: '',
              itemNumber: '',
              numberOfBags: null,
              weightInKg: null,
            });
            setErrors({});
            setAllocationResults([]);
            setCurrentPage(1);
          },
        },
      ]
    );
  }, []);

  const handleNumberOfBagsChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const value = cleaned ? parseInt(cleaned, 10) : null;
    setFormData((prev) => ({ ...prev, numberOfBags: value }));
    if (errors.numberOfBags) {
      setErrors((prev) => ({ ...prev, numberOfBags: undefined }));
    }
  }, [errors.numberOfBags]);

  const handleWeightChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts[1].slice(0, 2);
    }
    const value = formatted ? parseFloat(formatted) : null;
    setFormData((prev) => ({ ...prev, weightInKg: value }));
    if (errors.weightInKg) {
      setErrors((prev) => ({ ...prev, weightInKg: undefined }));
    }
  }, [errors.weightInKg]);

  const selectedAreaLabel = (areaOptions.find(
    (opt) => opt.value === formData.area
  )?.label || AREA_OPTIONS.find((opt) => opt.value === formData.area)?.label) ?? null;

  // Computed options for dropdown - use API data if available, otherwise fallback
  const dropdownOptions = areaOptions.length > 0 ? areaOptions : AREA_OPTIONS;

  // Filter options based on search query
  const filteredAreaOptions = areaSearchQuery
    ? dropdownOptions.filter(option =>
      option.label.toLowerCase().includes(areaSearchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(areaSearchQuery.toLowerCase())
    )
    : dropdownOptions;

  // Pagination logic for allocation results
  const totalPages = Math.ceil(allocationResults.length / ITEMS_PER_PAGE);
  const paginatedResults = allocationResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isLoading = status === 'saving' || status === 'posting';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <IssuanceHeader colors={colors} onCancel={handleCancel} onClear={handleClear} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Card */}
            <TransactionDetails
              colors={colors}
              isTablet={isTablet}
              formData={formData}
              errors={errors}
              areaOptions={areaOptions}
              filteredAreaOptions={filteredAreaOptions}
              itemOptions={itemOptions}
              selectedAreaLabel={selectedAreaLabel}
              showAreaPicker={showAreaPicker}
              isLoadingItems={isLoadingItems}
              areaSearchQuery={areaSearchQuery}
              onFormDataChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
              onErrorsChange={setErrors}
              onShowAreaPickerChange={setShowAreaPicker}
              onAreaSearchQueryChange={setAreaSearchQuery}
              onItemOptionsChange={setItemOptions}
              onIsLoadingItemsChange={setIsLoadingItems}
              // Quantity props
              isAllocating={isAllocating}
              allocationResults={allocationResults}
              currentPage={currentPage}
              totalPages={totalPages}
              paginatedResults={paginatedResults}
              onNumberOfBagsChange={handleNumberOfBagsChange}
              onWeightChange={handleWeightChange}
              onCalculateAllocation={handleCalculateAllocation}
              onPageChange={setCurrentPage}
            />

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '30' }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <MaterialCommunityIcons
                  name="information-slab-circle"
                  size={20}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  Verification Process
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Post to finalize the issuance verification. Posted transactions cannot be edited.
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.text} />
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.postButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={handlePost}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading && status === 'posting' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send-check" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Post</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
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
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  halfWidth: {
    flex: 1,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginTop: 10,
  },
  summaryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValue: {
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  postButton: {
    flex: 1.2,
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Calculate Allocation Button
  calculateButton: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Allocation Results
  allocationResults: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  allocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 12,
  },
  allocationSummary: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue2: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default IssuanceVerificationScreen;
