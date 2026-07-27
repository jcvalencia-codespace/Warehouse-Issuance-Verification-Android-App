import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIssuanceConfirmationService } from './services/materialIssuanceConfirmationService';
import { MaterialIssuanceRequestHeaderWithUnserved } from './types/materialIssuanceConfirmation.types';

export default function MaterialIssuanceConfirmationScreen() {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [headers, setHeaders] = useState<MaterialIssuanceRequestHeaderWithUnserved[]>([]);
    const [selectedHeader, setSelectedHeader] = useState<MaterialIssuanceRequestHeaderWithUnserved | null>(null);
    const [details, setDetails] = useState<any[]>([]);
    const [servedItems, setServedItems] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHeaders = useCallback(async () => {
        setError(null);
        try {
            const data = await MaterialIssuanceConfirmationService.getInstance()
                .getMaterialIssuanceRequestHeader(user?.COMPANY);
            setHeaders(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch material issuance requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.COMPANY]);

    useEffect(() => {
        fetchHeaders();
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHeaders();
    }, [fetchHeaders]);

    const handleHeaderPress = async (header: MaterialIssuanceRequestHeaderWithUnserved) => {
        setSelectedHeader(header);
        setDetailsLoading(true);
        try {
            const data = await MaterialIssuanceConfirmationService.getInstance()
                .getMaterialIssuanceRequestDetails(header.MIRNO, user?.COMPANY);
            setDetails(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch material issuance details.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleBackToList = () => {
        setSelectedHeader(null);
        setDetails([]);
        setServedItems(new Set());
    };

    const handleMarkServed = (item: any) => {
        const rowId = item.ROWID;
        Alert.alert(
            'Mark as Served',
            'Are you sure you want to mark this item as served?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'default',
                    onPress: async () => {
                        setServedItems((prev) => {
                            const next = new Set(prev);
                            next.add(rowId);
                            return next;
                        });
                        try {
                            await MaterialIssuanceConfirmationService.getInstance()
                                .markItemAsServed(selectedHeader?.MIRNO || '', rowId, user?.COMPANY);
                        } catch {
                            setServedItems((prev) => {
                                const next = new Set(prev);
                                next.delete(rowId);
                                return next;
                            });
                        }
                    },
                },
            ],
        );
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const postedCount = headers.filter((h) => h.POSTSTATUS === 1).length;

    const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) => (
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
        </View>
    );

    const renderHeaderItem = useCallback(
        ({ item }: { item: MaterialIssuanceRequestHeaderWithUnserved }) => {
            const isPosted = item.POSTSTATUS === 1;
            return (
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                    onPress={() => handleHeaderPress(item)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.cardIcon, { backgroundColor: isPosted ? colors.success + '14' : colors.warning + '14' }]}>
                            <MaterialCommunityIcons
                                name={isPosted ? 'check-circle-outline' : 'clock-outline'}
                                size={20}
                                color={isPosted ? colors.success : colors.warning}
                            />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                                {item.MIRNO}
                            </Text>
                            <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.SHIFT} • Reviewed by {item.REVIEWEDBY}
                            </Text>
                            {item.unservedCount > 0 ? (
                                <Text style={[styles.unservedBadge, { color: colors.warning }]}>
                                    {item.unservedCount} unserved
                                </Text>
                            ) : null}
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: isPosted ? colors.success + '18' : colors.warning + '18' }]}>
                            <View style={[styles.statusDot, { backgroundColor: isPosted ? colors.success : colors.warning }]} />
                            <Text style={[styles.statusLabel, { color: isPosted ? colors.success : colors.warning }]}>
                                {isPosted ? 'Posted' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardBottom}>
                        <View style={styles.cardMetaItem}>
                            <MaterialCommunityIcons name="calendar" size={12} color={colors.textTertiary} />
                            <Text style={[styles.cardMetaText, { color: colors.textTertiary }]}>{formatDate(item.DATECREATED)}</Text>
                        </View>
                        <View style={styles.cardMetaItem}>
                            <MaterialCommunityIcons name="account" size={12} color={colors.textTertiary} />
                            <Text style={[styles.cardMetaText, { color: colors.textTertiary }]}>{item.CREATEDBY}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        },
        [colors, handleHeaderPress],
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            {/* App Bar */}
            <View style={[styles.appBar, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                {selectedHeader ? (
                    <TouchableOpacity style={styles.backBtn} onPress={handleBackToList} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
                    </TouchableOpacity>
                ) : null}
                <View style={styles.appBarTitle}>
                    <Text style={[styles.appBarTitleText, { color: colors.text }]}>
                        {selectedHeader ? selectedHeader.MIRNO : 'Confirmations'}
                    </Text>
                    <Text style={[styles.appBarSubtitle, { color: colors.textSecondary }]}>
                        {selectedHeader ? 'Request details' : 'Review posted requests'}
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
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchHeaders}>
                        <MaterialCommunityIcons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : headers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '10' }]}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={52} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No confirmations yet</Text>
                    <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                        Posted material issuance requests will appear here for confirmation.
                    </Text>
                </View>
            ) : selectedHeader ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Details Header Card */}
                    <View style={[styles.detailsCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Request Information</Text>
                        <View style={styles.detailGrid}>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>MIR No.</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedHeader.MIRNO}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Shift</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedHeader.SHIFT}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reviewed By</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedHeader.REVIEWEDBY}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created By</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedHeader.CREATEDBY}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date Created</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedHeader.DATECREATED)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                                <View style={[styles.statusPill, { backgroundColor: colors.success + '18' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                                    <Text style={[styles.statusLabel, { color: colors.success }]}>Posted</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Items Section */}
                    <View style={{ marginTop: 16 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 4 }]}>
                            Items ({details.length})
                        </Text>
                        {detailsLoading ? (
                            <View style={styles.centered}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : details.length === 0 ? (
                            <View style={[styles.emptyContainer, { paddingVertical: 24 }]}>
                                <MaterialCommunityIcons name="package" size={40} color={colors.textTertiary} />
                                <Text style={[styles.emptyBody, { color: colors.textTertiary }]}>No items found for this request.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={details}
                                keyExtractor={(item, index) => `${item.ROWID}-${index}`}
                                nestedScrollEnabled
                                scrollEnabled={false}
                                renderItem={({ item }) => (
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
                                                    { backgroundColor: servedItems.has(item.ROWID) ? colors.success : colors.warning + '14' },
                                                ]}
                                                onPress={() => handleMarkServed(item)}
                                                activeOpacity={0.7}
                                            >
                                                <MaterialCommunityIcons
                                                    name={servedItems.has(item.ROWID) ? 'check' : 'circle'}
                                                    size={14}
                                                    color={servedItems.has(item.ROWID) ? '#ffffff' : colors.warning}
                                                />
                                                <Text style={[styles.servedBtnText, { color: servedItems.has(item.ROWID) ? '#ffffff' : colors.warning }]}>
                                                    {servedItems.has(item.ROWID) ? 'SERVED' : 'Mark Served'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                                contentContainerStyle={{ paddingHorizontal: 4 }}
                            />
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            ) : (
                <FlatList
                    data={headers}
                    keyExtractor={(item) => item.MIRNO}
                    renderItem={renderHeaderItem}
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
                                <StatCard label="Total" value={String(headers.length)} icon="numeric" color={colors.primary} />
                                <StatCard label="Posted" value={String(postedCount)} icon="check" color={colors.success} />
                                <StatCard
                                    label="Pending"
                                    value={String(headers.length - postedCount)}
                                    icon="clock"
                                    color={colors.warning}
                                />
                            </View>
                            <View style={[styles.sectionHeader, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Requests</Text>
                            </View>
                        </>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListFooterComponent={<View style={{ height: 32 }} />}
                />
            )}
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
    backBtn: { marginRight: 16, padding: 6 },
    appBarTitle: { flex: 1 },
    appBarTitleText: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
    appBarSubtitle: { fontSize: 18, fontWeight: '500', marginTop: 2 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, gap: 12 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
    list: { paddingTop: 16, paddingBottom: 40 },
    card: { borderRadius: 16, borderWidth: 1, marginHorizontal: 16, marginVertical: 6, overflow: 'hidden' },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    cardMeta: { fontSize: 18, fontWeight: '500' },
    unservedBadge: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 14, fontWeight: '700' },
    cardBottom: { flexDirection: 'row', paddingHorizontal: 18, paddingBottom: 14, paddingTop: 8, gap: 24 },
    cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMetaText: { fontSize: 16, fontWeight: '500' },
    scrollView: { flex: 1, padding: 16, paddingBottom: 24 },
    scrollContent: { paddingBottom: 32 },
    detailsCard: { borderRadius: 18, borderWidth: 1, padding: 20, marginHorizontal: 16 },
    detailGrid: { gap: 18 },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailLabel: { fontSize: 18, fontWeight: '500' },
    detailValue: { fontSize: 18, fontWeight: '600' },
    itemCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginVertical: 6 },
    itemCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    itemCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    itemCardBody: { flex: 1 },
    itemCode: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
    itemDesc: { fontSize: 18, fontWeight: '500' },
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
});