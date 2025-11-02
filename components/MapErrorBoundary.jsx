import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error, errorInfo) {
        console.log('Map Error Boundary:', error, errorInfo);
        // You can also log to your error reporting service here
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <Ionicons name="map-outline" size={64} color="#6366F1" />
                        <Text style={styles.errorTitle}>Map Unavailable</Text>
                        <Text style={styles.errorMessage}>
                            {this.props.customMessage || 'The map is temporarily unavailable. Please try again.'}
                        </Text>

                        {this.state.error && __DEV__ && (
                            <Text style={styles.errorDebug}>
                                Error: {this.state.error.message}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={this.handleRetry}
                        >
                            <Ionicons name="refresh" size={20} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>Reload Map</Text>
                        </TouchableOpacity>

                        {this.props.showAlternative && this.props.alternativeComponent}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorContent: {
        alignItems: 'center',
        maxWidth: 300,
    },
    errorTitle: {
        fontSize: 24,
        fontFamily: 'PoppinsSemiBold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    errorDebug: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
    },
});

export default MapErrorBoundary;