import React, {useState, useCallback} from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {useRouter} from 'expo-router';
import {uploadToCloudinary} from '../../../../../utils/Cloudinary';
import ClientUtils from "../../../../../utils/ClientUtilities";
import SessionManager from "../../../../../lib/SessionManager";
import StatusModal from "../../../../StatusModal/StatusModal";

// Reuse your existing colors
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

function UpdateAvatar({userData}) {
    const router = useRouter();
    const [profileImage, setProfileImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Updating profile picture...');

    const handleImagePicker = useCallback(() => {
        Alert.alert(
            'Update Profile Picture',
            'Choose an option',
            [
                {text: 'Take Photo', onPress: () => pickImage('camera')},
                {text: 'Choose from Library', onPress: () => pickImage('gallery')},
                {text: 'Cancel', style: 'cancel'},
            ],
            {cancelable: true}
        );
    }, []);

    const pickImage = async (source) => {
        setImageLoading(true);
        try {
            const options = {
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            };

            const result = await (source === 'camera'
                ? ImagePicker.launchCameraAsync(options)
                : ImagePicker.launchImageLibraryAsync(options));

            if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select image. Please try again.');
        } finally {
            setImageLoading(false);
        }
    };

    const handleImageUpload = async () => {
        if (!profileImage || profileImage === userData?.avatar) {
            return userData?.avatar;
        }

        try {
            const {timestamp, signature, public_id, api_key} = await ClientUtils.GetSignedUrl();
            return await uploadToCloudinary(profileImage, timestamp, signature, public_id, api_key);
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Image upload failed. Please try again.');
        }
    };

    const handleSubmit = async () => {
        setModalVisible(true);
        setModalStatus('loading');
        setModalMessage('Updating profile picture...');

        try {
            const imageUrl = await handleImageUpload();

            // Update profile with just the avatar
            const response = await ClientUtils.UpdateAvatar({avatar: imageUrl});

            if (response.user) {
                await SessionManager.updateUser(response.user);
                setModalStatus('success');
                setModalMessage('Avatar updated successfully!');

                setTimeout(() => {
                    setModalVisible(false);
                    router.back();
                }, 2000);
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            setModalStatus('error');
            setModalMessage(error.message || 'Failed to update profile picture');
        }
    };

    return (
        <View style={styles.container}>
            {/* Main Content */}
            <View style={styles.content}>
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
                                    <Ionicons name="person" size={60} color={COLORS.muted}/>
                                </View>
                            )}
                            {imageLoading && (
                                <View style={styles.profileImageOverlay}>
                                    <ActivityIndicator color="white" size="large"/>
                                </View>
                            )}
                        </View>
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="white"/>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.profileImageHint}>
                        Tap the image to change your profile picture
                    </Text>
                </View>

                {/* Update Button - Only show if new image selected */}
                {profileImage && profileImage !== userData?.avatar && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSubmit}
                        disabled={imageLoading}
                    >
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Modal */}
            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        fontFamily: 'PoppinsSemiBold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    profileImageButton: {
        position: 'relative',
    },
    profileImageWrapper: {
        width: 350,
        height: 350,
        borderRadius: 100,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
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
        bottom: 10,
        right: 10,
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    profileImageHint: {
        fontSize: 16,
        color: COLORS.muted,
        marginTop: 16,
        textAlign: 'center',
        fontFamily: 'PoppinsRegular',
        paddingHorizontal: 20,
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
    buttonText: {
        fontSize: 18,
        color: 'white',
        fontFamily: 'PoppinsSemiBold',
    },
});

export default UpdateAvatar;