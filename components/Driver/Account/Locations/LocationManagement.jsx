// components/Driver/Account/Locations/LocationManagement.jsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLocationStore } from '../../../../store/Driver/useLocationStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import DriverUtils from '../../../../utils/DriverUtilities';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import SessionManager from "../../../../lib/SessionManager";

function LocationManagement({ userData }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setMode, setEditingLocation, setFormData, resetLocationStore } = useLocationStore();

    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const savedLocations = userData?.savedLocations || [];

    // Delete mutation with optimistic updates
    const deleteLocationMutation = useMutation({
        mutationFn: (locationId) => DriverUtils.DeleteLocation({locationId}),
        onMutate: async (locationId) => {
            setDeletingId(locationId);
            // Cancel any outgoing refetches
            await queryClient.cancelQueries(['userData']);

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(['userData']);

            return { previousData };
        },
        onSuccess: async (respData, locationId) => {
            // Update session with new user data
            await SessionManager.updateUser(respData.user);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success('Location deleted successfully');

            // Close modals with delay for smooth transition
            setTimeout(() => {
                setDeleteModalVisible(false);
                setViewModalVisible(false);
                setSelectedLocation(null);
                setDeletingId(null);
            }, 300);
        },
        onError: (error, locationId, context) => {
            // Rollback on error
            queryClient.setQueryData(['userData'], context.previousData);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error(error.message || 'Failed to delete location');

            setDeletingId(null);
            setDeleteModalVisible(false);
        }
    });

    const handleAddNew = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        resetLocationStore();
        setMode('new');
        router.push('/driver/account/location/map');
    };

    const handleView = (location) => {
        setSelectedLocation(location);
        setViewModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleEdit = (location) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setEditingLocation(location);
        setFormData({
            address: location.address,
            coordinates: location.coordinates,
            landmark: location.landmark || '',
            contactPerson: location.contactPerson || { name: '', phone: '', alternatePhone: '' },
            extraInformation: location.extraInformation || '',
            locationType: location.locationType || 'residential',
            building: location.building || { name: '', floor: '', unit: '' }
        });
        setViewModalVisible(false);
        router.push('/driver/account/location/map');
    };

    const handleDeletePress = (location) => {
        setSelectedLocation(location);
        setDeleteModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleConfirmDelete = () => {
        if (selectedLocation) {
            deleteLocationMutation.mutate(selectedLocation._id);
        }
    };

    const getLocationIcon = (type) => {
        const icons = {
            residential: 'home',
            commercial: 'business',
            office: 'briefcase',
            mall: 'cart',
            hospital: 'medical',
            school: 'school',
            other: 'location'
        };
        return icons[type] || 'location';
    };

    return (
        <View style={styles.container}>
            {/* Elegant Header - Back button only */}
            <View style={styles.simpleHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/driver/account')}
                >
                    <Ionicons name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            {savedLocations.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="location-outline" size={80} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>No Saved Locations</Text>
                    <Text style={styles.emptyMessage}>
                        Add your frequently used locations for faster order placement
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={handleAddNew}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.emptyButtonText}>Add Location</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Hero Section - Landing Page Style */}
                    <View style={styles.heroSection}>
                        {/* Title with Icon */}
                        <View style={styles.heroTitleRow}>
                            <View style={styles.heroIconBg}>
                                <Ionicons name="location" size={24} color="#6366F1" />
                            </View>
                            <Text style={styles.heroTitle}>My Locations</Text>
                        </View>

                        {/* Subtitle */}
                        <Text style={styles.heroSubtitle}>
                            Manage your saved locations for faster deliveries and seamless order tracking
                        </Text>

                        {/* Stats Grid with Icons */}
                        <View style={styles.statsGrid}>
                            {/* Total Header with Dropdown Toggle */}
                            <TouchableOpacity
                                style={styles.totalHeader}
                                onPress={() => setStatsExpanded(!statsExpanded)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.totalLeft}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>{savedLocations.length}</Text>
                                </View>
                                <View style={styles.totalRight}>
                                    {/* Add button - only shown when collapsed */}
                                    {!statsExpanded && (
                                        <TouchableOpacity
                                            style={styles.addButtonSmall}
                                            onPress={handleAddNew}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="add" size={16} color="#6366F1" />
                                            <Text style={styles.addButtonSmallText}>Add</Text>
                                        </TouchableOpacity>
                                    )}
                                    {/* Dropdown arrow */}
                                    <Ionicons
                                        name={statsExpanded ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Icon Stats Row - conditionally rendered */}
                            {statsExpanded && (
                                <View style={styles.iconStatsRow}>
                                    {/* Residential */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#EEF2FF' }]}>
                                            <Ionicons name="home" size={20} color="#6366F1" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'residential').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Commercial */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#F0FDF4' }]}>
                                            <Ionicons name="business" size={20} color="#10B981" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'commercial').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Office */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#FEF3C7' }]}>
                                            <Ionicons name="briefcase" size={20} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'office').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Mall */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#FCE7F3' }]}>
                                            <Ionicons name="cart" size={20} color="#EC4899" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'mall').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Hospital */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#FEE2E2' }]}>
                                            <Ionicons name="medical" size={20} color="#EF4444" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'hospital').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* School */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#DBEAFE' }]}>
                                            <Ionicons name="school" size={20} color="#3B82F6" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'school').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Other */}
                                    <TouchableOpacity style={styles.iconStat} activeOpacity={0.7}>
                                        <View style={[styles.iconStatBadge, { backgroundColor: '#F3F4F6' }]}>
                                            <Ionicons name="location" size={20} color="#6B7280" />
                                        </View>
                                        <Text style={styles.iconStatValue}>
                                            {savedLocations.filter(l => l.locationType === 'other').length}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Add New Location Button - shown when expanded */}
                                    <TouchableOpacity
                                        style={styles.addNewStat}
                                        onPress={handleAddNew}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.addNewBadge}>
                                            <Ionicons name="add" size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.addNewText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                    </View>

                    {/* Locations List */}
                    <FlatList
                        data={savedLocations}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <LocationCard
                                location={item}
                                onView={() => handleView(item)}
                                onEdit={() => handleEdit(item)}
                                onDelete={() => handleDeletePress(item)}
                                getIcon={getLocationIcon}
                                isDeleting={deletingId === item._id}
                            />
                        )}
                    />
                </>
            )}

            {/* View Modal */}
            <LocationViewModal
                visible={viewModalVisible}
                location={selectedLocation}
                onClose={() => setViewModalVisible(false)}
                onEdit={() => handleEdit(selectedLocation)}
                onDelete={() => handleDeletePress(selectedLocation)}
                getIcon={getLocationIcon}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                visible={deleteModalVisible}
                location={selectedLocation}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteLocationMutation.isPending}
            />
        </View>
    );
}

// Location Card Component with Animation
const LocationCard = ({ location, onView, onEdit, onDelete, getIcon, isDeleting }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    React.useEffect(() => {
        if (isDeleting) {
            // Animate out
            scale.value = withSequence(
                withTiming(1.05, { duration: 100 }),
                withTiming(0.95, { duration: 200 }),
                withTiming(0, { duration: 300 })
            );
            opacity.value = withTiming(0, { duration: 400 });
        }
    }, [isDeleting]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                style={styles.locationCard}
                onPress={onView}
                activeOpacity={0.7}
                disabled={isDeleting}
            >
                <View style={styles.locationIconContainer}>
                    <Ionicons
                        name={getIcon(location.locationType)}
                        size={24}
                        color="#6366F1"
                    />
                </View>

                <View style={styles.locationContent}>
                    <View style={styles.locationHeader}>
                        <Text style={styles.locationType}>
                            {location.locationType.charAt(0).toUpperCase() + location.locationType.slice(1)}
                        </Text>
                        {location.building?.name && (
                            <View style={styles.buildingBadge}>
                                <Ionicons name="business-outline" size={12} color="#6B7280" />
                                <Text style={styles.buildingText}>{location.building.name}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.locationAddress} numberOfLines={2}>
                        {location.address}
                    </Text>

                    {location.landmark && (
                        <View style={styles.landmarkRow}>
                            <Ionicons name="flag-outline" size={14} color="#6B7280" />
                            <Text style={styles.landmarkText} numberOfLines={1}>
                                {location.landmark}
                            </Text>
                        </View>
                    )}

                    {!isDeleting && (
                        <View style={styles.locationActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color="#6366F1" />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteAction]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isDeleting && (
                        <View style={styles.deletingOverlay}>
                            <ActivityIndicator size="small" color="#EF4444" />
                            <Text style={styles.deletingText}>Deleting...</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Delete Confirmation Modal with Animation
const DeleteConfirmationModal = ({ visible, location, onClose, onConfirm, isDeleting }) => {
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
            });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = withTiming(0.9, { duration: 150 });
            opacity.value = withTiming(0, { duration: 150 });
        }
    }, [visible]);

    const animatedModalStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    if (!location) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.deleteModalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={!isDeleting ? onClose : undefined}
                />

                <Animated.View style={[styles.deleteModalContent, animatedModalStyle]}>
                    {/* Icon */}
                    <View style={styles.deleteIconContainer}>
                        <View style={styles.deleteIconBg}>
                            <Ionicons name="trash" size={32} color="#EF4444" />
                        </View>
                    </View>

                    {/* Content */}
                    <Text style={styles.deleteModalTitle}>Delete Location?</Text>
                    <Text style={styles.deleteModalText}>
                        Are you sure you want to delete this location? This action cannot be undone.
                    </Text>

                    {/* Location Preview */}
                    <View style={styles.locationPreview}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={styles.locationPreviewText} numberOfLines={2}>
                            {location.address}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.deleteModalActions}>
                        <TouchableOpacity
                            style={styles.cancelDeleteButton}
                            onPress={onClose}
                            disabled={isDeleting}
                        >
                            <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmDeleteButton,
                                isDeleting && styles.confirmDeleteButtonDisabled
                            ]}
                            onPress={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.confirmDeleteButtonText}>Deleting...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="trash" size={18} color="#fff" />
                                    <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

// View Modal Component (keep existing, just add this style)
const LocationViewModal = ({ visible, location, onClose, onEdit, onDelete, getIcon }) => {
    if (!location) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Location Details</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* ... (keep existing detail rows) ... */}
                        {/* Location Type */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons
                                    name={getIcon(location.locationType)}
                                    size={20}
                                    color="#6366F1"
                                />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Type</Text>
                                <Text style={styles.detailValue}>
                                    {location.locationType.charAt(0).toUpperCase() + location.locationType.slice(1)}
                                </Text>
                            </View>
                        </View>

                        {/* Address */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="location" size={20} color="#10B981" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Address</Text>
                                <Text style={styles.detailValue}>{location.address}</Text>
                            </View>
                        </View>

                        {/* Add other fields as before */}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onEdit}
                        >
                            <Ionicons name="create-outline" size={20} color="#6366F1" />
                            <Text style={styles.modalButtonText}>Edit Location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButton]}
                            onPress={onDelete}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const additionalStyles = {
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    deleteIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    deleteModalText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    locationPreviewText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
    },
    deleteModalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelDeleteButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelDeleteButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
    },
    confirmDeleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
    },
    confirmDeleteButtonDisabled: {
        opacity: 0.7,
    },
    confirmDeleteButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
    deletingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    deletingText: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#EF4444',
    },
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'PoppinsBold',
        color: '#6366F1',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    detailSubValue: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        marginTop: 4,
    },
    // confirmation modal
    confirmationOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmationModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    warningIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    confirmationActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelConfirmText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
    deleteConfirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#EF4444',
    },
    deleteConfirmText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },

    // additional styles
    ...additionalStyles,

    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Simple header with just back button
    simpleHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Hero Section - Landing Page Style
    heroSection: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 20,
        borderBottomColor: '#d7d2cc',
        borderBottomRightRadius: 50,
        borderBottomLeftRadius: 50,
    },
    heroTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    heroIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#C7D2FE',
    },
    heroTitle: {
        fontSize: 26,
        fontFamily: 'PoppinsBold',
        color: '#111827',
    },
    heroSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 24,
    },

    // Stats Grid
    statsGrid: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
    },
    totalValue: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        color: '#6366F1',
    },

    // Icon Stats Row
    iconStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    iconStat: {
        alignItems: 'center',
        minWidth: 60,
    },
    iconStatBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconStatValue: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
        color: '#111827',
    },

    // Add New Button
    addNewStat: {
        alignItems: 'center',
        minWidth: 60,
    },
    addNewBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addNewText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },

    // List Content
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },

    // Location Card styles (keep existing)
    locationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    locationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationContent: {
        flex: 1,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
        gap: 8,
    },
    locationType: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    buildingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
    },
    buildingText: {
        fontSize: 11,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
    },
    locationAddress: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    landmarkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    landmarkText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    locationActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
    },
    deleteAction: {
        backgroundColor: '#FEF2F2',
    },
    actionText: {
        fontSize: 13,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },
    deleteText: {
        color: '#EF4444',
    },
    deletingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    deletingText: {
        fontSize: 13,
        fontFamily: 'PoppinsMedium',
        color: '#EF4444',
    },

    // Empty State (keep existing)
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
    },

    // Modal styles (keep all existing modal styles)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#111827',
    },
    modalBody: {
        padding: 20,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#6B7280',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
        lineHeight: 22,
    },
    modalActions: {
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    deleteButton: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    modalButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },
    deleteButtonText: {
        color: '#EF4444',
    },

    // Delete Modal styles (keep existing additionalStyles)
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    deleteIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    deleteIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsBold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    deleteModalText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    locationPreviewText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#374151',
    },
    deleteModalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelDeleteButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelDeleteButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#6B7280',
    },
    confirmDeleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
    },
    confirmDeleteButtonDisabled: {
        opacity: 0.7,
    },
    confirmDeleteButtonText: {
        fontSize: 15,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
    // Add these to your existing styles
    totalLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    totalRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    addButtonSmallText: {
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        color: '#6366F1',
    },
});

export default LocationManagement;