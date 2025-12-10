import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Pressable } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import {Ionicons, AntDesign, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import {useNotificationStore} from "../store/useNotificationStore";

export function TabBar({ state, descriptors, navigation }) {
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

    const icons = {
        dashboard: {
            outline: 'home-outline',
            filled: 'home-sharp',
        },
        profile: {
            outline: 'person-outline',
            filled: 'person-sharp',
        },
        notifications: {
            outline: 'notifications-outline',
            filled: 'notifications-sharp',
        },
        orders: {
            outline: <FontAwesome6 name="boxes-stacked" size={24} color="blue" />,
            filled: <FontAwesome5 name="box-open" size={24} color="black" />
        },
        finance: {
            outline: 'wallet-outline',
            filled: 'wallet',
        },
    };

    const labels = {
        dashboard: 'Home',
        profile: 'Profile',
        orders: 'Orders',
        finance: 'Finance',
        notifications: '',
    };



    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const scale = animatedValues[index].interpolate({
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

                const iconName = isFocused
                    ? icons[route.name].filled
                    : icons[route.name].outline;

                const showBadge = route.name === 'notifications' && unreadCount > 0;

                return (
                    <Pressable
                        key={index}
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
                            {typeof iconName === 'string' ? (
                                <Ionicons
                                    name={iconName}
                                    size={22}
                                    color={isFocused ? '#FFF' : colors.text}
                                />
                            ) : (
                                React.cloneElement(iconName, {
                                    color: isFocused ? '#FFF' : colors.text
                                })
                            )}
                            {showBadge && (
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
                            {labels[route.name]}
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
        marginBottom: -15,
        borderRadius: 70,
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
    },
    label: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
    },
    badgeContainer: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#EF4444',
        borderRadius: 38,
        paddingHorizontal: 4,
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
