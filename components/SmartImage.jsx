// components/Common/SmartImage.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SmartImage = ({
                        source,
                        style,
                        onPress,
                        resizeMode = 'cover',
                        maxRetries = 2,
                        retryDelay = 1000
                    }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (!hasError) {
            setIsLoading(true);
            setHasError(false);
        }
    }, [source?.uri]);

    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
    };

    const handleLoadEnd = () => {
        setIsLoading(false);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleError = () => {
        setIsLoading(false);

        if (retryCount < maxRetries) {
            // Auto-retry after delay
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setHasError(false);
                setIsLoading(true);
            }, retryDelay);
        } else {
            setHasError(true);
        }
    };

    const handleRetry = () => {
        setRetryCount(0);
        setHasError(false);
        setIsLoading(true);
    };

    const ImageContent = onPress ? TouchableOpacity : View;

    return (
        <ImageContent
            style={[styles.container, style]}
            onPress={onPress}
            disabled={!onPress || isLoading}
        >
            {/* Loading State */}
            {isLoading && (
                <View style={[styles.loadingContainer, style]}>
                    <ActivityIndicator size="small" color="#4A90E2" />
                </View>
            )}

            {/* Error State */}
            {hasError && (
                <View style={[styles.errorContainer, style]}>
                    <Ionicons name="image-outline" size={32} color="#9E9E9E" />
                    <Ionicons
                        name="refresh"
                        size={20}
                        color="#4A90E2"
                        style={styles.retryIcon}
                        onPress={handleRetry}
                    />
                </View>
            )}

            {/* Actual Image */}
            {!hasError && (
                <Animated.Image
                    source={source}
                    style={[
                        styles.image,
                        style,
                        { opacity: fadeAnim }
                    ]}
                    resizeMode={resizeMode}
                    onLoadStart={handleLoadStart}
                    onLoadEnd={handleLoadEnd}
                    onError={handleError}
                />
            )}
        </ImageContent>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        zIndex: 2,
    },
    retryIcon: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 4,
        borderRadius: 12,
    },
});

export default SmartImage;