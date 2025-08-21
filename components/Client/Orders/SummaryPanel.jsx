// components/order/SummaryPanel.jsx - STUNNING REDESIGN 🚀
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SummaryPanel({
                                         pickupData,
                                         dropoffData,
                                         pickupComplete,
                                         dropoffComplete,
                                         onSwitchToPickup,
                                         onSwitchToDropoff
                                     }) {

    const [pulseAnim] = useState(new Animated.Value(1));
    const [slideAnim] = useState(new Animated.Value(50));
    const [routeProgress] = useState(new Animated.Value(0));

    const safePickupData = pickupData || {};
    const safeDropoffData = dropoffData || {};

    // Entrance animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(routeProgress, {
                toValue: pickupComplete && dropoffComplete ? 1 : 0,
                duration: 1200,
                useNativeDriver: false,
            })
        ]).start();

        // Pulse animation for incomplete sections
        if (!pickupComplete || !dropoffComplete) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        }
    }, [pickupComplete, dropoffComplete]);

    const getStatusConfig = () => {
        if (pickupComplete && dropoffComplete) {
            return {
                gradient: ['#667eea', '#764ba2', '#f093fb'],
                title: '🎉 Ready to Ship!',
                subtitle: 'Your delivery is all set up',
                emoji: '✨',
                bgPattern: 'celebration'
            };
        } else if (pickupComplete || dropoffComplete) {
            return {
                gradient: ['#ffecd2', '#fcb69f', '#ff9a9e'],
                title: '🔥 Almost There!',
                subtitle: 'Just one more location to complete',
                emoji: '⚡',
                bgPattern: 'progress'
            };
        } else {
            return {
                gradient: ['#a8edea', '#fed6e3', '#d299c2'],
                title: '🌟 Let\'s Get Started',
                subtitle: 'Set up your pickup and dropoff locations',
                emoji: '🚀',
                bgPattern: 'start'
            };
        }
    };

    const config = getStatusConfig();

    const calculateDistance = () => {
        if (!pickupComplete || !dropoffComplete) return null;

        const pickupCoords = safePickupData.coordinates?.coordinates || [];
        const dropoffCoords = safeDropoffData.coordinates?.coordinates || [];

        if (pickupCoords.length !== 2 || dropoffCoords.length !== 2) return null;

        // Haversine formula
        const R = 6371;
        const [lon1, lat1] = pickupCoords;
        const [lon2, lat2] = dropoffCoords;

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
            distance: distance.toFixed(1),
            time: Math.ceil(distance * 3.5 + 10), // More realistic time
            baseFare: 1200,
            distanceFare: distance * 85,
            totalFare: 1200 + (distance * 85)
        };
    };

    const routeInfo = calculateDistance();

    const renderHeroSection = () => (
        <Animated.View style={[styles.heroContainer, { transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
            >
                <View style={styles.heroContent}>
                    <Text style={styles.heroEmoji}>{config.emoji}</Text>
                    <Text style={styles.heroTitle}>{config.title}</Text>
                    <Text style={styles.heroSubtitle}>{config.subtitle}</Text>

                    {/* Progress Orbs */}
                    <View style={styles.progressOrbs}>
                        <View style={[
                            styles.progressOrb,
                            pickupComplete && styles.progressOrbComplete
                        ]}>
                            <Ionicons
                                name={pickupComplete ? "checkmark" : "location"}
                                size={20}
                                color={pickupComplete ? "#fff" : "#999"}
                            />
                        </View>

                        <View style={styles.progressLine}>
                            <Animated.View style={[
                                styles.progressLineActive,
                                {
                                    width: routeProgress.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]} />
                        </View>

                        <View style={[
                            styles.progressOrb,
                            dropoffComplete && styles.progressOrbComplete
                        ]}>
                            <Ionicons
                                name={dropoffComplete ? "checkmark" : "location"}
                                size={20}
                                color={dropoffComplete ? "#fff" : "#999"}
                            />
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    const renderLocationBubble = (
        type,
        data,
        isComplete,
        onEdit,
        position = 'left'
    ) => {
        const colors = type === 'pickup'
            ? ['#4facfe', '#00f2fe']
            : ['#fa709a', '#fee140'];

        const icon = type === 'pickup' ? 'arrow-up-circle' : 'arrow-down-circle';

        if (!isComplete) {
            return (
                <Animated.View
                    style={[
                        styles.locationBubble,
                        styles.locationBubbleIncomplete,
                        position === 'right' && styles.locationBubbleRight,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    <Pressable onPress={onEdit} style={styles.bubbleContent}>
                        <View style={styles.bubbleIconContainer}>
                            <LinearGradient colors={['#ffeaa7', '#fab1a0']} style={styles.bubbleIcon}>
                                <Ionicons name="add-circle" size={24} color="#fff" />
                            </LinearGradient>
                        </View>
                        <View style={styles.bubbleTextContainer}>
                            <Text style={styles.bubbleTitle}>
                                {type === 'pickup' ? '📍 Add Pickup' : '🎯 Add Dropoff'}
                            </Text>
                            <Text style={styles.bubbleSubtitle}>Tap to set location</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ddd" />
                    </Pressable>
                </Animated.View>
            );
        }

        return (
            <View style={[
                styles.locationBubble,
                position === 'right' && styles.locationBubbleRight
            ]}>
                <LinearGradient colors={colors} style={styles.bubbleGradient}>
                    <View style={styles.completeBubbleContent}>
                        <View style={styles.bubbleHeader}>
                            <Ionicons name={icon} size={20} color="#fff" />
                            <Text style={styles.bubbleCompleteTitle}>
                                {type === 'pickup' ? 'Pickup Ready' : 'Dropoff Set'}
                            </Text>
                            <Pressable onPress={onEdit} style={styles.editButton}>
                                <Ionicons name="pencil" size={14} color="#fff" />
                            </Pressable>
                        </View>

                        <Text style={styles.bubbleAddress} numberOfLines={2}>
                            {data?.address || 'No address'}
                        </Text>

                        <View style={styles.bubbleDetails}>
                            <View style={styles.bubbleDetailRow}>
                                <Ionicons name="person" size={12} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.bubbleDetailText}>
                                    {data?.contactPerson?.name || 'No contact'}
                                </Text>
                            </View>
                            <View style={styles.bubbleDetailRow}>
                                <Ionicons name="call" size={12} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.bubbleDetailText}>
                                    {data?.contactPerson?.phone || 'No phone'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const renderRouteCard = () => {
        if (!pickupComplete || !dropoffComplete || !routeInfo) {
            return (
                <View style={styles.routeCardEmpty}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.routeEmptyGradient}
                    >
                        <Ionicons name="map-outline" size={48} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.routeEmptyTitle}>Complete Both Locations</Text>
                        <Text style={styles.routeEmptySubtitle}>
                            To see your awesome route preview!
                        </Text>
                    </LinearGradient>
                </View>
            );
        }

        return (
            <View style={styles.routeCard}>
                <LinearGradient
                    colors={['#667eea', '#764ba2', '#f093fb']}
                    style={styles.routeCardGradient}
                >
                    <View style={styles.routeHeader}>
                        <Text style={styles.routeTitle}>🗺️ Your Delivery Route</Text>
                        <View style={styles.routeStats}>
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatNumber}>{routeInfo.distance}</Text>
                                <Text style={styles.routeStatLabel}>km</Text>
                            </View>
                            <View style={styles.routeStatDivider} />
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatNumber}>{routeInfo.time}</Text>
                                <Text style={styles.routeStatLabel}>min</Text>
                            </View>
                            <View style={styles.routeStatDivider} />
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatNumber}>₦{Math.round(routeInfo.totalFare)}</Text>
                                <Text style={styles.routeStatLabel}>total</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.routeVisualization}>
                        {/* Animated Route Line */}
                        <View style={styles.routePath}>
                            <View style={styles.routeStartPoint}>
                                <LinearGradient colors={['#00f2fe', '#4facfe']} style={styles.routePoint}>
                                    <Ionicons name="radio-button-on" size={16} color="#fff" />
                                </LinearGradient>
                            </View>

                            <View style={styles.routeLineContainer}>
                                <View style={styles.routeLineBackground} />
                                <Animated.View style={[
                                    styles.routeLineAnimated,
                                    {
                                        width: routeProgress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        })
                                    }
                                ]} />

                                {/* Moving Vehicle */}
                                <Animated.View style={[
                                    styles.routeVehicle,
                                    {
                                        left: routeProgress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '95%']
                                        })
                                    }
                                ]}>
                                    <LinearGradient colors={['#ffecd2', '#fcb69f']} style={styles.vehicleContainer}>
                                        <Ionicons name="bicycle" size={16} color="#fff" />
                                    </LinearGradient>
                                </Animated.View>
                            </View>

                            <View style={styles.routeEndPoint}>
                                <LinearGradient colors={['#fee140', '#fa709a']} style={styles.routePoint}>
                                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                </LinearGradient>
                            </View>
                        </View>
                    </View>

                    {/* Cost Breakdown */}
                    <View style={styles.costSection}>
                        <Text style={styles.costTitle}>💰 Cost Breakdown</Text>
                        <View style={styles.costBreakdown}>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Base fare</Text>
                                <Text style={styles.costValue}>₦{routeInfo.baseFare}</Text>
                            </View>
                            <View style={styles.costRow}>
                                <Text style={styles.costLabel}>Distance</Text>
                                <Text style={styles.costValue}>₦{Math.round(routeInfo.distanceFare)}</Text>
                            </View>
                            <View style={styles.costRowTotal}>
                                <Text style={styles.costTotalLabel}>Total</Text>
                                <Text style={styles.costTotalValue}>₦{Math.round(routeInfo.totalFare)}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
        >
            {renderHeroSection()}

            <View style={styles.locationsSection}>
                {renderLocationBubble('pickup', safePickupData, pickupComplete, onSwitchToPickup, 'left')}
                {renderLocationBubble('dropoff', safeDropoffData, dropoffComplete, onSwitchToDropoff, 'right')}
            </View>

            {renderRouteCard()}

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    contentContainer: {
        paddingBottom: 100,
    },

    // Hero Section
    heroContainer: {
        margin: 16,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    heroGradient: {
        padding: 24,
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
    },
    heroEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 24,
    },

    // Progress Orbs
    progressOrbs: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    progressOrb: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    progressOrbComplete: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        transform: [{ scale: 1.1 }],
    },
    progressLine: {
        width: 60,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    progressLineActive: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },

    // Location Bubbles
    locationsSection: {
        paddingHorizontal: 16,
        marginVertical: 20,
    },
    locationBubble: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    locationBubbleRight: {
        alignSelf: 'flex-end',
        maxWidth: '85%',
    },
    locationBubbleIncomplete: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#f1f3f4',
        borderStyle: 'dashed',
    },
    bubbleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    bubbleIconContainer: {
        marginRight: 12,
    },
    bubbleIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubbleTextContainer: {
        flex: 1,
    },
    bubbleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    bubbleSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },

    // Complete Bubbles
    bubbleGradient: {
        padding: 16,
    },
    completeBubbleContent: {},
    bubbleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bubbleCompleteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
        flex: 1,
    },
    editButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubbleAddress: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
        marginBottom: 8,
        lineHeight: 20,
    },
    bubbleDetails: {
        gap: 4,
    },
    bubbleDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bubbleDetailText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },

    // Route Card
    routeCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        marginBottom: 20,
    },
    routeCardEmpty: {
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
    },
    routeEmptyGradient: {
        padding: 40,
        alignItems: 'center',
    },
    routeEmptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    routeEmptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    routeCardGradient: {
        padding: 20,
    },
    routeHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    routeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    routeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
    },
    routeStat: {
        alignItems: 'center',
    },
    routeStatNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    routeStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    routeStatDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // Route Visualization
    routeVisualization: {
        marginVertical: 16,
    },
    routePath: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    routeStartPoint: {},
    routeEndPoint: {},
    routePoint: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeLineContainer: {
        flex: 1,
        height: 4,
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        position: 'relative',
    },
    routeLineBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 2,
    },
    routeLineAnimated: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    routeVehicle: {
        position: 'absolute',
        top: -12,
    },
    vehicleContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Cost Section
    costSection: {
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
    },
    costTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    costBreakdown: {},
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    costLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    costValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    costRowTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        marginTop: 8,
    },
    costTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    costTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },

    bottomSpacer: {
        height: 40,
    },
});