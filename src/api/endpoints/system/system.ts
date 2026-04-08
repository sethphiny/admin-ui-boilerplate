import { apiClient } from '../../client'
import {
  SystemConfig,
  FlatSystemConfig,
  ConfigUpdateResponse,
  CurrencyPair,
  CreateCurrencyPairDto,
  UpdateCurrencyPairDto,
  UpdateCurrencyPairFeesDto,
  UpdateCurrencyPairSpreadDto,
  Thresh0ldCurrency,
  CreateThresh0ldCurrencyDto,
  UpdateThresh0ldCurrencyDto,
  Thresh0ldToken,
  CreateThresh0ldTokenDto,
  UpdateThresh0ldTokenDto,
  FiatCurrency,
  CreateFiatCurrencyDto,
  UpdateFiatCurrencyDto,
} from '@/types/admin/system'

export const systemApi = {
  // System Config
  getSystemConfig: async (): Promise<FlatSystemConfig> => {
    return apiClient.get<FlatSystemConfig>('/admin/system/config')
  },

  getStructuredConfig: async (): Promise<SystemConfig> => {
    return apiClient.get<SystemConfig>('/admin/system/config/structured')
  },

  updateSystemConfig: async (data: FlatSystemConfig): Promise<ConfigUpdateResponse> => {
    return apiClient.patch<ConfigUpdateResponse>('/admin/system/config', data)
  },

  // Quidax Configuration
  saveQuidaxBankAccount: async (data: { bankCode: string; accountNumber: string }): Promise<void> => {
    return apiClient.post('/admin/system/quidax/bank-account', data)
  },

  // Currency Pairs
  getCurrencyPairs: async (): Promise<CurrencyPair[]> => {
    return apiClient.get<CurrencyPair[]>('/admin/system/currency-pairs')
  },

  updateCurrencyPair: async (pair: string, data: UpdateCurrencyPairDto): Promise<CurrencyPair> => {
    return apiClient.patch<CurrencyPair>(`/admin/system/currency-pairs/${pair}`, data)
  },

  createCurrencyPair: async (data: CreateCurrencyPairDto): Promise<CurrencyPair[]> => {
    return apiClient.post<CurrencyPair[]>('/admin/system/currency-pairs', data)
  },

  deleteCurrencyPair: async (pair: string): Promise<void> => {
    return apiClient.delete(`/admin/system/currency-pairs/${pair}`)
  },

  updateCurrencyPairFees: async (
    pair: string,
    data: UpdateCurrencyPairFeesDto
  ): Promise<CurrencyPair[]> => {
    return apiClient.patch<CurrencyPair[]>(`/admin/system/currency-pairs/${pair}/fees`, data)
  },

  updateCurrencyPairSpread: async (
    pair: string,
    data: UpdateCurrencyPairSpreadDto
  ): Promise<CurrencyPair[]> => {
    return apiClient.patch<CurrencyPair[]>(`/admin/system/currency-pairs/${pair}/spread`, data)
  },

  // Thresh0ld Currencies
  listThresh0ldCurrencies: async (): Promise<Thresh0ldCurrency[]> => {
    return apiClient.get<Thresh0ldCurrency[]>('/admin/system/thresh0ld-currencies')
  },

  getThresh0ldCurrencyById: async (id: string): Promise<Thresh0ldCurrency> => {
    return apiClient.get<Thresh0ldCurrency>(`/admin/system/thresh0ld-currencies/${id}`)
  },

  createThresh0ldCurrency: async (
    data: CreateThresh0ldCurrencyDto
  ): Promise<Thresh0ldCurrency> => {
    return apiClient.post<Thresh0ldCurrency>('/admin/system/thresh0ld-currencies', data)
  },

  updateThresh0ldCurrency: async (
    id: string,
    data: UpdateThresh0ldCurrencyDto
  ): Promise<Thresh0ldCurrency> => {
    return apiClient.patch<Thresh0ldCurrency>(`/admin/system/thresh0ld-currencies/${id}`, data)
  },

  deleteThresh0ldCurrency: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/system/thresh0ld-currencies/${id}`)
  },

  // Thresh0ld Tokens
  listThresh0ldTokens: async (): Promise<Thresh0ldToken[]> => {
    return apiClient.get<Thresh0ldToken[]>('/admin/system/thresh0ld-tokens')
  },

  getThresh0ldTokenById: async (id: string): Promise<Thresh0ldToken> => {
    return apiClient.get<Thresh0ldToken>(`/admin/system/thresh0ld-tokens/${id}`)
  },

  createThresh0ldToken: async (data: CreateThresh0ldTokenDto): Promise<Thresh0ldToken> => {
    return apiClient.post<Thresh0ldToken>('/admin/system/thresh0ld-tokens', data)
  },

  updateThresh0ldToken: async (
    id: string,
    data: UpdateThresh0ldTokenDto
  ): Promise<Thresh0ldToken> => {
    return apiClient.patch<Thresh0ldToken>(`/admin/system/thresh0ld-tokens/${id}`, data)
  },

  deleteThresh0ldToken: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/system/thresh0ld-tokens/${id}`)
  },

  // Fiat Currencies
  listFiatCurrencies: async (): Promise<FiatCurrency[]> => {
    return apiClient.get<FiatCurrency[]>('/admin/system/fiat-currencies')
  },

  getFiatCurrencyById: async (id: string): Promise<FiatCurrency> => {
    return apiClient.get<FiatCurrency>(`/admin/system/fiat-currencies/${id}`)
  },

  createFiatCurrency: async (data: CreateFiatCurrencyDto): Promise<FiatCurrency> => {
    return apiClient.post<FiatCurrency>('/admin/system/fiat-currencies', data)
  },

  updateFiatCurrency: async (
    id: string,
    data: UpdateFiatCurrencyDto
  ): Promise<FiatCurrency> => {
    return apiClient.patch<FiatCurrency>(`/admin/system/fiat-currencies/${id}`, data)
  },

  deleteFiatCurrency: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/system/fiat-currencies/${id}`)
  },

  // Wallet Withdrawal Config
  getCryptoPrices: async (): Promise<Record<string, number>> => {
    return apiClient.get<Record<string, number>>('/admin/system/crypto-prices')
  },

  updateWalletWithdrawalConfig: async (
    walletType: 'fiat' | 'crypto',
    configType: 'minWithdrawalAmount' | 'autoReviewAboveAmount',
    values: Record<string, number>,
    valuesInUsd?: Record<string, number>
  ): Promise<ConfigUpdateResponse> => {
    const body: any = {}

    if (Object.keys(values).length > 0) {
      body.values = values
    }

    if (valuesInUsd && Object.keys(valuesInUsd).length > 0) {
      body.valuesInUsd = valuesInUsd
    }

    return apiClient.patch<ConfigUpdateResponse>(
      `/admin/system/wallet-withdrawal-config/${walletType}/${configType}`,
      body
    )
  },
}

