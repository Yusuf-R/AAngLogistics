export const ROUTES = {
    // Tab Bar Routes
    HOME: '/client/dashboard',
    ORDERS: '/client/orders',
    PROFILE: '/client/profile',

    // Nested Routes (No Tab Bar)
    SECURITY: '/client/profile/security',
    'VERIFY-EMAIL': '/client/profile/verify-email',
    'UPDATE-PASSWORD': '/client/profile/update-password',
    'AUTH-PIN': '/client/profile/auth-pin',
    'UPDATE-PIN': '/client/profile/update-pin',
    'RESET-PIN': '/client/profile/reset-pin',
    TC: '/client/profile/tcs',
    UTILITY: '/client/profile/utility',
    // Add other nested routes here
};

// Explicit list of routes where Tab Bar should appear
export const TAB_BAR_VISIBLE_ROUTES = [
    ROUTES.HOME,
    ROUTES.ORDERS,
    ROUTES.PROFILE
];

// Utility to check password change capability (can be used elsewhere in your app)
export const canUserChangePassword = (userData) => {
    // Multiple layers of validation

    // 1. Backend explicitly says it's allowed
    if (userData.passwordChangeAllowed === true) {
        return { allowed: true, reason: null };
    }

    // 2. Backend explicitly says it's not allowed
    if (userData.passwordChangeAllowed === false) {
        return {
            allowed: false,
            reason: 'Account type does not support password changes'
        };
    }

    // 3. Check auth methods (fallback)
    if (userData.authMethods) {
        const hasCredentials = userData.authMethods.some(method => method.type === 'Credentials');
        if (!hasCredentials) {
            return {
                allowed: false,
                reason: 'Account created with social login only'
            };
        }
        return { allowed: true, reason: null };
    }

    // 4. Check primary provider (second fallback)
    if (userData.primaryProvider && userData.primaryProvider !== 'Credentials') {
        return {
            allowed: false,
            reason: `Account managed by ${userData.primaryProvider}`
        };
    }

    // 5. Default to not allowed for safety
    return {
        allowed: false,
        reason: 'Unable to verify account type'
    };
};