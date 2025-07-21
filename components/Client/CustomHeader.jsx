import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const CustomHeader = ({title, onBackPress}) => {
    const insets = useSafeAreaInsets();

    return (
        <>
            <View style={[styles.headerContainer, {paddingTop: insets.top}]}>
                {/* Status bar area - this creates space for the camera/dynamic island */}
                <View style={styles.statusBarSpacer}/>

                {/* Main header content */}
                <View style={styles.headerContent}>
                    <View style={styles.leftContainer}>
                        <Pressable onPress={onBackPress} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={22} color="#007AFF"/>
                        </Pressable>
                    </View>

                    <View style={styles.centerContainer}>
                        <Text style={styles.headerText}>{title}</Text>
                    </View>

                    <View style={styles.rightContainer}>
                        {/* Empty space for symmetry */}
                    </View>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#ffffff',
    },
    statusBarSpacer: {
        height: 8, // Creates space below the status bar/dynamic island
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 56,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerContainer: {
        flex: 2,
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: 2,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        margin: 4,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 17,
        fontFamily: 'PoppinsSemiBold',
        color: '#000000',
        textAlign: 'center',
    },
});

export default CustomHeader;