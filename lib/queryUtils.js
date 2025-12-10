// utils/queryUtils.js
import { queryClient } from './queryClient';

export const invalidateFinanceQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['PayoutManager'] });
    await queryClient.invalidateQueries({ queryKey: ['FinanceManager'] });
    await queryClient.invalidateQueries({ queryKey: ['TransactionHistory'] });
    await queryClient.invalidateQueries({ queryKey: ['PayoutHistory'] });
    console.log('✅ All finance queries invalidated');
};

export const invalidateClientFinanceQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ClientTopUpHistory'] });
    await queryClient.invalidateQueries({ queryKey: ['ClientWalletBalance'] });
    await queryClient.invalidateQueries({ queryKey: ['ClientFinanceManager'] });
    await queryClient.invalidateQueries({ queryKey: ['ClientFinancialData'] });
    await queryClient.invalidateQueries({ queryKey: ['ClientTransactions'] });
    console.log('✅ All finance queries invalidated');
};