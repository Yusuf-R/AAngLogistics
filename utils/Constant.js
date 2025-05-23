export const ROUTES = {
    // Tab Bar Routes
    HOME: '/client/dashboard',
    ORDERS: '/client/orders',
    PROFILE: '/client/profile',

    // Nested Routes (No Tab Bar)
    SECURITY: '/client/profile/security',
    // Add other nested routes here
};

// Explicit list of routes where Tab Bar should appear
export const TAB_BAR_VISIBLE_ROUTES = [
    ROUTES.HOME,
    ROUTES.ORDERS,
    ROUTES.PROFILE
];