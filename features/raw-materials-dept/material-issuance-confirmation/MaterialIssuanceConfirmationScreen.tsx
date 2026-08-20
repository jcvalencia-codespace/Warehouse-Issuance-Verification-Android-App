import { CancelRemarks } from '@/components/CancelRemarks';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { socketService } from '../../shared/services/socketService';
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
    IS_PREPARING?: number;
    IS_PREPARED?: number;
    IS_SERVED?: number;
    IS_CONFIRMED?: number;
}

type SectionType = 'preparing' | 'prepared' | 'waiting' | 'served' | 'confirmed';

interface SectionData {
    type: SectionType;
    title: string;
    count: number;
    data: FlatItem[];
}

interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    color: string;
    isActive?: boolean;
    onPress?: () => void;
}

const StatCard = ({ label, value, icon, color, isActive, onPress }: StatCardProps) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];

    return (
        <TouchableOpacity
            style={[
                styles.statCard,
                {
                    backgroundColor: isActive ? color + '14' : colors.cardBackground,
                    borderColor: isActive ? color : colors.cardBorder,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
            <Text style={[styles.statValue, { color: isActive ? color : colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: isActive ? color : colors.textTertiary }]}>{label}</Text>
        </TouchableOpacity>
    );
};

export default function MaterialIssuanceConfirmationScreen({ onBack, source }: { onBack?: () => void; source?: string }) {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();
    const router = useRouter();
    const routeSource = useLocalSearchParams<{ source?: string }>().source;
    const isProductionMode = (source || routeSource) === 'production';
    const filter = useLocalSearchParams<{ filter?: string }>().filter as SectionType | undefined;

    const [items, setItems] = useState<FlatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [markPreparingVisible, setMarkPreparingVisible] = useState(false);
    const [markPreparingItem, setMarkPreparingItem] = useState<FlatItem | null>(null);
    const [markPreparedVisible, setMarkPreparedVisible] = useState(false);
    const [markPreparedItem, setMarkPreparedItem] = useState<FlatItem | null>(null);
    const [markConfirmedVisible, setMarkConfirmedVisible] = useState(false);
    const [markConfirmedItem, setMarkConfirmedItem] = useState<FlatItem | null>(null);
    const [confirmSuccessVisible, setConfirmSuccessVisible] = useState(false);
    const [confirmSuccessItem, setConfirmSuccessItem] = useState<FlatItem | null>(null);
    const [cancelRemarksVisible, setCancelRemarksVisible] = useState(false);
    const [cancelRemarksItem, setCancelRemarksItem] = useState<FlatItem | null>(null);
    const [cancelSuccessVisible, setCancelSuccessVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<SectionType | 'all'>(
        filter === 'served' || source === 'production' ? 'served' : 'all'
    );
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
                                IS_PREPARING: detail.IS_PREPARING,
                                IS_PREPARED: detail.IS_PREPARED,
                                IS_SERVED: detail.IS_SERVED,
                            });
                        }
                    } catch {
                        // skip details for this header
                    }
                })
            );

            try {
                const servedDetails = await MaterialIssuanceConfirmationService.getInstance()
                    .getServedItems(user?.COMPANY);
                for (const detail of servedDetails) {
                    allItems.push({
                        ROWID: detail.ROWID,
                        MIRNO: detail.MIRNO,
                        SHIFT: '',
                        REVIEWEDBY: '',
                        CREATEDBY: '',
                        DATECREATED: detail.DATECREATED,
                        POSTSTATUS: 0,
                        ITEMNMBR: detail.ITEMNMBR,
                        ITEMDESC: detail.ITEMDESC,
                        QUANTITY: detail.QUANTITY,
                        UOFM: detail.UOFM,
                        IS_PREPARING: detail.IS_PREPARING,
                        IS_PREPARED: detail.IS_PREPARED,
                        IS_SERVED: 1,
                        IS_CONFIRMED: 0,
                    });
                }
            } catch {
                // skip served items if fetch fails
            }

            try {
                const confirmedDetails = await MaterialIssuanceConfirmationService.getInstance()
                    .getConfirmedItemsToday(user?.COMPANY);
                for (const detail of confirmedDetails) {
                    allItems.push({
                        ROWID: detail.ROWID,
                        MIRNO: detail.MIRNO,
                        SHIFT: '',
                        REVIEWEDBY: '',
                        CREATEDBY: '',
                        DATECREATED: '',
                        POSTSTATUS: 0,
                        ITEMNMBR: detail.ITEMNMBR,
                        ITEMDESC: detail.ITEMDESC,
                        QUANTITY: detail.QUANTITY,
                        UOFM: detail.UOFM,
                        IS_PREPARING: detail.IS_PREPARING,
                        IS_PREPARED: detail.IS_PREPARED,
                        IS_SERVED: detail.IS_SERVED,
                        IS_CONFIRMED: 1,
                    });
                }
            } catch {
                // skip confirmed items if fetch fails
            }

            allItems.sort((a, b) => a.DATECREATED.localeCompare(b.DATECREATED));
            setItems(allItems);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch material issuance requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLastUpdated(new Date());
        }
    }, [user?.COMPANY]);

    useEffect(() => {
        fetchAllItems();
    }, [fetchAllItems]);

    useEffect(() => {
        const handleRealtimeUpdate = (payload: any) => {
            fetchAllItems();
        };

        socketService.connect();
        socketService.onMaterialIssuanceUpdate(handleRealtimeUpdate);

        return () => {
            socketService.offMaterialIssuanceUpdate(handleRealtimeUpdate);
        };
    }, [fetchAllItems]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllItems();
    }, [fetchAllItems]);

    const handleNavigateToVerification = (item: FlatItem) => {
        router.push({
            pathname: '/raw-materials-dept/issuance-verification',
            params: {
                mirNo: item.MIRNO,
                itemCode: item.ITEMNMBR,
                rowId: item.ROWID.toString(),
            },
        });
    };

    const handleCancelItem = (item: FlatItem) => {
        setCancelRemarksItem(item);
        setCancelRemarksVisible(true);
    };

    const handleConfirmCancel = async (remarks: string) => {
        if (!cancelRemarksItem) return;
        const { ROWID: rowId, MIRNO } = cancelRemarksItem;
        setCancelRemarksVisible(false);
        try {
            await MaterialIssuanceConfirmationService.getInstance()
                .cancelItem(MIRNO, rowId, user?.NAME, remarks, user?.COMPANY);
            setCancelSuccessVisible(true);
        } catch {
            // handle error silently
        }
    };

    const handleCancelRemarksDone = () => {
        setCancelSuccessVisible(false);
        if (cancelRemarksItem) {
            const { ROWID: rowId } = cancelRemarksItem;
            setItems((prev) => prev.filter((it) => it.ROWID !== rowId));
            setCancelRemarksItem(null);
        }
    };

    const handleMarkAsPreparing = (item: FlatItem) => {
        setMarkPreparingItem(item);
        setMarkPreparingVisible(true);
    };

    const handleConfirmMarkAsPreparing = async () => {
        if (!markPreparingItem) return;
        const { ROWID: rowId, MIRNO } = markPreparingItem;
        setMarkPreparingVisible(false);
        try {
            await MaterialIssuanceConfirmationService.getInstance()
                .markItemAsPreparing(MIRNO, rowId, user?.NAME, user?.COMPANY);
            setItems((prev) =>
                prev.map((it) => (it.ROWID === rowId ? { ...it, IS_PREPARING: 1 } : it))
            );
        } catch {
            // handle error silently
        }
    };

    const handleCancelMarkAsPreparing = () => {
        setMarkPreparingVisible(false);
    };

    const handleMarkAsPrepared = (item: FlatItem) => {
        setMarkPreparedItem(item);
        setMarkPreparedVisible(true);
    };

    const handleConfirmMarkAsPrepared = async () => {
        if (!markPreparedItem) return;
        const { ROWID: rowId, MIRNO } = markPreparedItem;
        setMarkPreparedVisible(false);
        try {
            await MaterialIssuanceConfirmationService.getInstance()
                .markItemAsPrepared(MIRNO, rowId, user?.NAME, user?.COMPANY);
            setItems((prev) =>
                prev.map((it) => (it.ROWID === rowId ? { ...it, IS_PREPARED: 1 } : it))
            );
        } catch {
            // handle error silently
        }
    };

    const handleCancelMarkAsPrepared = () => {
        setMarkPreparedVisible(false);
    };

    const handleMarkAsConfirmed = (item: FlatItem) => {
        setMarkConfirmedItem(item);
        setMarkConfirmedVisible(true);
    }

    const handleConfirmMarkAsConfirmed = async () => {
        if (!markConfirmedItem) return;
        const { ROWID: rowId, MIRNO } = markConfirmedItem;
        setMarkConfirmedVisible(false);
        try {
            await MaterialIssuanceConfirmationService.getInstance()
                .markItemAsConfirmed(MIRNO, rowId, user?.NAME, user?.COMPANY);
            setConfirmSuccessItem(markConfirmedItem);
            setConfirmSuccessVisible(true);
        } catch {
            // handle error silently
        }
    };

    const handleConfirmSuccessDone = () => {
        setConfirmSuccessVisible(false);
        setConfirmSuccessItem(null);
        fetchAllItems();
    };

    const handleCancelMarkAsConfirmed = () => {
        setMarkConfirmedVisible(false);
    };


    const sections = useMemo<SectionData[]>(() => {
        const preparing: FlatItem[] = [];
        const prepared: FlatItem[] = [];
        const waiting: FlatItem[] = [];
        const served: FlatItem[] = [];
        const confirmed: FlatItem[] = [];

        for (const item of items) {
            if (item.IS_CONFIRMED === 1) {
                confirmed.push(item);
            } else if (item.IS_SERVED === 1) {
                served.push(item);
            } else if (item.IS_PREPARED === 1) {
                prepared.push(item);
            } else if (item.IS_PREPARING === 1) {
                preparing.push(item);
            } else {
                waiting.push(item);
            }
        }
        served.sort((a, b) => (a.DATECREATED || '').localeCompare(b.DATECREATED || ''));
        return [
            { type: 'preparing', title: 'NOW PREPARING', count: preparing.length, data: preparing },
            { type: 'prepared', title: 'PREPARED ITEMS', count: prepared.length, data: prepared },
            { type: 'waiting', title: 'PENDING (POSTED)', count: waiting.length, data: waiting },
            { type: 'served', title: 'SERVED (FOR CONFIRMATION)', count: served.length, data: served },
            { type: 'confirmed', title: 'CONFIRMED (TODAY)', count: confirmed.length, data: confirmed },
        ];
    }, [items, isProductionMode]);

    const preparingCount = sections.find((s) => s.type === 'preparing')?.count ?? 0;
    const preparedCount = sections.find((s) => s.type === 'prepared')?.count ?? 0;
    const waitingCount = sections.find((s) => s.type === 'waiting')?.count ?? 0;
    const servedCount = sections.find((s) => s.type === 'served')?.count ?? 0;
    const confirmedCount = sections.find((s) => s.type === 'confirmed')?.count ?? 0;

    const renderItem = ({ item, section }: { item: FlatItem; section: SectionData }) => {

        if (section.type === 'preparing') {
            return (
                <View style={[styles.itemCard, { backgroundColor: colors.preparingBg, borderColor: colors.preparingBorder }]}>
                    <View style={styles.itemCardRow}>
                        <View style={styles.itemCardLeft}>
                            <View style={[styles.itemAvatar, { backgroundColor: colors.preparing }]}>
                                <MaterialCommunityIcons name="package-variant" size={18} color="#FFFFFF" />
                            </View>
                            <View style={styles.itemCardBody}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                                    {item.ITEMDESC ? (
                                        <Text
                                            style={[styles.itemDesc, { color: colors.textSecondary, marginLeft: 8, flexShrink: 1 }]}
                                            numberOfLines={1}
                                        >
                                            {item.ITEMDESC}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.itemMirNo, { color: colors.textTertiary, fontSize: 16, marginTop: 4 }]}>
                                    {item.MIRNO} | {item.SHIFT} | Requested By: {item.CREATEDBY}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.itemQuantity}>
                            <Text style={[styles.itemQuantityValue, { color: colors.preparing }]}>{item.QUANTITY}</Text>
                            {item.UOFM ? (
                                <Text style={[styles.itemQuantityUnit, { color: colors.textTertiary }]}>{item.UOFM}</Text>
                            ) : null}
                        </View>
                    </View>
                    {!isProductionMode ? (
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    { backgroundColor: colors.preparing },
                                ]}
                                onPress={() => handleMarkAsPrepared(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="arrow-right"
                                    size={14}
                                    color="#FFFFFF"
                                />
                                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                                    Finish Preparing
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.cancelBtn,
                                    { backgroundColor: colors.cancelButtonBg },
                                ]}
                                onPress={() => handleCancelItem(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={14}
                                    color={colors.errorWhite}
                                />
                                <Text style={[styles.cancelBtnText, { color: colors.errorWhite }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (section.type === 'prepared') {
            return (
                <View style={[styles.itemCard, { backgroundColor: colors.preparedBg, borderColor: colors.preparedBorder }]}>
                    <View style={styles.itemCardRow}>
                        <View style={styles.itemCardLeft}>
                            <View style={[styles.itemAvatar, { backgroundColor: colors.prepared }]}>
                                <MaterialCommunityIcons name="package-variant" size={18} color="#FFFFFF" />
                            </View>
                            <View style={styles.itemCardBody}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                                    {item.ITEMDESC ? (
                                        <Text
                                            style={[styles.itemDesc, { color: colors.textSecondary, marginLeft: 8, flexShrink: 1 }]}
                                            numberOfLines={1}
                                        >
                                            {item.ITEMDESC}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.itemMirNo, { color: colors.textTertiary, fontSize: 16, marginTop: 4 }]}>
                                    {item.MIRNO} | {item.SHIFT} | Requested By: {item.CREATEDBY}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.itemQuantity}>
                            <Text style={[styles.itemQuantityValue, { color: colors.prepared }]}>{item.QUANTITY}</Text>
                            {item.UOFM ? (
                                <Text style={[styles.itemQuantityUnit, { color: colors.textTertiary }]}>{item.UOFM}</Text>
                            ) : null}
                        </View>
                    </View>
                    {!isProductionMode ? (
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={[
                                    styles.servedBtn,
                                    { backgroundColor: colors.prepared },
                                ]}
                                onPress={() => handleNavigateToVerification(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="check"
                                    size={14}
                                    color="#FFFFFF"
                                />
                                <Text style={[styles.servedBtnText, { color: '#FFFFFF' }]}>
                                    Proceed to Issuance
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.cancelBtn,
                                    { backgroundColor: colors.cancelButtonBg },
                                ]}
                                onPress={() => handleCancelItem(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={14}
                                    color={colors.errorWhite}
                                />
                                <Text style={[styles.cancelBtnText, { color: colors.errorWhite }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (section.type === 'served') {
            return (
                <View style={[styles.itemCard, { backgroundColor: colors.servedBg, borderColor: colors.servedBorder }]}>
                    <View style={styles.itemCardRow}>
                        <View style={styles.itemCardLeft}>
                            <View style={[styles.itemAvatar, { backgroundColor: colors.served }]}>
                                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                            </View>
                            <View style={styles.itemCardBody}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                                    {item.ITEMDESC ? (
                                        <Text
                                            style={[styles.itemDesc, { color: colors.textSecondary, marginLeft: 8, flexShrink: 1 }]}
                                            numberOfLines={1}
                                        >
                                            {item.ITEMDESC}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.itemMirNo, { color: colors.textTertiary, fontSize: 16, marginTop: 4 }]}>
                                    {item.MIRNO} | Served
                                </Text>
                            </View>
                        </View>
                        <View style={styles.itemQuantity}>
                            <Text style={[styles.itemQuantityValue, { color: colors.served }]}>{item.QUANTITY}</Text>
                            {item.UOFM ? (
                                <Text style={[styles.itemQuantityUnit, { color: colors.textTertiary }]}>{item.UOFM}</Text>
                            ) : null}
                        </View>
                    </View>
                    {isProductionMode ? (
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    { backgroundColor: colors.served },
                                ]}
                                onPress={() => handleMarkAsConfirmed(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="check"
                                    size={14}
                                    color="#FFFFFF"
                                />
                                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                                    Confirm Issuance
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            );
        }

        if (section.type === 'confirmed') {
            return (
                <View style={[styles.itemCard, { backgroundColor: '#22C55E14', borderColor: '#22C55E' }]}>
                    <View style={styles.itemCardRow}>
                        <View style={styles.itemCardLeft}>
                            <View style={[styles.itemAvatar, { backgroundColor: '#22C55E' }]}>
                                <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                            </View>
                            <View style={styles.itemCardBody}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                                    {item.ITEMDESC ? (
                                        <Text
                                            style={[styles.itemDesc, { color: colors.textSecondary, marginLeft: 8, flexShrink: 1 }]}
                                            numberOfLines={1}
                                        >
                                            {item.ITEMDESC}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.itemMirNo, { color: colors.textTertiary, fontSize: 16, marginTop: 4 }]}>
                                    {item.MIRNO} | Confirmed
                                </Text>
                            </View>
                        </View>
                        <View style={styles.itemQuantity}>
                            <Text style={[styles.itemQuantityValue, { color: '#22C55E' }]}>{item.QUANTITY}</Text>
                            {item.UOFM ? (
                                <Text style={[styles.itemQuantityUnit, { color: colors.textTertiary }]}>{item.UOFM}</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.itemCardRow}>
                    <View style={styles.itemCardLeft}>
                        <View style={[styles.itemAvatar, { backgroundColor: colors.primary + '14' }]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.itemCardBody}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.itemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                                {item.ITEMDESC ? (
                                    <Text
                                        style={[styles.itemDesc, { color: colors.textSecondary, marginLeft: 8, flexShrink: 1 }]}
                                        numberOfLines={1}
                                    >
                                        {item.ITEMDESC}
                                    </Text>
                                ) : null}
                            </View>
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
                </View>
                <View style={styles.itemActions}>
                    {!isProductionMode ? (
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: colors.warning, borderWidth: 1, borderColor: colors.countBadgeBorder },
                            ]}
                            onPress={() => handleMarkAsPreparing(item)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name="arrow-right"
                                size={14}
                                color={'#ffff'}
                            />
                            <Text style={[styles.actionBtnText, { color: '#ffff' }]}>
                                Start Preparing
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        style={[
                            styles.cancelBtn,
                            { backgroundColor: colors.cancelButtonBg },
                        ]}
                        onPress={() => handleCancelItem(item)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={14}
                            color={colors.errorWhite}
                        />
                        <Text style={[styles.cancelBtnText, { color: colors.errorWhite }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderSectionHeader = (section: SectionData) => (
        <View style={[styles.sectionHeader, { borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <View style={[styles.sectionCountBadge, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionCount, { color: colors.text }]}>{section.count}</Text>
                </View>
            </View>
        </View>
    );

    const renderSectionFooter = (section: SectionData) => {
        if (section.count === 0) {
            if (section.type === 'served') {
                return (
                    <View style={[styles.servedEmptySection, { backgroundColor: colors.servedBg, borderColor: colors.servedBorder }]}>
                        <View style={[styles.servedEmptyIcon, { backgroundColor: colors.served }]}>
                            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.servedEmptyText, { color: colors.textSecondary }]}>
                            No served items.
                        </Text>
                        <Text style={[styles.servedEmptySubtext, { color: colors.served }]}>
                            Requests you mark as served will appear here.
                        </Text>
                    </View>
                );
            }
            return (
                <View style={[styles.emptySection, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.emptySectionText, { color: colors.textTertiary }]}>
                        No items in this section.
                    </Text>
                </View>
            );
        }
        return null;
    };

    const renderItemSeparator = () => <View style={{ height: 12 }} />;

    interface StatCardProps {
        label: string;
        value: string;
        icon: string;
        color: string;
        onPress?: () => void;
    }

    const statsData = [
        { label: 'Total', value: String(items.length), icon: 'numeric', color: colors.prepared, filter: 'all' as SectionType | 'all', onPress: () => setActiveFilter('all') },
        { label: 'Pending', value: String(waitingCount), icon: 'clock', color: colors.preparing, filter: 'waiting' as SectionType, onPress: () => setActiveFilter('waiting') },
        { label: 'Preparing', value: String(preparingCount), icon: 'progress-check', color: colors.preparing, filter: 'preparing' as SectionType, onPress: () => setActiveFilter('preparing') },
        { label: 'Prepared', value: String(preparedCount), icon: 'check', color: colors.prepared, filter: 'prepared' as SectionType, onPress: () => setActiveFilter('prepared') },
        { label: 'Served', value: String(servedCount), icon: 'check-all', color: colors.served, filter: 'served' as SectionType, onPress: () => setActiveFilter('served') },
        { label: 'Confirmed', value: String(confirmedCount), icon: 'check-circle', color: '#22C55E', filter: 'confirmed' as SectionType, onPress: () => setActiveFilter('confirmed') },
    ];

    const allSections = useMemo<SectionData[]>(() => {
        if (activeFilter === 'all') {
            return sections;
        }
        return sections.filter((section) => section.type === activeFilter);
    }, [sections, activeFilter]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.appBar, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.primary + '10' }]}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
                </TouchableOpacity>
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
                    data={allSections}
                    keyExtractor={(section) => section.type}
                    nestedScrollEnabled
                    scrollEnabled
                    renderItem={({ item: section }) => (
                        <View>
                            {renderSectionHeader(section)}
                            {section.count === 0 ? (
                                renderSectionFooter(section)
                            ) : (
                                section.data.map((item, index) => (
                                    <React.Fragment key={`${item.ROWID}-${index}`}>
                                        {index > 0 && renderItemSeparator()}
                                        {renderItem({ item, section })}
                                    </React.Fragment>
                                ))
                            )}
                        </View>
                    )}
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
                        <View>
                            {lastUpdated ? (
                                <Text style={[styles.lastUpdatedText, { color: colors.textTertiary }]}>
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </Text>
                            ) : null}
                            <View style={styles.statsRow}>
                                {statsData.map((stat) => (
                                    <StatCard
                                        key={stat.label}
                                        label={stat.label}
                                        value={stat.value}
                                        icon={stat.icon}
                                        color={stat.color}
                                        isActive={activeFilter === stat.filter}
                                        onPress={stat.onPress}
                                    />
                                ))}
                            </View>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
                    ListFooterComponent={<View style={{ height: 32 }} />}
                />
            )}


            <ConfirmModal
                visible={markPreparingVisible}
                title="Set to Preparing"
                message="Are you sure you want to set this item to preparing?"
                iconName="alert-outline"
                iconColor={colors.warning}
                cancelText="Cancel"
                confirmText="Confirm"
                onConfirm={handleConfirmMarkAsPreparing}
                onCancel={handleCancelMarkAsPreparing}
            />
            <ConfirmModal
                visible={markPreparedVisible}
                title="Set to Prepared"
                message="Are you sure you want to set this item to prepared?"
                iconName="alert-outline"
                iconColor={colors.warning}
                cancelText="Cancel"
                confirmText="Confirm"
                onConfirm={handleConfirmMarkAsPrepared}
                onCancel={handleCancelMarkAsPrepared}
            />
            <ConfirmModal
                visible={markConfirmedVisible}
                title="Set to Confirmed"
                message="Are you sure you want to set this item to confirmed and received?"
                iconName="alert-outline"
                iconColor={colors.warning}
                cancelText="Cancel"
                confirmText="Confirm"
                onConfirm={handleConfirmMarkAsConfirmed}
                onCancel={handleCancelMarkAsConfirmed}
            />

            <CancelRemarks
                visible={cancelRemarksVisible}
                remarksRequired={true}
                message="Please enter a reason for cancelling this request."
                onConfirm={handleConfirmCancel}
                onCancel={() => setCancelRemarksVisible(false)}
            />
            <SuccessModal
                visible={cancelSuccessVisible}
                title="Item Cancelled"
                message="The item has been successfully cancelled."
                buttonText="Done"
                onDone={handleCancelRemarksDone}
            />
            <SuccessModal
                visible={confirmSuccessVisible}
                title="Issuance Confirmed"
                message="The item has been successfully confirmed and received."
                buttonText="Done"
                onDone={handleConfirmSuccessDone}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1 },
    backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    appBarTitle: { flex: 1 },
    appBarTitleText: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
    appBarSubtitle: { fontSize: 18, fontWeight: '500', marginTop: 2 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, gap: 12 },
    lastUpdatedText: { fontSize: 12, fontWeight: '500', paddingHorizontal: 16, marginTop: 4 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    list: { paddingTop: 16, paddingBottom: 40, paddingHorizontal: 16 },
    sectionHeader: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 6, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
    sectionCountBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1 },
    sectionCount: { fontSize: 14, fontWeight: '600' },
    emptySection: { padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    emptySectionText: { fontSize: 16, fontWeight: '600' },
    emptySectionSubtext: { fontSize: 14, fontWeight: '500', marginTop: 4 },
    servedEmptySection: { padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 8, flexDirection: 'row', gap: 12 },
    servedEmptyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    servedEmptyText: { fontSize: 16, fontWeight: '600' },
    servedEmptySubtext: { fontSize: 14, fontWeight: '500', marginTop: 4 },
    itemCard: { borderRadius: 16, borderWidth: 1, padding: 18 },
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
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    servedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, height: 48 },
    servedBtnText: { fontSize: 15, fontWeight: '700' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, height: 48 },
    actionBtnText: { fontSize: 15, fontWeight: '700' },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, height: 48 },
    cancelBtnText: { fontSize: 15, fontWeight: '700' },
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
