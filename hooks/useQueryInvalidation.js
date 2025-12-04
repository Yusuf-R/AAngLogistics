// hooks/useQueryInvalidation.js
import { queryClient }  from "../lib/queryClient"

/**
 * Custom hooks for invalidating dashboard queries
 * Use these when driver performs actions that update their data
 */

export const useInvalidateDashboard = () => {

    /**
     * Invalidate all dashboard queries at once
     * Use when driver completes a delivery
     */
    const invalidateAll = async (driverId) => {
        await Promise.all([
            queryClient.invalidateQueries(['DriverWallet']),
            queryClient.invalidateQueries(['DriverStats']),
            queryClient.invalidateQueries(['DriverMonthlyStats']),
            queryClient.invalidateQueries(['DecentDeliveries']),
        ]);
    };

    /**
     * Invalidate only financial queries
     * Use when driver withdraws money or receives payment
     */
    const invalidateFinancial = async (driverId) => {
        await queryClient.invalidateQueries(['driver-wallet', driverId]);
    };

    /**
     * Invalidate stats and deliveries
     * Use when a new order is completed
     */
    const invalidateStatsAndDeliveries = async (driverId) => {
        await Promise.all([
            queryClient.invalidateQueries(['DriverStats']),
            queryClient.invalidateQueries(['DriverMonthlyStats']),
            queryClient.invalidateQueries(['DecentDeliveries']),
        ]);
    };

    /**
     * Invalidate profile completion
     * Use when driver updates profile, uploads documents, etc.
     */
    const invalidateProfile = async (userId) => {
        await queryClient.invalidateQueries(['profile-completion', userId]);
    };

    /**
     * Force refetch all queries immediately
     * Use for pull-to-refresh functionality
     */
    const refetchAll = async (driverId) => {
        await Promise.all([
            queryClient.invalidateQueries(['DriverWallet']),
            queryClient.invalidateQueries(['DriverStats']),
            queryClient.invalidateQueries(['DriverMonthlyStats']),
            queryClient.invalidateQueries(['DecentDeliveries']),
        ]);
    };

    return {
        invalidateAll,
        invalidateFinancial,
        invalidateStatsAndDeliveries,
        invalidateProfile,
        refetchAll,
    };
};

/**
 * Example usage in your components:
 *
 * // In Order Completion Component
 * const { invalidateAll } = useInvalidateDashboard();
 *
 * const completeOrder = async () => {
 *   await completeOrderAPI();
 *   await invalidateAll(driverId); // Refresh all dashboard data
 * }
 *
 * // In Withdrawal Component
 * const { invalidateFinancial } = useInvalidateDashboard();
 *
 * const withdrawMoney = async () => {
 *   await withdrawAPI();
 *   await invalidateFinancial(driverId); // Refresh only wallet
 * }
 *
 * // In Profile Edit Component
 * const { invalidateProfile } = useInvalidateDashboard();
 *
 * const updateProfile = async () => {
 *   await updateProfileAPI();
 *   await invalidateProfile(userData._id); // Refresh profile completion
 * }
 */