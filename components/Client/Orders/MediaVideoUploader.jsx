// components/MediaVideoUploader.js
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Alert,
    Modal,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {useVideoPlayer, VideoView} from 'expo-video'
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import useMediaStore from '../../../store/useMediaStore';
import ClientUtils from "../../../utils/ClientUtilities";

const {width: screenWidth} = Dimensions.get('window');

const MediaVideoUploader = ({orderId}) => {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const {video, setVideo, clearVideo} = useMediaStore();

    // ADD these new state variables for video players
    const previewPlayer = useVideoPlayer(video?.localUri || null, player => {
        player.loop = false;
        player.muted = false;
    });

    const modalPlayer = useVideoPlayer(video?.localUri || null, player => {
        player.loop = false;
        player.muted = false;
    });

    const confirmPlayer = useVideoPlayer(previewVideo?.uri || null, player => {
        player.loop = true;
        player.muted = false;
    });


    // Memoized values for performance
    const hasVideo = useMemo(() => !!video, [video]);
    const statusText = useMemo(() => `Max 33 seconds • ${hasVideo ? '1/1' : '0/1'} video`, [hasVideo]);

    const requestPermission = useCallback(async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll permission to upload videos.');
            return false;
        }
        return true;
    }, []);

    const pickVideo = useCallback(async () => {
        if (hasVideo) {
            Alert.alert(
                'Replace Video',
                'You can only upload one video. Replace the current one?',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Replace', onPress: () => proceedWithVideoPicker()},
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
                videoMaxDuration: 33, // 33 seconds max
            });

            if (!result.canceled) {
                const videoAsset = result.assets[0];

                // Check file size (optional - add if needed)
                if (videoAsset.fileSize && videoAsset.fileSize > 50 * 1024 * 1024) { // 50MB limit
                    Alert.alert('File Too Large', 'Please select a video smaller than 50MB.');
                    return;
                }

                // Show preview modal for confirmation
                setPreviewVideo(videoAsset);
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.error('Video picker error:', error);
            Alert.alert('Selection Failed', 'Failed to select video');
        }
    }, [requestPermission]);

    const uploadVideo = useCallback(async (videoAsset) => {
        setUploading(true);
        setShowPreviewModal(false);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            // 1. Get file extension and prepare metadata
            const fileExt = videoAsset.uri.split('.').pop().toLowerCase() || 'mp4';
            const fileName = videoAsset.fileName || `video_${Date.now()}.${fileExt}`;
            const fileType = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;

            // 2. Get presigned URL
            const presignedData = await ClientUtils.GetPresignedUrl({
                orderId,
                fileType,
                fileName,
                fileCategory: 'videos'
            });

            // 3. Read file as binary for upload
            const fileUri = videoAsset.uri.startsWith('file://')
                ? videoAsset.uri
                : `file://${videoAsset.uri}`;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            const fileBlob = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // 4. Convert to ArrayBuffer for S3
            const byteArray = Uint8Array.from(atob(fileBlob), c => c.charCodeAt(0));

            // 5. Upload with proper headers
            const uploadResponse = await fetch(presignedData.uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': String(fileInfo.size),
                },
                body: byteArray,
            });

            // 6. Verify upload
            if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
                const s3Error = await uploadResponse.text();
                throw new Error(`S3 Upload Failed (${uploadResponse.status}): ${s3Error}`);
            }

            // 7. Save metadata
            const videoData = {
                key: presignedData.key,
                url: presignedData.fileURL,
                localUri: videoAsset.uri,
                fileName,
                size: fileInfo.size,
                duration: videoAsset.duration,
                uploadedAt: new Date().toISOString(),
                uploaded: true,
            };

            setVideo(videoData);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error('Upload error:', error);
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
    }, [orderId, setVideo]);

    const handleDeleteVideo = useCallback(async () => {
        if (!video) return;

        Alert.alert(
            'Delete Video',
            'Are you sure you want to delete this video?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await ClientUtils.DeleteFile({key: video.key});
                            clearVideo();
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                            // Close modal if it's open
                            if (modalVisible) {
                                setModalVisible(false);
                            }
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Delete Failed', 'Failed to delete video. Please try again.');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    }, [video, clearVideo, modalVisible]);

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
    }, []);

    // Render upload button
    const renderUploadButton = useMemo(() => (
        <Pressable
            style={[styles.uploadButton, hasVideo && styles.uploadButtonDisabled]}
            onPress={pickVideo}
            disabled={uploading || hasVideo}
        >
            <LinearGradient
                colors={hasVideo ? ['#9ca3af', '#6b7280'] : uploading ? ['#3b82f6', '#1d4ed8'] : ['#8b5cf6', '#7c3aed']}
                style={styles.uploadGradient}
            >
                {uploading ? (
                    <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color="white"/>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                ) : (
                    <>
                        <Ionicons name="videocam" size={32} color="white"/>
                        <Text style={styles.uploadText}>Add Video</Text>
                        <Text style={styles.uploadSubtext}>Max 33 seconds</Text>
                    </>
                )}
            </LinearGradient>
        </Pressable>
    ), [hasVideo, uploading, pickVideo]);

    useEffect(() => {
        if (previewVideo?.uri) {
            confirmPlayer.replaceAsync(previewVideo.uri);
        }
    }, [previewVideo?.uri]);

    useEffect(() => {
        if (showPreviewModal && previewVideo?.uri) {
            confirmPlayer.play();
        } else {
            confirmPlayer.pause();
        }
    }, [showPreviewModal, previewVideo?.uri]);

    useEffect(() => {
        const handleModalVideo = async () => {
            if (modalVisible && video?.localUri && modalPlayer) {
                try {
                    // Small delay to ensure modal is fully rendered
                    setTimeout(async () => {
                        await modalPlayer.replaceAsync(video.localUri);
                        modalPlayer.play();
                    }, 150);
                } catch (error) {
                    console.warn('Failed to setup modal video:', error);
                }
            } else if (modalPlayer) {
                modalPlayer.pause();
            }
        };

        handleModalVideo();
    }, [modalVisible, video?.localUri, modalPlayer]);

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>{statusText}</Text>
                </View>

                <View style={styles.videoContainer}>
                    {hasVideo ? (
                        <View style={styles.videoWrapper}>
                            <VideoView
                                player={previewPlayer}
                                style={[styles.videoPreview, deleting && styles.deletingVideo]}
                                contentFit="cover"
                                nativeControls={false}
                            />

                            {/* Deleting overlay */}
                            {deleting && (
                                <View style={styles.deletingOverlay}>
                                    <ActivityIndicator size="large" color="white"/>
                                    <Text style={styles.deletingText}>Deleting...</Text>
                                </View>
                            )}

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.videoOverlay}
                            />

                            <View style={styles.videoActions}>
                                <Pressable
                                    style={[styles.actionButton, deleting && styles.disabledButton]}
                                    onPress={openVideoModal}
                                    disabled={deleting}
                                >
                                    <Ionicons name="play-circle" size={20} color="white"/>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, deleting && styles.disabledButton]}
                                    onPress={pickVideo}
                                    disabled={deleting}
                                >
                                    <Ionicons name="camera" size={20} color="white"/>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionButton, styles.deleteButton, deleting && styles.disabledButton]}
                                    onPress={handleDeleteVideo}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <ActivityIndicator size={16} color="white"/>
                                    ) : (
                                        <Ionicons name="trash" size={20} color="white"/>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        renderUploadButton
                    )}
                </View>

                {/* Video Preview Modal (After Upload) */}
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
                                <Text style={styles.modalTitle}>Video Preview</Text>
                                <Pressable style={styles.closeButton} onPress={closeModal}>
                                    <Ionicons name="close" size={24} color="#374151"/>
                                </Pressable>
                            </View>

                            {video && (
                                <>
                                    <VideoView
                                        player={modalPlayer}
                                        style={styles.modalVideo}
                                        contentFit="contain"
                                        nativeControls={true}
                                        key={`modal-video-${modalVisible}`}
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
                                    <Ionicons name="camera" size={18} color="white"/>
                                    <Text style={styles.modalButtonText}>Replace</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.modalDeleteButton,
                                        deleting && styles.modalDeleteButtonDisabled
                                    ]}
                                    onPress={() => {
                                        closeModal();
                                        handleDeleteVideo();
                                    }}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <ActivityIndicator size={16} color="white"/>
                                            <Text style={styles.modalButtonText}>Deleting...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="trash" size={18} color="white"/>
                                            <Text style={styles.modalButtonText}>Delete</Text>
                                        </>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Upload Confirmation Modal (Before Upload) */}
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
                                <Text style={styles.modalTitle}>Upload this video?</Text>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowPreviewModal(false)}
                                >
                                    <Ionicons name="close" size={24} color="#374151"/>
                                </Pressable>
                            </View>

                            {previewVideo && (
                                <VideoView
                                    player={confirmPlayer}
                                    style={styles.previewVideo}
                                    contentFit="contain"
                                    nativeControls={true}
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
                                    onPress={() => previewVideo && uploadVideo(previewVideo)}
                                    disabled={uploading}
                                >
                                    <LinearGradient
                                        colors={uploading ? ['#9ca3af', '#6b7280'] : ['#8b5cf6', '#7c3aed']}
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
                                                <Text style={styles.confirmButtonText}>Upload Video</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    videoContainer: {
        marginBottom: 12,
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
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        marginTop: 8,
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
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    uploadButton: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
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
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
        marginTop: 8,
    },
    uploadSubtext: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    uploadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadingText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: 'white',
        marginTop: 8,
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
    modalVideo: {
        width: '100%',
        height: 300,
        borderRadius: 12,
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
    previewModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: screenWidth * 0.9,
        maxHeight: '70%',
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

export default MediaVideoUploader;