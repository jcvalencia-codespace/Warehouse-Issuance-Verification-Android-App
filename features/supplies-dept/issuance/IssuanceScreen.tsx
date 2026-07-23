/**
 * Supplies Issuance Screen
 * Wraps the IssuanceHeader form and IssuanceDetails, handles submission.
 */

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IssuanceDetails,
  IssuanceDetailsRef,
  IssuanceLineItem,
} from './components/IssuanceDetails';
import { IssuanceHeader, IssuanceHeaderRef } from './components/IssuanceHeader';
import { IssuanceService } from './services/issuanceService';
import {
  PostIssuanceDetail,
  PostIssuancePayload,
} from './types/issuance.types';

interface IssuanceScreenProps {
  onCancel?: () => void;
  onSubmit?: (data: any) => void;
}

const formatLocalDateTime = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;

export default function IssuanceScreen({ onCancel, onSubmit }: IssuanceScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const headerRef = useRef<IssuanceHeaderRef>(null);
  const detailsRef = useRef<IssuanceDetailsRef>(null);

  const [items, setItems] = useState<IssuanceLineItem[]>([]);
  const [pendingHeader, setPendingHeader] = useState<any>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issuedReferenceNo, setIssuedReferenceNo] = useState<string>('');

  const handleClear = () => {
    setClearConfirmVisible(true);
  };

  const handleConfirmClear = () => {
    headerRef.current?.clear();
    detailsRef.current?.clear();
    setIssuedReferenceNo('');
    setClearConfirmVisible(false);
  };

  const handleValidSubmit = async (headerData: any) => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item before submitting.');
      return;
    }

    try {
      const validation = await IssuanceService.getInstance().validateIssuanceDate(user?.COMPANY);
      if (!validation.canIssue) {
        Alert.alert(
          'Cannot Submit Transaction',
          validation.lastUnpostedDate
            ? `Post or Delete All Pending/Floating Transactions\n(R.R., Issuance, Sales, Adj.)\nbefore Encoding New Transactions!`
            : 'Issuance is currently blocked due to an old unposted record.'
        );
        return;
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'Failed to validate issuance date';
      Alert.alert('Error', message);
      return;
    }

    setPendingHeader(headerData);
    setConfirmVisible(true);
  };

  const buildPayload = (headerData: any): PostIssuancePayload => {
    const now = new Date();
    const dateIssued = new Date(headerData.dateIssued);
    const timeRequest = new Date(headerData.timeRequest);
    const timeIssued = headerData.issuanceMode === 'manual'
      ? new Date(headerData.timeIssued)
      : new Date();

    const dateOnly = new Date(dateIssued);
    dateOnly.setHours(0, 0, 0, 0);

    const dateIssuedWithTimeIssued = new Date(dateOnly);
    dateIssuedWithTimeIssued.setHours(
      timeIssued.getHours(),
      timeIssued.getMinutes(),
      timeIssued.getSeconds(),
      timeIssued.getMilliseconds()
    );

    const timeRequestWithDate = new Date(dateOnly);
    timeRequestWithDate.setHours(
      timeRequest.getHours(),
      timeRequest.getMinutes(),
      timeRequest.getSeconds(),
      timeRequest.getMilliseconds()
    );

    const timeIssuedWithDate = new Date(dateOnly);
    timeIssuedWithDate.setHours(
      timeIssued.getHours(),
      timeIssued.getMinutes(),
      timeIssued.getSeconds(),
      timeIssued.getMilliseconds()
    );

    const details: PostIssuanceDetail[] = items.map((item) => {
      const firstDetail = item.details[0];
      return {
        itemCode: item.itemCode,
        description: item.description,
        quantity: item.quantity,
        machineNo: '',
        lotNumber: firstDetail?.LOTNUMBER ?? '',
        uofm: firstDetail?.UOFM ?? '',
        refNoRecv: firstDetail?.REFERENCENO ?? '',
        lineNumRecv: firstDetail?.LINENUMBER ?? '',
        remarks: item.remarks ?? '',
      };
    });

    return {
      referenceNo: headerData.referenceNo,
      locnCode: 'PAWHSP',
      transactionType: headerData.transactionType,
      issuanceType: headerData.issuanceType,
      otherDocNo: headerData.issuanceMode === 'manual' ? 'ERP MOBILE -MANUAL' : 'ERP MOBILE',
      dateIssued: formatLocalDateTime(dateIssuedWithTimeIssued),
      shift: headerData.shift,
      contactPerson: headerData.contactPerson,
      transferLocnCode: headerData.deptCode,
      projectName: headerData?.project ?? '',
      areaTransfer: headerData.area,
      issuedBy: headerData.issuedBy,
      approvedBy: headerData.approvedBy,
      timeRequest: formatLocalDateTime(timeRequestWithDate),
      timeIssued: formatLocalDateTime(timeIssuedWithDate),
      dateCreated: formatLocalDateTime(now),
      dateModified: formatLocalDateTime(now),
      userName: user?.USERNAME || headerData.issuedBy,
      postStatus: 1,
      details,
    };
  };

  const handleConfirmSubmit = async () => {
    if (!pendingHeader) return;
    setSubmitting(true);
    try {
      const payload = buildPayload(pendingHeader);
      const result = await IssuanceService.getInstance().postIssuance(
        payload,
        user?.COMPANY
      );
      if (result.success) {
        setConfirmVisible(false);
        setSubmitting(false);
        setPendingHeader(null);
        const updatedPayload = result.referenceNo && result.referenceNo !== payload.referenceNo
          ? { ...payload, referenceNo: result.referenceNo }
          : payload;
        if (result.referenceNo && result.referenceNo !== payload.referenceNo) {
          setIssuedReferenceNo(result.referenceNo);
        }
        const message = result.referenceNo && result.referenceNo !== payload.referenceNo
          ? `Reference number has been changed to ${result.referenceNo}. Supplies issuance submitted successfully.`
          : 'Supplies issuance submitted successfully.';
        Alert.alert('Success', message, [
          {
            text: 'OK',
            onPress: () => onSubmit?.(updatedPayload),
          },
        ]);
      } else {
        setConfirmVisible(false);
        setSubmitting(false);
        Alert.alert('Error', result.message || 'Failed to submit issuance.');
      }
    } catch (error: any) {
      setSubmitting(false);
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Failed to submit issuance.';
      Alert.alert('Error', errorMessage);
      if (errorMessage.toLowerCase().includes('insufficient stock')) {
        detailsRef.current?.refreshItemQuantities();
      }
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 16 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <IssuanceHeader ref={headerRef} onValidSubmit={handleValidSubmit} referenceNo={issuedReferenceNo} />
          <IssuanceDetails ref={detailsRef} value={items} onItemsChange={setItems} onTimeRequestUpdate={(date) => headerRef.current?.updateTimeRequest(date)} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
          onPress={onCancel}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.clearButton,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
          onPress={handleClear}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.text} />
          <Text style={[styles.clearButtonText, { color: colors.text }]}>
            Clear
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={() => headerRef.current?.submit()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="send-check" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Confirm Submission Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !submitting && setConfirmVisible(false)}
        >
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: colors.primary + '14' },
              ]}
            >
              <MaterialCommunityIcons name="send-check" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Confirm Submission
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to submit this issuance with {items.length} item(s)?
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmCancel,
                  { borderColor: colors.cardBorder, backgroundColor: colors.background },
                ]}
                onPress={() => setConfirmVisible(false)}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmit, { backgroundColor: colors.primary }]}
                onPress={handleConfirmSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal visible={clearConfirmVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setClearConfirmVisible(false)}
        >
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: colors.warning + '14' },
              ]}
            >
              <MaterialCommunityIcons name="alert-outline" size={28} color={colors.warning} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Clear All Data
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to clear all issuance details? This action cannot be undone.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmCancel,
                  { borderColor: colors.cardBorder, backgroundColor: colors.background },
                ]}
                onPress={() => setClearConfirmVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmit, { backgroundColor: colors.warning }]}
                onPress={handleConfirmClear}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmSubmitText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmSubmit: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
