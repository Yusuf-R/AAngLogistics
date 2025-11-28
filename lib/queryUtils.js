// utils/queryUtils.js
import { queryClient } from './queryClient';

export const invalidateFinanceQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['PayoutManager'] });
    await queryClient.invalidateQueries({ queryKey: ['FinanceManager'] });
    await queryClient.invalidateQueries({ queryKey: ['TransactionHistory'] });
    await queryClient.invalidateQueries({ queryKey: ['PayoutHistory'] });
    console.log('✅ All finance queries invalidated');
};