// components/Driver/Delivery/Panels/DriverMediaUploader.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { toast } from 'sonner-native';
import DriverUtils from '../../utils/DriverUtilities';

const { width: screenWidth } = Dimensions.get('window');

// Configuration constant for easy mandatory/optional toggle
const MEDIA_CONFIG = {
    VIDEO_MANDATORY: false, // Change to true to make video required
    VIDEO_MAX_DURATION: 20, // seconds
    MIN_IMAGES: 3,
    MAX_IMAGES: 6
};

const DriverMediaUploader = ({
                                 orderId,
                                 stage,
                                 clientId,
                                 onMediaChange,
                                 minImages = MEDIA_CONFIG.MIN_IMAGES,
                                 maxImages = MEDIA_CONFIG.MAX_IMAGES,
                                 videoOptional = !MEDIA_CONFIG.VIDEO_MANDATORY,
                                 videoMaxDuration = MEDIA_CONFIG.VIDEO_MAX_DURATION
                             }) => {
    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

    // Video players
    const previewPlayer = useVideoPlayer(video?.localUri || null, player => {
        player.loop = false;
        player.muted = false;
    });

    const modalPlayer = useVideoPlayer(video?.localUri || null, player => {
        player.loop = false;
        player.muted = false;
    });

    const confirmPlayer = useVideoPlayer(previewMedia?.uri || null, player => {
        player.loop = true;
        player.muted = false;
    });

    // Memoized values
    const canAddMoreImages = useMemo(() => images.length < maxImages, [images.length, maxImages]);
    const hasVideo = useMemo(() => !!video, [video]);
    const isValid = useMemo(() => {
        const imagesValid = images.length >= minImages;
        const videoValid = videoOptional || hasVideo;
        return imagesValid && videoValid;
    }, [images.length, minImages, hasVideo, videoOptional]);

    const statusText = useMemo(() => {
        const imageText = `${images.length}/${maxImages} images • Min ${minImages} required`;
        const videoText = videoOptional
            ? `Video: ${hasVideo ? '✓' : 'Optional'}`
            : `Video: ${hasVideo ? '✓' : 'Required'}`;
        return `${imageText} • ${videoText}`;
    }, [images.length, maxImages, minImages, hasVideo, videoOptional]);

    // Notify parent of changes
    useEffect(() => {
        if (onMediaChange) {
            onMediaChange(images, video);
        }
    }, [images, video]);

    // Request permissions
    const requestPermission = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll permission to upload media.');
            return false;
        }
        return true;
    }, []);

    // Pick image
    const pickImage = useCallback(async () => {
        if (!canAddMoreImages) {
            Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
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

            if (!result.canceled && result.assets[0]) {
                setPreviewMedia(result.assets[0]);
                setMediaType('image');
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.log('Image picker error:', error);
            Alert.alert('Selection Failed', 'Failed to select image');
        }
    }, [canAddMoreImages, maxImages, requestPermission]);

    // Pick video
    const pickVideo = useCallback(async () => {
        if (hasVideo) {
            Alert.alert(
                'Replace Video',
                'You can only upload one video. Replace the current one?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Replace', onPress: () => proceedWithVideoPicker() },
                ]
            );
            return;
        }

        await proceedWithVideoPicker();
    }, [hasVideo]);

    const proceedWithVideoPicker = useCallback(async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
                videoMaxDuration: videoMaxDuration,
            });

            if (!result.canceled && result.assets[0]) {
                const videoAsset = result.assets[0];

                if (videoAsset.fileSize && videoAsset.fileSize > 50 * 1024 * 1024) {
                    Alert.alert('File Too Large', 'Please select a video smaller than 50MB.');
                    return;
                }

                setPreviewMedia(videoAsset);
                setMediaType('video');
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.log('Video picker error:', error);
            Alert.alert('Selection Failed', 'Failed to select video');
        }
    }, [requestPermission, videoMaxDuration]);

    // Upload media
    const uploadMedia = useCallback(async (mediaAsset, type) => {
        setUploading(true);
        setShowPreviewModal(false);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const fileExt = mediaAsset.uri.split('.').pop().toLowerCase();
            const isVideo = type === 'video';
            const fileName = mediaAsset.fileName || `${isVideo ? 'video' : 'image'}_${Date.now()}.${fileExt}`;
            const fileType = isVideo
                ? `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`
                : `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

            // Get presigned URL with proper structure
            const fileCategory = isVideo ? 'videos' : 'images';

            // Get presigned URL based on stage (pickup or delivery)
            const getPresignedUrl = stage === 'dropoff'
                ? DriverUtils.GetDropoffPresignedUrl
                : DriverUtils.GetPickupPresignedUrl;

            const presignedData = await getPresignedUrl({
                orderId,
                clientId,
                fileType,
                fileName,
                fileCategory
            });

            // Read file
            const fileUri = mediaAsset.uri.startsWith('file://')
                ? mediaAsset.uri
                : `file://${mediaAsset.uri}`;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            const fileBlob = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Convert to ArrayBuffer
            const byteArray = Uint8Array.from(atob(fileBlob), c => c.charCodeAt(0));

            // Upload to S3
            const uploadResponse = await fetch(presignedData.uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': String(fileInfo.size),
                },
                body: byteArray,
            });

            if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
                const s3Error = await uploadResponse.text();
                throw new Error(`S3 Upload Failed (${uploadResponse.status}): ${s3Error}`);
            }

            // Save metadata
            const mediaData = {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                key: presignedData.key,
                url: presignedData.fileURL,
                localUri: mediaAsset.uri,
                fileName,
                size: fileInfo.size,
                uploadedAt: new Date().toISOString(),
            };

            if (isVideo) {
                mediaData.duration = mediaAsset.duration;
                setVideo(mediaData);
                toast.success('Video uploaded successfully');
            } else {
                setImages(prev => [...prev, mediaData]);
                toast.success('Image uploaded successfully');
            }

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
    }, [orderId, clientId]);

    // Delete image
    const handleDeleteImage = useCallback(async (imageKey, imageName) => {
        Alert.alert(
            'Delete Image',
            `Are you sure you want to delete this ${imageName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(imageKey);
                        try {
                            await DriverUtils.DeleteFile({ key: imageKey });
                            setImages(prev => prev.filter(img => img.key !== imageKey));
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                            if (selectedImage?.key === imageKey) {
                                setModalVisible(false);
                                setSelectedImage(null);
                            }
                            toast.success('Image deleted');
                        } catch (error) {
                            console.log('Delete error:', error);
                            Alert.alert('Delete Failed', 'Failed to delete image. Please try again.');
                        } finally {
                            setDeleting(null);
                        }
                    },
                },
            ]
        );
    }, [selectedImage]);

    // Delete video
    const handleDeleteVideo = useCallback(async () => {
        if (!video) return;

        Alert.alert(
            'Delete Video',
            'Are you sure you want to delete this video?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(video.key);
                        try {
                            await DriverUtils.DeleteFile({ key: video.key });
                            setVideo(null);
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            if (modalVisible) setModalVisible(false);
                            toast.success('Video deleted');
                        } catch (error) {
                            console.log('Delete error:', error);
                            Alert.alert('Delete Failed', 'Failed to delete video. Please try again.');
                        } finally {
                            setDeleting(null);
                        }
                    },
                },
            ]
        );
    }, [video, modalVisible]);

    // Modal handlers
    const openImageModal = useCallback((image) => {
        setSelectedImage(image);
        setModalVisible(true);
    }, []);

    const openVideoModal = useCallback(async () => {
        if (video?.localUri && modalPlayer) {
            try {
                await modalPlayer.replaceAsync(video.localUri);
            } catch (error) {
                console.log('Failed to replace video:', error);
            }
        }
        setModalVisible(true);
    }, [video?.localUri, modalPlayer]);

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setSelectedImage(null);
    }, []);

    // Video player effects
    useEffect(() => {
        if (previewMedia?.uri && mediaType === 'video') {
            confirmPlayer.replaceAsync(previewMedia.uri);
        }
    }, [previewMedia?.uri, mediaType]);

    useEffect(() => {
        if (showPreviewModal && previewMedia?.uri && mediaType === 'video') {
            confirmPlayer.play();
        } else {
            confirmPlayer.pause();
        }
    }, [showPreviewModal, previewMedia?.uri, mediaType]);

    useEffect(() => {
        if (modalVisible && video?.localUri && modalPlayer) {
            setTimeout(async () => {
                try {
                    await modalPlayer.replaceAsync(video.localUri);
                    modalPlayer.play();
                } catch (error) {
                    console.warn('Failed to setup modal video:', error);
                }
            }, 150);
        } else if (modalPlayer) {
            modalPlayer.pause();
        }
    }, [modalVisible, video?.localUri, modalPlayer]);

    return (
        <View style={styles.container}>
            {/* Status Text */}
            <Text style={styles.statusText}>{statusText}</Text>

            {/* Images Section */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageList}
                contentContainerStyle={styles.imageListContent}
            >
                {/* Add Image Button */}
                <Pressable
                    style={[styles.uploadButton, !canAddMoreImages && styles.uploadButtonDisabled]}
                    onPress={pickImage}
                    disabled={uploading || !canAddMoreImages}
                >
                    <LinearGradient
                        colors={!canAddMoreImages ? ['#9ca3af', '#6b7280'] : uploading ? ['#3b82f6', '#1d4ed8'] : ['#10b981', '#059669']}
                        style={styles.uploadGradient}
                    >
                        {uploading && mediaType === 'image' ? (
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        ) : (
                            <>
                                <Ionicons name="camera" size={24} color="white" />
                                <Text style={styles.uploadText}>Add Image</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>

                {/* Image Thumbnails */}
                {images.map((image, index) => {
                    const isDeleting = deleting === image.key;
                    return (
                        <View key={image.key || image.id} style={styles.imageContainer}>
                            <Pressable
                                style={styles.imageWrapper}
                                onPress={() => !isDeleting && openImageModal(image)}
                                disabled={isDeleting}
                            >
                                <Image
                                    source={{ uri: image.localUri }}
                                    style={[styles.thumbnail, isDeleting && styles.deletingImage]}
                                    resizeMode="cover"
                                />

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
                                        <Ionicons name="eye" size={16} color="white" />
                                    </Pressable>
                                    <Pressable
                                        style={[styles.actionButton, styles.deleteButton, isDeleting && styles.disabledButton]}
                                        onPress={() => handleDeleteImage(image.key, image.fileName)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size={12} color="white" />
                                        ) : (
                                            <Ionicons name="trash" size={16} color="white" />
                                        )}
                                    </Pressable>
                                </View>
                            </Pressable>
                            <Text style={styles.imageIndex}>{index + 1}</Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Video Section */}
            <View style={styles.videoSection}>
                <Text style={styles.videoLabel}>
                    Video Evidence {videoOptional ? '(Optional)' : '(Required)'} - {videoMaxDuration}s max
                </Text>

                {hasVideo ? (
                    <View style={styles.videoWrapper}>
                        <VideoView
                            player={previewPlayer}
                            style={[styles.videoPreview, deleting === video.key && styles.deletingVideo]}
                            contentFit="cover"
                            nativeControls={false}
                        />

                        {deleting === video.key && (
                            <View style={styles.deletingOverlay}>
                                <ActivityIndicator size="large" color="white" />
                                <Text style={styles.deletingText}>Deleting...</Text>
                            </View>
                        )}

                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={styles.videoOverlay}
                        />

                        <View style={styles.videoActions}>
                            <Pressable
                                style={[styles.actionButton, deleting === video.key && styles.disabledButton]}
                                onPress={openVideoModal}
                                disabled={deleting === video.key}
                            >
                                <Ionicons name="play-circle" size={20} color="white" />
                            </Pressable>
                            <Pressable
                                style={[styles.actionButton, deleting === video.key && styles.disabledButton]}
                                onPress={pickVideo}
                                disabled={deleting === video.key}
                            >
                                <Ionicons name="camera" size={20} color="white" />
                            </Pressable>
                            <Pressable
                                style={[styles.actionButton, styles.deleteButton, deleting === video.key && styles.disabledButton]}
                                onPress={handleDeleteVideo}
                                disabled={deleting === video.key}
                            >
                                {deleting === video.key ? (
                                    <ActivityIndicator size={16} color="white" />
                                ) : (
                                    <Ionicons name="trash" size={20} color="white" />
                                )}
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable
                        style={[styles.videoUploadButton, !videoOptional && !hasVideo && styles.videoRequired]}
                        onPress={pickVideo}
                        disabled={uploading}
                    >
                        <LinearGradient
                            colors={uploading && mediaType === 'video' ? ['#3b82f6', '#1d4ed8'] : ['#8b5cf6', '#7c3aed']}
                            style={styles.videoUploadGradient}
                        >
                            {uploading && mediaType === 'video' ? (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.uploadingText}>Uploading...</Text>
                                </View>
                            ) : (
                                <>
                                    <Ionicons name="videocam" size={32} color="white" />
                                    <Text style={styles.videoUploadText}>Add Video</Text>
                                    <Text style={styles.videoUploadSubtext}>Max {videoMaxDuration} seconds</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                )}
            </View>

            {/* Validation Warning */}
            {!isValid && (
                <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color="#f59e0b" />
                    <Text style={styles.warningText}>
                        {images.length < minImages && `Upload at least ${minImages} images. `}
                        {!videoOptional && !hasVideo && 'Video is required.'}
                    </Text>
                </View>
            )}

            {/* Image Preview Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible && selectedImage}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Image Preview</Text>
                            <Pressable style={styles.closeButton} onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        {selectedImage && (
                            <>
                                <Image
                                    source={{ uri: selectedImage.localUri }}
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
                                        <ActivityIndicator size={16} color="white" />
                                        <Text style={styles.modalDeleteText}>Deleting...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={18} color="white" />
                                        <Text style={styles.modalDeleteText}>Delete</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Video Preview Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible && video && !selectedImage}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Video Preview</Text>
                            <Pressable style={styles.closeButton} onPress={closeModal}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        {video && (
                            <>
                                <VideoView
                                    player={modalPlayer}
                                    style={styles.modalVideo}
                                    contentFit="contain"
                                    nativeControls={true}
                                />

                                <View style={styles.videoMetadata}>
                                    <Text style={styles.metadataText}>
                                        {video.fileName || 'Unnamed video'}
                                    </Text>
                                    {video.uploadedAt && (
                                        <Text style={styles.metadataSubtext}>
                                            Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                                        </Text>
                                    )}
                                    {video.duration && (
                                        <Text style={styles.metadataSubtext}>
                                            Duration: {Math.round(video.duration / 1000)}s
                                        </Text>
                                    )}
                                </View>
                            </>
                        )}

                        <View style={styles.modalActions}>
                            <Pressable
                                style={styles.modalReplaceButton}
                                onPress={() => {
                                    closeModal();
                                    pickVideo();
                                }}
                            >
                                <Ionicons name="camera" size={18} color="white" />
                                <Text style={styles.modalButtonText}>Replace</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.modalDeleteButton,
                                    deleting === video?.key && styles.modalDeleteButtonDisabled
                                ]}
                                onPress={() => {
                                    closeModal();
                                    handleDeleteVideo();
                                }}
                                disabled={deleting === video?.key}
                            >
                                {deleting === video?.key ? (
                                    <>
                                        <ActivityIndicator size={16} color="white" />
                                        <Text style={styles.modalButtonText}>Deleting...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={18} color="white" />
                                        <Text style={styles.modalButtonText}>Delete</Text>
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
                            <Text style={styles.modalTitle}>
                                Upload this {mediaType}?
                            </Text>
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setShowPreviewModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        {previewMedia && (
                            mediaType === 'image' ? (
                                <Image
                                    source={{ uri: previewMedia.uri }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <VideoView
                                    player={confirmPlayer}
                                    style={styles.previewVideo}
                                    contentFit="contain"
                                    nativeControls={true}
                                />
                            )
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
                                onPress={() => previewMedia && uploadMedia(previewMedia, mediaType)}
                                disabled={uploading}
                            >
                                <LinearGradient
                                    colors={uploading ? ['#9ca3af', '#6b7280'] : mediaType === 'video' ? ['#8b5cf6', '#7c3aed'] : ['#10b981', '#059669']}
                                    style={styles.confirmGradient}
                                >
                                    {uploading ? (
                                        <>
                                            <ActivityIndicator size="small" color="white" />
                                            <Text style={styles.confirmButtonText}>Uploading...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload" size={18} color="white" />
                                            <Text style={styles.confirmButtonText}>Upload {mediaType}</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginBottom: 12,
    },
    imageList: {
        marginBottom: 16,
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
    deletingImage: {
        opacity: 0.5,
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
    disabledButton: {
        opacity: 0.5,
    },
    imageIndex: {
        fontSize: 10,
        fontFamily: 'PoppinsRegular',
        color: '#6b7280',
        marginTop: 4,
    },
    deletingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    deletingText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'PoppinsSemiBold',
        marginTop: 8,
    },
    videoSection: {
        marginBottom: 12,
    },
    videoLabel: {
        fontSize: 12,
        fontFamily: 'PoppinsMedium',
        color: '#374151',
        marginBottom: 8,
    },
    videoWrapper: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    videoPreview: {
        width: '100%',
        height: '100%',
    },
    deletingVideo: {
        opacity: 0.5,
    },
    videoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    videoActions: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    videoUploadButton: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    videoRequired: {
        borderColor: '#f59e0b',
    },
    videoUploadGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoUploadText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
        marginTop: 8,
    },
    videoUploadSubtext: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 6,
        backgroundColor: '#fef3c7',
        padding: 8,
        borderRadius: 8,
    },
    warningText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#f59e0b',
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
    modalVideo: {
        width: '100%',
        height: 300,
        borderRadius: 12,
    },
    imageMetadata: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    videoMetadata: {
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
        gap: 16,
        marginTop: 16,
    },
    modalReplaceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    modalDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    modalDeleteButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
    },
    modalDeleteText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
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
    previewVideo: {
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

export default DriverMediaUploader;