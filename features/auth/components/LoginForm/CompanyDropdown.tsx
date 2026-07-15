import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface CompanyOption {
  label: string;
  value: string;
  logo?: any;
  initials: string;
  color: string;
}

interface CompanyDropdownProps {
  options: CompanyOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    background: string;
    cardBackground: string;
    cardBorder: string;
    divider: string;
  };
}

export function CompanyDropdown({
  options,
  value,
  onSelect,
  placeholder = 'Select company',
  colors,
}: CompanyDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: colors.cardBorder,
            backgroundColor: colors.background,
          },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          {selected ? (
            <View
              style={[
                styles.logoRect,
                { backgroundColor: selected.color + '18' },
              ]}
            >
              {selected.logo ? (
                <Image
                  source={selected.logo}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.logoText, { color: selected.color }]}>
                  {selected.initials}
                </Text>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.logoRect,
                { backgroundColor: colors.divider },
              ]}
            >
              <Text
                style={[styles.logoText, { color: colors.textTertiary }]}
              >
                ?
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.triggerText,
              {
                color: selected ? colors.text : colors.textTertiary,
              },
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView
              style={styles.scrollView}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? option.color + '14'
                          : 'transparent',
                        borderBottomColor: colors.divider,
                      },
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionLogo,
                        { backgroundColor: option.color + '18' },
                      ]}
                    >
                      {option.logo ? (
                        <Image
                          source={option.logo}
                          style={styles.optionLogoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text
                          style={[
                            styles.optionLogoText,
                            { color: option.color },
                          ]}
                        >
                          {option.initials}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected
                            ? option.color
                            : colors.text,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Text
                        style={[
                          styles.checkmark,
                          { color: option.color },
                        ]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 50,
    paddingHorizontal: 14,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  logoRect: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollView: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  optionLogo: {
    width: 40,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  optionLogoImage: {
    width: 40,
    height: 32,
  },
  optionLogoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
});
