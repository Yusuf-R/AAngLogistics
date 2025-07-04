// components/ConfirmationModal.js
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';

const loader = require('@/assets/animations/loader/spin-loader.json');
const successAnim = require('@/assets/animations/loader/success.json');
const failedAnim = require('@/assets/animations/loader/failed.json');

const ConfirmationModal = ({
                               visible,
                               status = 'confirm', // 'confirm' | 'loading' | 'success' | 'error'
                               title = 'Confirm',
                               message = 'Are you sure you want to proceed?',
                               onConfirm,    // called when YES is pressed
                               onCancel,     // called when NO is pressed or Close
                               onRetry,      // optional: retry function after error
                               showRetryOnError = true,
                           }) => {
    const getAnimation = () => {
        switch (status) {
            case 'success':
                return successAnim;
            case 'error':
                return failedAnim;
            case 'loading':
                return loader;
            default:
                return null;
        }
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    {status === 'confirm' && (
                        <>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.text}>{message}</Text>
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                    <Text style={styles.cancelText}>No</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                                    <Text style={styles.confirmText}>Yes</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    {status !== 'confirm' && (
                        <>
                            <LottieView
                                source={getAnimation()}
                                autoPlay
                                loop={status === 'loading'}
                                style={{ width: 100, height: 100 }}
                            />
                            <Text style={styles.text}>{message}</Text>
                            {status === 'error' && (
                                <View style={styles.buttonGroup}>
                                    {onRetry && showRetryOnError && (
                                        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                                            <Text style={styles.retryText}>Try Again</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                                        <Text style={styles.closeText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 280,
    },
    title: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 8,
        textAlign: 'center',
    },
    text: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
        textAlign: 'center',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '50%',
        marginTop: 24,
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#60a5fa',
        borderRadius: 8,
    },
    confirmText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#E5E5E5',
        borderRadius: 8,
    },
    cancelText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#60a5fa',
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    closeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#E5E5E5',
        borderRadius: 8,
    },
    closeText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ConfirmationModal;
