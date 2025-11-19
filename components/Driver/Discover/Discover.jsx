// components/Driver/Discover/Discover.jsx
import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import LogisticMap from './LogisticMap';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TAB_W = 80; // Reduced width for single icon
const TAB_H = 70;
const EDGE_MARGIN = 16;
const TOP_DEFAULT = Platform.OS === 'ios' ? 60 : 10;

function Discover({ userData }) {
    // Animation values for single map tab
    const mapScale = useSharedValue(1);
    const mapOpacity = useSharedValue(1);

    // Draggable tab bar values
    const tx = useSharedValue((SCREEN_W - TAB_W) / 2);
    const ty = useSharedValue(TOP_DEFAULT);
    const pickedUp = useSharedValue(0);
    const glassScale = useSharedValue(1);
    const glassOpacity = useSharedValue(1);

    // Memoized map component with key for proper mount/unmount
    const MapComponent = useMemo(() => <LogisticMap key="logistics-map" />, []);

    // Gesture handlers
    const snapToEdge = () => {
        'worklet';
        const centerX = SCREEN_W / 2 - TAB_W / 2;
        const leftEdge = EDGE_MARGIN;
        const rightEdge = SCREEN_W - TAB_W - EDGE_MARGIN;

        const currentCenterX = tx.value + TAB_W / 2;
        const distToLeft = Math.abs(currentCenterX - (leftEdge + TAB_W / 2));
        const distToCenter = Math.abs(currentCenterX - SCREEN_W / 2);
        const distToRight = Math.abs(currentCenterX - (rightEdge + TAB_W / 2));

        const minDist = Math.min(distToLeft, distToCenter, distToRight);
        let targetX = distToLeft === minDist ? leftEdge : distToCenter === minDist ? centerX : rightEdge;

        tx.value = withSpring(targetX, { damping: 18, stiffness: 220 });
    };

    const clampWithinScreen = () => {
        'worklet';
        const minX = EDGE_MARGIN;
        const maxX = SCREEN_W - TAB_W - EDGE_MARGIN;
        const minY = EDGE_MARGIN;
        const maxY = SCREEN_H - TAB_H - EDGE_MARGIN - 24;
        if (tx.value < minX) tx.value = minX;
        if (tx.value > maxX) tx.value = maxX;
        if (ty.value < minY) ty.value = minY;
        if (ty.value > maxY) ty.value = maxY;
    };

    const longPress = Gesture.LongPress()
        .minDuration(200)
        .onStart(() => {
            pickedUp.value = 1;
            glassScale.value = withSpring(1.03);
            glassOpacity.value = withTiming(0.98, { duration: 120 });
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        });

    const pan = Gesture.Pan()
        .onChange((e) => {
            if (!pickedUp.value) return;
            tx.value += e.changeX;
            ty.value += e.changeY;
            clampWithinScreen();
        })
        .onEnd(() => {
            clampWithinScreen();
            snapToEdge();
            pickedUp.value = 0;
            glassScale.value = withSpring(1);
            glassOpacity.value = withTiming(1, { duration: 120 });
        });

    const dragGesture = Gesture.Simultaneous(longPress, pan);

    const glassStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: glassScale.value }],
        opacity: glassOpacity.value,
    }));

    const mapAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: mapScale.value }],
        opacity: mapOpacity.value,
    }));

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Map Content - Always visible */}
            <View style={styles.contentContainer} pointerEvents="box-none">
                {MapComponent}
            </View>

            {/* Simplified Tab Bar - Single Map Icon */}
            <GestureDetector gesture={dragGesture}>
                <Animated.View style={[styles.tabBarWrapper, glassStyle]} pointerEvents="box-none">
                    <View style={styles.shadowPlate} pointerEvents="none" />
                    <BlurView
                        intensity={Platform.OS === 'android' ? 50 : 85}
                        tint={Platform.OS === 'android' ? 'light' : 'extraLight'}
                        style={styles.glass}
                    >
                        <View style={styles.glassOverlay} pointerEvents="none" />

                        {/* Single Map Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            activeOpacity={1}
                            disabled={true}
                        >
                            <Animated.View style={[styles.tabIconContainer, mapAnimatedStyle]}>
                                <View style={[styles.tabIconBg, styles.tabIconBgActive]}>
                                    <Ionicons name="location" size={24} color="#4F46E5" />
                                </View>
                                <View style={styles.activeDot} />
                            </Animated.View>
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    contentContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    tabBarWrapper: {
        position: 'absolute',
        width: TAB_W,
        height: TAB_H,
        zIndex: 1000,
    },
    shadowPlate: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
        }),
        borderRadius: 24,
        position: 'absolute',
        inset: 0,
    },
    glass: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        backgroundColor: 'transparent',
    },
    tabButton: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
    tabIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(243,244,246,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(229,231,235,0.55)',
    },
    tabIconBgActive: {
        backgroundColor: 'rgba(238,242,255,0.9)',
        borderColor: 'rgba(199,210,254,0.9)',
        ...Platform.select({
            ios: {
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
            },
        }),
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4F46E5',
        marginTop: 6,
    },
});

export default Discover;