import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as yup from 'yup';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import {uploadToCloudinary} from '../../../../../utils/Cloudinary'
import ClientUtils from "../../../../../utils/ClientUtilities";
import {useMutation} from "@tanstack/react-query";

// Import your state and LGA data
import {stateAndLGA} from '../../../../../utils/Constant';
import StatusModal from "../../../../StatusModal/StatusModal";
import SessionManager from "../../../../../lib/SessionManager";


// Colors
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
    border: '#DEE2E6',
};

// Convert stateAndLGA object to array format for easier handling
const NIGERIAN_STATES = Object.keys(stateAndLGA).map(state => ({
    value: state,
    label: state
}));

// Validation Schema
const editProfileSchema = yup.object().shape({
    fullName: yup
        .string()
        .min(2, 'Full name must be at least 2 characters')
        .max(50, 'Full name cannot exceed 50 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')
        .required('Full name is required'),
    phoneNumber: yup
        .string()
        .matches(/^(\+234|0)[7-9][0-1]\d{8}$/, 'Please enter a valid Nigerian phone number')
        .required('Phone number is required'),
    dob: yup
        .date()
        .max(new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000), 'Must be at least 13 years old')
        .min(new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), 'Invalid date of birth')
        .required('Date of birth is required'),
    gender: yup
        .string()
        .oneOf(['Male', 'Female'], 'Please select a valid gender')
        .required('Gender is required'),
    state: yup
        .string()
        .required('State is required'),
    lga: yup
        .string()
        .required('Local Government Area is required'),
    address: yup
        .string()
        .min(10, 'Address must be at least 10 characters')
        .max(200, 'Address cannot exceed 200 characters')
        .required('Address is required'),
});

export default function EditProfile({userData = null}) {
    const router = useRouter();
    const [imageLoading, setImageLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showLGAModal, setShowLGAModal] = useState(false);
    const [selectedState, setSelectedState] = useState('');

    const [lgas, setLgas] = useState([]);


    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Updating Profile...');


    const updateProfileMutation = useMutation({
        mutationKey: ['UpdateProfile'],
        mutationFn: ClientUtils.UpdateProfile,
    });


    // React Hook Form setup
    const {
        control,
        handleSubmit,
        formState: {errors, isValid},
        setValue,
        watch,
        reset
    } = useForm({
        resolver: yupResolver(editProfileSchema),
        defaultValues: {
            fullName: userData?.fullName || '',
            phoneNumber: userData?.phoneNumber || '',
            dob: userData?.dob ? new Date(userData.dob) : new Date(),
            gender: userData?.gender || '',
            state: userData?.state || '',
            lga: userData?.lga || '',
            address: userData?.address || '',
        },
        mode: 'onTouched',
    });

    // Watch values for state/LGA dependency
    const watchedState = watch('state');

    useEffect(() => {
        // Request camera/gallery permissions
        (async () => {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions to change profile picture.');
            }
        })();
    }, []);

    // Reset LGA when state changes
    // Replace your current useEffect for watchedState
    useEffect(() => {
        if (watchedState && watchedState !== selectedState) {
            setSelectedState(watchedState);
            setLgas(stateAndLGA[watchedState] || []);
            // Only reset LGA if it doesn't belong to the new state
            if (userData?.lga && !stateAndLGA[watchedState]?.includes(userData.lga)) {
                setValue('lga', '');
            }
        }
    }, [watchedState, selectedState, setValue, userData?.lga]);

    // Load initial data
    useEffect(() => {
        if (userData?.state) {
            // Set the available LGAs for the user's state
            setLgas(stateAndLGA[userData.state] || []);
            // Set the selected state
            setSelectedState(userData.state);
        }
    }, [userData?.state]);


    const handleImagePicker = useCallback(() => {
        Alert.alert(
            'Update Picture',
            'Choose an option',
            [
                {text: 'Camera', onPress: () => pickImage('camera')},
                {text: 'Gallery', onPress: () => pickImage('gallery')},
                {text: 'Cancel', style: 'cancel'},
            ]
        );
    }, []);

    const pickImage = async (source) => {
        setImageLoading(true);
        try {
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: false,
            };

            let result;
            if (source === 'camera') {
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        } finally {
            setImageLoading(false);
        }
    };

    const handleImageUpload = async (userData) => {
        if (!profileImage || profileImage === userData?.avatar) {
            return userData?.avatar; // Return existing if no new image
        }

        try {
            const {timestamp, signature, public_id, api_key} = await ClientUtils.GetSignedUrl();
            ;
            if (!timestamp || !signature || !public_id || !api_key) {
                throw new Error('Required Cloudinary data is missing');
            }
            return await uploadToCloudinary(profileImage, timestamp, signature, public_id, api_key);
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Image upload failed. Please try again.');
        } finally {
        }
    };

    const onSubmit = async (data) => {
        setModalVisible(true);
        try {
            // 1. First upload the image if changed
            let imageUrl;
            try {
                imageUrl = await handleImageUpload(userData);
            } catch (uploadError) {
                setModalMessage(uploadError.message)
                setModalVisible(false)
                return;
            }

            // 2. Prepare the complete data
            const submitData = {
                ...data,
                dob: data.dob.toISOString().split('T')[0],
                avatar: imageUrl,
            };

            // we cook to the BE later
            updateProfileMutation.mutate(submitData, {
                onSuccess: async (respData) => {

                    setTimeout(() => {
                        setModalStatus('success');
                        setModalMessage('Profile updated successfully!');
                    }, 2000);

                    const {user} = respData;

                    await SessionManager.updateUser(user);

                    // Delay before redirecting
                    setTimeout(() => {
                        setModalVisible(false);
                        router.push({pathname: '/client/profile'});
                    }, 3500);
                },
                onError: (error) => {
                    setModalStatus('error');
                    setModalMessage(error.message || 'Failed to update profile. Please try again.');
                }
            })
        } catch (error) {
            console.error('Submission error:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to update profile. Please try again.'
            );
        }
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setValue('dob', selectedDate);
        }
    };

    const renderStateItem = ({item}) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
                setValue('state', item.value);
                setShowStateModal(false);
            }}
        >
            <Text style={styles.modalItemText}>{item.label}</Text>
        </TouchableOpacity>
    );

    // const renderLGAItem = ({item}) => (
    //     <TouchableOpacity
    //         style={styles.modalItem}
    //         onPress={() => {
    //             setValue('lga', item);
    //             setShowLGAModal(false);
    //         }}
    //     >
    //         <Text style={styles.modalItemText}>{item}</Text>
    //     </TouchableOpacity>
    // );

    // Update your renderLGAItem function
    const renderLGAItem = ({ item }) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
                setValue('lga', item);
                setShowLGAModal(false);
            }}
        >
            <Text style={styles.modalItemText}>{item}</Text>
            {watch('lga') === item && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Image Section */}
                <View style={styles.profileImageContainer}>
                    <TouchableOpacity
                        onPress={handleImagePicker}
                        disabled={imageLoading}
                        style={styles.profileImageButton}
                    >
                        <View style={styles.profileImageWrapper}>
                            {profileImage || userData?.avatar ? (
                                <Image
                                    source={{uri: profileImage || userData?.avatar}}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Ionicons name="person" size={40} color={COLORS.muted}/>
                                </View>
                            )}
                            {imageLoading && (
                                <View style={styles.profileImageOverlay}>
                                    <ActivityIndicator color="white"/>
                                </View>
                            )}
                        </View>
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={16} color="white"/>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.profileImageHint}>Tap to change profile picture</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <Controller
                            name="fullName"
                            control={control}
                            render={({field: {value, onChange, onBlur}}) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.fullName && styles.inputError
                                    ]}
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={COLORS.muted}
                                    autoCapitalize="words"
                                />
                            )}
                        />
                        {errors.fullName && (
                            <Text style={styles.errorText}>
                                {errors.fullName.message}
                            </Text>
                        )}
                    </View>

                    {/* Email (Read-only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledInputText}>
                                {userData?.email || 'andrew_ainsley@yourdomain.com'}
                            </Text>
                            <Ionicons name="lock-closed" size={16} color={COLORS.muted}/>
                        </View>
                        <Text style={styles.disabledHint}>
                            Email cannot be changed for security reasons
                        </Text>
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({field: {value, onChange, onBlur}}) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        errors.phoneNumber && styles.inputError
                                    ]}
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="+234 800 000 0000"
                                    placeholderTextColor={COLORS.muted}
                                    keyboardType="phone-pad"
                                />
                            )}
                        />
                        {errors.phoneNumber && (
                            <Text style={styles.errorText}>
                                {errors.phoneNumber.message}
                            </Text>
                        )}
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <Controller
                            name="dob"
                            control={control}
                            render={({field: {value}}) => (
                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        styles.dateInput,
                                        errors.dob && styles.inputError
                                    ]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateText}>
                                        {formatDate(value)}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color={COLORS.muted}/>
                                </TouchableOpacity>
                            )}
                        />
                        {errors.dob && (
                            <Text style={styles.errorText}>
                                {errors.dob.message}
                            </Text>
                        )}
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <Controller
                            name="gender"
                            control={control}
                            render={({field: {value, onChange}}) => (
                                <View style={styles.genderContainer}>
                                    {['Male', 'Female'].map((gender) => (
                                        <TouchableOpacity
                                            key={gender}
                                            style={[
                                                styles.genderButton,
                                                value === gender && styles.genderButtonActive
                                            ]}
                                            onPress={() => onChange(gender)}
                                        >
                                            <Text style={[
                                                styles.genderButtonText,
                                                value === gender && styles.genderButtonTextActive
                                            ]}>
                                                {gender}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        />
                        {errors.gender && (
                            <Text style={styles.errorText}>
                                {errors.gender.message}
                            </Text>
                        )}
                    </View>

                    {/* Nationality (Fixed) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nationality</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledInputText}>
                                🇳🇬 Nigeria
                            </Text>
                            <Ionicons name="lock-closed" size={16} color={COLORS.muted}/>
                        </View>
                    </View>

                    {/* State */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>State</Text>
                        <Controller
                            name="state"
                            control={control}
                            render={({field: {value}}) => (
                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        styles.selectInput,
                                        errors.state && styles.inputError
                                    ]}
                                    onPress={() => setShowStateModal(true)}
                                >
                                    <Text style={value ? styles.selectText : styles.selectPlaceholder}>
                                        {value || 'Select State'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={COLORS.muted}/>
                                </TouchableOpacity>
                            )}
                        />
                        {errors.state && (
                            <Text style={styles.errorText}>
                                {errors.state.message}
                            </Text>
                        )}
                    </View>

                    {/* LGA */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Local Government Area</Text>
                        <Controller
                            name="lga"
                            control={control}
                            render={({field: {value}}) => (
                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        styles.selectInput,
                                        errors.lga && styles.inputError,
                                        !watchedState && styles.disabledSelect
                                    ]}
                                    onPress={() => watchedState && setShowLGAModal(true)}
                                    disabled={!watchedState}
                                >
                                    <Text style={value ? styles.selectText : styles.selectPlaceholder}>
                                        {value || 'Select LGA'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={COLORS.muted}/>
                                </TouchableOpacity>
                            )}
                        />
                        {errors.lga && (
                            <Text style={styles.errorText}>
                                {errors.lga.message}
                            </Text>
                        )}
                        {!watchedState && (
                            <Text style={styles.disabledHint}>
                                Please select a state first
                            </Text>
                        )}
                    </View>

                    {/* Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <Controller
                            name="address"
                            control={control}
                            render={({field: {value, onChange, onBlur}}) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.multilineInput,
                                        errors.address && styles.inputError
                                    ]}
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Enter your full address"
                                    placeholderTextColor={COLORS.muted}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            )}
                        />
                        {errors.address && (
                            <Text style={styles.errorText}>
                                {errors.address.message}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Update Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                        ]}
                        onPress={handleSubmit(onSubmit)}
                    >
                        <Text style={styles.buttonText}>
                            Update Profile
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={watch('dob')}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {/* State Modal */}
            <Modal
                visible={showStateModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select State</Text>
                        <TouchableOpacity
                            onPress={() => setShowStateModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text}/>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={NIGERIAN_STATES}
                        keyExtractor={(item) => item.value}
                        renderItem={renderStateItem}
                    />
                </View>
            </Modal>

            {/* LGA Modal */}
            {/*<Modal*/}
            {/*    visible={showLGAModal}*/}
            {/*    animationType="slide"*/}
            {/*    presentationStyle="pageSheet"*/}
            {/*>*/}
            {/*    <View style={styles.modalContainer}>*/}
            {/*        <View style={styles.modalHeader}>*/}
            {/*            <Text style={styles.modalTitle}>Select LGA</Text>*/}
            {/*            <TouchableOpacity*/}
            {/*                onPress={() => setShowLGAModal(false)}*/}
            {/*                style={styles.modalCloseButton}*/}
            {/*            >*/}
            {/*                <Ionicons name="close" size={24} color={COLORS.text}/>*/}
            {/*            </TouchableOpacity>*/}
            {/*        </View>*/}
            {/*        <FlatList*/}
            {/*            data={watchedState ? stateAndLGA[watchedState] || [] : []}*/}
            {/*            keyExtractor={(item) => item}*/}
            {/*            renderItem={renderLGAItem}*/}
            {/*        />*/}
            {/*    </View>*/}
            {/*</Modal>*/}

            <Modal
                visible={showLGAModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Select LGA ({watchedState || 'No State Selected'})
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowLGAModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <Ionicons name="close" size={24} color={COLORS.text}/>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={lgas}  // Use the lgas state instead of direct lookup
                        keyExtractor={(item) => item}
                        renderItem={renderLGAItem}
                        ListEmptyComponent={
                            <Text style={styles.modalItemText}>
                                No LGAs available for {watchedState}
                            </Text>
                        }
                    />
                </View>
            </Modal>

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        fontFamily: 'PoppinsSemiBold',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    profileImageButton: {
        position: 'relative',
    },
    profileImageWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.border,
    },
    profileImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    profileImageHint: {
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 8,
        fontFamily: 'PoppinsRegular',
    },
    formContainer: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        fontFamily: 'PoppinsMedium',
    },
    input: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.card,
        borderRadius: 10,
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },
    selectPlaceholder: {
        fontSize: 16,
        color: COLORS.muted,
        fontFamily: 'PoppinsRegular',
    },
    disabledSelect: {
        opacity: 0.6,
    },
    disabledInput: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.border,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    disabledInputText: {
        fontSize: 16,
        color: COLORS.muted,
        fontFamily: 'PoppinsRegular',
    },
    disabledHint: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '20', // 20% opacity
    },
    genderButtonText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },
    genderButtonTextActive: {
        color: COLORS.primary,
        fontFamily: 'PoppinsMedium',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 4,
        fontFamily: 'PoppinsRegular',
    },
    buttonContainer: {
        marginBottom: 40,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: COLORS.muted,
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        fontFamily: 'PoppinsSemiBold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        fontFamily: 'PoppinsSemiBold',
    },
    modalCloseButton: {
        padding: 4,
    },
    // modalItem: {
    //     padding: 16,
    //     borderBottomWidth: 1,
    //     borderBottomColor: COLORS.border,
    // },
    modalItemText: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'PoppinsRegular',
    },

    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
});