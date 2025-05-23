import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Pressable } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export function TabBar({ state, descriptors, navigation }) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();
    const [previousIndex, setPreviousIndex] = useState(state.index);

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
        orders: {
            outline: 'clipboard-outline',
            filled: 'clipboard',
        },
        wallet: {
            outline: 'wallet-outline',
            filled: 'wallet',
        },
    };

    const labels = {
        dashboard: 'Home',
        profile: 'Profile',
        orders: 'Orders',
        wallet: 'Wallet',
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
                                isFocused && {
                                    backgroundColor: colors.primary,
                                },
                                { transform: [{ scale }] },
                            ]}
                        >
                            <Ionicons
                                name={iconName}
                                size={22}
                                color={isFocused ? '#FFF' : colors.text}
                            />
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
        backgroundColor: '#FFFFFF',
        marginHorizontal: 50,
        marginBottom: 10,
        paddingVertical: 10,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
    },
});
