// utils/cloudinary.js
import ClientUtils from "./ClientUtilities";
import {useMutation} from "@tanstack/react-query";

export const uploadToCloudinary = async (imageUri, timestamp, signature, public_id, api_key) => {
    try {

        // These are NOT sensitive
        const cloudName = 'dc75kyrne';

        // === Step 1: Get File Info ===
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const fileSizeMB = blob.size / (1024 * 1024);
        const mimeType = blob.type;

        // === Step 2: Validate size and type ===
        if (fileSizeMB > 5) {
            throw new Error('File must be less than 5MB');
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(mimeType)) {
            throw new Error('Only JPG, JPEG, or PNG files are allowed');
        }

        // === Step 3: Extract file extension ===
        const extension = mimeType.split('/')[1]; // jpeg, png, etc.
        const fileName = `profilePic.${extension}`;

        // Prepare the file
        const file = {
            uri: imageUri,
            type: mimeType,
            name: fileName,
        };

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('public_id', public_id);
        formData.append('api_key', api_key);

        // Upload with progress tracking
        const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.log('Cloudinary response:', errorText);
            throw new Error('Upload failed: ' + errorText);
        }

        const data = await result.json();
        return data.secure_url; // The HTTPS URL for the image

    } catch (error) {
        console.log('Upload error:', error);
        throw error;
    }
};

