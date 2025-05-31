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
    // Add other nested routes here
};

// Explicit list of routes where Tab Bar should appear
export const TAB_BAR_VISIBLE_ROUTES = [
    ROUTES.HOME,
    ROUTES.ORDERS,
    ROUTES.PROFILE
];