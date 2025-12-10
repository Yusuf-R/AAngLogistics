// components/Driver/Finance/FloatingFinanceTabs.jsx
import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
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
import FinanceManager from '../../../app/(protected)/driver/finance/(finance-tabs)/manager';
import EarningsTab from '../../../app/(protected)/driver/finance/(finance-tabs)/earnings';
import PayoutTab from '../../../app/(protected)/driver/finance/(finance-tabs)/payout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TAB_W = 160;
const TAB_H = 60;
const EDGE_MARGIN = 6;
const TOP_DEFAULT = Platform.OS === 'ios' ? 20 : 5;

const FloatingFinanceTabs = forwardRef(({ userData }, ref) => {
    const [activeTab, setActiveTab] = useState('manager');

    // Animation values for 3 tabs
    const managerScale = useSharedValue(1);
    const earningsScale = useSharedValue(0.85);
    const payoutScale = useSharedValue(0.85);

    const managerOpacity = useSharedValue(1);
    const earningsOpacity = useSharedValue(0.6);
    const payoutOpacity = useSharedValue(0.6);

    // Draggable tab bar values
    const tx = useSharedValue((SCREEN_W - TAB_W) / 2);
    const ty = useSharedValue(TOP_DEFAULT);
    const pickedUp = useSharedValue(0);
    const glassScale = useSharedValue(1);
    const glassOpacity = useSharedValue(1);

    // Expose method to parent to navigate to payout tab
    useImperativeHandle(ref, () => ({
        navigateToPayouts: () => {
            handleTabPress('payout');
        }
    }));

    // Memoized components
    const ManagerComponent = useMemo(() =>
            <FinanceManager
                userData={userData}
                onNavigateToPayouts={() => handleTabPress('payout')}
            />,
        [userData]
    );

    const EarningsComponent = useMemo(() =>
            <EarningsTab userData={userData} />,
        [userData]
    );

    const PayoutComponent = useMemo(() =>
            <PayoutTab userData={userData} />,
        [userData]
    );

    const handleTabPress = useCallback((tab) => {
        if (tab === activeTab) return;

        setActiveTab(tab);

        // Reset all animations
        managerScale.value = withSpring(0.85);
        earningsScale.value = withSpring(0.85);
        payoutScale.value = withSpring(0.85);

        managerOpacity.value = withTiming(0.6);
        earningsOpacity.value = withTiming(0.6);
        payoutOpacity.value = withTiming(0.6);

        // Animate selected tab
        if (tab === 'manager') {
            managerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            managerOpacity.value = withTiming(1, { duration: 200 });
        } else if (tab === 'earnings') {
            earningsScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            earningsOpacity.value = withTiming(1, { duration: 200 });
        } else if (tab === 'payout') {
            payoutScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            payoutOpacity.value = withTiming(1, { duration: 200 });
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [activeTab]);

    // Animated styles for each tab
    const managerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: managerScale.value }],
        opacity: managerOpacity.value,
    }));

    const earningsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: earningsScale.value }],
        opacity: earningsOpacity.value,
    }));

    const payoutAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: payoutScale.value }],
        opacity: payoutOpacity.value,
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
                                        color={activeTab === 'manager' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'manager' && <View style={styles.activeDot} />}
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Payout Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('payout')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, payoutAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'payout' && styles.tabIconBgActive
                                ]}>
                                    <FontAwesome6
                                        name="amazon-pay"
                                        size={26}
                                        color={activeTab === 'payout' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'payout' && <View style={styles.activeDot} />}
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Earnings Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('earnings')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, earningsAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'earnings' && styles.tabIconBgActive
                                ]}>
                                    <MaterialCommunityIcons
                                        name="database-clock"
                                        size={26}
                                        color={activeTab === 'earnings' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'earnings' && <View style={styles.activeDot} />}
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

            <View style={[styles.contentContainer, activeTab !== 'earnings' && styles.hidden]} pointerEvents="box-none">
                {EarningsComponent}
            </View>

            <View style={[styles.contentContainer, activeTab !== 'payout' && styles.hidden]} pointerEvents="box-none">
                {PayoutComponent}
            </View>

            {/* Floating Tab Bar */}
            {renderTabBar()}
        </View>
    );
});
// Styles (mostly same as your existing styles)
const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#F9FAFB'},
    contentContainer: {
        flex: 1,
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    hidden: {zIndex: -1, opacity: 0, pointerEvents: 'none'},
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
                shadowOffset: {width: 0, height: 10},
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
    tabIconContainer: {alignItems: 'center', justifyContent: 'center'},
    tabIconBg: {
        width: 42, height: 42, borderRadius: 21, // Slightly smaller for 3 tabs
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
                shadowOffset: {width: 0, height: 6},
                shadowOpacity: 0.35,
                shadowRadius: 10,
            },
        }),
    },
    activeDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#4F46E5',
        marginTop: 3,
    },
    divider: {
        width: 1, height: 40,
        backgroundColor: 'rgba(229,231,235,0.6)',
    },
});

export default FloatingFinanceTabs;