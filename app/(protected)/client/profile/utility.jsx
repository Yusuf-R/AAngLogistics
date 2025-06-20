import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from "@tanstack/react-query";
import SecureStorage from "../../../../lib/SecureStorage";
import SessionManager from "../../../../lib/SessionManager";
import { useSessionStore } from "../../../../store/useSessionStore";
import ClientUtils from "../../../../utils/ClientUtilities";
import SocketStatusMonitor from "../../../../components/Client/Security/Utility/SocketStatusMonitor";

const { width } = Dimensions.get('window');

const UtilityScreen = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [sessionSnapshot, setSessionSnapshot] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [operationInProgress, setOperationInProgress] = useState(null);

    // Zustand store
    const { user, token, role, onboarded } = useSessionStore();

    const dashboardMutation = useMutation({
        mutationKey: ['RefreshDashboard'],
        mutationFn: ClientUtils.Dashboard,
    });

    // Load session snapshot on mount
    useEffect(() => {
        loadSessionSnapshot();
    }, []);

    const loadSessionSnapshot = async () => {
        try {
            const snapshot = await SecureStorage.getSessionSnapshot();
            setSessionSnapshot(snapshot);
        } catch (error) {
            console.error('[Utility] Failed to load session snapshot:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSessionSnapshot();
        setRefreshing(false);
    };

    // Utility operations
    const utilityOperations = [
        {
            id: 'clearAccessToken',
            title: 'Clear Access Token',
            subtitle: 'Remove only access token & expiry',
            icon: 'key-outline',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            borderColor: '#F59E0B',
            action: async () => {
                await SecureStorage.clearAccessTokensOnly();
                useSessionStore.getState().setToken(null);
                return 'Access token cleared successfully';
            }
        },
        {
            id: 'clearRefreshToken',
            title: 'Clear Refresh Token',
            subtitle: 'Remove refresh token only',
            icon: 'refresh-outline',
            color: '#8B5CF6',
            bgColor: '#EDE9FE',
            borderColor: '#8B5CF6',
            action: async () => {
                await SecureStorage.deleteItemAsync('refreshToken');
                useSessionStore.getState().setRefToken(null);
                return 'Refresh token cleared successfully';
            }
        },
        {
            id: 'clearUserData',
            title: 'Clear User Data',
            subtitle: 'Remove user profile information',
            icon: 'person-outline',
            color: '#06B6D4',
            bgColor: '#CFFAFE',
            borderColor: '#06B6D4',
            action: async () => {
                await SecureStorage.deleteItemAsync('userData');
                useSessionStore.getState().setUser(null);
                return 'User data cleared successfully';
            }
        },
        {
            id: 'clearRole',
            title: 'Clear Role',
            subtitle: 'Remove user role (client/driver)',
            icon: 'shield-outline',
            color: '#10B981',
            bgColor: '#D1FAE5',
            borderColor: '#10B981',
            action: async () => {
                await SecureStorage.clearRole();
                useSessionStore.getState().setRole(null);
                return 'Role cleared successfully';
            }
        },
        {
            id: 'clearOnboarding',
            title: 'Reset Onboarding',
            subtitle: 'Mark user as not onboarded',
            icon: 'flag-outline',
            color: '#F97316',
            bgColor: '#FED7AA',
            borderColor: '#F97316',
            action: async () => {
                await SecureStorage.saveOnboardingStatus(false);
                useSessionStore.getState().setOnboarded(false);
                return 'Onboarding status reset successfully';
            }
        },
        {
            id: 'expireSession',
            title: 'Expire Session Only',
            subtitle: 'Expire tokens but keep identity',
            icon: 'time-outline',
            color: '#EF4444',
            bgColor: '#FEE2E2',
            borderColor: '#EF4444',
            action: async () => {
                await SessionManager.expireSessionOnly();
                return 'Session expired, identity preserved';
            }
        },
        {
            id: 'clearSessionOnly',
            title: 'Clear Session Data',
            subtitle: 'Remove tokens & user data only',
            icon: 'log-out-outline',
            color: '#DC2626',
            bgColor: '#FEE2E2',
            borderColor: '#DC2626',
            action: async () => {
                await SecureStorage.clearSessionOnly();
                useSessionStore.getState().clearSession();
                return 'Session data cleared successfully';
            }
        },
        {
            id: 'clearAll',
            title: 'Nuclear Reset',
            subtitle: 'Clear everything (use with caution)',
            icon: 'nuclear-outline',
            color: '#7C2D12',
            bgColor: '#FED7D7',
            borderColor: '#DC2626',
            action: async () => {
                await SecureStorage.clearAll();
                useSessionStore.getState().clearSession();
                return 'Complete reset performed';
            }
        }
    ];

    const handleOperation = async (operation) => {
        Alert.alert(
            `Confirm ${operation.title}`,
            `Are you sure you want to ${operation.title.toLowerCase()}?\n\n${operation.subtitle}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        setOperationInProgress(operation.id);
                        try {
                            const message = await operation.action();
                            setStatus(message);
                            await loadSessionSnapshot(); // Refresh snapshot
                        } catch (error) {
                            setStatus(`Failed: ${error.message}`);
                        } finally {
                            setOperationInProgress(null);
                        }
                    }
                }
            ]
        );
    };

    const handleRefreshDashboard = async () => {
        setLoading(true);
        setStatus('Fetching fresh dashboard data...');

        try {
            // Get current session to ensure we have a token
            const session = await SessionManager.getCurrentSession();

            if (!session.token) {
                setStatus('❌ No access token available. Please login first.');
                setLoading(false);
                return;
            }

            dashboardMutation.mutate(undefined, {
                onSuccess: async (respData) => {
                    const { user: freshUser } = respData;

                    // Update session with fresh user data
                    await SessionManager.updateUser(freshUser);
                    await loadSessionSnapshot();

                    setStatus(`✅ Dashboard refreshed successfully!\nUser: ${freshUser.name || freshUser.email}`);
                },
                onError: async (error) => {
                    console.error('[Utility] Dashboard refresh failed:', error);
                    setStatus(`❌ Dashboard refresh failed: ${error.message}`);
                },
                onSettled: () => {
                    setLoading(false);
                }
            });
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`);
            setLoading(false);
        }
    };

    const handleNavigateToRoute = () => {
        Alert.alert(
            'Navigate Based on Session',
            'This will resolve and navigate to the appropriate route based on current session state.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Navigate',
                    onPress: async () => {
                        try {
                            await SessionManager.check();
                        } catch (error) {
                            setStatus(`Navigation failed: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    const renderSessionInfo = () => (
        <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
                <Ionicons name="information-circle" size={24} color="#2563EB" />
                <Text style={styles.sessionTitle}>Current Session State</Text>
            </View>

            <View style={styles.sessionGrid}>
                <View style={styles.sessionItem}>
                    <Text style={styles.sessionLabel}>Zustand State</Text>
                    <View style={styles.sessionValues}>
                        <Text style={[styles.sessionValue, { color: token ? '#10B981' : '#EF4444' }]}>
                            Token: {token ? '✓' : '✗'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: user ? '#10B981' : '#EF4444' }]}>
                            User: {user ? '✓' : '✗'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: role ? '#10B981' : '#EF4444' }]}>
                            Role: {role || 'None'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: onboarded ? '#10B981' : '#F59E0B' }]}>
                            Onboarded: {onboarded ? '✓' : '✗'}
                        </Text>
                    </View>
                </View>

                <View style={styles.sessionItem}>
                    <Text style={styles.sessionLabel}>SecureStore Data</Text>
                    <View style={styles.sessionValues}>
                        <Text style={[styles.sessionValue, { color: sessionSnapshot.access ? '#10B981' : '#EF4444' }]}>
                            Access: {sessionSnapshot.access ? '✓' : '✗'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: sessionSnapshot.refresh ? '#10B981' : '#EF4444' }]}>
                            Refresh: {sessionSnapshot.refresh ? '✓' : '✗'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: sessionSnapshot.role ? '#10B981' : '#EF4444' }]}>
                            Role: {sessionSnapshot.role || 'None'}
                        </Text>
                        <Text style={[styles.sessionValue, { color: sessionSnapshot.onboarded ? '#10B981' : '#F59E0B' }]}>
                            Onboarded: {sessionSnapshot.onboarded ? '✓' : '✗'}
                        </Text>
                    </View>
                </View>
            </View>

            {sessionSnapshot.expiry && (
                <View style={styles.expiryInfo}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.expiryText}>
                        Token Expires: {new Date(sessionSnapshot.expiry).toLocaleString()}
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Session Information */}
                {renderSessionInfo()}

                {/* Dashboard Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.cardTitle}>Dashboard Actions</Text>

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.disabledButton]}
                        onPress={handleRefreshDashboard}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="refresh-circle" size={24} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Refresh Dashboard Data</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleNavigateToRoute}
                    >
                        <Ionicons name="navigate-circle" size={24} color="#2563EB" />
                        <Text style={styles.secondaryButtonText}>Auto-Navigate by Session</Text>
                    </TouchableOpacity>
                </View>

                {/* Utility Operations */}
                <View style={styles.operationsCard}>
                    <Text style={styles.cardTitle}>Session Management</Text>
                    <Text style={styles.cardSubtitle}>Use these tools to test different session states</Text>

                    {utilityOperations.map((operation) => (
                        <TouchableOpacity
                            key={operation.id}
                            style={[
                                styles.operationButton,
                                {
                                    backgroundColor: operation.bgColor,
                                    borderColor: operation.borderColor,
                                }
                            ]}
                            onPress={() => handleOperation(operation)}
                            disabled={operationInProgress === operation.id}
                        >
                            <View style={styles.operationLeft}>
                                <View style={[styles.operationIcon, { backgroundColor: operation.color }]}>
                                    {operationInProgress === operation.id ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name={operation.icon} size={20} color="#FFFFFF" />
                                    )}
                                </View>
                                <View style={styles.operationText}>
                                    <Text style={[styles.operationTitle, { color: operation.color }]}>
                                        {operation.title}
                                    </Text>
                                    <Text style={styles.operationSubtitle}>{operation.subtitle}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={operation.color} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Status Display */}
                {status ? (
                    <View style={styles.statusCard}>
                        <View style={styles.statusHeader}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.statusTitle}>Last Operation</Text>
                        </View>
                        <Text style={styles.statusText}>{status}</Text>
                        <TouchableOpacity
                            style={styles.clearStatusButton}
                            onPress={() => setStatus('')}
                        >
                            <Text style={styles.clearStatusText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.bottomSpacing} />

                <SocketStatusMonitor />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    scrollView: {
        flex: 1,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 12,
    },
    sessionGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    sessionItem: {
        flex: 1,
    },
    sessionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    sessionValues: {
        gap: 4,
    },
    sessionValue: {
        fontSize: 13,
        fontWeight: '500',
    },
    expiryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    expiryText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
    },
    actionsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    operationsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    secondaryButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
    operationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    operationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    operationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    operationText: {
        flex: 1,
    },
    operationTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    operationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusCard: {
        backgroundColor: '#F0FDF4',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#166534',
        marginLeft: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#166534',
        lineHeight: 20,
        marginBottom: 12,
    },
    clearStatusButton: {
        alignSelf: 'flex-end',
    },
    clearStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    bottomSpacing: {
        height: 20,
    },
});

export default UtilityScreen;