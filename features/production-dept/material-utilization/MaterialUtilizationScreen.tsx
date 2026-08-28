import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialUtilizationBaseDetails } from './components/MaterialUtilizationBaseDetails';
import { MaterialUtilizationBatchDetails } from './components/MaterialUtilizationBatchDetails';
import { MaterialUtilizationBatchLists } from './components/MaterialUtilizationBatchLists';
import { MaterialUtilizationDetails, MaterialUtilizationDetailsRef } from './components/MaterialUtilizationDetails';
import { MaterialUtilizationDetailsUpdate } from './components/MaterialUtilizationDetailsUpdate';
import { MaterialUtilizationHeader, MaterialUtilizationHeaderRef } from './components/MaterialUtilizationHeader';
import { MaterialUtilizationList } from './components/MaterialUtilizationList';
import { MaterialUtilizationService } from './services/materialUtilizationService';
import { BatchDetail, BatchingMaterialUtilization, MaterialUtilizationBaseItemDetails, MaterialUtilizationFormData, MaterialUtilizationLineItem, MaterialUtilizationPayload } from './types/materialUtilization.types';

interface MaterialUtilizationScreenProps {
  onBack?: () => void;
  onSubmit?: (data: any) => void;
}

export default function MaterialUtilizationScreen({ onBack, onSubmit }: MaterialUtilizationScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();

  const headerRef = React.useRef<MaterialUtilizationHeaderRef>(null);
  const detailsRef = React.useRef<MaterialUtilizationDetailsRef>(null);
  const detailViewRef = React.useRef<MaterialUtilizationDetailsRef>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [saveConfirmVisible, setSaveConfirmVisible] = useState(false);
  const [updateConfirmVisible, setUpdateConfirmVisible] = useState(false);
  const [pendingHeader, setPendingHeader] = useState<MaterialUtilizationFormData | null>(null);
  const [items, setItems] = useState<MaterialUtilizationBaseItemDetails[]>([]);
  const [detailViewRecord, setDetailViewRecord] = useState<any | null>(null);
  const [detailLineItems, setDetailLineItems] = useState<MaterialUtilizationLineItem[]>([]);
  const [detailViewBatchNo, setDetailViewBatchNo] = useState<number | null>(null);
  const [detailViewWeighedBy, setDetailViewWeighedBy] = useState('');
  const [detailViewValidatedBy, setDetailViewValidatedBy] = useState('');
  const [detailViewRandomSampled, setDetailViewRandomSampled] = useState(0);
  const [detailViewQaName, setDetailViewQaName] = useState('');
  const [isDosingMachine, setIsDosingMachine] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [lists, setLists] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBatchLists, setShowBatchLists] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatchInfo, setSelectedBatchInfo] = useState<{ batchNo: number; isDosingMachine: boolean } | null>(null);
  const [selectedUsageNo, setSelectedUsageNo] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');

  const handleClear = () => {
    setClearConfirmVisible(true);
  };

  const handleConfirmClear = async () => {
    headerRef.current?.clear();
    await headerRef.current?.refreshusageNo();
    detailsRef.current?.clear();
    setItems([]);
    setClearConfirmVisible(false);
  };

  const handleValidSubmit = (headerData: MaterialUtilizationFormData) => {
    const isDetailsValid = detailsRef.current?.validate();
    if (!isDetailsValid) {
      return;
    }
    setPendingHeader(headerData);
    setConfirmVisible(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingHeader) return;

    try {
      const basePayload: MaterialUtilizationPayload = {
        usageDate: pendingHeader.usageDate,
        usageNo: pendingHeader.usageNo,
        machineLineName: pendingHeader.machineLineName,
        shift: pendingHeader.shift,
        feedType: pendingHeader.feedType,
        variant: pendingHeader.variant,
        formulationNo: pendingHeader.formulationNo,
        batchNo: pendingHeader.batchNo,
        remarks: pendingHeader.remarks,
        transType: pendingHeader.transType,
        user: user?.NAME || '',
        baseDetails: items,
        validatedBy: '',
        weighedBy: '',
        subDetails: detailsRef.current?.getSubDetails() || [],
      };

      const result = await MaterialUtilizationService.getInstance().saveMaterialUtilization(
        basePayload,
        user?.COMPANY || ''
      );

      if (result.success) {
        setConfirmVisible(false);
        setSuccessMessage(result.message || 'Material utilization saved successfully.');
        setPendingHeader((prev) => prev ? { ...prev, usageNo: result.usageNo || prev.usageNo } : prev);
        setSuccessVisible(true);
        setShowForm(false);
        loadLists();
      } else {
        Alert.alert('Error', result.message || 'Failed to submit material utilization.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to submit material utilization.');
    }
  };

  const handleDone = async () => {
    setSuccessVisible(false);
    setSuccessMessage('');
    setPendingHeader(null);
    setItems([]);
    headerRef.current?.clear();
    await headerRef.current?.refreshusageNo();
    detailsRef.current?.clear();
  };

  const handleDetailSave = async () => {
    const isValid = detailViewRef.current?.validate();
    if (!isValid) {
      return;
    }

    try {
      const subDetails = detailViewRef.current?.getSubDetails() || [];
      const updatedBatchNo = detailViewRef.current?.getBatchNo() || '';
      const updatedLineItems = detailLineItems.map(item => ({
        ...item,
        batchNo: Number(updatedBatchNo) || item.batchNo,
        isDosingMachine,
      }));
      const payload: BatchingMaterialUtilization = {
        usageNo: String(detailViewRecord?.USAGENO || detailViewRecord?.usageNo || ''),
        user: user?.NAME || '',
        details: updatedLineItems,
        subDetails,
        transType: 2,
        isDosingMachine,
      };
      const result = await MaterialUtilizationService.getInstance().saveBatchingMaterialUtilization(
        payload,
        user?.COMPANY
      );

      if (result.success) {
        setSuccessMessage(result.message || 'Material utilization saved successfully.');
        setSuccessVisible(true);
        setDetailViewRecord(null);
        setDetailLineItems([]);
      } else {
        Alert.alert('Error', result.message || 'Failed to save material utilization.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to save material utilization.');
    }
  };

  const handleConfirmDetailSave = async () => {
    setSaveConfirmVisible(false);
    await handleDetailSave();
  };

  const handleUpdateDetailSave = async () => {
    const isValid = detailViewRef.current?.validate();
    if (!isValid) {
      return;
    }

    try {
      const subDetails = detailViewRef.current?.getSubDetails() || [];
      const updatedBatchNo = detailViewRef.current?.getBatchNo() || '';
      const updatedLineItems = detailLineItems.map(item => ({
        ...item,
        batchNo: Number(updatedBatchNo) || item.batchNo,
        isDosingMachine,
      }));
      const payload: BatchingMaterialUtilization = {
        usageNo: String(detailViewRecord?.USAGENO || detailViewRecord?.usageNo || ''),
        user: user?.NAME || '',
        details: updatedLineItems,
        subDetails,
        transType: 3,
        isDosingMachine,
      };
      const result = await MaterialUtilizationService.getInstance().updateBatchingMaterialUtilization(
        payload,
        user?.COMPANY
      );

      if (result.success) {
        setSuccessMessage(result.message || 'Batch details updated successfully.');
        setSuccessVisible(true);
        setDetailViewRecord(null);
        setDetailLineItems([]);
        setDetailViewBatchNo(null);
        setDetailViewWeighedBy('');
        setDetailViewValidatedBy('');
        setDetailViewRandomSampled(0);
        setDetailViewQaName('');
        setIsDosingMachine(false);
        setIsUpdating(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update batch details.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to update batch details.');
    }
  };

  const handleConfirmUpdateDetailSave = async () => {
    setUpdateConfirmVisible(false);
    await handleUpdateDetailSave();
  };

  const loadLists = useCallback(async () => {
    setListsLoading(true);
    try {
      const data = await MaterialUtilizationService.getInstance().getMaterialUtilizationLists(user?.COMPANY);
      setLists(data || []);
    } catch (error) {
      console.error('Failed to load material utilization lists:', error);
      Alert.alert('Error', 'Failed to load material utilization lists.');
    } finally {
      setListsLoading(false);
    }
  }, [user?.COMPANY]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleAddNew = () => {
    setShowForm(true);
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowBatchLists(false);
    setShowBatchDetails(false);
    setSelectedBatchInfo(null);
    setSelectedUsageNo(undefined);
    setDetailViewRecord(null);
    setDetailLineItems([]);
    setDetailViewBatchNo(null);
    setDetailViewWeighedBy('');
    setDetailViewValidatedBy('');
    setDetailViewRandomSampled(0);
    setDetailViewQaName('');
    setIsDosingMachine(false);
    setIsUpdating(false);
  }

  const handleBackToBatchLists = () => {
    setShowForm(false);
    setShowBatchLists(true);
    setShowBatchDetails(false);
    setSelectedBatchInfo(null);
    setDetailViewRecord(null);
    setDetailLineItems([]);
    setDetailViewBatchNo(null);
    setDetailViewWeighedBy('');
    setDetailViewValidatedBy('');
    setDetailViewRandomSampled(0);
    setDetailViewQaName('');
    setIsDosingMachine(false);
    setIsUpdating(false);
  }

  const handleRecordPress = (record: any) => {
    setShowBatchLists(true);
    setSelectedUsageNo(Number(record.USAGENO));
  };

  const handleCreateNewFromBatchLists = async (isDosingMachine: boolean) => {
    try {
      let result;
      if (isDosingMachine) {
        result = await MaterialUtilizationService.getInstance().getDosingMachineDetails(user?.COMPANY, selectedUsageNo);
      } else {
        result = await MaterialUtilizationService.getInstance().getMaterialUtilizationDetails(user?.COMPANY, selectedUsageNo);
      }

      if (result.header) {
        const header = result.header;
        const latestBatchNo = await MaterialUtilizationService.getInstance().getNextBatchNo(user?.COMPANY, selectedUsageNo, isDosingMachine);
        setDetailViewBatchNo(latestBatchNo);

        setDetailViewWeighedBy(header.WEIGHEDBY || '');
        setDetailViewValidatedBy(header.VALIDATEDBY || '');
        setDetailViewRandomSampled(Number(header.IS_RANDOM_SAMPLED) || 0);
        setDetailViewQaName(header?.QA_NAME || '');

        const nextBatchNo = (latestBatchNo ?? 0) + 1;

        const detailLineItems: MaterialUtilizationLineItem[] = result.details.map((detail, index) => ({
          id: String(detail.ROWID || index),
          batchNo: nextBatchNo,
          usageNo: String(header.USAGENO || ''),
          itemNo: detail.ITEMNMBR || '',
          itemDescription: detail.ITEMNMBR || '',
          requiredWeight: Number(detail.KGSREQUIRED) || 0,
          weightLoaded: Number(header.WEIGHTLOADED) || 0,
          processType: 'Prepared and Loaded' as const,
          weighedBy: header.WEIGHEDBY || '',
          ValidatedBy: header.VALIDATEDBY || '',
          randomSampled: Number(header.IS_RANDOM_SAMPLED) || 0,
          qaName: header.QA_NAME || '',
          remarks: '',
        }));

        setShowForm(false);
        setShowBatchLists(false);
        setIsDosingMachine(isDosingMachine);
        setIsUpdating(false);
        setDetailViewRecord(header);
        setDetailLineItems(detailLineItems);
      }
    } catch (error) {
      console.error('Error fetching material utilization details:', error);
      Alert.alert('Error', 'Failed to load material utilization details.');
    }
  };

  const handleBatchPress = (batchNo: number, isDosingMachine: boolean) => {
    setSelectedBatchInfo({ batchNo, isDosingMachine });
    setShowForm(false);
    setShowBatchLists(false);
    setShowBatchDetails(true);
  };

  const handleEditBatchDetails = async (batchDetails: BatchDetail[]) => {
    const batchInfo = selectedBatchInfo;
    if (!batchInfo) return;

    const { isDosingMachine } = batchInfo;
    try {
      let result;
      if (isDosingMachine) {
        result = await MaterialUtilizationService.getInstance().getDosingMachineDetails(user?.COMPANY, selectedUsageNo);
      } else {
        result = await MaterialUtilizationService.getInstance().getMaterialUtilizationDetails(user?.COMPANY, selectedUsageNo);
      }

      if (result.header) {
        const header = result.header;
        const latestBatchNo = await MaterialUtilizationService.getInstance().getNextBatchNo(user?.COMPANY, selectedUsageNo, isDosingMachine);
        setDetailViewBatchNo(latestBatchNo);

        let weighedBy = '';
        let validatedBy = '';
        let randomSampled = 0;
        let qaName = '';

        for (const detail of batchDetails) {
          weighedBy = detail.WEIGHEDBY || weighedBy;
          validatedBy = detail.VALIDATEDBY || validatedBy;
          if (detail.RANDOM_SAMPLED !== undefined && detail.RANDOM_SAMPLED !== null) {
            randomSampled = Number(detail.RANDOM_SAMPLED);
          }
          qaName = detail.QA_NAME || qaName;
        }

        setDetailViewWeighedBy(weighedBy || header.WEIGHEDBY || '');
        setDetailViewValidatedBy(validatedBy || header.VALIDATEDBY || '');
        setDetailViewRandomSampled(randomSampled || Number(header.IS_RANDOM_SAMPLED) || 0);
        setDetailViewQaName(qaName || header?.QA_NAME || '');

        const nextBatchNo = (latestBatchNo ?? 0) + 1;

        const detailLineItems: MaterialUtilizationLineItem[] = batchDetails.map((detail, index) => ({
          id: String(detail.PUDROWID || detail.ITEMNMBR || index),
          pudRowId: Number(detail.PUDROWID) || 0,
          batchNo: nextBatchNo,
          usageNo: String(header.USAGENO || ''),
          itemNo: detail.ITEMNMBR || '',
          itemDescription: detail.ITEMDESC || detail.ITEMNMBR || '',
          requiredWeight: Number(detail.KGSREQUIRED) || 0,
          weightLoaded: Number(detail.KGSUSED) || 0,
          processType: detail.PROCESS || 'Prepared and Loaded',
          weighedBy: detail.WEIGHEDBY || header.WEIGHEDBY || '',
          ValidatedBy: detail.VALIDATEDBY || header.VALIDATEDBY || '',
          randomSampled: Number(detail.RANDOM_SAMPLED) || 0,
          qaName: detail.QA_NAME || header?.QA_NAME || '',
          isDosingMachine,
          remarks: '',
        }));

        setShowForm(false);
        setShowBatchLists(false);
        setShowBatchDetails(false);
        setIsDosingMachine(isDosingMachine);
        setIsUpdating(true);
        setDetailViewRecord(header);
        setDetailLineItems(detailLineItems);
      }
    } catch (error) {
      console.error('Error fetching material utilization details:', error);
      Alert.alert('Error', 'Failed to load material utilization details.');
    }
  };

  const handleBackFromBatchDetails = () => {
    setShowBatchDetails(false);
    setSelectedBatchInfo(null);
    setShowBatchLists(true);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {showForm ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleBackToList} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerBarTitle, { color: colors.text }]}>New Material Utilization</Text>
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <MaterialUtilizationHeader
              ref={headerRef}
              onValidSubmit={handleValidSubmit}
              scrollViewRef={scrollViewRef}
            />
            <MaterialUtilizationBaseDetails
              ref={detailsRef}
              value={items}
              onItemsChange={setItems}
            />
            <View style={{ height: 80 }} />
          </ScrollView>

          <View
            style={[
              styles.footer,
              { backgroundColor: colors.background, borderTopColor: colors.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={handleBackToList}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={handleClear}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.text} />
              <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={() => headerRef.current?.submit()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send-check" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : showBatchLists ? (
        <MaterialUtilizationBatchLists
          usageNo={selectedUsageNo}
          onBack={handleBackToList}
          onAddNew={handleCreateNewFromBatchLists}
          onAddBaseDetail={handleAddNew}
          onBatchPress={handleBatchPress}
        />
      ) : showBatchDetails ? (
        <MaterialUtilizationBatchDetails
          usageNo={selectedUsageNo}
          batchNo={selectedBatchInfo?.batchNo}
          isDosingMachine={selectedBatchInfo?.isDosingMachine ?? false}
          onBack={handleBackFromBatchDetails}
          onEdit={handleEditBatchDetails}
        />
      ) : detailViewRecord ? (
        <View style={styles.detailViewContainer}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleBackToBatchLists} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerBarTitle, { color: colors.text }]}>
              {isUpdating ? 'Material Utilization Details Update' : 'Material Utilization Details'}
            </Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isUpdating ? (
              <MaterialUtilizationDetailsUpdate
                ref={detailViewRef}
                value={detailLineItems}
                onItemsChange={setDetailLineItems}
                isDosingMachine={isDosingMachine}
                initialData={{
                  pudRowId: Number(detailViewRecord.PUDROWID),
                  usageRefNo: String(detailViewRecord.USAGENO || ''),
                  batchNo: detailViewBatchNo ?? (Number(detailViewRecord?.BATCHNO) || 1),
                  itemnmbr: detailViewRecord?.FEEDTYPE || '',
                  weighedBy: detailViewWeighedBy,
                  validatedBy: detailViewValidatedBy,
                  randomSampled: detailViewRandomSampled,
                  qaName: detailViewQaName,
                }}
              />
            ) : (
              <MaterialUtilizationDetails
                ref={detailViewRef}
                value={detailLineItems}
                onItemsChange={setDetailLineItems}
                isDosingMachine={isDosingMachine}
                initialData={{
                  usageRefNo: String(detailViewRecord.USAGENO || ''),
                  batchNo: detailViewBatchNo ?? (Number(detailViewRecord?.BATCHNO) || 1),
                  itemnmbr: detailViewRecord?.FEEDTYPE || '',
                  weighedBy: detailViewWeighedBy,
                  validatedBy: detailViewValidatedBy,
                }}
              />
            )}
          </ScrollView>

          <View
            style={[
              styles.detailFooter,
              {
                borderTopColor: colors.cardBorder,
                backgroundColor: colors.background,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const isValid = detailViewRef.current?.validate();
                if (isValid) {
                  if (isUpdating) {
                    setUpdateConfirmVisible(true);
                  } else {
                    setSaveConfirmVisible(true);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="content-save-check" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {isUpdating ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <MaterialUtilizationList
          data={lists}
          loading={listsLoading}
          search={search}
          onSearchChange={setSearch}
          onRecordPress={handleRecordPress}
          onBack={onBack || (() => { })}
          onAddNew={handleAddNew}
        />
      )}

      <ConfirmModal
        visible={confirmVisible}
        title="Submit Material Utilization"
        message="Are you sure you want to submit this material utilization record?"
        iconName="send-check"
        iconColor={colors.primary}
        cancelText="Cancel"
        confirmText="Submit"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmModal
        visible={clearConfirmVisible}
        title="Clear All Data"
        message="Are you sure you want to clear all utilization details? This action cannot be undone."
        iconName="alert-outline"
        iconColor={colors.warning}
        cancelText="Cancel"
        confirmText="Clear"
        onConfirm={handleConfirmClear}
        onCancel={() => setClearConfirmVisible(false)}
      />

      <ConfirmModal
        visible={saveConfirmVisible}
        title="Save Changes"
        message="Are you sure you want to save the changes to this material utilization record?"
        iconName="content-save-check"
        iconColor={colors.primary}
        cancelText="Cancel"
        confirmText="Save"
        onConfirm={handleConfirmDetailSave}
        onCancel={() => setSaveConfirmVisible(false)}
      />

      <ConfirmModal
        visible={updateConfirmVisible}
        title="Update Batch Details"
        message="Are you sure you want to update this batch details record?"
        iconName="content-save-check"
        iconColor={colors.primary}
        cancelText="Cancel"
        confirmText="Update"
        onConfirm={handleConfirmUpdateDetailSave}
        onCancel={() => setUpdateConfirmVisible(false)}
      />

      <SuccessModal
        visible={successVisible}
        title="Success"
        message={successMessage}
        buttonText="Done"
        onDone={handleDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  detailViewContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  clearButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  clearButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1.3,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailFooter: {
    borderTopWidth: 1,
    padding: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
