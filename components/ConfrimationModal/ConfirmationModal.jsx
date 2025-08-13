// components/ConfirmationModal.js
import React from 'react';
import {Modal, View, Text, Pressable, StyleSheet} from 'react-native';
import {BlurView} from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {Ionicons} from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ConfirmationModal({
                                              visible,
                                              status = 'confirm', // confirm | success | error | loading
                                              title = 'Confirm',
                                              message = 'Are you sure?',
                                              onConfirm,
                                              onCancel,
                                              onRetry,
                                          }) {
    const scale = useSharedValue(0.8);

    React.useEffect(() => {
        scale.value = withSpring(visible ? 1 : 0.8, {damping: 15});
    }, [visible]);

    const cardStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

    const iconProps = {
        confirm: {name: 'help-circle', color: '#3b82f6'},
        success: {name: 'checkmark-circle', color: '#10b981'},
        error: {name: 'close-circle', color: '#ef4444'},
        loading: {name: 'reload', color: '#6b7280'},
    }[status];

    const handle = (fn) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fn?.();
    };

    return (
        <Modal transparent visible={visible} onRequestClose={() => handle(onCancel)}>
            <BlurView intensity={85} tint="dark" style={styles.backdrop}>
                <Animated.View style={[styles.card, cardStyle]}>
                    <Ionicons {...iconProps} size={52} style={styles.icon}/>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.row}>
                        {status === 'confirm' && (
                            <>
                                <AnimatedPressable style={styles.btnOutline} onPress={() => handle(onCancel)}>
                                    <Text style={styles.outlineTxt}>Cancel</Text>
                                </AnimatedPressable>
                                <AnimatedPressable style={styles.btnFill} onPress={() => handle(onConfirm)}>
                                    <Text style={styles.fillTxt}>Confirm</Text>
                                </AnimatedPressable>
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                {onRetry && (
                                    <AnimatedPressable style={styles.btnOutline} onPress={() => handle(onRetry)}>
                                        <Text style={styles.outlineTxt}>Retry</Text>
                                    </AnimatedPressable>
                                )}
                                <AnimatedPressable style={styles.btnFill} onPress={() => handle(onCancel)}>
                                    <Text style={styles.fillTxt}>Close</Text>
                                </AnimatedPressable>
                            </>
                        )}
                        {status === 'success' && (
                            <AnimatedPressable style={styles.btnFill} onPress={() => handle(onCancel)}>
                                <Text style={styles.fillTxt}>Done</Text>
                            </AnimatedPressable>
                        )}
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    card: {
        width: 320,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        elevation: 20,
    },
    icon: {marginBottom: 12},
    title: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 4
    },
    message: {fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 24, fontFamily: 'PoppinsRegular'},
    row: {flexDirection: 'row', gap: 12, width: '100%'},
    btnOutline: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        alignItems: 'center',
    },
    btnFill: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        alignItems: 'center',
    },
    outlineTxt: {fontSize: 15, color: '#374151', fontFamily: 'PoppinsSemiBold'},
    fillTxt: {fontSize: 15, color: '#fff', fontFamily: 'PoppinsSemiBold'},
});