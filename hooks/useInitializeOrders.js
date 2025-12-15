// hooks/useInitializeOrders.ts
import { useEffect } from 'react';
import { useOrdersStore } from '../store/useOrderStore';
import { useQuery } from '@tanstack/react-query';
import ClientUtilities from "../utils/ClientUtilities";

export const useInitializeOrders = () => {
    const {
        initializeOrders,
        setSavedLocations,
        isInitialized
    } = useOrdersStore();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['orderStats'],
        queryFn: ClientUtilities.GetOrderStats,
        enabled: !isInitialized
    });

    const { data: recentOrders, isLoading: ordersLoading } = useQuery({
        queryKey: ['recentOrders'],
        queryFn: ClientUtilities.GetOrderHistory,
        enabled: !isInitialized
    });

    const { data: savedLocations, isLoading: locLoading } = useQuery({
        queryKey: ['savedLocations'],
        queryFn: ClientUtilities.GetSavedLocations,
        enabled: !isInitialized
    });

    useEffect(() => {
        if (stats && recentOrders) {
            initializeOrders(stats, recentOrders);
        }
        if (savedLocations) {
            setSavedLocations(savedLocations);
        }
    }, [stats, recentOrders, savedLocations]);

    return {
        isLoading: statsLoading || ordersLoading || locLoading
    };
};
