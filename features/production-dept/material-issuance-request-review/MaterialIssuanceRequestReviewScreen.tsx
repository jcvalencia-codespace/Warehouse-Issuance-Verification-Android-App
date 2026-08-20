import { CancelRemarks } from '@/components/CancelRemarks';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIssuanceRequestReviewDetails } from './components/MaterialIssuanceRequestReviewDetails';
import { MaterialIssuanceRequestReviewService } from './services/materialIssuanceRequestReviewService';
import {
    MaterialIssuanceRequestReviewDetail,
    MaterialIssuanceRequestReviewHeader,
} from './types/materialIssuanceRequestReview.types';

interface MaterialIssuanceRequestReviewScreenProps {
    onBack?: () => void;
}

export default function MaterialIssuanceRequestReviewScreen({ onBack }: MaterialIssuanceRequestReviewScreenProps) {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [requests, setRequests] = useState<MaterialIssuanceRequestReviewHeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<MaterialIssuanceRequestReviewHeader | null>(null);
    const [details, setDetails] = useState<MaterialIssuanceRequestReviewDetail[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [approveConfirmVisible, setApproveConfirmVisible] = useState(false);
    const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchRequests = useCallback(async () => {
        setError(null);
        try {
            const data = await MaterialIssuanceRequestReviewService.getInstance().getRequestHeaders(user?.COMPANY);
            setRequests(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch material issuance requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.COMPANY]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleRefresh = useCallback(() => {
        if (!selectedRequest) {
            setRefreshing(true);
            fetchRequests();
        }
    }, [fetchRequests, selectedRequest]);

    const handleSelectRequest = useCallback(
        async (request: MaterialIssuanceRequestReviewHeader) => {
            setSelectedRequest(request);
            setDetails([]);
            setDetailsError(null);
            setDetailsLoading(true);
            try {
                const data = await MaterialIssuanceRequestReviewService.getInstance().getRequestDetails(
                    request.MIRNO,
                    user?.COMPANY
                );
                setDetails(data);
            } catch (err: any) {
                setDetailsError(err?.message || 'Failed to fetch request details.');
            } finally {
                setDetailsLoading(false);
            }
        },
        [user?.COMPANY]
    );

    const handleBackToList = () => {
        setSelectedRequest(null);
        setDetails([]);
        setDetailsError(null);
    };

    const handleApprovePress = () => {
        if (!selectedRequest) return;
        setApproveConfirmVisible(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedRequest) return;
        setApproveConfirmVisible(false);
        try {
            const result = await MaterialIssuanceRequestReviewService.getInstance().approveRequest(
                selectedRequest.MIRNO,
                user?.NAME || '',
                user?.COMPANY
            );
            if (result.success) {
                setSuccessMessage(`Request ${selectedRequest.MIRNO} approved successfully.`);
                setSuccessVisible(true);
                setRequests((prev) => prev.filter((r) => r.MIRNO !== selectedRequest.MIRNO));
                handleBackToList();
            } else {
                Alert.alert('Error', result.message || 'Failed to approve request.');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to approve request.');
        }
    };

    const handleRejectPress = () => {
        if (!selectedRequest) return;
        setRejectConfirmVisible(true);
    };

    const handleConfirmReject = async (remarks: string) => {
        if (!selectedRequest) return;
        setRejectConfirmVisible(false);
        try {
            const result = await MaterialIssuanceRequestReviewService.getInstance().rejectRequest(
                selectedRequest.MIRNO,
                user?.NAME || '',
                user?.COMPANY,
                remarks
            );
            console.log(selectedRequest.MIRNO, remarks);
            if (result.success) {
                setSuccessMessage(`Request ${selectedRequest.MIRNO} rejected successfully.`);
                setSuccessVisible(true);
                setRequests((prev) => prev.filter((r) => r.MIRNO !== selectedRequest.MIRNO));
                handleBackToList();
            } else {
                Alert.alert('Error', result.message || 'Failed to reject request.');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to reject request.');
        }
    };

    const handleSuccessDone = () => {
        setSuccessVisible(false);
        setSuccessMessage('');
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return dateStr;
        }
    };

    const filteredRequests = search.trim()
        ? requests.filter((r) =>
            String(r.MIRNO ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
            String(r.REVIEWEDBY ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
            String(r.CREATEDBY ?? '').toLowerCase().includes(search.trim().toLowerCase())
        )
        : requests;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <TouchableOpacity
                style={[
                    styles.backButton,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
                onPress={selectedRequest ? handleBackToList : onBack}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {selectedRequest ? selectedRequest.MIRNO : 'Request Review'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {selectedRequest
                        ? 'View request details'
                        : 'Review pending material issuance requests'}
                </Text>
            </View>
            <View style={styles.headerPlaceholder} />
        </View>
    );

    const renderSearch = () => (
        <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by MIR No. / Reviewed By / Requested By"
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCapitalize="none"
            />
            {search.length > 0 ? (
                <TouchableOpacity
                    onPress={() => setSearch('')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
            ) : null}
        </View>
    );

    const renderRequestCard = ({ item }: { item: MaterialIssuanceRequestReviewHeader }) => (
        <TouchableOpacity
            style={[
                styles.requestCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={() => handleSelectRequest(item)}
            activeOpacity={0.7}
        >
            <View style={styles.requestCardLeft}>
                <View style={[styles.requestAvatar, { backgroundColor: colors.review + '33' }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.requestBody}>
                    <Text style={[styles.mirNo, { color: colors.text }]}>{item.MIRNO}</Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.requestMeta, { color: colors.textSecondary }]}>
                            Shift: {item.SHIFT || '—'}
                        </Text>
                        <Text style={[styles.requestMeta, { color: colors.textSecondary }]}>
                            For Review By: {item.REVIEWEDBY || '—'}
                        </Text>
                    </View>
                    <Text style={[styles.requestMeta, { color: colors.textSecondary }]}>
                        Requested By: {item.CREATEDBY || '—'}
                    </Text>
                    <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
                        Created: {formatDateTime(item.DATECREATED)}
                    </Text>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
    );

    const renderList = () => {
        if (loading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading requests…
                    </Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centered}>
                    <View
                        style={[
                            styles.errorIconContainer,
                            { backgroundColor: (colors.error || '#ef4444') + '14' },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={40}
                            color={colors.error || '#ef4444'}
                        />
                    </View>
                    <Text style={[styles.errorTitle, { color: colors.text }]}>
                        Something went wrong
                    </Text>
                    <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                        onPress={fetchRequests}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (filteredRequests.length === 0) {
            return (
                <View style={styles.centered}>
                    <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '10' }]}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={52} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        No requests found
                    </Text>
                    <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                        {search.trim()
                            ? 'No requests match your search.'
                            : 'There are no material issuance requests pending review.'}
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={filteredRequests}
                keyExtractor={(item, index) => `${item.MIRNO}-${index}`}
                renderItem={renderRequestCard}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                contentContainerStyle={styles.listContent}
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
                ListFooterComponent={<View style={{ height: 16 }} />}
            />
        );
    };

    return (
        <>
            <SafeAreaView
                edges={['top', 'bottom']}
                style={[styles.safeArea, { backgroundColor: colors.background }]}
            >
                {renderHeader()}

                {selectedRequest ? (
                    <View style={styles.detailContainer}>
                        <MaterialIssuanceRequestReviewDetails
                            header={selectedRequest}
                            details={details}
                            loading={detailsLoading}
                            error={detailsError}
                        />
                        <View
                            style={[
                                styles.footer,
                                { backgroundColor: colors.background, borderTopColor: colors.cardBorder },
                            ]}
                        >
                            <TouchableOpacity
                                style={[styles.footerButton, styles.footerButtonSecondary, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                                onPress={handleRejectPress}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error || '#ef4444'} />
                                <Text style={[styles.footerButtonText, { color: colors.error || '#ef4444' }]}>
                                    Reject
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: colors.success }]}
                                onPress={handleApprovePress}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#ffffff" />
                                <Text style={styles.footerButtonTextPrimary}>
                                    Approve
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {renderSearch()}
                        {renderList()}
                    </>
                )}
            </SafeAreaView>

            <ConfirmModal
                visible={approveConfirmVisible}
                title="Approve Request"
                message={`Are you sure you want to approve request ${selectedRequest?.MIRNO}? This will mark it as approved.`}
                iconName="check-circle-outline"
                iconColor={colors.success}
                cancelText="Cancel"
                confirmText="Approve"
                onConfirm={handleConfirmApprove}
                onCancel={() => setApproveConfirmVisible(false)}
            />

            <CancelRemarks
                visible={rejectConfirmVisible}
                remarksRequired={false}
                title="Reject Request"
                placeholder="Enter remarks here (optional)..."
                message={`Are you sure you want to reject request ${selectedRequest?.MIRNO}? This will mark it as rejected.`}
                onConfirm={handleConfirmReject}
                onCancel={() => setRejectConfirmVisible(false)}
            />

            <SuccessModal
                visible={successVisible}
                title="Success"
                message={successMessage}
                buttonText="Done"
                onDone={handleSuccessDone}
            />
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    headerPlaceholder: {
        width: 40,
        height: 40,
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
        marginTop: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    requestCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    requestCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    requestBody: {
        flex: 1,
    },
    mirNo: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 4,
    },
    requestMeta: {
        fontSize: 14,
        fontWeight: '500',
    },
    requestDate: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    detailContainer: {
        flex: 1,
        paddingTop: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    errorIconContainer: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    errorBody: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: 300,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 8,
    },
    retryBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptyBody: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderTopWidth: 1,
    },
    footerButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
    },
    footerButtonSecondary: {
        borderColor: 'transparent',
    },
    footerButtonPrimary: {
        borderColor: 'transparent',
    },
    footerButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    footerButtonTextPrimary: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
