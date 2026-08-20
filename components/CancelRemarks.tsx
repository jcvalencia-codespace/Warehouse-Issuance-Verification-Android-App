import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface CancelRemarksProps {
    visible: boolean;
    remarksRequired: boolean;
    title?: string;
    message?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    requiredText?: string;
    onConfirm: (remarks: string) => void;
    onCancel: () => void;
}

export function CancelRemarks({
    visible,
    remarksRequired,
    title = 'Provide Remarks',
    message = 'Please enter a reason for cancelling this request.',
    placeholder = 'Enter remarks here...',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    requiredText = 'Remarks is required',
    onConfirm,
    onCancel,
}: CancelRemarksProps) {
    const scheme = useColorScheme();
    const colors = Colors[scheme ?? 'light'];
    const [remarks, setRemarks] = useState('');
    const [isEmptyError, setIsEmptyError] = useState(false);

    const handleConfirm = () => {
        const trimmed = remarks.trim();
        if (!trimmed) {
            setIsEmptyError(true);
            return;
        }
        onConfirm(trimmed);
        setRemarks('');
        setIsEmptyError(false);
    };

    const handleCancel = () => {
        setRemarks('');
        setIsEmptyError(false);
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleCancel}
            >
                <View
                    style={[
                        styles.cancelCard,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <View
                        style={[
                            styles.cancelIcon,
                            { backgroundColor: '#EF444414' },
                        ]}
                    >
                        <MaterialCommunityIcons name="alert-outline" size={28} color="#EF4444" />
                    </View>
                    <Text style={[styles.cancelTitle, { color: colors.text }]}>
                        {title}
                    </Text>
                    <Text style={[styles.cancelMessage, { color: colors.textSecondary }]}>
                        {message}
                    </Text>

                    <TextInput
                        style={[
                            styles.cancelInput,
                            { borderColor: isEmptyError ? colors.error : colors.cardBorder, color: colors.text, backgroundColor: colors.background },
                        ]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textTertiary}
                        value={remarks}
                        onChangeText={(text) => {
                            setRemarks(text);
                            if (isEmptyError && text.trim()) {
                                setIsEmptyError(false);
                            }
                        }}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    {isEmptyError ? (
                        <Text style={[styles.cancelRequiredText, { color: colors.error }]}>
                            {requiredText}
                        </Text>
                    ) : null}

                    <View style={styles.cancelButtons}>
                        <TouchableOpacity
                            style={[
                                styles.cancelBtn,
                                { borderColor: colors.cardBorder, backgroundColor: colors.background },
                            ]}
                            onPress={handleCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                                {cancelText}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                { backgroundColor: (!remarksRequired || remarks.trim()) ? '#EF4444' : colors.cardBorder },
                            ]}
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                            disabled={remarksRequired && !remarks.trim()}
                        >
                            <Text style={[styles.confirmBtnText, { color: (!remarksRequired || remarks.trim()) ? '#ffffff' : colors.textTertiary }]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cancelCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
    },
    cancelIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cancelTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    cancelMessage: {
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 16,
    },
    cancelInput: {
        width: '100%',
        minHeight: 80,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 20,
    },
    cancelButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelRequiredText: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
});
