import React, {useState, useCallback, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    RefreshControl,
    Dimensions
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as Location from 'expo-location';
import StatusModal from '../../../StatusModal/StatusModal';
import ClientUtils from '../../../../utils/ClientUtilities';
import LocationForm from './LocationForm';
import {queryClient} from '../../../../lib/queryClient';
import {useSavedLocationStore} from '../../../../store/useSavedLocationStore';
import {useLocalSearchParams, useRouter} from 'expo-router';
import SessionManager from "../../../../lib/SessionManager";
import ConfirmationModal from "../../../ConfrimationModal/ConfirmationModal"
const {width, height} = Dimensions.get('window');
import { toast } from "sonner-native";
// Colors matching your design system
const COLORS = {
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#7209B7',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    muted: '#6C757D',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    border: '#DEE2E6',
    light: '#F8F9FA',
    dark: '#495057',
};

// Location type icons mapping
const LOCATION_ICONS = {
    residential: 'home-outline',
    commercial: 'business-outline',
    office: 'briefcase-outline',
    mall: 'storefront-outline',
    hospital: 'medical-outline',
    school: 'school-outline',
    other: 'location-outline'
};

// Location type colors
const LOCATION_COLORS = {
    residential: '#28A745',
    commercial: '#007BFF',
    office: '#6F42C1',
    mall: '#FD7E14',
    hospital: '#DC3545',
    school: '#20C997',
    other: '#6C757D'
};


function Locations({userData}) {
    const router = useRouter();
    const { from } = useLocalSearchParams();
    const setEditLocation = useSavedLocationStore((state) => state.setEditLocation);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [statusModalData, setStatusModalData] = useState({});
    const [locationPermission, setLocationPermission] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmModalStatus, setConfirmModalStatus] = useState('confirm');
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [locationToDelete, setLocationToDelete] = useState(null);

    // Animated values for smooth transitions
    const slideAnim = useState(new Animated.Value(height))[0];
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Mutations
    const deleteLocationMutation = useMutation({
        mutationFn: ClientUtils.DeleteLocation,
        mutationKey: ['DeleteLocation'],
    })


    useEffect(() => {
        if (from === 'edit' || from === 'create') {
            router.replace('/client/profile/location');
        }
    }, [from]);

    // Request location permission on component mount
    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        } catch (error) {
            toast.error('Error requesting location permission');
            console.log('Error requesting location permission:', error);
        }
    };


    const handleDeleteLocation = (locationData) => {
        setLocationToDelete(locationData);
        setConfirmModalStatus('confirm');
        setConfirmModalMessage(`Are you sure you want to delete ?`);
        setConfirmModalVisible(true);
    };

    const handleConfirmDelete = () => {
        setConfirmModalStatus('loading');
        setConfirmModalMessage('Deleting...');

        deleteLocationMutation.mutate(locationToDelete, {
            onSuccess: async (respData) => {
                setConfirmModalStatus('success');
                setConfirmModalMessage('Location deleted successfully.');
                const {user} = respData;
                await SessionManager.updateUser(user);

                // Auto close after short delay
                setTimeout(() => {
                    setConfirmModalVisible(false);
                    setLocationToDelete(null);
                }, 1200);
            },
            onError: (error) => {
                setConfirmModalStatus('error');
                setConfirmModalMessage(error.message || 'Failed to delete location.');
            }
        });
    };


    const toggleCardExpansion = (locationId) => {
        setExpandedCard(expandedCard === locationId ? null : locationId);
    };

    const handleCreateLocation = () => {
        const { clearMapLocation } = useSavedLocationStore.getState();
        clearMapLocation();

        router.push('/client/profile/location/map-picker');
    };

    const handleEditLocation = (location) => {
        // Store the location data in Zustand before navigating
        setEditLocation(location);
        router.push('/client/profile/location/edit',{
            params: {
                action: 'edit',
            }
        });
    };

    const renderLocationCard = ({item, index}) => {
        const isExpanded = expandedCard === item._id;
        const iconName = LOCATION_ICONS[item.locationType] || LOCATION_ICONS.other;
        const iconColor = LOCATION_COLORS[item.locationType] || LOCATION_COLORS.other;

        return (
            <View style={[styles.locationCard, {marginBottom: index === userData.savedLocations.length - 1 ? 100 : 16}]}>
                <TouchableOpacity
                    style={styles.locationCardHeader}
                    activeOpacity={0.7}
                    onPress={() => toggleCardExpansion(item._id)}
                >
                    <View style={styles.locationCardLeft}>
                        <View style={[styles.locationIcon, {backgroundColor: iconColor + '20'}]}>
                            <Ionicons name={iconName} size={24} color={iconColor}/>
                        </View>
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationAddress} numberOfLines={5}>
                                {item.address}
                            </Text>
                            <Text style={styles.locationType}>
                                {item.locationType.charAt(0).toUpperCase() + item.locationType.slice(1)}
                            </Text>
                            {item.landmark && (
                                <Text style={styles.locationLandmark} numberOfLines={2}>
                                    📍 {item.landmark}
                                </Text>
                            )}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 6,
                                    backgroundColor: COLORS.light,
                                    paddingVertical: 6,
                                    borderRadius: 10,
                                    width: '80%',
                                }}
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={16}
                                    color={COLORS.primary}
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'PoppinsMedium',
                                        color: COLORS.text,
                                        letterSpacing: 0.3,
                                    }}
                                >
                                    {item.coordinates?.lat
                                        ? `Lat: ${item.coordinates.lat.toFixed(6)}`
                                        : 'Lat: N/A'}
                                    {'   '}
                                    •
                                    {'   '}
                                    {item.coordinates?.lng
                                        ? `Lng: ${item.coordinates.lng.toFixed(6)}`
                                        : 'Lng: N/A'}
                                </Text>
                            </View>

                        </View>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.muted}
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.locationCardContent}>
                        {item.building?.name && (
                            <View style={styles.detailRow}>
                                <Ionicons name="business-outline" size={16} color={COLORS.muted}/>
                                <Text style={styles.detailText}>
                                    {item.building.name}
                                    {item.building.floor && `, Floor ${item.building.floor}`}
                                    {item.building.unit && `, Unit ${item.building.unit}`}
                                </Text>
                            </View>
                        )}

                        {item.contactPerson?.name && (
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={16} color={COLORS.muted}/>
                                <Text style={styles.detailText}>
                                    {item.contactPerson.name}
                                    {item.contactPerson.phone && (
                                        <>
                                            {' • '}
                                            {item.contactPerson.phone}
                                            {item.contactPerson.alternatePhone && ` or ${item.contactPerson.alternatePhone}`}
                                        </>
                                    )}
                                </Text>
                            </View>
                        )}

                        {item.extraInformation && (
                            <View style={styles.detailRow}>
                                <Ionicons name="information-circle-outline" size={16} color={COLORS.muted}/>
                                <Text style={styles.detailText}>{item.extraInformation}</Text>
                            </View>
                        )}

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => handleEditLocation(item)}
                            >
                                <Ionicons name="pencil" size={16} color={COLORS.primary}/>
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteLocation(item)}
                            >
                                <Ionicons name="trash" size={16} color={COLORS.error}/>
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
                <Ionicons name="location-outline" size={64} color={COLORS.muted}/>
            </View>
            <Text style={styles.emptyStateTitle}>No Saved Locations</Text>
            <Text style={styles.emptyStateText}>
                Add your location to make booking your logistics service faster and easier.
            </Text>
            <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleCreateLocation}
            >
                <Text style={styles.emptyStateButtonText}>Add Your First Location</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => router.replace('/client/profile')}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.dark}/>
                    </TouchableOpacity>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerTitle}>Saved Locations</Text>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>
                    Manage your frequently delivery locations
                </Text>
            </View>

            {/* Location List */}
            <FlatList
                data={userData?.savedLocations ?? []}
                renderItem={renderLocationCard}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContainer}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateLocation}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={24} color="white"/>
            </TouchableOpacity>

            {/* Status Modal */}
            <StatusModal
                visible={statusModalVisible}
                status={statusModalData.status}
                message={statusModalData.message}
                onClose={() => setStatusModalVisible(false)}
            />
        </View>
            <ConfirmationModal
                visible={confirmModalVisible}
                status={confirmModalStatus}
                message={confirmModalMessage}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmModalVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.muted,
    },
    header: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 5,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 2,
    },
    titleWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'PoppinsSemiBold',
        fontSize: 20,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: COLORS.muted,
        marginTop: 4,
    },
    listContainer: {
        padding: 20,
        flexGrow: 1,
    },
    locationCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    locationCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    locationCardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationAddress: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsBold',
        marginBottom: 2,

    },
    locationType: {
        fontSize: 12,
        color: COLORS.muted,
        textTransform: 'uppercase',
        fontFamily: 'PoppinsRegular',
        marginBottom: 2,
        letterSpacing: 0.5,
        fontWeight: '500',
        paddingVertical: 2,
        paddingHorizontal: 6,
        textAlign: 'center',
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    locationLandmark: {
        fontSize: 14,
        color: COLORS.dark,
        fontFamily: 'PoppinsRegular',
    },
    locationCardContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 8,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.dark,
        marginLeft: 8,
        flex: 1,
        fontFamily: 'PoppinsRegular',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: COLORS.primary + '15',
    },
    editButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    deleteButton: {
        backgroundColor: COLORS.error + '15',
    },
    deleteButtonText: {
        color: COLORS.error,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyStateIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyStateButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.9,
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalForm: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.card,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 4,
    },
    addressInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressInput: {
        flex: 1,
        minHeight: 60,
        textAlignVertical: 'top',
        marginRight: 8,
    },
    locationButton: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
    },
    locationTypeContainer: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    typeScroll: {
        flexDirection: 'row',
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        marginRight: 8,
        minWidth: 100,
    },
    typeText: {
        fontSize: 12,
        color: COLORS.muted,
        marginLeft: 6,
        fontWeight: '500',
    },
    sectionContainer: {
        marginBottom: 20,
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    halfInput: {
        flex: 0.48,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    cancelButton: {
        flex: 0.45,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    saveButton: {
        flex: 0.45,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.muted,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default Locations;