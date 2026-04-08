import { apiClient } from '@/api/client';

export interface RevenueBalance {
    id: string;
    currency: string;
    balance: string;
    createdOn: string;
    updatedOn: string;
}

export interface RevenueLog {
    id: string;
    systemWalletId: string;
    transactionId: string | null;
    type: string;
    amount: string;
    currencyType: string | null;
    context: Record<string, any> | null;
    createdOn: string;
    systemWallet?: RevenueBalance;
}

export interface PaginatedResponse<T> {
    results: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const revenueService = {
    /**
     * Get all system revenue balances
     */
    getBalances: async (): Promise<RevenueBalance[]> => {
        return await apiClient.get<RevenueBalance[]>('/admin/revenue/balances');
    },

    /**
     * Get paginated revenue audit logs
     */
    getLogs: async (params?: { page?: number; limit?: number; currency?: string }): Promise<PaginatedResponse<RevenueLog>> => {
        return await apiClient.get<PaginatedResponse<RevenueLog>>('/admin/revenue/logs', { params });
    },
};
