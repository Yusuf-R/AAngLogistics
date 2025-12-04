// hooks/useDriverDashboard.js
import {useQuery} from '@tanstack/react-query';
import DriverUtils from '../utils/DriverUtilities';

/**
 * Hook for fetching driver wallet/financial data
 */
export const useDriverWallet =  (driverId) => {
    return useQuery({
        queryKey: ['DriverWallet'],
        queryFn: async () => {
            const response = await DriverUtils.getDriverWallet();
            return response.data;
        },
        enabled: !!driverId,
        staleTime: 500,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',

    });

};

/**
 * Hook for fetching driver stats (deliveries, ratings)
 */
export const useDriverStats = (driverId) => {
    return useQuery({
        queryKey: ['DriverStats'],
        queryFn: async () => {
            const response = await DriverUtils.getDriverStats(driverId);
            return response.data;
        },
        enabled: !!driverId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook for fetching monthly stats (instead of weekly)
 */
export const useDriverMonthlyStats = (driverId) => {
    return useQuery({
        queryKey: ['DriverMonthlyStats'],
        queryFn: async () => {
            const response = await DriverUtils.getMonthlyStats(driverId);
            return response.data;
        },
        enabled: !!driverId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

/**
 * Hook for fetching recent delivery history (7 most recent)
 */
export const useRecentDeliveries = (driverId) => {
    return useQuery({
        queryKey: ['RecentDeliveries'],
        queryFn: async () => {
            const response = await DriverUtils.getRecentDeliveries();
            return response.data;
        },
        enabled: !!driverId,
        staleTime: 1000 * 60 * 3, // 3 minutes
        refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    });

};

/**
 * Hook for calculating profile completion
 * This runs client-side based on userData
 */
export const useProfileCompletion = (userData) => {
    return useQuery({
        queryKey: ['ProfileCompletion'],
        queryFn: () => calculateProfileCompletion(userData),
        enabled: !!userData,
        staleTime: Infinity, // Only recalculate when userData changes
    });
};

/**
 * Client-side profile completion calculation
 */
const calculateProfileCompletion = (user) => {
    if (!user) return { percent: 0, isComplete: false, missing: [], checklist: [] };

    const checklist = [];
    let totalWeight = 0;
    let completedWeight = 0;

    // 1. Email Verification (10%)
    const emailVerified = user?.emailVerified === true;
    checklist.push({
        id: 'email',
        label: 'Email Verification',
        completed: emailVerified,
        weight: 10,
        description: 'Verify your email address'
    });
    totalWeight += 10;
    if (emailVerified) completedWeight += 10;

    // 2. Profile Photo/Avatar (10%)
    const hasAvatar = user?.avatar && user.avatar.trim() !== '';
    checklist.push({
        id: 'avatar',
        label: 'Profile Photo',
        completed: hasAvatar,
        weight: 10,
        description: 'Upload a profile picture'
    });
    totalWeight += 10;
    if (hasAvatar) completedWeight += 10;

    // 3. Auth PIN Setup (10%)
    const hasPinSetup = user?.authPin?.isEnabled === true;
    checklist.push({
        id: 'authPin',
        label: 'Security PIN',
        completed: hasPinSetup,
        weight: 10,
        description: 'Set up your security PIN'
    });
    totalWeight += 10;
    if (hasPinSetup) completedWeight += 10;

    // 4. Terms & Conditions Accepted (10%)
    const tcsAccepted = user?.tcs?.isAccepted === true;
    checklist.push({
        id: 'tcs',
        label: 'Terms & Conditions',
        completed: tcsAccepted,
        weight: 10,
        description: 'Accept terms and conditions'
    });
    totalWeight += 10;
    if (tcsAccepted) completedWeight += 10;

    // 5. Bank Account Setup (10%)
    const bankDetails = user?.verification?.activeData?.basicVerification?.bankAccounts || [];
    const primaryBankAccount = bankDetails.find(account => account?.isPrimary === true);
    const hasBankSetup = primaryBankAccount &&
        primaryBankAccount?.accountName &&
        primaryBankAccount?.accountName.trim().length > 0 &&
        primaryBankAccount?.accountNumber &&
        String(primaryBankAccount?.accountNumber).replace(/\s/g, '').length === 10 &&
        primaryBankAccount?.isPrimary === true &&
        primaryBankAccount?.verified === true;

    checklist.push({
        id: 'bank',
        label: 'Bank Account',
        completed: hasBankSetup,
        weight: 10,
        description: 'Add and verify bank account'
    });
    totalWeight += 10;
    if (hasBankSetup) completedWeight += 10;

    // 6. Document Verification (50% - most important)
    const overallVerified = user?.verification?.overallStatus === 'approved';
    checklist.push({
        id: 'verification',
        label: 'Document Verification',
        completed: overallVerified,
        weight: 50,
        description: 'Complete and get documents approved'
    });
    totalWeight += 50;
    if (overallVerified) completedWeight += 50;

    const percent = Math.round((completedWeight / totalWeight) * 100);
    const isComplete = percent === 100;

    return {
        percent,
        isComplete,
        checklist,
        completedCount: checklist.filter(item => item.completed).length,
        totalCount: checklist.length
    };
};