import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialUtilizationService } from '../services/materialUtilizationService';
import { BatchDetail } from '../types/materialUtilization.types';

interface MaterialUtilizationBatchDetailsProps {
    usageNo?: number;
    batchNo?: number;
    isDosingMachine?: boolean;
    onBack?: () => void;
    /** Called when the user wants to edit the batch details. Receives the batch details already loaded. */
    onEdit?: (details: BatchDetail[]) => void;
    /** Pre-fetched details. If omitted, the component fetches them itself. */
    batchDetails?: BatchDetail[];
}

export const MaterialUtilizationBatchDetails: React.FC<MaterialUtilizationBatchDetailsProps> = ({
    usageNo,
    batchNo,
    isDosingMachine = false,
    onBack,
    onEdit,
    batchDetails: initialDetails,
}) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [details, setDetails] = useState<BatchDetail[]>(initialDetails ?? []);
    const [loading, setLoading] = useState(!initialDetails);

    const loadBatchDetails = useCallback(async () => {
        if (!usageNo || batchNo === undefined) return;
        setLoading(true);
        try {
            const data = await MaterialUtilizationService.getInstance().getBatchDetails(
                user?.COMPANY,
                usageNo,
                batchNo,
                isDosingMachine
            );
            setDetails(data);
        } catch (error) {
            console.error('Failed to load batch details:', error);
            Alert.alert('Error', 'Failed to load batch details.');
        } finally {
            setLoading(false);
        }
    }, [usageNo, batchNo, isDosingMachine, user?.COMPANY]);

    useEffect(() => {
        if (!initialDetails) {
            loadBatchDetails();
        }
    }, [loadBatchDetails, initialDetails]);

    const formatKg = (value?: string | number) =>
        `${Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const totalRequired = details.reduce((sum, d) => sum + Number(d.KGSREQUIRED || 0), 0);
    const totalLoaded = details.reduce((sum, d) => sum + Number(d.KGSUSED || 0), 0);

    const renderHeader = () => (
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.cardBorder, backgroundColor: colors.background, },]}>
            <Text style={[styles.headerCell, styles.colItem, { color: colors.textSecondary },]}>
                Item No
            </Text>
            <Text style={[styles.headerCell, styles.colQty, { color: colors.textSecondary, textAlign: 'right', },]}>
                Req. Wt (kgs)
            </Text>
            <Text style={[styles.headerCell, styles.colQty, { color: colors.textSecondary, textAlign: 'right', },]}>
                Wt. Loaded (kgs)
            </Text>
            <Text style={[styles.headerCell, styles.colProcess, { color: colors.textSecondary, textAlign: 'right', },]}>
                Process
            </Text>
        </View>
    );

    const renderRow = ({ item }: { item: BatchDetail }) => {
        const isOil = item.PROCESS === 'Oil';
        return (
            <View style={[styles.tableRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.cell, styles.colItem, { color: colors.text }]} numberOfLines={1}>
                    {item.ITEMNMBR || '—'}
                </Text>
                <View style={styles.colQty}>
                    <Text style={[styles.cell, { color: colors.textSecondary, fontWeight: '600', textAlign: 'right', },]}>
                        {formatKg(item.KGSREQUIRED)}
                    </Text>
                </View>

                <View style={styles.colQty}>
                    <Text style={[styles.cell, { color: colors.text, textAlign: 'right', },]}>
                        {formatKg(item.KGSUSED)}
                    </Text>
                </View>
                <View style={styles.colProcess}>
                    <View
                        style={[
                            styles.processBadge,
                            {
                                backgroundColor: isOil ? colors.warning + '20' : colors.primary + '20',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.processBadgeText,
                                { color: isOil ? colors.warning : colors.primary },
                            ]}
                        >
                            {item.PROCESS || 'Prepared and Loaded'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (details.length === 0) return null;
        return (
            <View
                style={[
                    styles.tableFooterRow,
                    { borderTopColor: colors.cardBorder, backgroundColor: colors.cardBackground, borderRadius: 16 },
                ]}
            >
                <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text
                    style={[
                        styles.footerCell,
                        styles.colQty,
                        { color: colors.text, textAlign: 'right', fontWeight: '700' },
                    ]}
                >
                    {formatKg(totalRequired)}
                </Text>
                <Text
                    style={[
                        styles.footerCell,
                        styles.colQty,
                        { color: colors.primary, textAlign: 'right', fontWeight: '700' },
                    ]}
                >
                    {formatKg(totalLoaded)}
                </Text>
                <View style={styles.colProcess} />
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.headerBar}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={8}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : null}
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.review }]}>Batch No: {batchNo} {isDosingMachine ? '- Auto Dosing' : ''}</Text>

                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Batch Details For Review
                    </Text>

                </View>
                {onEdit ? (
                    <TouchableOpacity onPress={() => onEdit?.(details)} activeOpacity={0.7} hitSlop={8}>
                        <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading batch details…
                    </Text>
                </View>
            ) : details.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="clipboard-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No batch details found
                    </Text>
                </View>
            ) : (
                <View style={styles.tableCardContainer}>
                    <View
                        style={[
                            styles.tableCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        {renderHeader()}
                        <FlatList
                            data={details}
                            keyExtractor={(item, index) => item.ITEMNMBR + index}
                            renderItem={renderRow}
                            scrollEnabled={false}
                        />
                    </View>
                </View>

            )}
            <View style= {styles.footer}>
                {renderFooter()}
            </View>
        </SafeAreaView>
    );
};

export default MaterialUtilizationBatchDetails;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    tableCardContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 8,
    },
    tableCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tableFooterRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 20,
        alignItems: 'center',
    },
    headerCell: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    cell: {
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
    },
    footerLabel: {
        fontSize: 16,
        fontWeight: '600',
        flex: 2,
    },

    footerCell: {
        fontSize: 16,
        fontWeight: '500',
    },
    colItem: {
        flex: 2,
        minWidth: 80,
    },

    colQty: {
        flex: 1.5,
        minWidth: 90,
        alignItems: 'flex-end',
    },

    colProcess: {
        flex: 1.5,
        minWidth: 130,
        alignItems: 'flex-end',
    },

    colBadge: {
        flex: 0.8,
        minWidth: 40,
        alignItems: 'center',
    },
    processBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    processBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
