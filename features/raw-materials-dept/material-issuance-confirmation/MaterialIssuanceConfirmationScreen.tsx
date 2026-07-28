import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIssuanceConfirmationService } from './services/materialIssuanceConfirmationService';

interface FlatItem {
    ROWID: number;
    MIRNO: string;
    SHIFT: string;
    REVIEWEDBY: string;
    CREATEDBY: string;
    DATECREATED: string;
    POSTSTATUS: number;
    ITEMNMBR: string;
    ITEMDESC?: string;
    QUANTITY: number;
    UOFM?: string;
}

export default function MaterialIssuanceConfirmationScreen() {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [items, setItems] = useState<FlatItem[]>([]);
    const [servedItems, setServedItems] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [markServedVisible, setMarkServedVisible] = useState(false);
    const [markServedItem, setMarkServedItem] = useState<FlatItem | null>(null);

    const fetchAllItems = useCallback(async () => {
        setError(null);
        try {
            const headers = await MaterialIssuanceConfirmationService.getInstance()
                .getMaterialIssuanceRequestHeader(user?.COMPANY);

            const allItems: FlatItem[] = [];
            await Promise.all(
                headers.map(async (header) => {
                    try {
                        const details = await MaterialIssuanceConfirmationService.getInstance()
                            .getMaterialIssuanceRequestDetails(header.MIRNO, user?.COMPANY);
                        for (const detail of details) {
                            let itemDesc = detail.ITEMDESC;
                            allItems.push({
                                ROWID: detail.ROWID,
                                MIRNO: header.MIRNO,
                                SHIFT: header.SHIFT,
                                REVIEWEDBY: header.REVIEWEDBY,
                                CREATEDBY: header.CREATEDBY,
                                DATECREATED: header.DATECREATED,
                                POSTSTATUS: header.POSTSTATUS,
                                ITEMNMBR: detail.ITEMNMBR,
                                ITEMDESC: itemDesc,
                                QUANTITY: detail.QUANTITY,
                                UOFM: detail.UOFM,
                            });
                        }
                    } catch {
                        // skip details for this header
                    }
                })
            );

            setItems(allItems);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch material issuance requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.COMPANY]);

    useEffect(() => {
        fetchAllItems();
    }, [fetchAllItems]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllItems();
    }, [fetchAllItems]);

    const handleMarkServed = (item: FlatItem) => {
        setMarkServedItem(item);
        setMarkServedVisible(true);
    };

    const handleConfirmMarkServed = async () => {
        if (!markServedItem) return;
        const { ROWID: rowId, MIRNO } = markServedItem;
        setServedItems((prev) => {
            const next = new Set(prev);
            next.add(rowId);
            return next;
        });
        setMarkServedVisible(false);
        try {
            await MaterialIssuanceConfirmationService.getInstance()
                .markItemAsServed(MIRNO, rowId, user?.COMPANY);
        } catch {
            setServedItems((prev) => {
                const next = new Set(prev);
                next.delete(rowId);
                return next;
            });
        }
    };

    const handleCancelMarkServed = () => {
        setMarkServedVisible(false);
    };

    const postedCount = items.filter((it) => it.POSTSTATUS === 1).length;
    const pendingCount = items.length - postedCount;

    const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) => (
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
        </View>
    );

    const renderItem = ({ item }: { item: FlatItem }) => {
        const isServed = servedItems.has(item.ROWID);
        return (
            <View style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.itemCardRow}>
                    <View style={styles.itemCardLeft}>
                        <View style={[styles.itemAvatar, { backgroundColor: colors.primary + '14' }]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.itemCardBody}>
                            <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                            {item.ITEMDESC ? (
                                <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {item.ITEMDESC}
                                </Text>
                            ) : null}
                            <Text style={[styles.itemMirNo, { color: colors.textTertiary, fontSize: 16, marginTop: 4 }]}>
                                {item.MIRNO} | {item.SHIFT} | Requested By: {item.CREATEDBY}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.itemQuantity}>
                        <Text style={[styles.itemQuantityValue, { color: colors.primary }]}>{item.QUANTITY}</Text>
                        {item.UOFM ? (
                            <Text style={[styles.itemQuantityUnit, { color: colors.textTertiary }]}>{item.UOFM}</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.servedBtn,
                            { backgroundColor: isServed ? colors.success : colors.warning + '14' },
                        ]}
                        onPress={() => handleMarkServed(item)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={isServed ? 'check' : 'circle'}
                            size={14}
                            color={isServed ? '#ffffff' : colors.warning}
                        />
                        <Text style={[styles.servedBtnText, { color: isServed ? '#ffffff' : colors.warning }]}>
                            {isServed ? 'SERVED' : 'Mark Served'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.appBar, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <View style={styles.appBarTitle}>
                    <Text style={[styles.appBarTitleText, { color: colors.text }]}>Confirmations</Text>
                    <Text style={[styles.appBarSubtitle, { color: colors.textSecondary }]}>
                        Review posted requests
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>Loading confirmations…</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <View style={[styles.errorIconContainer, { backgroundColor: (colors.error || '#ef4444') + '14' }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.error || '#ef4444'} />
                    </View>
                    <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
                    <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchAllItems}>
                        <MaterialCommunityIcons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '10' }]}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={52} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No confirmations yet</Text>
                    <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                        Posted material issuance requests will appear here for confirmation.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => `${item.ROWID}-${index}`}
                    nestedScrollEnabled
                    scrollEnabled
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            progressBackgroundColor={colors.cardBackground}
                        />
                    }
                    ListHeaderComponent={
                        <>
                            <View style={styles.statsRow}>
                                <StatCard label="Total" value={String(items.length)} icon="numeric" color={colors.primary} />
                                <StatCard label="Posted" value={String(postedCount)} icon="check" color={colors.success} />
                                <StatCard
                                    label="Pending"
                                    value={String(pendingCount)}
                                    icon="clock"
                                    color={colors.warning}
                                />
                            </View>
                            <View style={[styles.sectionHeader, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
                            </View>
                        </>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListFooterComponent={<View style={{ height: 32 }} />}
                />
            )}

            <Modal visible={markServedVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCancelMarkServed}
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
                            Mark as Served
                        </Text>
                        <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                            Are you sure you want to mark this item as served?
                        </Text>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmCancel,
                                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                                ]}
                                onPress={handleCancelMarkServed}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmSubmit, { backgroundColor: colors.warning }]}
                                onPress={handleConfirmMarkServed}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmSubmitText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    appBarTitle: { flex: 1 },
    appBarTitleText: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
    appBarSubtitle: { fontSize: 18, fontWeight: '500', marginTop: 2 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, gap: 12 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
    list: { paddingTop: 16, paddingBottom: 40, paddingHorizontal: 16 },
    itemCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginVertical: 6 },
    itemCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    itemCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    itemCardBody: { flex: 1 },
    itemCode: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
    itemDesc: { fontSize: 18, fontWeight: '500' },
    itemMirNo: { fontWeight: '500' },
    itemQuantity: { alignItems: 'center', marginHorizontal: 16, minWidth: 90 },
    itemQuantityValue: { fontSize: 32, fontWeight: '800' },
    itemQuantityUnit: { fontSize: 16, fontWeight: '500', marginTop: 4 },
    servedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, height: 48 },
    servedBtnText: { fontSize: 15, fontWeight: '700' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    loadingText: { fontSize: 18, fontWeight: '500' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    errorIconContainer: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    errorTitle: { fontSize: 24, fontWeight: '700' },
    errorBody: { fontSize: 18, fontWeight: '500', textAlign: 'center', maxWidth: 300 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    retryBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    emptyIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyTitle: { fontSize: 24, fontWeight: '700' },
    emptyBody: { fontSize: 18, fontWeight: '500', textAlign: 'center', maxWidth: 280, lineHeight: 24 },
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