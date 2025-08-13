// components/MediaImageUploader.js
import React, {useState, useCallback, useMemo} from 'react';
import {Buffer} from 'buffer';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Image,
    Alert,
    Modal,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useMediaStore from '../../../store/useMediaStore';
import ClientUtils from "../../../utils/ClientUtilities";
import * as FileSystem from 'expo-file-system';

const {width: screenWidth} = Dimensions.get('window');

const MediaImageUploader = ({orderId}) => {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const {images, addImage, removeImage} = useMediaStore();

    // Memoized values for performance
    const canAddMore = useMemo(() => images.length < 6, [images.length]);
    const isValid = useMemo(() => images.length >= 3, [images.length]);
    const imageCount = useMemo(() => `${images.length}/6 images • Min 3 required`, [images.length]);

    const requestPermission = useCallback(async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll permission to upload images.');
            return false;
        }
        return true;
    }, []);

    const pickImage = useCallback(async () => {
        if (!canAddMore) {
            Alert.alert('Limit Reached', 'You can only upload up to 6 images.');
            return;
        }

        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: false,
                selectionLimit: 1,
                compress: 0.8,
            });

            if (!result.canceled) {
                setPreviewImage(result.assets[0]);
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Selection Failed', 'Failed to select image');
        }
    }, [canAddMore, requestPermission]);

    const uploadImage = useCallback(async (imageAsset) => {
        // if (imageAsset.fileSize > 10 * 1024 * 1024) {
        //     throw new Error('File size exceeds 10MB limit');
        // }
        setUploading(true);
        setShowPreviewModal(false);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            // 1. Get file extension from URI (critical fix)
            const fileExt = imageAsset.uri.split('.').pop().toLowerCase();
            const fileName = `image_${Date.now()}.${fileExt}`;
            const fileType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

            // 2. Get presigned URL (match backend exactly)
            const presignedData = await ClientUtils.GetPresignedUrl({
                orderId,
                fileType,
                fileName,
                fileCategory: 'images'
            });

            // 3. Read file as binary blob (native format)
            const fileUri = imageAsset.uri.startsWith('file://')
                ? imageAsset.uri
                : `file://${imageAsset.uri}`;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            const fileBlob = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // 4. Convert to ArrayBuffer (S3 expects raw binary)
            const byteArray = Uint8Array.from(atob(fileBlob), c => c.charCodeAt(0));

            // 5. Upload with EXACT headers from presigned URL
            const uploadResponse = await fetch(presignedData.uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': String(fileInfo.size),
                },
                body: byteArray,
            });

            // 6. Verify upload (critical change)
            if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
                const s3Error = await uploadResponse.text();
                throw new Error(`S3 Upload Failed (${uploadResponse.status}): ${s3Error}`);
            }

            // 7. Save metadata
            const imageData = {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                key: presignedData.key,
                url: presignedData.fileURL,
                localUri: imageAsset.uri,
                fileName,
                size: fileInfo.size,
                uploadedAt: new Date().toISOString(),
            };

            addImage(imageData);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.log('Upload error:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Upload Failed',
                error.message.includes('S3 Upload Failed')
                    ? 'Server rejected the file. Try again.'
                    : error.message
            );
        } finally {
            setUploading(false);
        }
    }, [orderId, addImage]);

    const handleDeleteImage = useCallback(async (imageKey, imageName = 'image') => {
        Alert.alert(
            'Delete Image',
            `Are you sure you want to delete this ${imageName}?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(imageKey); // Set deleting state
                        try {
                            // Delete from S3
                            await ClientUtils.DeleteFile({key: imageKey});
                            removeImage(imageKey);
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                            // Close modal if deleting current selected image
                            if (selectedImage?.key === imageKey) {
                                setModalVisible(false);
                                setSelectedImage(null);
                            }
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Delete Failed', 'Failed to delete image. Please try again.');
                        } finally {
                            setDeleting(null); // Clear deleting state
                        }
                    },
                },
            ]
        );
    }, [removeImage, selectedImage]);

    const openImageModal = useCallback((image) => {
        setSelectedImage(image);
        setModalVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setSelectedImage(null);
    }, []);

    // Render upload button
    const renderUploadButton = useMemo(() => (
        <Pressable
            style={[styles.uploadButton, !canAddMore && styles.uploadButtonDisabled]}
            onPress={pickImage}
            disabled={uploading || !canAddMore}
        >
            <LinearGradient
                colors={!canAddMore ? ['#9ca3af', '#6b7280'] : uploading ? ['#3b82f6', '#1d4ed8'] : ['#10b981', '#059669']}
                style={styles.uploadGradient}
            >
                {uploading ? (
                    <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color="white"/>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                ) : (
                    <>
                        <Ionicons name="camera" size={24} color="white"/>
                        <Text style={styles.uploadText}>Add Image</Text>
                    </>
                )}
            </LinearGradient>
        </Pressable>
    ), [canAddMore, uploading, pickImage]);

    // Render image item (memoized for performance)
    const ImageItem = React.memo(({image, index}) => {
        const isDeleting = deleting === image.key;

        return (
            <View key={image.key || image.id} style={styles.imageContainer}>
                <Pressable
                    style={styles.imageWrapper}
                    onPress={() => !isDeleting && openImageModal(image)}
                    disabled={isDeleting}
                >
                    <Image
                        source={{uri: image.localUri}}
                        style={[styles.thumbnail, isDeleting && styles.deletingImage]}
                        resizeMode="cover"
                    />

                    {/* Deleting overlay */}
                    {isDeleting && (
                        <View style={styles.deletingOverlay}>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={styles.deletingText}>Deleting...</Text>
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)']}
                        style={styles.imageOverlay}
                    />
                    <View style={styles.imageActions}>
                        <Pressable
                            style={[styles.actionButton, isDeleting && styles.disabledButton]}
                            onPress={() => openImageModal(image)}
                            disabled={isDeleting}
                        >
                            <Ionicons name="eye" size={16} color="white"/>
                        </Pressable>
                        <Pressable
                            style={[styles.actionButton, styles.deleteButton, isDeleting && styles.disabledButton]}
                            onPress={() => handleDeleteImage(image.key, image.fileName)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size={12} color="white" />
                            ) : (
                                <Ionicons name="trash" size={16} color="white"/>
                            )}
                        </Pressable>
                    </View>
                </Pressable>
                <Text style={styles.imageIndex}>{index + 1}</Text>
            </View>
        );
    });

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>{imageCount}</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageList}
                    contentContainerStyle={styles.imageListContent}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={6}
                    windowSize={10}
                >
                    {renderUploadButton}

                    {images.map((image, index) => (
                        <ImageItem
                            key={image.key || image.id}
                            image={image}
                            index={index}
                        />
                    ))}
                </ScrollView>

                {/* Image Preview Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalContainer}>
                        <Pressable style={styles.modalBackdrop} onPress={closeModal}/>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Image Preview</Text>
                                <Pressable style={styles.closeButton} onPress={closeModal}>
                                    <Ionicons name="close" size={24} color="#374151"/>
                                </Pressable>
                            </View>

                            {selectedImage && (
                                <>
                                    <Image
                                        source={{uri: selectedImage.localUri}}
                                        style={styles.modalImage}
                                        resizeMode="contain"
                                    />

                                    <View style={styles.imageMetadata}>
                                        <Text style={styles.metadataText}>
                                            {selectedImage.fileName || 'Unnamed image'}
                                        </Text>
                                        {selectedImage.uploadedAt && (
                                            <Text style={styles.metadataSubtext}>
                                                Uploaded: {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </View>
                                </>
                            )}
                            <View style={styles.modalActions}>
                                <Pressable
                                    style={[
                                        styles.modalDeleteButton,
                                        deleting === selectedImage?.key && styles.modalDeleteButtonDisabled
                                    ]}
                                    onPress={() => {
                                        if (selectedImage && deleting !== selectedImage.key) {
                                            handleDeleteImage(selectedImage.key, selectedImage.fileName);
                                        }
                                    }}
                                    disabled={deleting === selectedImage?.key}
                                >
                                    {deleting === selectedImage?.key ? (
                                        <>
                                            <ActivityIndicator size={16} color="white"/>
                                            <Text style={styles.modalDeleteText}>Deleting...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="trash" size={18} color="white"/>
                                            <Text style={styles.modalDeleteText}>Delete</Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Upload Confirmation Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showPreviewModal}
                    onRequestClose={() => setShowPreviewModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <Pressable
                            style={styles.modalBackdrop}
                            onPress={() => setShowPreviewModal(false)}
                        />
                        <View style={styles.previewModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Upload this image?</Text>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowPreviewModal(false)}
                                >
                                    <Ionicons name="close" size={24} color="#374151"/>
                                </Pressable>
                            </View>

                            {previewImage && (
                                <Image
                                    source={{uri: previewImage.uri}}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            )}

                            <View style={styles.previewActions}>
                                <Pressable
                                    style={styles.cancelButton}
                                    onPress={() => setShowPreviewModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.confirmButton}
                                    onPress={() => previewImage && uploadImage(previewImage)}
                                    disabled={uploading}
                                >
                                    <LinearGradient
                                        colors={uploading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                                        style={styles.confirmGradient}
                                    >
                                        {uploading ? (
                                            <>
                                                <ActivityIndicator size="small" color="white"/>
                                                <Text style={styles.confirmButtonText}>Uploading...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="cloud-upload" size={18} color="white"/>
                                                <Text style={styles.confirmButtonText}>Upload Image</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Status Messages */}
                {!isValid && (
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={16} color="#f59e0b"/>
                        <Text style={styles.warningText}>
                            Please upload at least 3 images to proceed
                        </Text>
                    </View>
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    header: {
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
    },
    imageList: {
        marginBottom: 12,
    },
    imageListContent: {
        paddingRight: 20,
    },
    uploadButton: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
    },
    uploadButtonDisabled: {
        opacity: 0.5,
    },
    uploadGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: 'white',
        marginTop: 4,
    },
    uploadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadingText: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: 'white',
        marginTop: 4,
    },
    imageContainer: {
        marginRight: 12,
        alignItems: 'center',
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    imageActions: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
    },
    actionButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
    },
    imageIndex: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: screenWidth * 0.9,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    modalImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
    },
    imageMetadata: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    metadataText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        textAlign: 'center',
    },
    metadataSubtext: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 2,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    modalDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    modalDeleteText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 6,
    },
    warningText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#f59e0b',
    },
    previewModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: screenWidth * 0.9,
        maxHeight: '70%',
    },
    previewImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#6b7280',
    },
    confirmButton: {
        flex: 1.5,
        borderRadius: 8,
        overflow: 'hidden',
    },
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    confirmButtonText: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
    },
});

export default MediaImageUploader;