// components/StatusModal/StatusModal.jsx
import React, { useEffect } from 'react'; // Add useEffect
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';

const loader = require('@/assets/animations/loader/spin-loader.json');
const successAnim = require('@/assets/animations/loader/success.json');
const failedAnim = require('@/assets/animations/loader/failed.json');

const StatusModal = ({
                         visible,
                         status = 'loading', // 'loading', 'success', 'error'
                         message = 'Loading...',
                         onFinish,
                         onRetry,       // optional
                         onClose,       // optional
                         showRetryOnError = true,
                         // New optional props
                         autoClose = false,
                         autoCloseDelay = 1500,
                         showAction = false,
                         actionText = 'Action',
                         onAction,
                     }) => {

    // Add auto-close functionality
    useEffect(() => {
        if (visible && autoClose && status === 'success' && onFinish) {
            const timer = setTimeout(() => {
                onFinish();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [visible, autoClose, status, autoCloseDelay, onFinish]);

    const getAnimation = () => {
        switch (status) {
            case 'success':
                return successAnim;
            case 'error':
                return failedAnim;
            default:
                return loader;
        }
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    <LottieView
                        source={getAnimation()}
                        autoPlay
                        loop={status === 'loading'}
                        style={{ width: 100, height: 100 }}
                        onAnimationFinish={() => {
                            // Only use this for non-autoClose scenarios
                            if (status === 'success' && onFinish && !autoClose) onFinish();
                        }}
                    />
                    <Text style={styles.text}>{message}</Text>

                    {/* Action buttons for error or custom actions */}
                    {(status === 'error' || showAction) && (
                        <View style={styles.buttonGroup}>
                            {showAction && onAction && (
                                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                                    <Text style={styles.actionText}>{actionText}</Text>
                                </TouchableOpacity>
                            )}
                            {onRetry && showRetryOnError && status === 'error' && (
                                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                                    <Text style={styles.retryText}>Try Again</Text>
                                </TouchableOpacity>
                            )}
                            {onClose && (
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Text style={styles.closeText}>Close</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
        minWidth: 260,
    },
    text: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#10b981',
        borderRadius: 8,
    },
    actionText: {
        color: 'white',
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

export default StatusModal;