// components/Client/Account/Analytics/DeliveryDetails.jsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    Modal,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from "../../../CustomHeader";
import SmartImage from "../../../SmartImage";
import { router } from "expo-router";

const { width } = Dimensions.get('window');

const DeliveryDetails = ({ delivery, refetch }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [expandedSection, setExpandedSection] = useState({
        tracking: true,
        package: false,
        location: false,
        payment: false
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch?.();
        setRefreshing(false);
    };

    const toggleSection = (section) => {
        setExpandedSection(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const formatCurrency = (amount) => `₦${(amount || 0).toLocaleString()}`;
    const formatDistance = (km) => `${(km || 0).toFixed(2)} km`;
    const formatDuration = (minutes) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: '#9E9E9E',
            delivered: '#4CAF50',
            cancelled: '#F44336',
            'en_route_pickup': '#FF9800',
            'en_route_dropoff': '#2196F3',
            'picked_up': '#9C27B0'
        };
        return colors[status] || '#9E9E9E';
    };

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Draft',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            'en_route_pickup': 'En Route to Pickup',
            'en_route_dropoff': 'En Route to Dropoff',
            'picked_up': 'Package Picked Up'
        };
        return labels[status] || status;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            laptop: 'laptop',
            document: 'document-text',
            food: 'fast-food',
            electronics: 'hardware-chip',
            clothing: 'shirt',
            furniture: 'cube',
            medicine: 'medical',
            gift: 'gift',
            other: 'cube-outline'
        };
        return icons[category] || 'cube-outline';
    };

    if (!delivery) {
        return (
            <>
                <CustomHeader title="Delivery Details" onBackPress={() => router.back()} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
                    <Text style={styles.errorText}>Delivery not found</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <CustomHeader title="Delivery Details" onBackPress={() => router.back()} />

            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* STATUS HEADER */}
                <View style={[styles.statusHeader, { backgroundColor: getStatusColor(delivery.status) }]}>
                    <View style={styles.statusContent}>
                        <Text style={styles.orderRef}>{delivery.orderRef}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{getStatusLabel(delivery.status)}</Text>
                        </View>
                    </View>

                    <View style={styles.earningsDisplay}>
                        <Text style={styles.earningsLabel}>Payment</Text>
                        <Text style={styles.earningsAmount}>{formatCurrency(delivery.pricing?.totalAmount || 0)}</Text>
                    </View>
                </View>

                {/* QUICK INFO CARDS */}
                <View style={styles.quickInfoSection}>
                    <View style={styles.quickInfoRow}>
                        <View style={styles.quickInfoCard}>
                            <Ionicons name="speedometer" size={24} color="#FF9800" />
                            <Text style={styles.quickInfoValue}>{formatDistance(delivery.driverAssignment?.distance?.total)}</Text>
                            <Text style={styles.quickInfoLabel}>Distance</Text>
                        </View>

                        <View style={styles.quickInfoCard}>
                            <Ionicons name="time" size={24} color="#2196F3" />
                            <Text style={styles.quickInfoValue}>{formatDuration(delivery.driverAssignment?.duration?.actual)}</Text>
                            <Text style={styles.quickInfoLabel}>Duration</Text>
                        </View>

                        {delivery.rating?.clientRating?.stars && (
                            <View style={styles.quickInfoCard}>
                                <Ionicons name="star" size={24} color="#FFC107" />
                                <Text style={styles.quickInfoValue}>{delivery.rating.clientRating.stars}.0</Text>
                                <Text style={styles.quickInfoLabel}>Rating</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* DELIVERY TIMELINE */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('tracking')}
                    >
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="time-outline" size={20} color="#4CAF50" />
                            <Text style={styles.sectionTitle}>Delivery Timeline</Text>
                        </View>
                        <Ionicons
                            name={expandedSection.tracking ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection.tracking && (
                        <View style={styles.sectionContent}>
                            {delivery.orderTrackingHistory?.map((track, index) => (
                                <View key={track._id} style={styles.timelineItem}>
                                    <View style={styles.timelineDot}>
                                        <View style={[
                                            styles.dot,
                                            { backgroundColor: track.isCompleted ? '#4CAF50' : '#E0E0E0' }
                                        ]} />
                                        {index < delivery.orderTrackingHistory.length - 1 && (
                                            <View style={styles.timelineLine} />
                                        )}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <View style={styles.timelineHeader}>
                                            <Text style={styles.timelineTitle}>{track.title}</Text>
                                            <Text style={styles.timelineTime}>
                                                {new Date(track.timestamp).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Text>
                                        </View>
                                        <Text style={styles.timelineDescription}>{track.description}</Text>
                                        {track.metadata?.proof?.url && (
                                            <TouchableOpacity
                                                style={styles.proofButton}
                                                onPress={() => openImageModal(track.metadata.proof.url)}
                                            >
                                                <SmartImage
                                                    source={{ uri: track.metadata.proof.url }}
                                                    style={styles.proofThumbnail}
                                                    resizeMode="cover"
                                                    maxRetries={1}
                                                />
                                                <Ionicons name="image" size={16} color="#4CAF50" />
                                                <Text style={styles.proofButtonText}>View Proof</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* PACKAGE DETAILS */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('package')}
                    >
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name={getCategoryIcon(delivery.package?.category)} size={20} color="#2196F3" />
                            <Text style={styles.sectionTitle}>Package Details</Text>
                        </View>
                        <Ionicons
                            name={expandedSection.package ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection.package && (
                        <View style={styles.sectionContent}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Category</Text>
                                <Text style={styles.detailValue}>
                                    {delivery.package?.category?.toUpperCase() || 'N/A'}
                                </Text>
                            </View>

                            {delivery.package?.description && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Description</Text>
                                    <Text style={styles.detailValue}>{delivery.package.description}</Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Weight</Text>
                                <Text style={styles.detailValue}>
                                    {delivery.package?.weight?.value} {delivery.package?.weight?.unit || 'kg'}
                                </Text>
                            </View>

                            {delivery.package?.dimensions && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Dimensions</Text>
                                    <Text style={styles.detailValue}>
                                        {delivery.package.dimensions.length} × {delivery.package.dimensions.width} × {delivery.package.dimensions.height} {delivery.package.dimensions.unit}
                                    </Text>
                                </View>
                            )}

                            {delivery.package?.isFragile && (
                                <View style={styles.warningBadge}>
                                    <Ionicons name="warning" size={16} color="#FF9800" />
                                    <Text style={styles.warningText}>Fragile Item</Text>
                                </View>
                            )}

                            {delivery.package?.requiresSpecialHandling && (
                                <View style={styles.warningBadge}>
                                    <Ionicons name="hand-left" size={16} color="#9C27B0" />
                                    <Text style={styles.warningText}>Special Handling Required</Text>
                                </View>
                            )}

                            {delivery.package?.specialInstructions && (
                                <View style={styles.instructionsBox}>
                                    <Text style={styles.instructionsTitle}>Special Instructions:</Text>
                                    <Text style={styles.instructionsText}>{delivery.package.specialInstructions}</Text>
                                </View>
                            )}

                            {/* Package Images */}
                            {delivery.package?.images?.length > 0 && (
                                <View style={styles.imagesSection}>
                                    <Text style={styles.imagesTitle}>Package Images</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {delivery.package.images.map((image, index) => (
                                            <SmartImage
                                                key={index}
                                                source={{ uri: image.url }}
                                                style={styles.packageImage}
                                                onPress={() => openImageModal(image.url)}
                                                maxRetries={3}
                                                retryDelay={1500}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* LOCATION DETAILS */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('location')}
                    >
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="location-outline" size={20} color="#F44336" />
                            <Text style={styles.sectionTitle}>Location Details</Text>
                        </View>
                        <Ionicons
                            name={expandedSection.location ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection.location && (
                        <View style={styles.sectionContent}>
                            {/* Pickup Location */}
                            <View style={styles.locationCard}>
                                <View style={styles.locationHeader}>
                                    <Ionicons name="ellipse" size={16} color="#4CAF50" />
                                    <Text style={styles.locationTitle}>Pickup Location</Text>
                                </View>

                                <Text style={styles.locationAddress}>{delivery.location?.pickUp?.address}</Text>

                                {delivery.location?.pickUp?.landmark && (
                                    <View style={styles.landmarkRow}>
                                        <Ionicons name="flag" size={14} color="#666" />
                                        <Text style={styles.landmarkText}>{delivery.location.pickUp.landmark}</Text>
                                    </View>
                                )}

                                {delivery.location?.pickUp?.contactPerson?.name && (
                                    <View style={styles.contactInfo}>
                                        <Ionicons name="person" size={14} color="#666" />
                                        <Text style={styles.contactText}>
                                            {delivery.location.pickUp.contactPerson.name} • {delivery.location.pickUp.contactPerson.phone}
                                        </Text>
                                    </View>
                                )}

                                {delivery.location?.pickUp?.building?.name && (
                                    <Text style={styles.buildingInfo}>
                                        {delivery.location.pickUp.building.name}
                                        {delivery.location.pickUp.building.floor && `, Floor ${delivery.location.pickUp.building.floor}`}
                                        {delivery.location.pickUp.building.unit && `, Unit ${delivery.location.pickUp.building.unit}`}
                                    </Text>
                                )}
                            </View>

                            {/* Dropoff Location */}
                            <View style={[styles.locationCard, { marginTop: 12 }]}>
                                <View style={styles.locationHeader}>
                                    <Ionicons name="location" size={16} color="#F44336" />
                                    <Text style={styles.locationTitle}>Dropoff Location</Text>
                                </View>

                                <Text style={styles.locationAddress}>{delivery.location?.dropOff?.address}</Text>

                                {delivery.location?.dropOff?.landmark && (
                                    <View style={styles.landmarkRow}>
                                        <Ionicons name="flag" size={14} color="#666" />
                                        <Text style={styles.landmarkText}>{delivery.location.dropOff.landmark}</Text>
                                    </View>
                                )}

                                {delivery.location?.dropOff?.contactPerson?.name && (
                                    <View style={styles.contactInfo}>
                                        <Ionicons name="person" size={14} color="#666" />
                                        <Text style={styles.contactText}>
                                            {delivery.location.dropOff.contactPerson.name} • {delivery.location.dropOff.contactPerson.phone}
                                        </Text>
                                    </View>
                                )}

                                {delivery.location?.dropOff?.building?.name && (
                                    <Text style={styles.buildingInfo}>
                                        {delivery.location.dropOff.building.name}
                                        {delivery.location.dropOff.building.floor && `, Floor ${delivery.location.dropOff.building.floor}`}
                                        {delivery.location.dropOff.building.unit && `, Unit ${delivery.location.dropOff.building.unit}`}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* PAYMENT DETAILS */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('payment')}
                    >
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="wallet-outline" size={20} color="#FF9800" />
                            <Text style={styles.sectionTitle}>Payment Breakdown</Text>
                        </View>
                        <Ionicons
                            name={expandedSection.payment ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {expandedSection.payment && (
                        <View style={styles.sectionContent}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabelTotal}>Total Amount</Text>
                                <Text style={styles.paymentValueTotal}>{formatCurrency(delivery.pricing?.totalAmount)}</Text>
                            </View>

                            <View style={styles.paymentMethodBox}>
                                <Ionicons name="card" size={16} color="#4CAF50" />
                                <Text style={styles.paymentMethodText}>
                                    Paid via {delivery.payment?.method}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* YOUR CONFIRMATION PROOFS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="shield-checkmark" size={20} color="#9C27B0" />
                            <Text style={styles.sectionTitle}>Your Confirmation Proofs</Text>
                        </View>
                    </View>

                    <View style={styles.sectionContent}>
                        {/* Pickup Photos */}
                        {delivery.pickupConfirmation?.photos?.length > 0 && (
                            <View style={styles.proofSection}>
                                <Text style={styles.proofSectionTitle}>Pickup Photos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofPhotos}>
                                    {delivery.pickupConfirmation.photos.map((photo, index) => (
                                        <SmartImage
                                            key={index}
                                            source={{ uri: photo }}
                                            style={styles.proofImage}
                                            onPress={() => openImageModal(photo)}
                                            maxRetries={2}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Delivery Photos */}
                        {delivery.deliveryConfirmation?.photos?.length > 0 && (
                            <View style={styles.proofSection}>
                                <Text style={styles.proofSectionTitle}>Delivery Photos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.proofPhotos}>
                                    {delivery.deliveryConfirmation.photos.map((photo, index) => (
                                        <SmartImage
                                            key={index}
                                            source={{ uri: photo }}
                                            style={styles.proofImage}
                                            onPress={() => openImageModal(photo)}
                                            maxRetries={2}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Token Verification */}
                        {delivery.tokenVerified?.verified && (
                            <View style={styles.verificationBadge}>
                                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                                <View style={styles.verificationText}>
                                    <Text style={styles.verificationTitle}>Token Verified</Text>
                                    <Text style={styles.verificationSubtitle}>
                                        Verified by {delivery.tokenVerified.verifiedBy?.name} at {new Date(delivery.tokenVerified.verifiedAt).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* CLIENT RATING */}
                {delivery.rating?.clientRating?.stars && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="star" size={20} color="#FFC107" />
                                <Text style={styles.sectionTitle}>Client Rating</Text>
                            </View>
                        </View>

                        <View style={styles.sectionContent}>
                            <View style={styles.ratingDisplay}>
                                <Text style={styles.ratingStars}>
                                    {'⭐'.repeat(delivery.rating.clientRating.stars)}
                                </Text>
                                <Text style={styles.ratingScore}>{delivery.rating.clientRating.stars}.0 / 5.0</Text>
                            </View>

                            {delivery.rating.clientRating.feedback && (
                                <View style={styles.feedbackBox}>
                                    <Text style={styles.feedbackText}>"{delivery.rating.clientRating.feedback}"</Text>
                                </View>
                            )}

                            {delivery.rating.clientRating.categories?.length > 0 && (
                                <View style={styles.categoriesRating}>
                                    {delivery.rating.clientRating.categories.map((cat, index) => (
                                        <View key={index} style={styles.categoryItem}>
                                            <Text style={styles.categoryName}>
                                                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                            </Text>
                                            <View style={styles.categoryStars}>
                                                <Text style={styles.categoryRating}>{'⭐'.repeat(cat.rating)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {delivery.rating.clientRating.wouldRecommend && (
                                <View style={styles.recommendBadge}>
                                    <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
                                    <Text style={styles.recommendText}>Client would recommend you</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* DELIVERY DATES */}
                <View style={styles.datesSection}>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateLabel}>Created</Text>
                        <Text style={styles.dateValue}>
                            {new Date(delivery.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>

                    {delivery.driverAssignment?.actualTimes?.deliveredAt && (
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Completed</Text>
                            <Text style={styles.dateValue}>
                                {new Date(delivery.driverAssignment.actualTimes.deliveredAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* IMAGE MODAL */}
            <Modal
                visible={showImageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowImageModal(false)}
                    >
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <SmartImage
                            source={{ uri: selectedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                            maxRetries={3}
                            retryDelay={2000}
                        />
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#F44336',
        marginTop: 16,
    },

    // Status Header
    statusHeader: {
        padding: 20,
        marginBottom: 12,
    },
    statusContent: {
        marginBottom: 16,
    },
    orderRef: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 8,
        fontFamily: 'PoppinsSemiBold',
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
    earningsDisplay: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 16,
        borderRadius: 12,
    },
    earningsLabel: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
        opacity: 0.9,
        marginBottom: 4,
    },
    earningsAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },

    // Quick Info
    quickInfoSection: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    quickInfoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickInfoCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quickInfoValue: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#1A1A1A',
        marginTop: 8,
        marginBottom: 4,
    },
    quickInfoLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#666',
    },

    // Section
    section: {
        backgroundColor: '#fff',
        marginBottom: 12,
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#1A1A1A',
        fontFamily: 'PoppinsSemiBold',
    },
    sectionContent: {
        padding: 16,
    },

    // Timeline
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineDot: {
        alignItems: 'center',
        marginRight: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#1A1A1A',
    },
    timelineTime: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#999',
    },
    timelineDescription: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'PoppinsMono',
        lineHeight: 18,
        marginBottom: 8,
    },
    proofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    proofButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Detail Rows
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 2,
        textAlign: 'right',
    },

    // Warning Badges
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    warningText: {
        fontSize: 13,
        fontFamily: 'PoppinsMono',
        fontWeight: '600',
        color: '#FF9800',
    },

    // Instructions
    instructionsBox: {
        backgroundColor: '#F0F7FF',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    instructionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'PoppinsSemiBold',
        color: '#2196F3',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },

    // Images
    imagesSection: {
        marginTop: 16,
    },
    imagesTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    packageImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        marginRight: 12,
    },

    // Location Cards
    locationCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    locationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    locationAddress: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    landmarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    landmarkText: {
        fontSize: 13,
        color: '#666',
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    contactText: {
        fontSize: 13,
        color: '#666',
    },
    buildingInfo: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },

    // Payment
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    paymentDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    paymentLabelTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    paymentValueTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    paymentMethodBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    paymentMethodText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Proof Section
    proofSection: {
        marginBottom: 20,
    },
    proofSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    proofPhotos: {
        flexDirection: 'row',
    },
    proofImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        marginRight: 12,
    },

    // Verification Badge
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    verificationText: {
        flex: 1,
    },
    verificationTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 4,
    },
    verificationSubtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsMono',
        color: '#666',
    },

    // Rating Display
    ratingDisplay: {
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginBottom: 16,
    },
    ratingStars: {
        fontSize: 32,
        marginBottom: 8,
    },
    ratingScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    feedbackBox: {
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    feedbackText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    categoriesRating: {
        marginBottom: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    categoryName: {
        fontSize: 14,
        color: '#666',
    },
    categoryStars: {
        flexDirection: 'row',
    },
    categoryRating: {
        fontSize: 16,
    },
    recommendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
    },
    recommendText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4CAF50',
    },

    // Dates Section
    datesSection: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dateLabel: {
        fontSize: 14,
        color: '#666',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },

    // Image Modal
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    fullImage: {
        width: width - 40,
        height: width - 40,
    },
    proofThumbnail: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginRight: 6,
    },
});

export default DeliveryDetails;