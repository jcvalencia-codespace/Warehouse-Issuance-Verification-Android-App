/**
 * Item Code Modal
 * Modal with search functionality for selecting an item code.
 */

import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { DropdownOption } from '../services/issuanceService';

interface ItemCodeModalProps {
  visible: boolean;
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function ItemCodeModal({
  visible,
  options,
  selectedValue,
  onSelect,
  onClose,
}: ItemCodeModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.value.toLowerCase().includes(query) ||
      (option.description?.toLowerCase().includes(query) ?? false)
    );
  }, [options, search]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, paddingBottom: insets.bottom }]} edges={['bottom']}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Select Item Code</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchContainer,
              { borderColor: colors.cardBorder, backgroundColor: colors.background },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              placeholder="Search item code or description"
              placeholderTextColor={colors.textTertiary}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.tableHeaderCode, { color: colors.textTertiary }]}>CODE</Text>
            <Text style={[styles.tableHeaderDescription, { color: colors.textTertiary }]}>DESCRIPTION</Text>
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No item codes found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  { borderBottomColor: colors.cardBorder },
                  selectedValue === item.value && { backgroundColor: colors.primary + '14' },
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <View style={styles.optionColumns}>
                  <Text style={[styles.optionCode, { color: colors.text }]} numberOfLines={1}>
                    {item.value}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {item.description || ''}
                  </Text>
                </View>
                {selectedValue === item.value && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    maxHeight: '80%',
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tableHeaderCode: {
    width: 120,
    marginRight: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableHeaderDescription: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  optionColumns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  optionCode: {
    fontSize: 15,
    fontWeight: '700',
    width: 120,
    marginRight: 12,
    marginTop: 1,
  },
  optionDescription: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
