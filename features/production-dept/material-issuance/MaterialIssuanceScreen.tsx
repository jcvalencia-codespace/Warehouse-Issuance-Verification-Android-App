import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIssuanceDetails, MaterialIssuanceDetailsRef } from './components/MaterialIssuanceDetails';
import { MaterialIssuanceHeader, MaterialIssuanceHeaderRef } from './components/MaterialIssuanceHeader';
import { MaterialIssuanceService } from './services/materialIssuanceService';
import { MaterialIssuancePayload, MaterialIssuancePostResponse } from './types/materialIssuance.types';

interface MaterialIssuanceProps {
    onBack?: () => void;
    onSubmit?: (data: any) => void;
}

export default function MaterialIssuanceScreen({ onBack, onSubmit }: MaterialIssuanceProps) {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const headerRef = useRef<MaterialIssuanceHeaderRef>(null);
    const detailsRef = useRef<MaterialIssuanceDetailsRef>(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pendingHeader, setPendingHeader] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedIssuance, setSelectedIssuance] = useState<any>(null);

    const handleClear = () => {
        setClearConfirmVisible(true);
    };

    const handleConfirmClear = async () => {
        headerRef.current?.clear();
        detailsRef.current?.clear();
        setClearConfirmVisible(false);
        setSelectedIssuance(null);
        await headerRef.current?.refreshMirNo();
    };

    const handleSearchPress = async () => {
        try {
            const headers = await MaterialIssuanceService.getInstance().getMaterialIssuanceRequestHeader(user?.COMPANY);
            setSearchResults(headers);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch material issuance requests.');
        }
        setSearchVisible(true);
    };

    const handleSearchIssuance = async (query: string) => {
        // Placeholder for search logic
    };

    const handleSelectIssuance = async (issuance: any) => {
        setSelectedIssuance(issuance);
        setSearchVisible(false);

        headerRef.current?.setField('mirNo', issuance.MIRNO || '');
        headerRef.current?.setField('shift', issuance.SHIFT || '');
        headerRef.current?.setField('reviewedBy', issuance.REVIEWEDBY || '');

        try {
            const details = await MaterialIssuanceService.getInstance().getMaterialIssuanceRequestDetails(issuance.MIRNO, user?.COMPANY);
            const formattedItems = details.map((item: any) => ({
                itemCode: item.ITEMNMBR || '',
                description: item.ITEMDESC || '',
                quantity: String(item.QUANTITY || ''),
                allocations: [],
            }));
            setItems(formattedItems);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch issuance details.');
        }
    };

    const handleValidSubmit = (headerData: any) => {
        const isDetailsValid = detailsRef.current?.validate();
        if (!isDetailsValid) {
            return;
        }
        setPendingHeader(headerData);
        setConfirmVisible(true);
    };

    const handleConfirmSubmit = async () => {
        if (!pendingHeader) return;
        setSubmitting(true);
        try {
            const payload: MaterialIssuancePayload = {
                mirNo: pendingHeader.mirNo,
                shift: pendingHeader.shift,
                reviewedBy: pendingHeader.reviewedBy,
                createdBy: user?.NAME || user?.USERNAME || '',
                dateCreated: pendingHeader.dateCreated,
                details: items,
            };

            let result: MaterialIssuancePostResponse;
            if (selectedIssuance) {
                result = await MaterialIssuanceService.getInstance().postMaterialIssuanceRequest(
                    payload,
                    user?.COMPANY || ''
                );
            } else {
                result = await MaterialIssuanceService.getInstance().saveMaterialIssuanceRequest(
                    payload,
                    user?.COMPANY || ''
                );
            }

            if (result.success) {
                const originalMirNo = pendingHeader.mirNo;
                const savedMirNo = result.mirNo || pendingHeader.mirNo;
                const mirNoChanged = originalMirNo && savedMirNo && originalMirNo !== savedMirNo;

                Alert.alert(
                    mirNoChanged ? 'MIR No. Changed\nSaved as ${savedMirNo}.' : 'Success',
                    mirNoChanged
                        ? `MIR No. ${originalMirNo} already exists.\nSaved as ${savedMirNo}.`
                        : `Material issuance saved successfully.`,
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                setConfirmVisible(false);
                                setSubmitting(false);
                                setPendingHeader(null);
                                setItems([]);
                                setSelectedIssuance(null);
                                headerRef.current?.clear();
                                detailsRef.current?.clear();
                                await headerRef.current?.refreshMirNo();
                            },
                        },
                    ]
                );
            } else {
                setSubmitting(false);
                Alert.alert('Error', result.message || 'Failed to submit material issuance.');
            }
        } catch (error: any) {
            setSubmitting(false);
            Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to submit material issuance.');
        }
    };

    return (
        <SafeAreaView
            edges={['top']}
            style={[styles.safeArea, { backgroundColor: colors.background }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: 16 + insets.bottom },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <MaterialIssuanceHeader
                        ref={headerRef}
                        onValidSubmit={handleValidSubmit}
                        onSearchPress={handleSearchPress}
                        searchable={true}
                    />
                    <MaterialIssuanceDetails
                        ref={detailsRef}
                        value={items}
                        onItemsChange={setItems}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <SafeAreaView
                edges={['bottom']}
                style={[
                    styles.footer,
                    { backgroundColor: colors.background, borderTopColor: colors.cardBorder },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.cancelButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                    onPress={onBack}
                >
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                        Back
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.clearButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                    onPress={handleClear}
                >
                    <MaterialCommunityIcons name="refresh" size={20} color={colors.text} />
                    <Text style={[styles.clearButtonText, { color: colors.text }]}>
                        Clear
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={() => headerRef.current?.submit()}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name={selectedIssuance ? "send" : "send-check"} size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>{selectedIssuance ? 'POST' : 'Submit'}</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <Modal visible={confirmVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => !submitting && setConfirmVisible(false)}
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
                                { backgroundColor: colors.primary + '14' },
                            ]}
                        >
                            <MaterialCommunityIcons name="send-check" size={28} color={colors.primary} />
                        </View>
                        <Text style={[styles.confirmTitle, { color: colors.text }]}>
                            Confirm Submission
                        </Text>
                        <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                            Are you sure you want to submit this material issuance?
                        </Text>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmCancel,
                                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                                ]}
                                onPress={() => setConfirmVisible(false)}
                                disabled={submitting}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmSubmit, { backgroundColor: colors.primary }]}
                                onPress={handleConfirmSubmit}
                                disabled={submitting}
                                activeOpacity={0.8}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.confirmSubmitText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={clearConfirmVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setClearConfirmVisible(false)}
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
                            Clear All Data
                        </Text>
                        <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                            Are you sure you want to clear all issuance details? This action cannot be undone.
                        </Text>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmCancel,
                                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                                ]}
                                onPress={() => setClearConfirmVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmSubmit, { backgroundColor: colors.warning }]}
                                onPress={handleConfirmClear}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmSubmitText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={searchVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSearchVisible(false)}
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
                                { backgroundColor: colors.primary + '14' },
                            ]}
                        >
                            <MaterialCommunityIcons name="magnify" size={28} color={colors.primary} />
                        </View>
                        <Text style={[styles.confirmTitle, { color: colors.text }]}>
                            Search Material Issuance
                        </Text>
                        <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                            Select an existing material issuance to view or post.
                        </Text>

                        <View style={[styles.searchInputContainer, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}>
                            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search by MIR No..."
                                placeholderTextColor={colors.textTertiary}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoFocus
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.searchResultsContainer}>
                            {searchResults.length > 0 ? (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item, index) => `${item.MIRNO}-${index}`}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.searchResultItem, { borderBottomColor: colors.cardBorder }]}
                                            onPress={() => handleSelectIssuance(item)}
                                        >
                                            <Text style={[styles.searchResultText, { color: colors.text }]}>
                                                {item.MIRNO}
                                            </Text>
                                            <Text style={[styles.searchResultSubtext, { color: colors.textSecondary }]}>
                                                {item.SHIFT} - {item.REVIEWEDBY}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    ItemSeparatorComponent={() => <View style={[styles.searchResultSeparator, { borderBottomColor: colors.cardBorder }]} />}
                                    scrollEnabled={true}
                                    nestedScrollEnabled={true}
                                />
                            ) : (
                                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                                    No posted issuances found.
                                </Text>
                            )}
                        </View>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmCancel,
                                    { borderColor: colors.cardBorder, backgroundColor: colors.background },
                                ]}
                                onPress={() => setSearchVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderTopWidth: 1,
    },
    cancelButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    clearButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    clearButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    submitButton: {
        flex: 1.3,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
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
    searchResultsContainer: {
        width: '100%',
        maxHeight: 280,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
    },
    searchResultItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    searchResultSeparator: {
        height: 1,
        borderBottomWidth: 1,
    },
    searchResultText: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    searchResultSubtext: {
        fontSize: 13,
        fontWeight: '500',
    },
});
