import { Colors } from '@/constants/theme';

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useSearchParams } from 'expo-router';
import { forkliftOperatorService } from '../services/forkliftOperatorService';
import {
  CreateForkliftOperatorPayload,
  ForkliftOperator,
  UpdateForkliftOperatorPayload,
} from '../types/forkliftOperator.types';

interface ForkliftOperatorFormScreenProps {
  operator?: ForkliftOperator;
}

export function ForkliftOperatorFormScreen({ operator: propOperator }: ForkliftOperatorFormScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchParams = useSearchParams();
  
  const rowIdParam = searchParams.get('rowId');
  const rowId = rowIdParam ? parseInt(rowIdParam) : null;

  const isEdit = !!rowId || !!propOperator?.ROWID;
  const [loading, setLoading] = useState(false);
  const [operator, setOperator] = useState<ForkliftOperator | undefined>(propOperator);
  const [loadingOperator, setLoadingOperator] = useState(!!rowId);
  const [formData, setFormData] = useState<{
    FORKLIFT_OPERATOR: string;
    IS_ACTIVE: boolean;
  }>({
    FORKLIFT_OPERATOR: propOperator?.FORKLIFT_OPERATOR || '',
    IS_ACTIVE: propOperator?.IS_ACTIVE ?? true,
  });

  useEffect(() => {
    if (rowId) {
      const fetchOperator = async () => {
        try {
          const result = await forkliftOperatorService.getForkliftOperatorById(rowId);
          if (result.success && result.data) {
            setOperator(result.data);
            setFormData({
              FORKLIFT_OPERATOR: result.data.FORKLIFT_OPERATOR,
              IS_ACTIVE: result.data.IS_ACTIVE,
            });
          }
        } catch (err) {
          console.error('Error fetching operator:', err);
        } finally {
          setLoadingOperator(false);
        }
      };
      fetchOperator();
    }
  }, [rowId]);

  useEffect(() => {
    if (propOperator) {
      setFormData({
        FORKLIFT_OPERATOR: propOperator.FORKLIFT_OPERATOR,
        IS_ACTIVE: propOperator.IS_ACTIVE,
      });
    }
  }, [propOperator]);

  const handleSubmit = async () => {
    if (!formData.FORKLIFT_OPERATOR.trim()) {
      Alert.alert('Validation Error', 'Please enter operator name');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const payload: UpdateForkliftOperatorPayload = {
          FORKLIFT_OPERATOR: formData.FORKLIFT_OPERATOR.trim(),
          IS_ACTIVE: formData.IS_ACTIVE,
        };
        const result = await forkliftOperatorService.updateForkliftOperator(
          rowId!,
          payload
        );

        if (!result.success) {
          Alert.alert('Error', result.message || 'Failed to update operator');
          return;
        }

        Alert.alert('Success', 'Operator updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const payload: CreateForkliftOperatorPayload = {
          FORKLIFT_OPERATOR: formData.FORKLIFT_OPERATOR.trim(),
          IS_ACTIVE: formData.IS_ACTIVE,
        };
        const result = await forkliftOperatorService.createForkliftOperator(payload);

        if (!result.success) {
          Alert.alert('Error', result.message || 'Failed to create operator');
          return;
        }

        Alert.alert('Success', 'Operator created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('Error saving forklift operator:', err);
      Alert.alert('Error', 'Connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (
    field: 'FORKLIFT_OPERATOR' | 'IS_ACTIVE',
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingOperator) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading operator...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isEdit ? 'Edit Operator' : 'New Operator'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isEdit
                ? 'Update operator details'
                : 'Add a new forklift operator'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[
              styles.inputGroup,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>
              Operator Name
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter operator name"
              placeholderTextColor={colors.textSecondary}
              value={formData.FORKLIFT_OPERATOR}
              onChangeText={(value) => updateField('FORKLIFT_OPERATOR', value)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.toggleGroup,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons
                name="account-check"
                size={24}
                color={formData.IS_ACTIVE ? colors.success : colors.textSecondary}
              />
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Active Status
                </Text>
                <Text
                  style={[styles.toggleDescription, { color: colors.textSecondary }]}
                >
                  Operator can be assigned to transactions
                </Text>
              </View>
            </View>
            <Switch
              value={formData.IS_ACTIVE}
              onValueChange={(value) => updateField('IS_ACTIVE', value)}
              trackColor={{ false: colors.textSecondary, true: colors.success }}
              thumbColor={colors.card}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: loading ? colors.textSecondary : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={loading ? 'loading' : isEdit ? 'content-save' : 'plus'}
              size={22}
              color={colors.card}
            />
            <Text style={[styles.submitText, { color: colors.card }]}>
              {loading
                ? 'Saving...'
                : isEdit
                  ? 'Update Operator'
                  : 'Add Operator'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputGroup: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForkliftOperatorFormScreen;