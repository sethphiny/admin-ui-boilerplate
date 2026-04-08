import { apiClient } from '@/api/client';

export interface FeesResponse {
    depositFeePercent: number;
    withdrawalFeePercent: number;
    onRampFeePercent: number;
    offRampFeePercent: number;
}

export interface UpdateFeesDto {
    depositFeePercent: number;
    withdrawalFeePercent: number;
    onRampFeePercent: number;
    offRampFeePercent: number;
}

export const feesService = {
    getFees: async (): Promise<FeesResponse> => {
        const response = await apiClient.get<FeesResponse>('/admin/fees');
        return response;
    },

    updateFees: async (data: UpdateFeesDto): Promise<FeesResponse> => {
        const response = await apiClient.put<FeesResponse>('/admin/fees', data);
        return response;
    },
};
