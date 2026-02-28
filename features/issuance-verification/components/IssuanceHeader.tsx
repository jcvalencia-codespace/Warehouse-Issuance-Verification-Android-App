/**
 * Issuance Verification Header Component
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface IssuanceHeaderProps {
  colors: any;
  onCancel: () => void;
  onClear?: () => void;
}

export function IssuanceHeader({ colors, onCancel, onClear }: IssuanceHeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
      <TouchableOpacity onPress={onCancel} style={styles.headerButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Issuance Verification
        </Text>
        <View style={styles.headerSubtitleRow}>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.statusText, { color: colors.warning }]}>Draft</Text>
          </View>
        </View>
      </View>
      {onClear ? (
        <TouchableOpacity onPress={onClear} style={styles.headerButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
