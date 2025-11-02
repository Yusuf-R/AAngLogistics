// components/Driver/Discover/Discover.jsx
import React, { useState, useMemo, useCallback } from 'react';
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
import OrdersList from './OrdersList';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TAB_W = 160;
const TAB_H = 72;
const EDGE_MARGIN = 16;
const TOP_DEFAULT = Platform.OS === 'ios' ? 60 : 20;

function Discover() {
    const [activeTab, setActiveTab] = useState('map'); // 'map' or 'orders'

    // Scale/opacity for tab icons
    const mapScale = useSharedValue(1);
    const ordersScale = useSharedValue(0.85);
    const mapOpacity = useSharedValue(1);
    const ordersOpacity = useSharedValue(0.6);

    // Draggable floating tab bar (long-press to pick up, then drag)
    const tx = useSharedValue((SCREEN_W - TAB_W) / 2); // center by default
    const ty = useSharedValue(TOP_DEFAULT);
    const pickedUp = useSharedValue(0);
    const glassScale = useSharedValue(1);
    const glassOpacity = useSharedValue(1);

    // Memo children
    const MapComponent = useMemo(() => <LogisticMap />, []);
    const OrdersComponent = useMemo(() => <OrdersList />, []);

    const handleTabPress = useCallback((tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);

        if (tab === 'map') {
            mapScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            mapOpacity.value = withTiming(1, { duration: 200 });
            ordersScale.value = withSpring(0.85, { damping: 15, stiffness: 150 });
            ordersOpacity.value = withTiming(0.6, { duration: 200 });
        } else {
            ordersScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            ordersOpacity.value = withTiming(1, { duration: 200 });
            mapScale.value = withSpring(0.85, { damping: 15, stiffness: 150 });
            mapOpacity.value = withTiming(0.6, { duration: 200 });
        }
    }, [activeTab]);

    const mapAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: mapScale.value }],
        opacity: mapOpacity.value,
    }));
    const ordersAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ordersScale.value }],
        opacity: ordersOpacity.value,
    }));

    // Glass draggable style
    const glassStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: glassScale.value }],
        opacity: glassOpacity.value,
    }));

    // Snap to nearest horizontal edge
    const snapToEdge = () => {
        'worklet';
        const centerX = SCREEN_W / 2 - TAB_W / 2;
        const leftEdge = EDGE_MARGIN;
        const rightEdge = SCREEN_W - TAB_W - EDGE_MARGIN;

        const currentCenterX = tx.value + TAB_W / 2;

        // Calculate distances to each snap point
        const distToLeft = Math.abs(currentCenterX - (leftEdge + TAB_W / 2));
        const distToCenter = Math.abs(currentCenterX - SCREEN_W / 2);
        const distToRight = Math.abs(currentCenterX - (rightEdge + TAB_W / 2));

        // Find closest snap point
        const minDist = Math.min(distToLeft, distToCenter, distToRight);

        let targetX;
        if (minDist === distToLeft) {
            targetX = leftEdge;
        } else if (minDist === distToCenter) {
            targetX = centerX;
        } else {
            targetX = rightEdge;
        }

        tx.value = withSpring(targetX, { damping: 18, stiffness: 220 });
    };

    // Constrain within screen
    const clampWithinScreen = () => {
        'worklet';
        const minX = EDGE_MARGIN;
        const maxX = SCREEN_W - TAB_W - EDGE_MARGIN;
        const minY = EDGE_MARGIN;
        const maxY = SCREEN_H - TAB_H - EDGE_MARGIN - 24; // keep above bottom gestures
        if (tx.value < minX) tx.value = minX;
        if (tx.value > maxX) tx.value = maxX;
        if (ty.value < minY) ty.value = minY;
        if (ty.value > maxY) ty.value = maxY;
    };

    // Gesture: long-press to pick, then pan
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

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* keep map/list rendered underneath for transparency */}
            <View style={[styles.contentContainer, activeTab !== 'map' && styles.hidden]} pointerEvents="box-none">
                {MapComponent}
            </View>

            <View style={[styles.contentContainer, activeTab !== 'orders' && styles.hidden]} pointerEvents="box-none">
                {OrdersComponent}
            </View>

            {/* Floating glass tab bar (draggable) */}
            <GestureDetector gesture={dragGesture}>
                <Animated.View style={[styles.tabBarWrapper, glassStyle]} pointerEvents="box-none">
                    {/* Outer soft shadow plate to make it float */}
                    <View style={styles.shadowPlate} pointerEvents="none" />
                    <BlurView
                        intensity={Platform.OS === 'android' ? 50 : 85}
                        tint={Platform.OS === 'android' ? 'light' : 'extraLight'}
                        style={styles.glass}
                    >
                        {/* Subtle radial gradient overlay to enhance glass depth */}
                        <View style={styles.glassOverlay} pointerEvents="none" />

                        {/* Map Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('map')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, mapAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'map' && styles.tabIconBgActive
                                ]}>
                                    <Ionicons
                                        name="location"
                                        size={24}
                                        color={activeTab === 'map' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'map' && <View style={styles.activeDot} />}
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Orders Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('orders')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, ordersAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'orders' && styles.tabIconBgActive
                                ]}>
                                    <Ionicons
                                        name="cube"
                                        size={24}
                                        color={activeTab === 'orders' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'orders' && <View style={styles.activeDot} />}
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
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    hidden: { zIndex: -1, opacity: 0, pointerEvents: 'none' },

    // Draggable wrapper (positioned via animated translate)
    tabBarWrapper: {
        position: 'absolute',
        width: TAB_W,
        height: TAB_H,
        // initial placement handled by shared values
        zIndex: 1000,
    },

    // Soft plate shadow to enhance floating feel
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
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(255,255,255,0.35)', // fallback layer
    },

    // Subtle radial highlight to sell the glass
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
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(243,244,246,0.45)',
        borderWidth: 1, borderColor: 'rgba(229,231,235,0.55)',
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
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#4F46E5',
        marginTop: 6,
    },
    divider: {
        width: 1, height: 40,
        backgroundColor: 'rgba(229,231,235,0.6)',
    },
});

export default Discover;
