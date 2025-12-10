// components/Client/Finance/FloatingFinanceTabs.jsx
import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Fontisto } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// Import your finance components
import FinanceManager from '../../../app/(protected)/client/finance/(finance-tabs)/manager';
import TopUpTab from '../../../app/(protected)/client/finance/(finance-tabs)/topup';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TAB_W = 120; // Smaller since only 2 tabs
const TAB_H = 60;
const EDGE_MARGIN = 6;
const TOP_DEFAULT = Platform.OS === 'ios' ? 20 : 5;

const FloatingFinanceTabs = forwardRef(({ userData }, ref) => {
    const [activeTab, setActiveTab] = useState('manager');

    // Animation values for 2 tabs
    const managerScale = useSharedValue(1);
    const topupScale = useSharedValue(0.85);

    const managerOpacity = useSharedValue(1);
    const topupOpacity = useSharedValue(0.6);

    // Draggable tab bar values
    const tx = useSharedValue((SCREEN_W - TAB_W) / 2);
    const ty = useSharedValue(TOP_DEFAULT);
    const pickedUp = useSharedValue(0);
    const glassScale = useSharedValue(1);
    const glassOpacity = useSharedValue(1);

    // Expose method to parent to navigate to top-up tab
    useImperativeHandle(ref, () => ({
        navigateToTopUp: () => {
            handleTabPress('topup');
        }
    }));

    // Memoized components
    const ManagerComponent = useMemo(() =>
            <FinanceManager
                userData={userData}
                onNavigateToTopUp={() => handleTabPress('topup')}
            />,
        [userData]
    );

    const TopUpComponent = useMemo(() =>
            <TopUpTab userData={userData} />,
        [userData]
    );

    const handleTabPress = useCallback((tab) => {
        if (tab === activeTab) return;

        setActiveTab(tab);

        // Reset all animations
        managerScale.value = withSpring(0.85);
        topupScale.value = withSpring(0.85);

        managerOpacity.value = withTiming(0.6);
        topupOpacity.value = withTiming(0.6);

        // Animate selected tab
        if (tab === 'manager') {
            managerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            managerOpacity.value = withTiming(1, { duration: 200 });
        } else if (tab === 'topup') {
            topupScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            topupOpacity.value = withTiming(1, { duration: 200 });
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [activeTab]);

    // Animated styles for each tab
    const managerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: managerScale.value }],
        opacity: managerOpacity.value,
    }));

    const topupAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: topupScale.value }],
        opacity: topupOpacity.value,
    }));

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
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: glassScale.value }
        ],
        opacity: glassOpacity.value,
    }));

    // Render the floating tab bar
    const renderTabBar = () => {
        return (
            <GestureDetector gesture={dragGesture}>
                <Animated.View style={[styles.tabBarWrapper, glassStyle]} pointerEvents="box-none">
                    <View style={styles.shadowPlate} pointerEvents="none" />
                    <BlurView
                        intensity={Platform.OS === 'android' ? 50 : 85}
                        tint={Platform.OS === 'android' ? 'light' : 'extraLight'}
                        style={styles.glass}
                    >
                        <View style={styles.glassOverlay} pointerEvents="none" />

                        {/* Manager Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('manager')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, managerAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'manager' && styles.tabIconBgActive
                                ]}>
                                    <MaterialIcons
                                        name="dashboard"
                                        size={26}
                                        color={activeTab === 'manager' ? '#3b82f6' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'manager' && <View style={styles.activeDot} />}
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Top-Up Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('topup')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, topupAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'topup' && styles.tabIconBgActive
                                ]}>
                                    <Fontisto
                                        name="wallet"
                                        size={26}
                                        color={activeTab === 'topup' ? '#3b82f6' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'topup' && <View style={styles.activeDot} />}
                            </Animated.View>
                        </TouchableOpacity>
                    </BlurView>
                </Animated.View>
            </GestureDetector>
        );
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Conditional Content Rendering */}
            <View style={[styles.contentContainer, activeTab !== 'manager' && styles.hidden]} pointerEvents="box-none">
                {ManagerComponent}
            </View>

            <View style={[styles.contentContainer, activeTab !== 'topup' && styles.hidden]} pointerEvents="box-none">
                {TopUpComponent}
            </View>

            {/* Floating Tab Bar */}
            {renderTabBar()}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    contentContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    hidden: {
        display: 'none',
    },
    tabBarWrapper: {
        position: 'absolute',
        width: TAB_W,
        height: TAB_H,
        zIndex: 1000,
    },
    shadowPlate: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    glass: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Platform.OS === 'android'
            ? 'rgba(255,255,255,0.7)'
            : 'rgba(255,255,255,0.4)',
        borderRadius: 30,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconBg: {
        padding: 8,
        borderRadius: 90,
        backgroundColor: 'transparent',
    },
    tabIconBgActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 150,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#3b82f6',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
    },
});

export default FloatingFinanceTabs;