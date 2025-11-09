// components/Driver/TabNavigation/TabNavigation.jsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Pressable } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Ionicons, AntDesign, FontAwesome5 } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    cancelAnimation,
    Easing
} from 'react-native-reanimated';
import { useNotificationStore } from "../../../store/Driver/useNotificationStore";
import { router, usePathname } from "expo-router";
import useLogisticStore, { DELIVERY_STAGES } from "../../../store/Driver/useLogisticStore";

export function TabNavigation({ state, descriptors, navigation, canAccess }) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();
    const pathname = usePathname();
    const [previousIndex, setPreviousIndex] = useState(state.index);
    const unreadCount = useNotificationStore(state => state.stats?.unread || 0);
    const { isOnActiveDelivery, deliveryStage } = useLogisticStore();

    // ✅ Pulsing animation for active delivery
    const deliveryPulse = useSharedValue(0);

    // React Native Animated values for tab scaling
    const animatedValues = useRef(
        state.routes.map((_, i) => new RNAnimated.Value(i === state.index ? 1 : 0))
    ).current;

    // Start/stop delivery pulse animation
    useEffect(() => {
        if (isOnActiveDelivery) {
            deliveryPulse.value = withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.ease }),
                -1,
                true
            );
        } else {
            cancelAnimation(deliveryPulse);
            deliveryPulse.value = 0;
        }
    }, [isOnActiveDelivery]);

    const deliveryPulseStyle = useAnimatedStyle(() => ({
        opacity: 0.8 - deliveryPulse.value * 0.3,
        transform: [{ scale: 0.8 + deliveryPulse.value * 0.4 }]
    }));

    // Tab scaling animation
    useEffect(() => {
        if (previousIndex !== state.index) {
            RNAnimated.spring(animatedValues[previousIndex], {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();

            RNAnimated.spring(animatedValues[state.index], {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();

            setPreviousIndex(state.index);
        }
    }, [state.index]);

    // Get delivery dot color based on stage
    const getDeliveryDotColor = () => {
        switch(deliveryStage) {
            case DELIVERY_STAGES.ACCEPTED:
            case DELIVERY_STAGES.ARRIVED_PICKUP:
                return '#10B981'; // Green
            case DELIVERY_STAGES.PICKED_UP:
            case DELIVERY_STAGES.ARRIVED_DROPOFF:
                return '#0000D7'; // Blue
            default:
                return null;
        }
    };

    // ✅ Tab configuration in desired order: Home || Discover || Notifications || Account
    const tabConfig = [
        {
            name: 'dashboard',
            label: 'Home',
            iconOutline: 'home-outline',
            iconFilled: 'home-sharp',
        },
        {
            name: 'discover',
            label: isOnActiveDelivery ? 'Active' : 'Discover',
            iconOutline: isOnActiveDelivery ? 'navigate-outline' : 'cube-outline',
            iconFilled: isOnActiveDelivery ? 'navigate' : 'cube',
            customIcon: true,
            isActiveDelivery: isOnActiveDelivery,
        },
        {
            name: 'notifications',
            label: 'Notifications',
            iconOutline: 'notifications-outline',
            iconFilled: 'notifications-sharp',
            showBadge: true,
        },
        {
            name: 'account',
            label: 'Account',
            iconOutline: 'person-outline',
            iconFilled: 'person-sharp',
        },
    ];

    const handleDiscoverPress = (name, route) => {
        if (name === 'discover') {
            if (isOnActiveDelivery) {
                // If on active delivery, navigate to live tracking
                router.push('/driver/discover/live');
                return;
            }
        }

        // 🔒 Gate here
        if (canAccess && !canAccess(name)) {
            router.replace("/driver/tcs-required");
            return;
        }

        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true
        });

        if (!event.defaultPrevented) {
            if (state.routes[state.index].name !== route.name) {
                navigation.navigate(route.name, route.params);
            }
        }
    };

    // ✅ Create ordered route mapping
    const orderedRoutes = tabConfig.map(config => {
        const route = state.routes.find(r => r.name === config.name);
        const routeIndex = state.routes.findIndex(r => r.name === config.name);

        // Special handling for discover tab when on active delivery
        const isFocused = config.name === 'discover' && isOnActiveDelivery
            ? pathname === '/driver/discover/live'
            : state.index === routeIndex;

        return { ...config, route, routeIndex, isFocused };
    }).filter(item => item.route);

    return (
        <View style={styles.tabBar}>
            {orderedRoutes.map(({
                                    name,
                                    label,
                                    iconOutline,
                                    iconFilled,
                                    showBadge,
                                    customIcon,
                                    route,
                                    routeIndex,
                                    isFocused,
                                    isActiveDelivery
                                }) => {
                const scale = animatedValues[routeIndex].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                });

                const onPress = () => handleDiscoverPress(name, route);

                const renderIcon = () => {
                    const iconName = isFocused ? iconFilled : iconOutline;
                    const iconColor = isFocused ? '#FFF' : colors.text;

                    if (customIcon) {
                        if (isActiveDelivery) {
                            return (
                                <Ionicons
                                    name={iconName}
                                    size={22}
                                    color={iconColor}
                                />
                            );
                        }
                        return isFocused ? (
                            <FontAwesome5 name="box-open" size={22} color={iconColor} />
                        ) : (
                            <AntDesign name="CodeSandbox" size={22} color={iconColor} />
                        );
                    }

                    return (
                        <Ionicons
                            name={iconName}
                            size={22}
                            color={iconColor}
                        />
                    );
                };

                const displayBadge = showBadge && name === 'notifications' && unreadCount > 0;
                const showDeliveryDot = isActiveDelivery && !isFocused;

                return (
                    <Pressable
                        key={name}
                        href={buildHref(route.name, route.params)}
                        onPress={onPress}
                        style={styles.tabBarItem}
                        android_ripple={null}
                    >
                        <RNAnimated.View
                            style={[
                                styles.iconContainer,
                                isFocused && { backgroundColor: colors.primary },
                                isActiveDelivery && isFocused && { backgroundColor: '#EF4444' },
                                { transform: [{ scale }] },
                            ]}
                        >
                            {renderIcon()}

                            {/* Notification Badge */}
                            {displayBadge && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}

                            {/* ✅ Active Delivery Indicator */}
                            {showDeliveryDot && (
                                <Animated.View
                                    style={[
                                        styles.activeDeliveryDot,
                                        deliveryPulseStyle,
                                        { backgroundColor: getDeliveryDotColor() }
                                    ]}
                                />
                            )}
                        </RNAnimated.View>

                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? colors.primary : colors.text,
                                    opacity: isFocused ? 1 : 0.6,
                                },
                                isActiveDelivery && isFocused && { color: '#EF4444' },
                            ]}
                        >
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        marginBottom: -5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 1000,
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        overflow: 'hidden',
        backgroundColor: '#FFF',
    },
    tabBarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 35,
        height: 35,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    label: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        marginTop: 4,
    },
    badgeContainer: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 5,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeDeliveryDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFF',
        zIndex: 5,
    },
});