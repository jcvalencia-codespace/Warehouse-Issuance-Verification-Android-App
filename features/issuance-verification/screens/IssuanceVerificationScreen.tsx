/**
 * Issuance Verification Screen
 * Professional full-page form for warehouse issuance verification
 */

import { ModalDialog } from '@/components/ui/modal-dialog';
import { Colors } from '@/constants/theme';
import { toast } from '@/hooks/use-toast';
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
import { useAuth } from '../../auth/context/AuthContext';
import { IssuanceHeader, TransactionDetails } from '../components';
import { AreaOption, issuanceService } from '../services/issuanceService';
import {
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
  const { user } = useAuth();

  const [formData, setFormData] = useState<IssuanceVerificationFormData>({
    transactionRefNumber: '',
    area: '',
    itemNumber: '',
    lotNumber: '',
    numberOfBags: null,
    weightInKg: null,
    forkliftOperator: '',
    floorScale: '',
    transType: '',
  });

  // Modal state for web-compatible dialogs
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Separate state to track raw weight input (for preserving decimal while typing)
  const [weightInputRaw, setWeightInputRaw] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationResults, setAllocationResults] = useState<BagAllocationItem[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);
  const [itemOptions, setItemOptions] = useState<AreaOption[]>([]);
  const [lotOptions, setLotOptions] = useState<AreaOption[]>([]);
  const [filteredLotOptions, setFilteredLotOptions] = useState<AreaOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingLots, setIsLoadingLots] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showLotPicker, setShowLotPicker] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [lotSearchQuery, setLotSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showItemColumn, setShowItemColumn] = useState(true);
  const [isViewingAvailableLots, setIsViewingAvailableLots] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
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
      // 3. Item number is selected
      // 4. Not already allocating
      // 5. Not viewing available lots (don't auto-allocate when browsing available lots)
      if (
        formData.numberOfBags && 
        formData.numberOfBags > 0 && 
        formData.area && 
        formData.itemNumber &&
        itemOptions.length > 0 
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
  }, [formData.numberOfBags, formData.area, formData.itemNumber, itemOptions, isAllocating, isViewingAvailableLots]);

  // Fetch areas on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areas = await issuanceService.getAreas();
        if (areas && areas.length > 0) {
          setAreaOptions(areas);
        }
      } catch (error) {
        console.error('Error fetching areas:', error);
        // Fallback to default options on error
      }
    };
    fetchAreas();
  }, []);

  // Fetch transaction reference number on mount
  useEffect(() => {
    const fetchTransactionRefNumber = async () => {
      try {
        const refNumber = await issuanceService.getTransactionReferenceNumber();
        if (refNumber) {
          setFormData((prev) => ({ ...prev, transactionRefNumber: refNumber.toString() }));
        }
      } catch (error) {
        console.error('Error fetching transaction reference number:', error);
      }
    };
    fetchTransactionRefNumber();
  }, []);

  // Handle item selection from allocation table
  const handleItemSelect = useCallback((itemNumber: string) => {
    setFormData((prev) => ({ ...prev, itemNumber }));
    setShowItemColumn(false);
    // Filter allocation results to show only selected item
    if (allocationResults.length > 0) {
      const filtered = allocationResults.filter(item => item.ITEMNMBR === itemNumber);
      setAllocationResults(filtered);
    }
  }, [allocationResults]);

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
    } else if (allocationResults.length > 0) {
      // Get the top 1 available bags from the allocation results
      const sortedByBags = [...allocationResults].sort((a, b) => (b['AVAILABLE BAGS'] || 0) - (a['AVAILABLE BAGS'] || 0));
      const topAvailableBags = sortedByBags[0]?.['AVAILABLE BAGS'] || 0;
      
      if (formData.numberOfBags > topAvailableBags) {
        newErrors.numberOfBags = `Input exceeds maximum available bags (${topAvailableBags} bags in top lot)`;
      }
    }

    if (formData.weightInKg === null || formData.weightInKg === undefined) {
      newErrors.weightInKg = 'Weight is required';
    } else if (formData.weightInKg < 0) {
      newErrors.weightInKg = 'Weight cannot be negative';
    } else if (allocationResults.length > 0) {
      // Get the top 1 available weight from the allocation results
      const sortedByWeight = [...allocationResults].sort((a, b) => (b['AVAILABLE KGS'] || 0) - (a['AVAILABLE KGS'] || 0));
      const topAvailableKgs = sortedByWeight[0]?.['AVAILABLE KGS'] || 0;
      
      if (formData.weightInKg > topAvailableKgs) {
        newErrors.weightInKg = `Input exceeds maximum available weight (${topAvailableKgs.toFixed(2)} kg in top lot)`;
      }
    }

    if (!formData.forkliftOperator || formData.forkliftOperator.trim() === '') {
      newErrors.forkliftOperator = 'Forklift operator is required';
    }

    if (!formData.floorScale || formData.floorScale.trim() === '') {
      newErrors.floorScale = 'Floor scale is required';
    }

    if (!formData.itemNumber || formData.itemNumber.trim() === '') {
      newErrors.itemNumber = 'Item number is required';
    }
    if (!formData.floorScale || formData.floorScale.trim() === '') {
      newErrors.floorScale = 'Floor scale is required';
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to the first one
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      scrollToField(firstErrorField);
      return false;
    }
    
    return Object.keys(newErrors).length === 0;
  }, [formData, allocationResults]);

  // Function to scroll to a specific field
  const scrollToField = useCallback((fieldName: string) => {
    // Define scroll offsets for each field (approximate)
    const fieldOffsets: Record<string, number> = {
      transactionRefNumber: 0,
      floorScale: 150,
      area: 280,
      itemNumber: 500,
      numberOfBags: 700,
      weightInKg: 700,
      forkliftOperator: 900,
    };
    
    const scrollOffset = fieldOffsets[fieldName] || 0;
    
    scrollViewRef.current?.scrollTo({
      y: scrollOffset,
      animated: true,
    });
  }, []);

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

    if (!formData.itemNumber) {
      Alert.alert('Required', 'Please select an item');
      return;
    }

    // Validate against available lots if they are loaded
    if (allocationResults.length > 0) {
      const sortedByBags = [...allocationResults].sort((a, b) => (b['AVAILABLE BAGS'] || 0) - (a['AVAILABLE BAGS'] || 0));
      const topAvailableBags = sortedByBags[0]?.['AVAILABLE BAGS'] || 0;
      const sortedByWeight = [...allocationResults].sort((a, b) => (b['AVAILABLE KGS'] || 0) - (a['AVAILABLE KGS'] || 0));
      const topAvailableKgs = sortedByWeight[0]?.['AVAILABLE KGS'] || 0;

      if (formData.numberOfBags > topAvailableBags) {
        Alert.alert('Invalid Quantity', `Number of bags exceeds maximum available (${topAvailableBags} bags in top lot)`);
        return;
      }

      if (formData.weightInKg && formData.weightInKg > topAvailableKgs) {
        Alert.alert('Invalid Weight', `Weight exceeds maximum available (${topAvailableKgs.toFixed(2)} kg in top lot)`);
        return;
      }
    }

    const area = formData.area;
    const itemNumber = formData.itemNumber;

    // Validate that item number is selected
    if (!itemNumber) {
      Alert.alert('Error', 'Please select an item number first');
      return;
    }

    setIsAllocating(true);
    setIsViewingAvailableLots(false);
    try {
      const response = await issuanceService.allocateBags(formData.numberOfBags, area, itemNumber);

      if (response.success && response.data) {
        // Check if allocation uses more than 1 lot
        const allocatedItems = response.data.filter((item: BagAllocationItem) => item.BAGS !== null);
        const uniqueLots = new Set(allocatedItems.map((item: BagAllocationItem) => item.LOTNUMBER));

        
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
  }, [formData, itemOptions, allocationResults]);

  const handlePost = useCallback(async () => {
    if (!validateForm()) return;

    // Check if there are allocation results to post
    const allocatedItems = allocationResults.filter(item => item.BAGS !== null);
    if (allocatedItems.length === 0) {
      Alert.alert('No Allocation', 'Please calculate the allocation first before posting.');
      return;
    }

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
              const response = await issuanceService.postIssuance({
                transactionRefNumber: formData.transactionRefNumber,
                area: formData.area,
                numberOfBags: formData.numberOfBags || 0,
                weightInKg: formData.weightInKg || 0,
                allocations: allocatedItems,
                username: user?.USERNAME || '',
                forkliftOperator: formData.forkliftOperator || '',
                floorScale: formData.floorScale || '',
                transType: formData.transType || '',
              });

              if (response.success) {
                setStatus('posted');
                // Clear form data after successful post instead of going back
                setFormData({
                  transactionRefNumber: '',
                  area: '',
                  itemNumber: '',
                  lotNumber: '',
                  numberOfBags: null,
                  weightInKg: null,
                  forkliftOperator: '',
                  floorScale: '',
                  transType: '',
                });
                setWeightInputRaw('');
                setErrors({});
                setAllocationResults([]);
                setCurrentPage(1);
                setIsViewingAvailableLots(false);
                
                // Fetch new transaction reference number
                try {
                  const refNumber = await issuanceService.getTransactionReferenceNumber();
                  if (refNumber) {
                    setFormData((prev) => ({ ...prev, transactionRefNumber: refNumber.toString() }));
                  }
                } catch (error) {
                  console.error('Error fetching transaction reference number:', error);
                }
                
                Alert.alert('Success', 'Issuance verification posted successfully');
              } else {
                setStatus('error');
                Alert.alert('Error', response.message || 'Failed to post verification.');
              }
            } catch (error: any) {
              setStatus('error');
              Alert.alert('Error', error.response?.data?.message || 'Failed to post verification. Please try again.');
            }
          },
        },
      ]
    );
  }, [formData, validateForm, router, allocationResults, user]);

  const handleCancel = useCallback(() => {
    if (formData.transactionRefNumber || formData.area || formData.numberOfBags || formData.weightInKg) {
      // Use modal for web compatibility
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [formData, router]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    router.back();
  }, [router]);

  const handleClear = useCallback(() => {
    // Use modal for web compatibility
    setShowClearModal(true);
  }, []);

  const handleConfirmClear = useCallback(async () => {
    setShowClearModal(false);
    setFormData({
      transactionRefNumber: '',
      area: '',
      itemNumber: '',
      lotNumber: '',
      numberOfBags: null,
      weightInKg: null,
      forkliftOperator: '',
      floorScale: '',
      transType: '',
    });
    setWeightInputRaw('');
    setErrors({});
    setAllocationResults([]);
    setCurrentPage(1);
    setIsViewingAvailableLots(false);
    
    // Fetch new transaction reference number after clearing
    try {
      const refNumber = await issuanceService.getTransactionReferenceNumber();
      if (refNumber) {
        setFormData((prev) => ({ ...prev, transactionRefNumber: refNumber.toString() }));
      }
    } catch (error) {
      console.error('Error fetching transaction reference number:', error);
    }
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
    // Allow typing decimals naturally - keep the decimal point while typing
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts[1].slice(0, 2);
    }
    
    // Update raw input state to preserve decimal while typing
    setWeightInputRaw(formatted);
    
    // Convert to number for form data
    let value: number | null = null;
    if (formatted !== '' && formatted !== '.') {
      const parsed = parseFloat(formatted);
      if (!isNaN(parsed)) {
        value = parsed;
      }
    }
    
    setFormData((prev) => ({ ...prev, weightInKg: value }));
    if (errors.weightInKg) {
      setErrors((prev) => ({ ...prev, weightInKg: undefined }));
    }
  }, [errors.weightInKg]);

  const selectedAreaLabel = areaOptions.find(
    (opt) => opt.value === formData.area
  )?.label ?? null;

  // Computed options for dropdown - use API data if available
  const dropdownOptions = areaOptions;

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
            ref={scrollViewRef}
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
              filteredAreaOptions={filteredAreaOptions}
              itemOptions={itemOptions}
              lotOptions={lotOptions}
              filteredLotOptions={filteredLotOptions}
              selectedAreaLabel={selectedAreaLabel}
              showAreaPicker={showAreaPicker}
              showItemPicker={showItemPicker}
              showLotPicker={showLotPicker}
              isLoadingItems={isLoadingItems}
              isLoadingLots={isLoadingLots}
              areaSearchQuery={areaSearchQuery}
              itemSearchQuery={itemSearchQuery}
              lotSearchQuery={lotSearchQuery}
              onFormDataChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
              onErrorsChange={setErrors}
              onShowAreaPickerChange={setShowAreaPicker}
              onShowItemPickerChange={setShowItemPicker}
              onShowLotPickerChange={setShowLotPicker}
              onAreaSearchQueryChange={setAreaSearchQuery}
              onItemSearchQueryChange={setItemSearchQuery}
              onLotSearchQueryChange={setLotSearchQuery}
              onItemOptionsChange={setItemOptions}
              onLotOptionsChange={setLotOptions}
              onFilteredLotOptionsChange={setFilteredLotOptions}
              onIsLoadingItemsChange={setIsLoadingItems}
              onIsLoadingLotsChange={setIsLoadingLots}
              onAvailableLotsLoaded={(lots) => {
                setAllocationResults(lots);
                setShowItemColumn(true);
                setIsViewingAvailableLots(true);
                // Show toast notification when available lots are loaded
                if (lots && lots.length > 0) {
                  const totalBags = lots.reduce((sum: number, item: BagAllocationItem) => sum + (item['AVAILABLE BAGS'] || 0), 0);
                  const totalKgs = lots.reduce((sum: number, item: BagAllocationItem) => sum + (item['AVAILABLE KGS'] || 0), 0);
                  toast({
                    title: 'Available Lots Loaded',
                    description: `${lots.length} lot(s) found with ${totalBags.toLocaleString()} bags (${totalKgs.toFixed(2)} kg) available`,
                    variant: 'default',
                  });
                }
              }}
              selectedItemNumber={formData.itemNumber}
              onItemSelect={handleItemSelect}
              showItemColumn={showItemColumn}
              // Quantity props
              isAllocating={isAllocating}
              allocationResults={allocationResults}
              currentPage={currentPage}
              totalPages={totalPages}
              paginatedResults={paginatedResults}
              onNumberOfBagsChange={handleNumberOfBagsChange}
              onWeightChange={handleWeightChange}
              weightInputRaw={weightInputRaw}
              onCalculateAllocation={handleCalculateAllocation}
              onPageChange={setCurrentPage}
              isViewingAvailableLots={isViewingAvailableLots}
              scrollToField={scrollToField}
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

      {/* Discard Changes Modal - Web Compatible */}
      <ModalDialog
        visible={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        type="warning"
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmButtonVariant="destructive"
      />

      {/* Clear All Modal - Web Compatible */}
      <ModalDialog
        visible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Inputs?"
        message="This will clear all form data. Are you sure?"
        type="warning"
        confirmText="Clear"
        cancelText="Cancel"
        confirmButtonVariant="destructive"
      />
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
