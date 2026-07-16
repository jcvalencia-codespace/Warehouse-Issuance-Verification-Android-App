/**
 * Supplies Issuance Screen
 * Wraps the IssuanceHeader form and handles cancellation.
 */

import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { IssuanceHeader, IssuanceHeaderRef } from './components/IssuanceHeader';
import { IssuanceDetails } from './components/IssuanceDetails';

interface IssuanceScreenProps {
  onCancel?: () => void;
  onSubmit?: (data: any) => void;
}

export default function IssuanceScreen({ onCancel, onSubmit }: IssuanceScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const headerRef = useRef<IssuanceHeaderRef>(null);

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
          <IssuanceHeader ref={headerRef} onSubmit={onSubmit} />
          <IssuanceDetails />
        </ScrollView>

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
            <MaterialCommunityIcons name="close" size={20} color={colors.text} />
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
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
