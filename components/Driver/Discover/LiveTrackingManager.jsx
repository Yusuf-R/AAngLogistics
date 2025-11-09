// components/Driver/Discover/Discover.jsx
import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {View, TouchableOpacity, StyleSheet, Platform, Dimensions} from 'react-native';
import {BlurView} from 'expo-blur';
import {Ionicons, Entypo, MaterialCommunityIcons} from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import LiveTracking from "./LiveTracking";
import LiveChat from "./LiveChat";

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const TAB_W = 140;
const TAB_H = 70;
const EDGE_MARGIN = 6;
const TOP_DEFAULT = Platform.OS === 'ios' ? 40 : 10;

function LiveTrackingManager({userData}) {
    // ✅ Only 2 tabs now: 'live' and 'chat'
    const [activeTab, setActiveTab] = useState('live');


    // Animation values (only for live and Chat)
    const liveScale = useSharedValue(1);
    const chatScale = useSharedValue(0.85);
    const liveOpacity = useSharedValue(1);
    const chatOpacity = useSharedValue(0.6);

    // Draggable tab bar values
    const tx = useSharedValue((SCREEN_W - TAB_W) / 2);
    const ty = useSharedValue(TOP_DEFAULT);
    const pickedUp = useSharedValue(0);
    const glassScale = useSharedValue(1);
    const glassOpacity = useSharedValue(1);

    const switchToChatTab = useCallback(() => {
        setActiveTab('chat');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const switchToLiveTab = useCallback(() => {
        setActiveTab('live');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Memoized components (only live and Chat)
    const LiveMapComponent = useMemo(() =>
            <LiveTracking onNavigateToChat={switchToChatTab} />,
        [switchToChatTab]
    );

    const ChatComponent = useMemo(() =>
            <LiveChat onNavigateToLive={switchToLiveTab} />,
        [switchToLiveTab]
    );

    const handleTabPress = useCallback((tab) => {
        if (tab === activeTab) return;

        setActiveTab(tab);

        // Reset animations
        liveScale.value = withSpring(0.85);
        chatScale.value = withSpring(0.85);
        liveOpacity.value = withTiming(0.6);
        chatOpacity.value = withTiming(0.6);

        // Animate selected tab
        if (tab === 'live') {
            liveScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            liveOpacity.value = withTiming(1, { duration: 200 });
        } else if (tab === 'chat') {
            chatScale.value = withSpring(1, { damping: 15, stiffness: 150 });
            chatOpacity.value = withTiming(1, { duration: 200 });
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [activeTab]);

    // Animated styles
    const liveAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: liveScale.value }],
        opacity: liveOpacity.value,
    }));

    const chatAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: chatScale.value }],
        opacity: chatOpacity.value,
    }));


    // Gesture handlers (same as before)
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

        tx.value = withSpring(targetX, {damping: 18, stiffness: 220});
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
            glassOpacity.value = withTiming(0.98, {duration: 120});
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
            glassOpacity.value = withTiming(1, {duration: 120});
        });

    const dragGesture = Gesture.Simultaneous(longPress, pan);

    const glassStyle = useAnimatedStyle(() => ({
        transform: [{translateX: tx.value}, {translateY: ty.value}, {scale: glassScale.value}],
        opacity: glassOpacity.value,
    }));

    // Render tab bar based on delivery status
    const renderTabBar = () => {
        return (
            <GestureDetector gesture={dragGesture}>
                <Animated.View style={[styles.tabBarWrapper, glassStyle]} pointerEvents="box-none">
                    <View style={styles.shadowPlate} pointerEvents="none"/>
                    <BlurView
                        intensity={Platform.OS === 'android' ? 50 : 85}
                        tint={Platform.OS === 'android' ? 'light' : 'extraLight'}
                        style={styles.glass}
                    >
                        <View style={styles.glassOverlay} pointerEvents="none"/>

                        {/* live Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('live')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, liveAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'live' && styles.tabIconBgActive
                                ]}>
                                    <MaterialCommunityIcons
                                        name="transit-connection-variant"
                                        size={22}
                                        color={activeTab === 'live' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'live' && <View style={styles.activeDot}/>}
                            </Animated.View>
                        </TouchableOpacity>

                        <View style={styles.divider}/>

                        {/* Chat Tab */}
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('chat')}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={[styles.tabIconContainer, chatAnimatedStyle]}>
                                <View style={[
                                    styles.tabIconBg,
                                    activeTab === 'chat' && styles.tabIconBgActive
                                ]}>
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={24}
                                        color={activeTab === 'chat' ? '#4F46E5' : '#6B7280'}
                                    />
                                </View>
                                {activeTab === 'chat' && <View style={styles.activeDot}/>}
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
            <View style={[styles.contentContainer, activeTab !== 'live' && styles.hidden]} pointerEvents="box-none">
                {LiveMapComponent}
            </View>

            <View style={[styles.contentContainer, activeTab !== 'chat' && styles.hidden]} pointerEvents="box-none">
                {ChatComponent}
            </View>

            {/* Dynamic Tab Bar */}
            {renderTabBar()}
        </View>
    );
}

// Styles remain exactly the same as previous implementation
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
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(243,244,246,0.45)',
        borderWidth: 1, borderColor: 'rgba(229,231,235,0.55)',
    },
    liveTabIconBg: {
        backgroundColor: 'rgba(240,253,244,0.45)',
        borderColor: 'rgba(220,252,231,0.55)',
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
        marginTop: 6,
    },
    liveActiveDot: {
        backgroundColor: '#10B981',
    },
    divider: {
        width: 1, height: 40,
        backgroundColor: 'rgba(229,231,235,0.6)',
    },
});

export default LiveTrackingManager;