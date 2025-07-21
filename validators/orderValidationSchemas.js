// validationSchemas.js - Yup validation schemas for each step
import * as Yup from 'yup';

// Step 1: Order Type & Basic Info
export const stepOneSchema = Yup.object().shape({
    orderType: Yup.string().required('Please select an order type.'),
    scheduledPickup: Yup.date().nullable().when('orderType', {
        is: 'scheduled',
        then: (s) => s.required('Please select a pickup time.')
    }),
    package: Yup.object().shape({
        category: Yup.string().required('Please select a package category.'),
        description: Yup.string().min(3, 'Description too short.').required('Please enter a description.'),
        dimensions: Yup.object().shape({
            length: Yup.number()
                .positive('Length must be positive')
                .max(1000, 'Length cannot exceed 1000cm'),
            width: Yup.number()
                .positive('Width must be positive')
                .max(1000, 'Width cannot exceed 1000cm'),
            height: Yup.number()
                .positive('Height must be positive')
                .max(1000, 'Height cannot exceed 1000cm'),
            unit: Yup.string().oneOf(['cm', 'inch'])
        }),

        weight: Yup.object().shape({
            value: Yup.number()
                .positive('Weight must be positive')
                .max(1000, 'Weight cannot exceed 1000kg'),
            unit: Yup.string().oneOf(['kg', 'g'])
        }),

        value: Yup.number()
            .min(0, 'Value cannot be negative')
            .max(10000000, 'Value cannot exceed 10,000,000'),

        isFragile: Yup.boolean(),

        requiresSpecialHandling: Yup.boolean(),

        specialInstructions: Yup.string()
            .max(300, 'Special instructions cannot exceed 300 characters'),

        images: Yup.array()
            .min(2, 'At least 2 images are required')
            .max(6, 'Maximum 6 images allowed'),

        video: Yup.object().nullable() // Video is optional
    })
});

