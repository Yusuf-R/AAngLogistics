// components/Utility/StoreResetUtility.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import useLogisticStore from '../../../../store/Driver/useLogisticStore';

export default function StoreResetUtility() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
                💥 Reset Store
            </Text>

            <TouchableOpacity
                onPress={() => {
                    Alert.alert('Reset?', 'Clear all data?', [
                        { text: 'Cancel' },
                        {
                            text: 'RESET',
                            onPress: () => {
                                useLogisticStore.getState().resetStore();
                                toast.success('Store cleared!');
                            }
                        }
                    ]);
                }}
                style={{
                    backgroundColor: '#EF4444',
                    padding: 16,
                    borderRadius: 8
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    RESET STORE
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        padding: 4
    },
    title: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    headerSpacer: {
        width: 32
    },
    content: {
        flex: 1,
        padding: 16
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16
    },
    statusTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    statusGrid: {
        gap: 12
    },
    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statusLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280'
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold'
    },
    stageText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    orderIdText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280'
    },
    activeOrderWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginTop: 12
    },
    warningText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#92400E',
        flex: 1
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16
    },
    infoTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827'
    },
    infoList: {
        gap: 12
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        flex: 1,
        lineHeight: 20
    },
    resetButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6
    },
    resetButtonBlur: {
        padding: 20
    },
    resetButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },
    resetButtonText: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#EF4444'
    },
    resetButtonDisabled: {
        opacity: 0.6
    },
    quickActions: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    quickActionsTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
        marginBottom: 16
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    quickActionText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1'
    }
});

