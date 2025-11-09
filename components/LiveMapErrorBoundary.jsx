// 1️⃣ ADD: Import ErrorBoundary at the top
import React, { useState, useEffect, useRef, useMemo, Component } from 'react';

// 2️⃣ ADD: Map Error Boundary Component (before LiveTracking function)
class LiveMapErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🗺️ Map Error Caught:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Log to analytics/error tracking service
        // Sentry.captureException(error);
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.mapErrorContainer}>
                    <View style={styles.mapErrorCard}>
                        <Ionicons name="map-outline" size={48} color="#EF4444" />
                        <Text style={styles.mapErrorTitle}>Map Failed to Load</Text>
                        <Text style={styles.mapErrorMessage}>
                            {this.state.error?.message || 'An error occurred while loading the map'}
                        </Text>

                        <View style={styles.errorActions}>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={this.handleRetry}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryButtonText}>
                                    Retry {this.state.retryCount > 0 ? `(${this.state.retryCount})` : ''}
                                </Text>
                            </TouchableOpacity>

                            {this.state.retryCount >= 3 && (
                                <Text style={styles.contactSupport}>
                                    Still having issues? Contact support
                                </Text>
                            )}
                        </View>

                        {/* Show fallback coordinates */}
                        {this.props.fallbackData && (
                            <View style={styles.fallbackInfo}>
                                <Text style={styles.fallbackTitle}>Current Location:</Text>
                                <Text style={styles.fallbackText}>
                                    📍 Lat: {this.props.fallbackData.currentLocation?.lat.toFixed(4)}
                                </Text>
                                <Text style={styles.fallbackText}>
                                    📍 Lng: {this.props.fallbackData.currentLocation?.lng.toFixed(4)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

export default LiveMapErrorBoundary;