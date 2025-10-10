// components/Driver/TabNavigation/TabNavigation.jsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Ionicons, AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { useNotificationStore } from "../../../store/useNotificationStore";

export function TabNavigation({ state, descriptors, navigation }) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();
    const [previousIndex, setPreviousIndex] = useState(state.index);
    const unreadCount = useNotificationStore(state => state.stats?.unread || 0);

    // Animation values
    const animatedValues = useRef(
        state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
    ).current;

    useEffect(() => {
        if (previousIndex !== state.index) {
            Animated.spring(animatedValues[previousIndex], {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();

            Animated.spring(animatedValues[state.index], {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start();

            setPreviousIndex(state.index);
        }
    }, [state.index]);

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
            label: 'Discover',
            iconOutline: 'cube-outline',
            iconFilled: 'cube',
            customIcon: true,
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

    // ✅ Create ordered route mapping
    const orderedRoutes = tabConfig.map(config => {
        const route = state.routes.find(r => r.name === config.name);
        const routeIndex = state.routes.findIndex(r => r.name === config.name);
        return { ...config, route, routeIndex };
    }).filter(item => item.route);

    return (
        <View style={styles.tabBar}>
            {orderedRoutes.map(({ name, label, iconOutline, iconFilled, showBadge, customIcon, route, routeIndex }) => {
                const isFocused = state.index === routeIndex;
                const scale = animatedValues[routeIndex].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                });

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const renderIcon = () => {
                    const iconName = isFocused ? iconFilled : iconOutline;
                    const iconColor = isFocused ? '#FFF' : colors.text;

                    if (customIcon && name === 'orders') {
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

                return (
                    <Pressable
                        key={name}
                        href={buildHref(route.name, route.params)}
                        onPress={onPress}
                        style={styles.tabBarItem}
                        android_ripple={null}
                    >
                        <Animated.View
                            style={[
                                styles.iconContainer,
                                isFocused && { backgroundColor: colors.primary },
                                { transform: [{ scale }] },
                            ]}
                        >
                            {renderIcon()}

                            {displayBadge && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>

                        <Text
                            style={[
                                styles.label,
                                {
                                    color: isFocused ? colors.primary : colors.text,
                                    opacity: isFocused ? 1 : 0.6,
                                },
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
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});