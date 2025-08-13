import React, { useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ExitOrderModal({ visible, onClose, onConfirm }) {
    const scale = useSharedValue(0.8);

    useEffect(() => {
        scale.value = withSpring(visible ? 1 : 0.8, { damping: 15 });
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleYes = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onConfirm();
    };

    const handleNo = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <BlurView intensity={85} tint="dark" style={styles.backdrop}>
                <Animated.View style={[styles.card, animatedStyle]}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#ef4444"
                        style={styles.icon}
                    />
                    <Text style={styles.title}>Leave order creation?</Text>
                    <Text style={styles.subtitle}>
                        Unsaved progress will be lost. Are you sure you want to exit?
                    </Text>

                    <View style={styles.row}>
                        <Pressable style={[styles.btn, styles.outline]} onPress={handleNo}>
                            <Text style={[styles.btnText, styles.outlineText]}>No, stay</Text>
                        </Pressable>

                        <Pressable style={[styles.btn, styles.fill]} onPress={handleYes}>
                            <Text style={[styles.btnText, styles.fillText]}>Yes, exit</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    icon: { marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    row: { flexDirection: 'row', gap: 12, width: '100%' },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outline: {
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    fill: { backgroundColor: '#ef4444' },
    btnText: { fontSize: 15, fontWeight: '600' },
    outlineText: { color: '#374151' },
    fillText: { color: '#fff' },
});