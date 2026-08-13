import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialUtilizationDetails, MaterialUtilizationDetailsRef } from './components/MaterialUtilizationDetails';
import { MaterialUtilizationHeader, MaterialUtilizationHeaderRef } from './components/MaterialUtilizationHeader';
import { MaterialUtilizationService } from './services/materialUtilizationService';
import { MaterialUtilizationFormData, MaterialUtilizationLineItem, MaterialUtilizationPayload } from './types/materialUtilization.types';

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
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [pendingHeader, setPendingHeader] = useState<MaterialUtilizationFormData | null>(null);
  const [items, setItems] = useState<MaterialUtilizationLineItem[]>([]);

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        validatedBy: pendingHeader.validatedBy,
        weighedBy: pendingHeader.weighedBy,
        user: user?.NAME || '',
        details: items,
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

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MaterialUtilizationHeader
            ref={headerRef}
            onValidSubmit={handleValidSubmit}
            scrollViewRef={scrollViewRef}
          />
          <MaterialUtilizationDetails
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
            style={[
              styles.cancelButton,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={onBack}
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
            <Text style={styles.buttonText}>
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
});
