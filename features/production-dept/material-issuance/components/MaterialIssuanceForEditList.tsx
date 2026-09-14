import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIssuanceService } from '../services/materialIssuanceService';
import { MaterialIssuanceRequestHeader } from '../types/materialIssuance.types';

interface MaterialIssuanceForEditListProps {
    onBack?: () => void;
    onRecordPress: (header: MaterialIssuanceRequestHeader) => void;
}

export const MaterialIssuanceForEditList: React.FC<MaterialIssuanceForEditListProps> = ({
    onBack,
    onRecordPress,
}) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const { user } = useAuth();

    const [data, setData] = useState<MaterialIssuanceRequestHeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const result = await MaterialIssuanceService.getInstance().getMIRForEdit(user?.COMPANY);
            setData(result || []);
        } catch (error) {
            console.error('Failed to load MIR for edit:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [user?.COMPANY]);

    useEffect(() => {
        load();
    }, [load]);

    const formatDateDisplay = (dateValue: string | Date): string => {
        if (!dateValue) return '—';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredData = search.trim()
        ? data.filter((r) => {
            const s = search.trim().toLowerCase();
            return (
                String(r.MIRNO ?? '').toLowerCase().includes(s) ||
                String(r.SHIFT ?? '').toLowerCase().includes(s) ||
                String(r.REVIEWEDBY ?? '').toLowerCase().includes(s) ||
                String(r.CREATEDBY ?? '').toLowerCase().includes(s)
            );
        })
        : data;

    const renderListItem = ({ item }: { item: MaterialIssuanceRequestHeader }) => (
        <TouchableOpacity
            style={[
                styles.listItemCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={() => onRecordPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.listItemHeader}>
                <View
                    style={[
                        styles.listItemIconContainer,
                        { backgroundColor: colors.primary + '14' },
                    ]}
                >
                    <MaterialCommunityIcons
                        name="file-document-outline"
                        size={22}
                        color={colors.primary}
                    />
                </View>
                <View style={styles.mirNoContainer}>
                    <Text style={[styles.listItemMirNo, { color: colors.primary }]}>
                        {item.MIRNO}
                    </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={30}
                        color={colors.textSecondary}
                    />
                </View>
            </View>
            <View style={styles.listItemMeta}>
                <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
                    Shift: {item.SHIFT || '—'}
                </Text>
                <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
                    Review By: {item.REVIEWEDBY || '—'}
                </Text>
            </View>
            <View style={styles.listItemMeta}>
                <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
                    Created By: {item.CREATEDBY || '—'}
                </Text>
                <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
                    Date: {formatDateDisplay(item.DATECREATED)}
                </Text>
            </View>
            {item.REMARKS ? (
                <View style={[styles.remarksContainer, { backgroundColor: colors.error + '10' }]}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={16}
                        color={colors.error || '#ef4444'}
                    />
                    <Text style={[styles.remarksText, { color: colors.error || '#ef4444' }]}>
                        {item.REMARKS}
                    </Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView
            edges={['top', 'bottom']}
            style={[styles.safeArea, { backgroundColor: colors.background }]}
        >
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={onBack}
                    activeOpacity={0.7}
                    style={[
                        styles.backButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Edit Material Issuance</Text>
                <TouchableOpacity
                    style={[
                        styles.refreshButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                    onPress={load}
                    activeOpacity={0.7}
                    disabled={loading}
                >
                    <MaterialCommunityIcons name="refresh" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View
                style={[
                    styles.searchContainer,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
            >
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by MIR No, Shift, Reviewer, Requested By"
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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading records…
                    </Text>
                </View>
            ) : filteredData.length > 0 ? (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => `${item.MIRNO}-${index}`}
                    renderItem={renderListItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListFooterComponent={<View style={{ height: 16 }} />}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                        name="file-document-outline"
                        size={48}
                        color={colors.textTertiary}
                    />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {search.trim()
                            ? 'No requests match your search.'
                            : 'No pending material issuance requests for edit.'}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
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
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.3,
        flex: 1,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
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
    listItemCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    listItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    listItemIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mirNoContainer: {
        flex: 1,
    },
    listItemMirNo: {
        fontSize: 20,
        fontWeight: '700',
    },
    listItemMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    listItemMetaText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    remarksContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        gap: 6,
    },
    remarksText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        textAlign: 'left',
    },
    loadingContainer: {
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: 280,
    },
});
