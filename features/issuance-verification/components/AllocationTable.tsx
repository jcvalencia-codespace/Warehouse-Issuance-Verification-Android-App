/**
 * Allocation Table Component
 * Responsive table that shows cards on mobile and table on tablet
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BagAllocationItem } from '../types/issuance.types';

interface AllocationTableProps {
  colors: any;
  isTablet: boolean;
  items: BagAllocationItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  selectedItemNumber?: string;
  selectedItemRemarks?: string;
  selectedArea?: string;
  onItemSelect?: (itemNumber: string, itemRemarks?: string) => void;
  showItemColumn?: boolean;
  allocationError?: string;
}

export function AllocationTable({
  colors,
  isTablet,
  items,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  selectedItemNumber,
  selectedItemRemarks,
  selectedArea,
  onItemSelect,
  showItemColumn = true,
  allocationError,
}: AllocationTableProps) {
  // Filter items when an item number, remarks, or area is selected
  const filteredItems = items.filter(item => {
    const itemKey = item.ITEMNMBR?.trim() || '';
    const itemRemarks = item.REMARKS?.trim() || '';
    
    // Create the display key for comparison (ITEMNMBR-REMARKS or just ITEMNMBR)
    const fullItemKey = itemRemarks ? `${itemKey}-${itemRemarks}` : itemKey;
    
    const matchesItem = !selectedItemNumber || fullItemKey === selectedItemNumber.trim() || itemKey === selectedItemNumber.trim();
    
    // Handle remarks filtering:
    // - If selectedItemRemarks has value, filter by that specific remarks
    // - If selectedItemRemarks is empty/undefined, only show items WITHOUT remarks
    let matchesRemarks: boolean;
    if (!selectedItemRemarks || selectedItemRemarks.trim() === '') {
      // No remarks selected - only show items without remarks
      matchesRemarks = itemRemarks === '';
    } else {
      // Remarks selected - match the specific remarks
      matchesRemarks = itemRemarks === selectedItemRemarks.trim();
    }
    
    const matchesArea = !selectedArea || item.AREA?.trim() === selectedArea.trim();
    return matchesItem && matchesRemarks && matchesArea;
  });
  
  // Calculate pagination based on filtered items
  const filteredTotalItems = filteredItems.length;
  const filteredTotalPages = Math.ceil(filteredTotalItems / itemsPerPage) || 1;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredTotalItems);

  // Get items for current page from filtered list
  const paginatedItems = filteredItems.slice(startItem - 1, endItem);

  return (
    <View style={styles.container}>
      {/* Allocation Error Display */}
      {allocationError && (
        <View style={[styles.errorContainer, { marginBottom: 16, padding: 12, backgroundColor: colors.error + '15', borderRadius: 8 }]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error, flex: 1 }]}>
            {allocationError}
          </Text>
        </View>
      )}
      {isTablet ? (
        // Table View for Tablets
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.primary + '10', borderBottomColor: colors.cardBorder }]}>
            {showItemColumn && (
              <Text style={[styles.tableHeaderTextItem, { color: colors.primary }]}>ITEM #</Text>
            )}
            <Text style={[styles.tableHeaderTextLot, { color: colors.primary }]}>LOT #</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Area</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Avail Bags</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Avail KGS</Text>
            <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Tag</Text>
          </View>

          {/* Table Rows */}
          {paginatedItems.map((item, index) => (
            <TouchableOpacity
              key={`${item.QM_IDNUMBER}-${index}`}
              style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground, borderBottomColor: colors.cardBorder }]}
              onPress={() => showItemColumn && onItemSelect?.(item.ITEMNMBR, item.REMARKS)}
              disabled={!showItemColumn}
              activeOpacity={0.7}
            >
              {showItemColumn && (
                <Text style={[styles.tableCellItem, { 
                  color: (selectedItemNumber === item.ITEMNMBR || selectedItemNumber === `${item.ITEMNMBR?.trim()}-${item.REMARKS?.trim()}`) 
                    ? colors.primary : colors.text, 
                  fontWeight: (selectedItemNumber === item.ITEMNMBR || selectedItemNumber === `${item.ITEMNMBR?.trim()}-${item.REMARKS?.trim()}`) ? '700' as const : '400' as const 
                }]}>
                  {item.REMARKS && item.REMARKS.trim() 
                    ? `${String(item.ITEMNMBR || '-').trim()}-${item.REMARKS.trim()}`
                    : String(item.ITEMNMBR || '-').trim()}
                </Text>
              )}
              <Text style={[styles.tableCellLot, { color: colors.text }]}>{String(item.LOTNUMBER || '-').trim()}</Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>{String(item.AREA || '-').trim()}</Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>{item['AVAILABLE BAGS']}</Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>{Number(item['AVAILABLE KGS']).toFixed(2)}</Text>
              <Text style={[styles.tableCell, { color: item.TAG === 'TRUE' ? colors.success : colors.error, fontWeight: '600' as const }]}>
                {item.TAG === 'TRUE' ? '✓' : '✗'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        // Card View for Phones
        <View style={styles.cardContainer}>
          {paginatedItems.map((item, index) => (
            <View
              key={`${item.QM_IDNUMBER}-${index}`}
              style={[styles.allocationCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardBadge, { backgroundColor: item.TAG === 'TRUE' ? colors.success + '20' : colors.error + '20' }]}>
                  <Text style={[styles.cardBadgeText, { color: item.TAG === 'TRUE' ? colors.success : colors.error }]}>
                    {item.TAG === 'TRUE' ? '✓ Allocated' : '✗ Not Allocated'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                {showItemColumn && (
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>ITEM #</Text>
                    <Text style={[styles.cardValue, { 
                      color: (selectedItemNumber === item.ITEMNMBR || selectedItemNumber === `${item.ITEMNMBR?.trim()}-${item.REMARKS?.trim()}`) 
                        ? colors.primary : colors.text 
                    }]}>
                      {item.REMARKS && item.REMARKS.trim() 
                        ? `${String(item.ITEMNMBR || '-').trim()}-${item.REMARKS.trim()}`
                        : String(item.ITEMNMBR || '-').trim()}
                    </Text>
                  </View>
                )}
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>LOT #</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.LOTNUMBER || '-').trim()}</Text>
                </View>
                
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Area</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.AREA || '-').trim()}</Text>
                </View>
                
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Available</Text>
                  <Text style={[styles.cardValue, { color: colors.text }]}>{item['AVAILABLE BAGS']} bags ({Number(item['AVAILABLE KGS']).toFixed(2)} kg)</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination Controls */}
      {filteredTotalItems > itemsPerPage && (
        <View style={[styles.paginationContainer, { backgroundColor: colors.primary + '08', borderTopColor: colors.cardBorder }]}>
          <Text style={[styles.paginationInfo, { color: colors.textSecondary }]}>
            Showing {startItem}-{endItem} of {filteredTotalItems}
          </Text>

          <View style={styles.paginationControls}>
            <View
              style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            >
              <MaterialCommunityIcons
                name="page-first"
                size={18}
                color={currentPage === 1 ? colors.textTertiary : colors.primary}
              />
            </View>

            <View
              style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onTouchEnd={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={18}
                color={currentPage === 1 ? colors.textTertiary : colors.primary}
              />
            </View>

            <View style={[styles.pageIndicator, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.pageIndicatorText, { color: colors.primary }]}>
                {currentPage} / {filteredTotalPages}
              </Text>
            </View>

            <View
              style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onTouchEnd={() => onPageChange(Math.min(filteredTotalPages, currentPage + 1))}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={currentPage === filteredTotalPages ? colors.textTertiary : colors.primary}
              />
            </View>

            <View
              style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            >
              <MaterialCommunityIcons
                name="page-last"
                size={18}
                color={currentPage === filteredTotalPages ? colors.textTertiary : colors.primary}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Table Styles
  tableContainer: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  tableHeaderTextLot: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'center',
  },
  tableHeaderTextItem: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  tableCell: {
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  tableCellLot: {
    fontSize: 14,
    flex: 1.5,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  tableCellItem: {
    fontSize: 14,
    flex: 1.5,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  // Card Styles for Mobile
  cardContainer: {
    paddingHorizontal: 14,
    gap: 14,
  },
  allocationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  cardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardContent: {
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  paginationInfo: {
    fontSize: 15,
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationNavButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
