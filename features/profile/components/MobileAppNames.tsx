import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { MobileAppNamesService } from '../services/mobileAppNamesService';
import { MobileAppName } from '../types/mobileAppNames.types';

interface MobileAppNamesProps {
  onBack?: () => void;
}

export default function MobileAppNames({ onBack }: MobileAppNamesProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();

  const [appNames, setAppNames] = useState<MobileAppName[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [locnCodes, setLocnCodes] = useState<string[]>([]);
  const [locnCodesLoading, setLocnCodesLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedLocnCode, setSelectedLocnCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locnCodeDropdownOpen, setLocnCodeDropdownOpen] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmItem, setConfirmItem] = useState<MobileAppName | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadAppNames = async () => {
    setLoading(true);
    try {
      const data = await MobileAppNamesService.getInstance().getMobileAppNames(
        user?.COMPANY,
      );
      setAppNames(data || []);
    } catch (error: any) {
      console.error('Failed to load mobile app names:', error);
      Alert.alert('Error', 'Failed to load mobile app names.');
      setAppNames([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocnCodes = async () => {
    setLocnCodesLoading(true);
    try {
      const data = await MobileAppNamesService.getInstance().getMobileAppNamesByLocnCode(
        user?.COMPANY,
      );
      setLocnCodes(data || []);
    } catch (error: any) {
      console.error('Failed to load location codes:', error);
      setLocnCodes([]);
    } finally {
      setLocnCodesLoading(false);
    }
  };

  useEffect(() => {
    loadAppNames();
    loadLocnCodes();
  }, [user?.COMPANY]);

  const filteredData = search.trim()
    ? appNames.filter((r) => {
        const s = search.trim().toLowerCase();
        return (
          String(r.NAME ?? '').toLowerCase().includes(s) ||
          String(r.LOCNCODE ?? '').toLowerCase().includes(s)
        );
      })
    : appNames;

  const handleAddNew = () => {
    setNewName('');
    setSelectedLocnCode(locnCodes[0] || null);
    setShowAddModal(true);
    setLocnCodeDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      Alert.alert('Validation', 'Please enter a mobile app name.');
      return;
    }
    if (!selectedLocnCode) {
      Alert.alert('Validation', 'Please select a location code.');
      return;
    }

    setSaving(true);
    try {
      const result = await MobileAppNamesService.getInstance().saveMobileAppName(
        {
          name: newName.trim(),
          locnCode: selectedLocnCode,
          createdBy: user?.NAME || '',
        },
        user?.COMPANY,
      );

      if (result.success) {
        setShowAddModal(false);
        setSuccessMessage(result.message || 'Mobile app name saved successfully.');
        setSuccessVisible(true);
        loadAppNames();
      } else {
        Alert.alert('Error', result.message || 'Failed to save mobile app name.');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to save mobile app name.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (item: MobileAppName) => {
    setConfirmItem(item);
    setConfirmVisible(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmItem) return;
    try {
      const result = await MobileAppNamesService.getInstance().deactivateMobileAppName(
        confirmItem.ROWID,
        user?.COMPANY,
      );
      if (result.success) {
        setConfirmVisible(false);
        setConfirmItem(null);
        setSuccessMessage(result.message || 'Mobile app name deactivated successfully.');
        setSuccessVisible(true);
        loadAppNames();
      } else {
        Alert.alert('Error', result.message || 'Failed to deactivate mobile app name.');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to deactivate mobile app name.',
      );
    }
  };

  const handleDone = () => {
    setSuccessVisible(false);
    setSuccessMessage('');
  };

  const renderListItem = ({ item }: { item: MobileAppName }) => {
    const isActive = item.ACTIVE === '1' || item.ACTIVE === 1 || item.ACTIVE === true;

    return (
      <View
        style={[
          styles.listItemCard,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.listItemHeader}>
          <View
            style={[
              styles.listItemIconContainer,
              { backgroundColor: colors.primary + '14' },
            ]}
          >
            <MaterialCommunityIcons name="cellphone" size={22} color={colors.primary} />
          </View>
          <View style={styles.listItemTextContainer}>
            <Text style={[styles.listItemName, { color: colors.text }]}>
              {item.NAME || '—'}
            </Text>
            <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
              Location: {item.LOCNCODE || '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.success + '14' : colors.error + '14' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? colors.success : colors.error },
                ]}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {isActive && (
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => handleDeactivate(item)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack || (() => {})}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Mobile App Names</Text>
          <TouchableOpacity
            style={[styles.addFab, { backgroundColor: colors.primary }]}
            onPress={handleAddNew}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name or location code"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading records…
            </Text>
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.ROWID ?? index}-${index}`}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={<View style={{ height: 16 }} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cellphone" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No mobile app names found
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Mobile App Name</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter app name"
                placeholderTextColor={colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Location Code</Text>
              <TouchableOpacity
                style={[
                  styles.locnCodeSelector,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setLocnCodeDropdownOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.locnCodeSelectedText, { color: colors.text }]}>
                  {selectedLocnCode || 'Select location code'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Modal
              visible={locnCodeDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setLocnCodeDropdownOpen(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setLocnCodeDropdownOpen(false)}
              >
                <View
                  style={[
                    styles.dropdownContent,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.dropdownTitle, { color: colors.textSecondary }]}>
                    Select Location Code
                  </Text>
                  {locnCodesLoading ? (
                    <View style={styles.dropdownLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : (
                    <FlatList
                      data={locnCodes}
                      keyExtractor={(item, index) => `${item}-${index}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedLocnCode(item);
                            setLocnCodeDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                </View>
              </Pressable>
            </Modal>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmVisible}
        title="Deactivate Mobile App Name"
        message="Are you sure you want to deactivate this mobile app name?"
        iconName="alert-outline"
        iconColor={colors.error}
        cancelText="Cancel"
        confirmText="Deactivate"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setConfirmVisible(false);
          setConfirmItem(null);
        }}
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
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  addFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deactivateButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  locnCodeSelector: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locnCodeSelectedText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalConfirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownContent: {
    width: '90%',
    maxHeight: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  dropdownLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
