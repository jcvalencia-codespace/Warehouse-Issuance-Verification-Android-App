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
import { MaterialUtilizationDetails, MaterialUtilizationDetailsRef } from './components/MaterialUtilizationDetails';
import { MaterialUtilizationHeader, MaterialUtilizationHeaderRef } from './components/MaterialUtilizationHeader';
import { MaterialUtilizationList } from './components/MaterialUtilizationList';
import { MaterialUtilizationService } from './services/materialUtilizationService';
import { BatchingMaterialUtilization, MaterialUtilizationBaseItemDetails, MaterialUtilizationFormData, MaterialUtilizationLineItem, MaterialUtilizationPayload } from './types/materialUtilization.types';

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
  const [pendingHeader, setPendingHeader] = useState<MaterialUtilizationFormData | null>(null);
  const [items, setItems] = useState<MaterialUtilizationBaseItemDetails[]>([]);
  const [detailViewRecord, setDetailViewRecord] = useState<any | null>(null);
  const [detailLineItems, setDetailLineItems] = useState<MaterialUtilizationLineItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [lists, setLists] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
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
      const payload: BatchingMaterialUtilization = {
        user: user?.NAME || '',
        details: detailLineItems,
        subDetails,
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
    setSelectedRecord(null);
    setDetailModalVisible(false);
    setDetailViewRecord(null);
    setDetailLineItems([]);
  };

  const handleRecordPress = async (record: any) => {
    setSelectedRecord(record);
    setDetailModalVisible(false);
    setDetailLoading(true);
    setDetailViewRecord(record);
    try {
      const data = await MaterialUtilizationService.getInstance().getMaterialUtilizationDetails(
        user?.COMPANY,
        record.USAGENO
      );
      const lineItems: MaterialUtilizationLineItem[] = (data.details || []).map((d) => ({
        id: d.ROWID ? String(d.ROWID) : String(Math.random()),
        batchNo: Number(record?.BATCHNO) || 0,
        usageNo: String(data.header?.USAGENO || record.USAGENO),
        itemNo: d.ITEMNMBR || '',
        itemDescription: d.ITEMDESC || d.ITEMNMBR || '',
        requiredWeight: Number(d.KGSREQUIRED) || 0,
        weightLoaded: 0,
        processType: 'Prepared and Loaded',
        weighedBy: data.header?.WEIGHEDBY || '',
        ValidatedBy: data.header?.VALIDATEDBY || '',
        randomSampled: 0,
        qaName: '',
        remarks: '',
      }));
      setDetailLineItems(lineItems);
    } catch (error) {
      console.error('Failed to fetch material utilization details:', error);
    } finally {
      setDetailLoading(false);
    }
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
       ) : detailViewRecord ? (
        <View style={styles.detailViewContainer}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleBackToList} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerBarTitle, { color: colors.text }]}>Material Utilization Details</Text>
          </View>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <MaterialUtilizationDetails
                ref={detailViewRef}
                value={detailLineItems}
                onItemsChange={setDetailLineItems}
                initialData={{
                  usageRefNo: String(detailViewRecord.USAGENO || ''),
                  batchNo: Number(detailViewRecord.BATCHNO) || 1,
                  itemnmbr: detailViewRecord?.FEEDTYPE || '',
                  weighedBy: detailViewRecord?.WEIGHEDBY || '',
                  validatedBy: detailViewRecord?.VALIDATEDBY || '',
                }}
              />
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
                onPress={() => setSaveConfirmVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="content-save-check" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save</Text>
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
          onBack={onBack || (() => {})}
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
