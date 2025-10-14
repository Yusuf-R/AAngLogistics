// components/Driver/Account/Verification/SingleImageUploader.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    Modal,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import DriverUtils from '../../../../utils/DriverUtilities';

function SingleImageUploader({
                                 title,
                                 imageUrl,
                                 onUpload,
                                 onDelete,
                                 required = false,
                                 description = null,
                                 uploadMetadata = null
                             }) {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please grant camera roll permission to upload images.'
            );
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                // aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: false
            });

            if (!result.canceled) {
                setPreviewImage(result.assets[0]);
                setShowPreview(true);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Selection Failed', 'Failed to select image');
        }
    };

    const uploadImage = async (imageAsset) => {
        setUploading(true);
        setShowPreview(false);

        try {
            // Get file extension
            const fileExt = imageAsset.uri.split('.').pop().toLowerCase();
            const fileName = `verification_${Date.now()}.${fileExt}`;
            const fileType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

            const presignedData = await DriverUtils.GetDriverPresignedUrl({
                fileType,
                fileName,
                ...uploadMetadata
            });

            // Read file
            const fileUri = imageAsset.uri.startsWith('file://')
                ? imageAsset.uri
                : `file://${imageAsset.uri}`;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            const fileBlob = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64
            });

            // Convert to ArrayBuffer
            const byteArray = Uint8Array.from(atob(fileBlob), c => c.charCodeAt(0));

            // Upload to S3
            const uploadResponse = await fetch(presignedData.uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': String(fileInfo.size)
                },
                body: byteArray
            });

            if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
                const s3Error = await uploadResponse.text();
                throw new Error(`Upload Failed (${uploadResponse.status}): ${s3Error}`);
            }

            // Return the S3 URL to parent component
            onUpload(presignedData.fileURL);

            // Clear preview state after successful upload
            setPreviewImage(null);

        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert(
                'Upload Failed',
                error.message.includes('Upload Failed')
                    ? 'Server rejected the file. Try again.'
                    : 'Failed to upload image. Please try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Image',
            'Are you sure you want to delete this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            // Extract key from URL and delete from S3
                            if (imageUrl) {
                                const key = imageUrl.split('.com/')[1];
                                await DriverUtils.DeleteFile({ key });
                            }
                            onDelete();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Delete Failed', 'Failed to delete image');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {title}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                    {description && (
                        <Text style={styles.description}>{description}</Text>
                    )}
                </View>

                {imageUrl ? (
                    <View style={styles.imageContainer}>
                        <Pressable
                            style={styles.imageWrapper}
                            onPress={() => setShowImageModal(true)}
                            disabled={deleting}
                        >
                            <Image
                                source={{ uri: imageUrl }}
                                style={[styles.image, deleting && styles.imageDeleting]}
                                resizeMode="cover"
                            />
                            {deleting && (
                                <View style={styles.deletingOverlay}>
                                    <ActivityIndicator size="small" color="white" />
                                </View>
                            )}
                        </Pressable>

                        <View style={styles.imageActions}>
                            <Pressable
                                style={styles.actionButton}
                                onPress={() => setShowImageModal(true)}
                                disabled={deleting}
                            >
                                <Ionicons name="eye" size={20} color="#6b7280" />
                                <Text style={styles.actionText}>View</Text>
                            </Pressable>

                            <Pressable
                                style={styles.actionButton}
                                onPress={pickImage}
                                disabled={deleting || uploading}
                            >
                                <Ionicons name="refresh" size={20} color="#6b7280" />
                                <Text style={styles.actionText}>Replace</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionButton, styles.deleteAction]}
                                onPress={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator size={16} color="#ef4444" />
                                ) : (
                                    <Ionicons name="trash" size={20} color="#ef4444" />
                                )}
                                <Text style={[styles.actionText, styles.deleteText]}>
                                    Delete
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable
                        style={styles.uploadButton}
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        <LinearGradient
                            colors={uploading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                            style={styles.uploadGradient}
                        >
                            {uploading ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.uploadText}>Uploading...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={24} color="white" />
                                    <Text style={styles.uploadText}>Upload Image</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                )}
            </View>

            {/* Preview Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPreview}
                onRequestClose={() => setShowPreview(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowPreview(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Upload this image?</Text>
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setShowPreview(false)}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        {previewImage && (
                            <Image
                                source={{ uri: previewImage.uri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        )}

                        <View style={styles.modalActions}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setShowPreview(false)}
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
                                            <ActivityIndicator size="small" color="white" />
                                            <Text style={styles.confirmButtonText}>Uploading...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={18} color="white" />
                                            <Text style={styles.confirmButtonText}>Confirm Upload</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image View Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showImageModal}
                onRequestClose={() => setShowImageModal(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowImageModal(false)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setShowImageModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </Pressable>
                        </View>

                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16
    },
    header: {
        marginBottom: 12
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    required: {
        color: '#ef4444'
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    imageWrapper: {
        width: '100%',
        height: 200,
        backgroundColor: '#f3f4f6'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    imageDeleting: {
        opacity: 0.5
    },
    deletingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff'
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 6,
        borderRightWidth: 1,
        borderRightColor: '#e5e7eb'
    },
    deleteAction: {
        borderRightWidth: 0
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280'
    },
    deleteText: {
        color: '#ef4444'
    },
    uploadButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#d1d5db'
    },
    uploadGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    closeButton: {
        padding: 4
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        backgroundColor: '#f3f4f6'
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280'
    },
    confirmButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden'
    },
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default SingleImageUploader;