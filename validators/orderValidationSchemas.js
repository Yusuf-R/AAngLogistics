// validationSchemas.js - Yup validation schemas for each step
import * as Yup from 'yup';

const PHONE_REGEX = /^(\+2340\d{10}|\+234\d{10}|0\d{10})$/;
const LOCATION_TYPES = ['residential','commercial','office','mall','hospital','school','other'];


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
                .typeError('Please enter a valid weight')
                .positive('Weight must be positive')
                .max(1000, 'Weight cannot exceed 1000kg')
                .required('Weight is required'),
            unit: Yup.string().oneOf(['kg', 'g'])
        }),

        // for insurance
        // value: Yup.number()
        //     .typeError('Weight must be a number')
        //     .min(0, 'Value cannot be negative')
        //     .max(10000000, 'Value cannot exceed 10,000,000'),

        isFragile: Yup.boolean(),

        requiresSpecialHandling: Yup.boolean(),
        specialInstructions: Yup.string().min(3, 'Special Instruction too short.').required('Please enter any instruction.'),
        images: Yup.array()
            .min(3, 'At least 3 images are required')
            .max(6, 'Maximum 6 images allowed')
            .required(),

        video: Yup.object().nullable() // Video is optional
    })
});


// Step 2: Location & Contact Details
const geoJSONPoint = Yup.object({
    type: Yup.string().oneOf(['Point']).required(),
    coordinates: Yup.array()
        .of(Yup.number().typeError('Coordinate must be a number'))
        .length(2, 'Coordinates must be [lng, lat]')
        .test('lng-range', 'Longitude must be between -180 and 180', (arr) =>
            Array.isArray(arr) ? arr[0] >= -180 && arr[0] <= 180 : false
        )
        .test('lat-range', 'Latitude must be between -90 and 90', (arr) =>
            Array.isArray(arr) ? arr[1] >= -90 && arr[1] <= 90 : false
        )
        .required('Coordinates are required'),
});

const locationShape = Yup.object({
    address: Yup.string().trim().min(3, 'Enter a valid address').required('Address is required'),
    coordinates: geoJSONPoint.required(),
    landmark: Yup.string().trim().max(140),
    contactPerson: Yup.object({
        name: Yup.string().trim().max(80).required('Contact name is required'),
        phone: Yup.string().trim().matches(PHONE_REGEX, 'Enter a valid phone'),
        alternatePhone: Yup.string()
            .trim()
            .nullable()
            .notRequired()
            .matches(PHONE_REGEX, 'Enter a valid alternate phone number')
            .transform((value) => value === '' ? null : value),
    }),
    extraInformation: Yup.string().trim().max(240),
    locationType: Yup.string().oneOf(LOCATION_TYPES).default('residential'),
    building: Yup.object({
        name: Yup.string().trim().max(100),
        floor: Yup.string().trim().max(20),
        unit: Yup.string().trim().max(20),
    }),
});

export const stepTwoSchema = Yup.object({
    location: Yup.object({
        pickUp: locationShape.required(),
        dropOff: locationShape.required(),
    })
        .required()
        .test('distinct-points', 'Pick-up and Drop-off cannot be the same location', function (loc) {
            if (!loc?.pickUp?.coordinates || !loc?.dropOff?.coordinates) return true;
            const a = loc.pickUp.coordinates.coordinates;
            const b = loc.dropOff.coordinates.coordinates;
            if (!Array.isArray(a) || !Array.isArray(b)) return true;
            const same = Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
            return !same;
        }),
});

export const stepThreeSchema = Yup.object({
    vehicleRequirements: Yup.array()
        .of(Yup.mixed().oneOf(['bicycle','motorcycle','tricycle','car','van','truck']))
        .min(1, 'Select at least one vehicle type')
        .max(4, 'Maximum 4 vehicle types allowed')
        .required('Vehicle selection is required')
});
