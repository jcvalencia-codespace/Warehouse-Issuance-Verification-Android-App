import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import { MaterialIssuanceRequestReviewHeader } from '../types/materialIssuanceRequestReview.types';

type DetailItem = {
    ITEMNMBR: string;
    ITEMDESC?: string | null;
    QUANTITY?: number;
    UOFM?: string | null;
    SERVEDBY?: string | null;
    CREATEDBY?: string | null;
    DATECREATED?: string | null;
};

interface MaterialIssuanceRequestDetailsProps {
    header: MaterialIssuanceRequestReviewHeader | null;
    details: DetailItem[];
    loading: boolean;
    error: string | null;
}

export function MaterialIssuanceRequestReviewDetails({ header, details, loading, error }: MaterialIssuanceRequestDetailsProps) {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return dateStr;
        }
    };

    const renderMetaRow = (label: string, value: string | undefined | null) => {
        if (value === undefined || value === null || String(value).trim() === '') {
            return null;
        }
        return (
            <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
            </View>
        );
    };

    const renderRequestInformation = () => {
        if (!header) return null;
        return (
            <View
                style={[
                    styles.sectionCard,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
            >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Request Information
                </Text>
                {renderMetaRow('MIR No.', header.MIRNO)}
                {renderMetaRow('Shift', header.SHIFT)}
                {renderMetaRow('For Review By', header.REVIEWEDBY)}
                {renderMetaRow('Created By', header.CREATEDBY)}
                {renderMetaRow('Date Created', formatDateTime(header.DATECREATED))}
            </View>
        );
    };

    const renderDetailCard = ({ item }: { item: DetailItem }) => (
        <View
            style={[
                styles.detailCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
        >
            <View style={[styles.detailCardHeader, { borderBottomColor: colors.cardBorder }]}>
                <View style={[styles.detailAvatar, { backgroundColor: colors.review + '33' }]}>
                    <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.review} />
                </View>
                <View style={styles.detailTitleContainer}>
                    <Text style={[styles.detailItemCode, { color: colors.text }]}>{item.ITEMNMBR}</Text>
                    {item.ITEMDESC ? (
                        <Text
                            style={[styles.detailItemDesc, { color: colors.textSecondary }]}
                            numberOfLines={1}
                        >
                            {item.ITEMDESC}
                        </Text>
                    ) : null}
                </View>
                <View style={[styles.detailQuantity, { backgroundColor: colors.review + '10' }]}>
                    <Text style={[styles.detailQuantityValue, { color: colors.review }]}>
                        {item.QUANTITY ?? '—'}
                    </Text>
                    {item.UOFM ? (
                        <Text style={[styles.detailQuantityUnit, { color: colors.textTertiary }]}>
                            {item.UOFM}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <>
                {renderRequestInformation()}
                <View style={styles.centeredFlex}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
                        Loading details…
                    </Text>
                </View>
            </>
        );
    }

    if (error) {
        return (
            <>
                {renderRequestInformation()}
                <View style={[styles.centeredFlex, { gap: 12 }]}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={32}
                        color={colors.error || '#ef4444'}
                    />
                    <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
                </View>
            </>
        );
    }

    return (
        <>
            {renderRequestInformation()}
            <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                Request Details ({details.length})
            </Text>
            {details.length === 0 ? (
                <View style={[styles.emptyDetail, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.emptyDetailText, { color: colors.textSecondary }]}>
                        No details found for this request.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={details}
                    keyExtractor={(item, index) => `${item.ITEMNMBR}-${index}`}
                    renderItem={renderDetailCard}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sectionCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    detailSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        marginHorizontal: 16,
    },
    detailCard: {
        borderRadius: 16,
        borderWidth: 1,
        marginHorizontal: 16,
        marginBottom: 8,
        overflow: 'hidden',
    },
    detailCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    detailAvatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailTitleContainer: {
        flex: 1,
    },
    detailItemCode: {
        fontSize: 25,
        fontWeight: '700',
        marginBottom: 2,
    },
    detailItemDesc: {
        fontSize: 18,
        fontWeight: '500',
    },
    detailQuantity: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 76,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    detailQuantityValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    detailQuantityUnit: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 20,
        fontWeight: '500',
        flexShrink: 1,
        textAlign: 'right',
    },
    emptyDetail: {
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginHorizontal: 16,
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    emptyDetailText: {
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
    },
    centeredFlex: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    loadingText: {
        fontSize: 25,
        fontWeight: '500',
    },
    errorBody: {
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
        maxWidth: 300,
    },
});
