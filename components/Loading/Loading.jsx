// components/Loading/Loading.jsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import LottieView from 'lottie-react-native';

// const loaderAnim = require('@/assets/animations/loader/spin-loader.json');
const loaderAnim = require('@/assets/animations/loader/spin-loader.json');

const Loading = ({ message = 'Loading...', fullscreen = true }) => {
    return (
        <View style={[styles.container, fullscreen && styles.fullscreen]}>
            <LottieView
                source={loaderAnim}
                autoPlay
                loop
                style={styles.lottie}
            />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    fullscreen: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 90,
        height: 90,
    },
    message: {
        marginTop: 12,
        fontSize: 16,
        color: '#374151',
        fontFamily: 'PoppinsSemiBold',
        textAlign: 'center'
    }
});

export default Loading;
