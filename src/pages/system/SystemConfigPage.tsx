import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, Column } from '@/components/tables/DataTable'
import { PermissionError } from '@/components/misc/PermissionError'
import { isPermissionError, handleApiError, showSuccessToast, showErrorToast } from '@/lib/errorHandler'
import { formatDateTime } from '@/lib/dateUtils'
import { systemApi } from '@/api/endpoints/system/system'
import { providersApi } from '@/api/endpoints/providers/providers'
import { useSystemConfig } from '@/hooks/system/useSystemConfig'
import { MaintenanceExceptionEmails } from '@/components/system/MaintenanceExceptionEmails'
import {
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
  WalletType,
  ConfigType,
} from '@/types/admin/system'
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Loader from '@/components/misc/Loader'

// Zod Schemas
const currencyPairCreateSchema = z.object({
  base: z.string().min(1, 'Base currency is required'),
  quote: z.string().min(1, 'Quote currency is required'),
  rate: z.number().min(0.0001, 'Rate must be greater than 0'),
  marketRate: z.number().optional(),
  buyRate: z.number().min(0.0001, 'Buy rate must be greater than 0').optional().nullable(),
  sellRate: z.number().min(0.0001, 'Sell rate must be greater than 0').optional().nullable(),
  profitPercent: z.number().optional(),
  flatFee: z.number().optional(),
  feePercent: z.number().optional(),
  provider: z.string().optional(),
})

const currencyPairUpdateSchema = z.object({
  rate: z.number().min(0.0001, 'Rate must be greater than 0'),
  spread: z.number().optional(),
  buyRate: z.number().min(0.0001, 'Buy rate must be greater than 0').optional().nullable(),
  sellRate: z.number().min(0.0001, 'Sell rate must be greater than 0').optional().nullable(),
  provider: z.string().optional(),
})

const currencyPairFeesSchema = z.object({
  flatFee: z.number().optional(),
  feePercent: z.number().optional(),
})

const currencyPairSpreadSchema = z.object({
  spread: z.number().min(0, 'Spread must be >= 0'),
})

const thresh0ldCurrencySchema = z.object({
  coin: z.string().min(1, 'Coin is required'),
  chain: z.string().min(1, 'Chain is required'),
  isTestnet: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().optional(),
})

const thresh0ldCurrencyUpdateSchema = z.object({
  isActive: z.boolean(),
  sortOrder: z.number().optional(),
})

const thresh0ldTokenSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  decimals: z.number().min(0, 'Decimals must be >= 0'),
  parentChain: z.string().min(1, 'Parent chain is required'),
  isTestnet: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const thresh0ldTokenUpdateSchema = z.object({
  isActive: z.boolean(),
  decimals: z.number().min(0, 'Decimals must be >= 0').optional(),
})

const fiatCurrencySchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().min(1, 'Name is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  isActive: z.boolean().default(true),
})

const fiatCurrencyUpdateSchema = z.object({
  name: z.string().optional(),
  countryCode: z.string().optional(),
  isActive: z.boolean(),
})

export default function SystemConfigPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('config')
  const [configSubTab, setConfigSubTab] = useState('maintenance')

  // System Config Hook
  const { config, loading: configLoading, error: configError, updateConfig, isUpdating } = useSystemConfig()

  // Currency Pairs Dialog States
  const [isCreateCurrencyPairOpen, setIsCreateCurrencyPairOpen] = useState(false)
  const [editingCurrencyPair, setEditingCurrencyPair] = useState<CurrencyPair | null>(null)
  const [updatingFeesPair, setUpdatingFeesPair] = useState<CurrencyPair | null>(null)
  const [updatingSpreadPair, setUpdatingSpreadPair] = useState<CurrencyPair | null>(null)
  const [deletingCurrencyPair, setDeletingCurrencyPair] = useState<CurrencyPair | null>(null)

  // Thresh0ld Currency Dialog States
  const [isCreateThresh0ldCurrencyOpen, setIsCreateThresh0ldCurrencyOpen] = useState(false)
  const [editingThresh0ldCurrency, setEditingThresh0ldCurrency] = useState<Thresh0ldCurrency | null>(null)
  const [deletingThresh0ldCurrency, setDeletingThresh0ldCurrency] = useState<Thresh0ldCurrency | null>(null)

  // Thresh0ld Token Dialog States
  const [isCreateThresh0ldTokenOpen, setIsCreateThresh0ldTokenOpen] = useState(false)
  const [editingThresh0ldToken, setEditingThresh0ldToken] = useState<Thresh0ldToken | null>(null)
  const [deletingThresh0ldToken, setDeletingThresh0ldToken] = useState<Thresh0ldToken | null>(null)

  // Fiat Currency Dialog States
  const [isCreateFiatCurrencyOpen, setIsCreateFiatCurrencyOpen] = useState(false)
  const [editingFiatCurrency, setEditingFiatCurrency] = useState<FiatCurrency | null>(null)
  const [deletingFiatCurrency, setDeletingFiatCurrency] = useState<FiatCurrency | null>(null)

  // Wallet Withdrawal Config States
  const [walletWithdrawalTab, setWalletWithdrawalTab] = useState<'fiat' | 'crypto'>('fiat')
  const [cryptoInputMode, setCryptoInputMode] = useState<'crypto' | 'usd'>('crypto')
  const [editedWalletConfig, setEditedWalletConfig] = useState<{
    fiat: {
      minWithdrawalAmount: Record<string, number>
      autoReviewAboveAmount: Record<string, number>
    }
    crypto: {
      minWithdrawalAmount: Record<string, number>
      autoReviewAboveAmount: Record<string, number>
    }
  } | null>(null)
  const [editedWalletConfigUsd, setEditedWalletConfigUsd] = useState<{
    crypto: {
      minWithdrawalAmount: Record<string, number>
      autoReviewAboveAmount: Record<string, number>
    }
  } | null>(null)
  // Track raw input values to handle normalization properly
  const [rawInputValues, setRawInputValues] = useState<{
    [key: string]: string
  }>({})

  // Track raw quidax receiver address input to do explicit form submission
  const [quidaxReceiverInput, setQuidaxReceiverInput] = useState<string>('')
  const [isQuidaxReceiverEditing, setIsQuidaxReceiverEditing] = useState<boolean>(false)

  // Quidax offramp bank account states
  const [selectedQuidaxBankCode, setSelectedQuidaxBankCode] = useState<string>('')
  const [quidaxAccountNumber, setQuidaxAccountNumber] = useState<string>('')
  const [isQuidaxOfframpEditing, setIsQuidaxOfframpEditing] = useState<boolean>(false)

  // Currency Pairs Query
  const { data: currencyPairs, isLoading: isLoadingPairs, error: pairsError, refetch: refetchPairs, isFetching: isFetchingPairs } = useQuery({
    queryKey: ['currency-pairs'],
    queryFn: () => systemApi.getCurrencyPairs(),
  })

  // Thresh0ld Currencies Query
  const { data: thresh0ldCurrencies, isLoading: isLoadingThresh0ldCurrencies, error: thresh0ldCurrenciesError, refetch: refetchThresh0ldCurrencies, isFetching: isFetchingThresh0ldCurrencies } = useQuery({
    queryKey: ['thresh0ld-currencies'],
    queryFn: () => systemApi.listThresh0ldCurrencies(),
  })

  // Thresh0ld Tokens Query
  const { data: thresh0ldTokens, isLoading: isLoadingThresh0ldTokens, error: thresh0ldTokensError, refetch: refetchThresh0ldTokens, isFetching: isFetchingThresh0ldTokens } = useQuery({
    queryKey: ['thresh0ld-tokens'],
    queryFn: () => systemApi.listThresh0ldTokens(),
  })

  // Fiat Currencies Query
  const { data: fiatCurrencies, isLoading: isLoadingFiatCurrencies, error: fiatCurrenciesError, refetch: refetchFiatCurrencies, isFetching: isFetchingFiatCurrencies } = useQuery({
    queryKey: ['fiat-currencies'],
    queryFn: () => systemApi.listFiatCurrencies(),
  })

  // Quidax Banks Query
  const { data: quidaxBanks, isLoading: isLoadingQuidaxBanks } = useQuery({
    queryKey: ['quidax-banks'],
    queryFn: () => providersApi.getQuidaxBanks(),
  })

  // Quidax Bank Account Mutation
  const saveQuidaxBankMutation = useMutation({
    mutationFn: systemApi.saveQuidaxBankAccount,
    onSuccess: () => {
      showSuccessToast('Quidax bank account saved successfully')
      setIsQuidaxOfframpEditing(false)
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
    },
    onError: (error) => {
      showErrorToast(handleApiError(error))
    },
  })


  // Configuration update handlers
  const handleConfigToggle = async (key: string, value: boolean) => {
    try {
      await updateConfig({ [key]: value.toString() })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleConfigInputChange = async (key: string, value: string | number) => {
    try {
      await updateConfig({ [key]: value.toString() })
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleExceptionEmailsUpdate = async (emails: string[]) => {
    try {
      // API accepts array directly - it will be serialized by the API client
      await updateConfig({ 'app.maintenance.exceptionEmails': emails })
    } catch (error) {
      // Error is handled by the hook
      throw error // Re-throw so component can handle it
    }
  }


  // Initialize and update wallet withdrawal config when config loads/changes
  // Only track the actual values we edit in this section to prevent infinite re-renders
  // from other unrelated config changes (like prices updating)
  const walletConfigStr = JSON.stringify({
    fiat: config?.wallet?.fiat,
    crypto: {
      minWithdrawalAmount: config?.wallet?.crypto?.minWithdrawalAmount,
      autoReviewAboveAmount: config?.wallet?.crypto?.autoReviewAboveAmount,
    }
  })

  useEffect(() => {
    if (config?.wallet?.fiat && config?.wallet?.crypto) {
      setEditedWalletConfig({
        fiat: {
          minWithdrawalAmount: { ...config.wallet.fiat.minWithdrawalAmount },
          autoReviewAboveAmount: { ...config.wallet.fiat.autoReviewAboveAmount },
        },
        crypto: {
          minWithdrawalAmount: { ...config.wallet.crypto.minWithdrawalAmount },
          autoReviewAboveAmount: { ...config.wallet.crypto.autoReviewAboveAmount },
        },
      })

      // Initialize USD values for crypto wallets (convert crypto to USD for display)
      if (config.wallet.crypto.prices) {
        const usdMinWithdrawal: Record<string, number> = {}
        const usdAutoReview: Record<string, number> = {}

        for (const [currency, cryptoValue] of Object.entries(config.wallet.crypto.minWithdrawalAmount)) {
          const price = config.wallet.crypto.prices[currency]
          if (price && cryptoValue > 0) {
            usdMinWithdrawal[currency] = cryptoValue * price
          }
        }

        for (const [currency, cryptoValue] of Object.entries(config.wallet.crypto.autoReviewAboveAmount)) {
          const price = config.wallet.crypto.prices[currency]
          if (price && cryptoValue > 0) {
            usdAutoReview[currency] = cryptoValue * price
          }
        }

        setEditedWalletConfigUsd({
          crypto: {
            minWithdrawalAmount: usdMinWithdrawal,
            autoReviewAboveAmount: usdAutoReview,
          },
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConfigStr])

  // Conversion functions for crypto wallets
  const convertUsdToCrypto = (currency: string, usdValue: number): number => {
    if (!config?.wallet?.crypto?.prices) return 0
    const price = config.wallet.crypto.prices[currency]
    return price && price > 0 ? usdValue / price : 0
  }

  const convertCryptoToUsd = (currency: string, cryptoValue: number): number => {
    if (!config?.wallet?.crypto?.prices) return 0
    const price = config.wallet.crypto.prices[currency]
    const usdValue = price && price > 0 ? cryptoValue * price : 0
    // Round to 2 decimal places to avoid precision issues (e.g., 9.999995971914 -> 10.00)
    return Math.round(usdValue * 100) / 100
  }

  // Helper function to normalize input value and handle "0" replacement
  const normalizeInputValue = (inputValue: string): string => {
    // Handle empty string
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      return '0'
    }

    const trimmed = inputValue.trim()

    // If it's a decimal number starting with "0.", keep it as is
    // This preserves "0.1", "0.3", "0.01", etc.
    if (trimmed.startsWith('0.')) {
      return trimmed
    }

    // If it's just "0", keep it
    if (trimmed === '0') {
      return '0'
    }

    // For non-decimal numbers, remove all leading zeros
    // "01" -> "1", "001" -> "1", "020" -> "20", "0100" -> "100", "0005" -> "5"
    if (!trimmed.includes('.')) {
      // Remove all leading zeros, but keep at least one digit if input was all zeros
      const normalized = trimmed.replace(/^0+/, '')
      // If normalized is empty (input was all zeros like "000"), return "0"
      // Otherwise return the normalized value
      return normalized === '' ? '0' : normalized
    }

    // For other cases (shouldn't happen with our inputs), return as is
    return trimmed
  }

  // Helper function to parse input value to number
  const parseInputValue = (normalizedInput: string): number => {
    if (normalizedInput === '' || normalizedInput === null || normalizedInput === undefined) {
      return 0
    }
    const parsed = parseFloat(normalizedInput)
    return isNaN(parsed) ? 0 : parsed
  }

  // Wallet withdrawal config handlers
  const handleWalletValueChange = (
    walletType: WalletType,
    configType: ConfigType,
    currency: string,
    inputValue: string,
    isUsd: boolean = false
  ) => {
    if (!editedWalletConfig) return

    // Create a unique key for this input field
    const inputKey = `${walletType}-${configType}-${currency}-${isUsd ? 'usd' : 'crypto'}`

    // Normalize the input value (handles "0" replacement)
    // This removes leading zeros like "01" -> "1", "020" -> "20", "0100" -> "100"
    // But preserves decimals like "0.1", "0.3"
    const normalizedInput = normalizeInputValue(inputValue)
    const value = parseInputValue(normalizedInput)

    // Store the normalized input value for display immediately
    // This ensures "020" -> "20" or "0100" -> "100" is displayed right away, even on first keystroke
    setRawInputValues((prev) => ({
      ...prev,
      [inputKey]: normalizedInput,
    }))

    if (isUsd && walletType === 'crypto') {
      // Round USD value to 2 decimal places to avoid precision issues (e.g., 9.999995971914 -> 10.00)
      const roundedUsdValue = Math.round(value * 100) / 100

      // Update USD value and auto-convert to crypto
      setEditedWalletConfigUsd((prev) => {
        if (!prev) return null
        return {
          ...prev,
          crypto: {
            ...prev.crypto,
            [configType]: {
              ...prev.crypto[configType],
              [currency]: roundedUsdValue,
            },
          },
        }
      })

      // Auto-update crypto value
      if (roundedUsdValue > 0) {
        const converted = convertUsdToCrypto(currency, roundedUsdValue)
        setEditedWalletConfig((prev) => {
          if (!prev) return null
          return {
            ...prev,
            crypto: {
              ...prev.crypto,
              [configType]: {
                ...prev.crypto[configType],
                [currency]: converted,
              },
            },
          }
        })
      } else {
        // If USD value is 0, also set crypto to 0
        setEditedWalletConfig((prev) => {
          if (!prev) return null
          return {
            ...prev,
            crypto: {
              ...prev.crypto,
              [configType]: {
                ...prev.crypto[configType],
                [currency]: 0,
              },
            },
          }
        })
      }
    } else {
      // Update crypto/fiat value
      setEditedWalletConfig((prev) => {
        if (!prev) return null
        return {
          ...prev,
          [walletType]: {
            ...prev[walletType],
            [configType]: {
              ...prev[walletType][configType],
              [currency]: value,
            },
          },
        }
      })

      // Auto-update USD value for crypto wallets
      if (walletType === 'crypto' && value > 0) {
        const converted = convertCryptoToUsd(currency, value)
        setEditedWalletConfigUsd((prev) => {
          if (!prev) return null
          return {
            ...prev,
            crypto: {
              ...prev.crypto,
              [configType]: {
                ...prev.crypto[configType],
                [currency]: converted,
              },
            },
          }
        })
      } else if (walletType === 'crypto' && value === 0) {
        // If crypto value is 0, also set USD to 0
        setEditedWalletConfigUsd((prev) => {
          if (!prev) return null
          return {
            ...prev,
            crypto: {
              ...prev.crypto,
              [configType]: {
                ...prev.crypto[configType],
                [currency]: 0,
              },
            },
          }
        })
      }
    }
  }

  const updateWalletWithdrawalConfigMutation = useMutation({
    mutationFn: ({
      walletType,
      configType,
      values,
      valuesInUsd,
    }: {
      walletType: WalletType
      configType: ConfigType
      values: Record<string, number>
      valuesInUsd?: Record<string, number>
    }) => systemApi.updateWalletWithdrawalConfig(walletType, configType, values, valuesInUsd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config-structured'] })
      showSuccessToast('Wallet withdrawal configuration updated successfully')
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const handleSaveWalletConfig = async (walletType: WalletType, configType: ConfigType) => {
    if (!editedWalletConfig) return

    try {
      // Filter out zero values (unconfigured currencies)
      const valuesToSave = Object.fromEntries(
        Object.entries(editedWalletConfig[walletType][configType]).filter(
          ([_, value]) => value > 0
        )
      )

      // For crypto wallets, include USD values if provided
      // Round USD values to 2 decimal places before saving
      const valuesInUsdToSave = walletType === 'crypto' && editedWalletConfigUsd
        ? Object.fromEntries(
          Object.entries(editedWalletConfigUsd.crypto[configType])
            .filter(([_, value]) => value > 0)
            .map(([currency, value]) => [currency, Math.round(value * 100) / 100])
        )
        : undefined

      await updateWalletWithdrawalConfigMutation.mutateAsync({
        walletType,
        configType,
        values: valuesToSave,
        valuesInUsd: valuesInUsdToSave,
      })
    } catch (error) {
      // Error is handled by mutation
    }
  }


  // Currency Pair Mutations
  const createCurrencyPairForm = useForm<CreateCurrencyPairDto>({
    resolver: zodResolver(currencyPairCreateSchema),
  })

  const updateCurrencyPairForm = useForm<UpdateCurrencyPairDto>({
    resolver: zodResolver(currencyPairUpdateSchema),
  })

  const updateFeesForm = useForm<UpdateCurrencyPairFeesDto>({
    resolver: zodResolver(currencyPairFeesSchema),
  })

  const updateSpreadForm = useForm<UpdateCurrencyPairSpreadDto>({
    resolver: zodResolver(currencyPairSpreadSchema),
  })

  const createCurrencyPairMutation = useMutation({
    mutationFn: (data: CreateCurrencyPairDto) => systemApi.createCurrencyPair(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-pairs'] })
      showSuccessToast('Currency pair created successfully')
      setIsCreateCurrencyPairOpen(false)
      createCurrencyPairForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateCurrencyPairMutation = useMutation({
    mutationFn: ({ pair, data }: { pair: string; data: UpdateCurrencyPairDto }) =>
      systemApi.updateCurrencyPair(pair, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-pairs'] })
      showSuccessToast('Currency pair updated successfully')
      setEditingCurrencyPair(null)
      updateCurrencyPairForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateFeesMutation = useMutation({
    mutationFn: ({ pair, data }: { pair: string; data: UpdateCurrencyPairFeesDto }) =>
      systemApi.updateCurrencyPairFees(pair, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-pairs'] })
      showSuccessToast('Fees updated successfully')
      setUpdatingFeesPair(null)
      updateFeesForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateSpreadMutation = useMutation({
    mutationFn: ({ pair, data }: { pair: string; data: UpdateCurrencyPairSpreadDto }) =>
      systemApi.updateCurrencyPairSpread(pair, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-pairs'] })
      showSuccessToast('Spread updated successfully')
      setUpdatingSpreadPair(null)
      updateSpreadForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const deleteCurrencyPairMutation = useMutation({
    mutationFn: (pair: string) => systemApi.deleteCurrencyPair(pair),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-pairs'] })
      showSuccessToast('Currency pair deleted successfully')
      setDeletingCurrencyPair(null)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Thresh0ld Currency Mutations
  const createThresh0ldCurrencyForm = useForm<CreateThresh0ldCurrencyDto>({
    resolver: zodResolver(thresh0ldCurrencySchema),
    defaultValues: { isTestnet: false, isActive: true },
  })

  const updateThresh0ldCurrencyForm = useForm<UpdateThresh0ldCurrencyDto>({
    resolver: zodResolver(thresh0ldCurrencyUpdateSchema),
  })

  const createThresh0ldCurrencyMutation = useMutation({
    mutationFn: (data: CreateThresh0ldCurrencyDto) => systemApi.createThresh0ldCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-currencies'] })
      showSuccessToast('Thresh0ld currency created successfully')
      setIsCreateThresh0ldCurrencyOpen(false)
      createThresh0ldCurrencyForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateThresh0ldCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateThresh0ldCurrencyDto }) =>
      systemApi.updateThresh0ldCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-currencies'] })
      showSuccessToast('Thresh0ld currency updated successfully')
      setEditingThresh0ldCurrency(null)
      updateThresh0ldCurrencyForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const deleteThresh0ldCurrencyMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteThresh0ldCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-currencies'] })
      showSuccessToast('Thresh0ld currency deleted successfully')
      setDeletingThresh0ldCurrency(null)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Thresh0ld Token Mutations
  const createThresh0ldTokenForm = useForm<CreateThresh0ldTokenDto>({
    resolver: zodResolver(thresh0ldTokenSchema),
    defaultValues: { isTestnet: false, isActive: true },
  })

  const updateThresh0ldTokenForm = useForm<UpdateThresh0ldTokenDto>({
    resolver: zodResolver(thresh0ldTokenUpdateSchema),
  })

  const createThresh0ldTokenMutation = useMutation({
    mutationFn: (data: CreateThresh0ldTokenDto) => systemApi.createThresh0ldToken(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-tokens'] })
      showSuccessToast('Thresh0ld token created successfully')
      setIsCreateThresh0ldTokenOpen(false)
      createThresh0ldTokenForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateThresh0ldTokenMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateThresh0ldTokenDto }) =>
      systemApi.updateThresh0ldToken(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-tokens'] })
      showSuccessToast('Thresh0ld token updated successfully')
      setEditingThresh0ldToken(null)
      updateThresh0ldTokenForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const deleteThresh0ldTokenMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteThresh0ldToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresh0ld-tokens'] })
      showSuccessToast('Thresh0ld token deleted successfully')
      setDeletingThresh0ldToken(null)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Fiat Currency Mutations
  const createFiatCurrencyForm = useForm<CreateFiatCurrencyDto>({
    resolver: zodResolver(fiatCurrencySchema),
    defaultValues: { isActive: true },
  })

  const updateFiatCurrencyForm = useForm<UpdateFiatCurrencyDto>({
    resolver: zodResolver(fiatCurrencyUpdateSchema),
  })

  const createFiatCurrencyMutation = useMutation({
    mutationFn: (data: CreateFiatCurrencyDto) => systemApi.createFiatCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiat-currencies'] })
      showSuccessToast('Fiat currency created successfully')
      setIsCreateFiatCurrencyOpen(false)
      createFiatCurrencyForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateFiatCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFiatCurrencyDto }) =>
      systemApi.updateFiatCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiat-currencies'] })
      showSuccessToast('Fiat currency updated successfully')
      setEditingFiatCurrency(null)
      updateFiatCurrencyForm.reset()
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const deleteFiatCurrencyMutation = useMutation({
    mutationFn: (id: string) => systemApi.deleteFiatCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiat-currencies'] })
      showSuccessToast('Fiat currency deleted successfully')
      setDeletingFiatCurrency(null)
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  // Handlers
  const handleEditCurrencyPair = (pair: CurrencyPair) => {
    setEditingCurrencyPair(pair)
    updateCurrencyPairForm.reset({
      rate: pair.rate,
      spread: pair.profitPercent,
      buyRate: pair.buyRate ?? undefined,
      sellRate: pair.sellRate ?? undefined,
      provider: pair.provider || 'INTERNAL',
    })
  }

  const handleUpdateFees = (pair: CurrencyPair) => {
    setUpdatingFeesPair(pair)
    updateFeesForm.reset({
      flatFee: pair.flatFee,
      feePercent: pair.feePercent,
    })
  }

  const handleUpdateSpread = (pair: CurrencyPair) => {
    setUpdatingSpreadPair(pair)
    updateSpreadForm.reset({
      spread: pair.profitPercent || 0,
    })
  }

  const handleEditThresh0ldCurrency = (currency: Thresh0ldCurrency) => {
    setEditingThresh0ldCurrency(currency)
    updateThresh0ldCurrencyForm.reset({
      isActive: currency.isActive,
      sortOrder: currency.sortOrder,
    })
  }

  const handleEditThresh0ldToken = (token: Thresh0ldToken) => {
    setEditingThresh0ldToken(token)
    updateThresh0ldTokenForm.reset({
      isActive: token.isActive,
      decimals: token.decimals,
    })
  }

  const handleEditFiatCurrency = (currency: FiatCurrency) => {
    setEditingFiatCurrency(currency)
    updateFiatCurrencyForm.reset({
      name: currency.name,
      countryCode: currency.countryCode,
      isActive: currency.isActive,
    })
  }

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  const getPairKey = (pair: CurrencyPair) => pair.pair || `${pair.base}_${pair.quote}`

  // Currency Pairs Columns
  const currencyPairsColumns: Column<CurrencyPair>[] = [
    {
      id: 'pair',
      header: 'Pair',
      cell: (row) => `${row.base}/${row.quote}`,
    },
    {
      id: 'rate',
      header: 'Rate',
      cell: (row) => row.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }),
    },
    {
      id: 'marketRate',
      header: 'Market Rate',
      cell: (row) => row.marketRate ? row.marketRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : 'N/A',
    },
    {
      id: 'buyRate',
      header: 'Buy Rate',
      cell: (row) => row.buyRate ? row.buyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : 'N/A',
    },
    {
      id: 'sellRate',
      header: 'Sell Rate',
      cell: (row) => row.sellRate ? row.sellRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : 'N/A',
    },
    {
      id: 'spread',
      header: 'Spread',
      cell: (row) => row.profitPercent ? `${row.profitPercent}%` : 'N/A',
    },
    {
      id: 'flatFee',
      header: 'Flat Fee',
      cell: (row) => row.flatFee ? row.flatFee.toLocaleString() : 'N/A',
    },
    {
      id: 'feePercent',
      header: 'Fee %',
      cell: (row) => row.feePercent ? `${row.feePercent}%` : 'N/A',
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: (row) => (
        <Badge variant={row.provider === 'QUIDAX' ? 'default' : 'secondary'}>
          {row.provider || 'INTERNAL'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditCurrencyPair(row)
            }}
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleUpdateFees(row)
            }}
          >
            <HiOutlineCurrencyDollar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleUpdateSpread(row)
            }}
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeletingCurrencyPair(row)
            }}
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Thresh0ld Currencies Columns
  const thresh0ldCurrenciesColumns: Column<Thresh0ldCurrency>[] = [
    {
      id: 'coin',
      header: 'Coin',
      accessorKey: 'coin',
    },
    {
      id: 'chain',
      header: 'Chain',
      accessorKey: 'chain',
    },
    {
      id: 'testnet',
      header: 'Testnet',
      cell: (row) => (
        <Badge className={row.isTestnet ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
          {row.isTestnet ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'active',
      header: 'Active',
      cell: (row) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'sortOrder',
      header: 'Sort Order',
      cell: (row) => row.sortOrder ?? 'N/A',
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditThresh0ldCurrency(row)
            }}
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeletingThresh0ldCurrency(row)
            }}
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Thresh0ld Tokens Columns
  const thresh0ldTokensColumns: Column<Thresh0ldToken>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'symbol',
      header: 'Symbol',
      accessorKey: 'symbol',
    },
    {
      id: 'address',
      header: 'Address',
      cell: (row) => {
        const address = row.address
        const truncated = address.length > 20 ? `${address.substring(0, 20)}...` : address
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help font-mono text-xs">{truncated}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs break-all font-mono text-xs">{address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      id: 'parentChain',
      header: 'Parent Chain',
      accessorKey: 'parentChain',
    },
    {
      id: 'decimals',
      header: 'Decimals',
      accessorKey: 'decimals',
    },
    {
      id: 'testnet',
      header: 'Testnet',
      cell: (row) => (
        <Badge className={row.isTestnet ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
          {row.isTestnet ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'active',
      header: 'Active',
      cell: (row) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditThresh0ldToken(row)
            }}
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeletingThresh0ldToken(row)
            }}
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Fiat Currencies Columns
  const fiatCurrenciesColumns: Column<FiatCurrency>[] = [
    {
      id: 'symbol',
      header: 'Symbol',
      accessorKey: 'symbol',
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
    },
    {
      id: 'countryCode',
      header: 'Country Code',
      accessorKey: 'countryCode',
    },
    {
      id: 'active',
      header: 'Active',
      cell: (row) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditFiatCurrency(row)
            }}
          >
            <HiOutlinePencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeletingFiatCurrency(row)
            }}
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="System Configuration" description="Manage system settings and configurations" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">System Config</TabsTrigger>
          <TabsTrigger value="currency-pairs">Currency Pairs</TabsTrigger>
          <TabsTrigger value="thresh0ld-currencies">Thresh0ld Currencies</TabsTrigger>
          <TabsTrigger value="thresh0ld-tokens">Thresh0ld Tokens</TabsTrigger>
          <TabsTrigger value="fiat-currencies">Fiat Currencies</TabsTrigger>
        </TabsList>

        {/* System Config Tab */}
        <TabsContent value="config" className="space-y-6">
          {configLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <Loader />
                </div>
              </CardContent>
            </Card>
          ) : isPermissionError(configError) ? (
            <PermissionError message={handleApiError(configError)} variant="full" />
          ) : configError ? (
            <Alert variant="destructive">
              <HiOutlineExclamationTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{handleApiError(configError)}</AlertDescription>
            </Alert>
          ) : config ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={configSubTab} onValueChange={setConfigSubTab} className="w-full">
                    <div className="overflow-x-auto">
                      <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
                        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                        <TabsTrigger value="auth">Authentication</TabsTrigger>
                        <TabsTrigger value="wallet">Wallet</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="announcements">Announcements</TabsTrigger>
                        <TabsTrigger value="version">Version</TabsTrigger>
                        <TabsTrigger value="integrations">Integrations</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Maintenance Tab */}
                    <TabsContent value="maintenance" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Block logins & major actions when enabled
                          </p>
                        </div>
                        <Switch
                          checked={config.app.maintenance.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('app.maintenance.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Maintenance Message</Label>
                        <Input
                          value={config.app.maintenance.message}
                          onChange={(e) =>
                            handleConfigInputChange('app.maintenance.message', e.target.value)
                          }
                          disabled={isUpdating}
                          placeholder="Enter maintenance message"
                        />
                      </div>

                      {/* Exception Emails Management */}
                      <MaintenanceExceptionEmails
                        emails={
                          Array.isArray(config.app.maintenance.exceptionEmails)
                            ? config.app.maintenance.exceptionEmails
                            : typeof config.app.maintenance.exceptionEmails === 'string'
                              ? (() => {
                                try {
                                  return JSON.parse(config.app.maintenance.exceptionEmails || '[]')
                                } catch {
                                  return []
                                }
                              })()
                              : []
                        }
                        onUpdate={handleExceptionEmailsUpdate}
                        isUpdating={isUpdating}
                        maintenanceEnabled={config.app.maintenance.enabled}
                      />

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Read-Only Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow viewing data but block changes
                          </p>
                        </div>
                        <Switch
                          checked={config.app.readOnly.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('app.readOnly.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Scheduled Maintenance Start</Label>
                        <Input
                          type="datetime-local"
                          value={
                            config.app.scheduledMaintenance.start
                              ? new Date(config.app.scheduledMaintenance.start)
                                .toISOString()
                                .slice(0, 16)
                              : ''
                          }
                          onChange={(e) =>
                            handleConfigInputChange(
                              'app.scheduledMaintenance.start',
                              e.target.value ? new Date(e.target.value).toISOString() : ''
                            )
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Scheduled Maintenance End</Label>
                        <Input
                          type="datetime-local"
                          value={
                            config.app.scheduledMaintenance.end
                              ? new Date(config.app.scheduledMaintenance.end)
                                .toISOString()
                                .slice(0, 16)
                              : ''
                          }
                          onChange={(e) =>
                            handleConfigInputChange(
                              'app.scheduledMaintenance.end',
                              e.target.value ? new Date(e.target.value).toISOString() : ''
                            )
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </TabsContent>

                    {/* Authentication Tab */}
                    <TabsContent value="auth" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Login Enabled</Label>
                          <p className="text-sm text-muted-foreground">Allow users to login</p>
                        </div>
                        <Switch
                          checked={config.auth.login.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('auth.login.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Registration Enabled</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow new user registration
                          </p>
                        </div>
                        <Switch
                          checked={config.auth.registration.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('auth.registration.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Require Email Verification</Label>
                          <p className="text-sm text-muted-foreground">
                            Require email verification for new accounts
                          </p>
                        </div>
                        <Switch
                          checked={config.auth.emailVerification.required}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('auth.emailVerification.required', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Failed Logins</Label>
                        <Input
                          type="number"
                          value={config.auth.maxFailedLogins}
                          onChange={(e) =>
                            handleConfigInputChange(
                              'auth.maxFailedLogins',
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Lockout Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={config.auth.lockoutDurationMinutes}
                          onChange={(e) =>
                            handleConfigInputChange(
                              'auth.lockoutDurationMinutes',
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Password Minimum Length</Label>
                        <Input
                          type="number"
                          value={config.auth.passwordPolicy.minLength}
                          onChange={(e) =>
                            handleConfigInputChange(
                              'auth.passwordPolicy.minLength',
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Password Complexity</Label>
                          <p className="text-sm text-muted-foreground">
                            Require complex passwords
                          </p>
                        </div>
                        <Switch
                          checked={config.auth.passwordPolicy.complexity}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('auth.passwordPolicy.complexity', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </TabsContent>

                    {/* Wallet Tab */}
                    <TabsContent value="wallet" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Transfers Enabled</Label>
                          <p className="text-sm text-muted-foreground">Allow wallet transfers</p>
                        </div>
                        <Switch
                          checked={config.wallet.transfers.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('wallet.transfers.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Withdrawals Enabled</Label>
                          <p className="text-sm text-muted-foreground">Allow wallet withdrawals</p>
                        </div>
                        <Switch
                          checked={config.wallet.withdrawals.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('wallet.withdrawals.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Deposits Enabled</Label>
                          <p className="text-sm text-muted-foreground">Allow wallet deposits</p>
                        </div>
                        <Switch
                          checked={config.wallet.deposits.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('wallet.deposits.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Wallet Withdrawal Configuration */}
                      {config.wallet.fiat && config.wallet.crypto && editedWalletConfig && (
                        <div className="space-y-6 mt-6">
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Withdrawal Configuration</h3>

                            {/* Wallet Type Tabs */}
                            <Tabs value={walletWithdrawalTab} onValueChange={(v) => setWalletWithdrawalTab(v as 'fiat' | 'crypto')} className="mb-6">
                              <TabsList>
                                <TabsTrigger value="fiat">Fiat Wallets</TabsTrigger>
                                <TabsTrigger value="crypto">Crypto Wallets</TabsTrigger>
                              </TabsList>

                              {/* Fiat Wallet Config */}
                              <TabsContent value="fiat" className="space-y-6 mt-4">
                                {/* Minimum Withdrawal Amount */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Minimum Withdrawal Amount</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        Set the minimum withdrawal amount for each fiat currency. Set to 0 to disable withdrawals for that currency.
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys({
                                          ...config.wallet.fiat.minWithdrawalAmount,
                                          ...config.wallet.fiat.autoReviewAboveAmount,
                                        })
                                          .sort()
                                          .map((currency) => {
                                            const inputKey = `fiat-minWithdrawalAmount-${currency}-fiat`
                                            const rawValue = rawInputValues[inputKey]
                                            const numericValue = editedWalletConfig.fiat.minWithdrawalAmount[currency] || 0
                                            // Use raw value if available (user is typing), otherwise use numeric value
                                            // Always use rawValue when defined (user is typing), even if empty
                                            // Convert to string to ensure proper display in number input
                                            const displayValue = rawValue !== undefined
                                              ? String(rawValue)
                                              : String(numericValue || 0)

                                            return (
                                              <div key={currency} className="space-y-2">
                                                <Label>{currency}</Label>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  min="0"
                                                  value={displayValue}
                                                  onInput={(e) => {
                                                    // Use onInput for immediate feedback
                                                    const target = e.target as HTMLInputElement
                                                    handleWalletValueChange(
                                                      'fiat',
                                                      'minWithdrawalAmount',
                                                      currency,
                                                      target.value
                                                    )
                                                  }}
                                                  onChange={(e) => {
                                                    // Also handle onChange as fallback
                                                    handleWalletValueChange(
                                                      'fiat',
                                                      'minWithdrawalAmount',
                                                      currency,
                                                      e.target.value
                                                    )
                                                  }}
                                                  onBlur={() => {
                                                    setRawInputValues((prev) => {
                                                      const newValues = { ...prev }
                                                      delete newValues[inputKey]
                                                      return newValues
                                                    })
                                                  }}
                                                  disabled={updateWalletWithdrawalConfigMutation.isPending}
                                                  placeholder="0"
                                                />
                                                {editedWalletConfig.fiat.minWithdrawalAmount[currency] !==
                                                  config.wallet.fiat.minWithdrawalAmount[currency] && (
                                                    <Badge variant="outline" className="text-orange-600">
                                                      Modified
                                                    </Badge>
                                                  )}
                                              </div>
                                            )
                                          })}
                                      </div>
                                      <Button
                                        onClick={() => handleSaveWalletConfig('fiat', 'minWithdrawalAmount')}
                                        disabled={updateWalletWithdrawalConfigMutation.isPending}
                                      >
                                        {updateWalletWithdrawalConfigMutation.isPending ? 'Saving...' : 'Save Minimum Withdrawal Amounts'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Auto Review Above Amount */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Auto Review Above Amount</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        Withdrawals above this amount will require manual admin review. Set to 0 to disable auto-review.
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys({
                                          ...config.wallet.fiat.minWithdrawalAmount,
                                          ...config.wallet.fiat.autoReviewAboveAmount,
                                        })
                                          .sort()
                                          .map((currency) => {
                                            const inputKey = `fiat-autoReviewAboveAmount-${currency}-fiat`
                                            const rawValue = rawInputValues[inputKey]
                                            const numericValue = editedWalletConfig.fiat.autoReviewAboveAmount[currency] || 0
                                            // Use raw value if available (user is typing), otherwise use numeric value
                                            // Always use rawValue when defined (user is typing), even if empty
                                            // Convert to string to ensure proper display in number input
                                            const displayValue = rawValue !== undefined
                                              ? String(rawValue)
                                              : String(numericValue || 0)

                                            return (
                                              <div key={currency} className="space-y-2">
                                                <Label>{currency}</Label>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  min="0"
                                                  value={displayValue}
                                                  onInput={(e) => {
                                                    // Use onInput for immediate feedback
                                                    const target = e.target as HTMLInputElement
                                                    handleWalletValueChange(
                                                      'fiat',
                                                      'autoReviewAboveAmount',
                                                      currency,
                                                      target.value
                                                    )
                                                  }}
                                                  onChange={(e) => {
                                                    // Also handle onChange as fallback
                                                    handleWalletValueChange(
                                                      'fiat',
                                                      'autoReviewAboveAmount',
                                                      currency,
                                                      e.target.value
                                                    )
                                                  }}
                                                  onBlur={() => {
                                                    setRawInputValues((prev) => {
                                                      const newValues = { ...prev }
                                                      delete newValues[inputKey]
                                                      return newValues
                                                    })
                                                  }}
                                                  disabled={updateWalletWithdrawalConfigMutation.isPending}
                                                  placeholder="0"
                                                />
                                                {editedWalletConfig.fiat.autoReviewAboveAmount[currency] !==
                                                  config.wallet.fiat.autoReviewAboveAmount[currency] && (
                                                    <Badge variant="outline" className="text-orange-600">
                                                      Modified
                                                    </Badge>
                                                  )}
                                              </div>
                                            )
                                          })}
                                      </div>
                                      <Button
                                        onClick={() => handleSaveWalletConfig('fiat', 'autoReviewAboveAmount')}
                                        disabled={updateWalletWithdrawalConfigMutation.isPending}
                                      >
                                        {updateWalletWithdrawalConfigMutation.isPending ? 'Saving...' : 'Save Auto Review Thresholds'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              {/* Crypto Wallet Config */}
                              <TabsContent value="crypto" className="space-y-6 mt-4">
                                {/* Input Mode Toggle */}
                                <Card>
                                  <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                      <Label className="text-base font-medium">Input Mode:</Label>
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            id="crypto-mode"
                                            value="crypto"
                                            checked={cryptoInputMode === 'crypto'}
                                            onChange={() => setCryptoInputMode('crypto')}
                                            className="h-4 w-4"
                                          />
                                          <Label htmlFor="crypto-mode" className="cursor-pointer">
                                            Set in Crypto
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            id="usd-mode"
                                            value="usd"
                                            checked={cryptoInputMode === 'usd'}
                                            onChange={() => setCryptoInputMode('usd')}
                                            className="h-4 w-4"
                                          />
                                          <Label htmlFor="usd-mode" className="cursor-pointer">
                                            Set in USD
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Minimum Withdrawal Amount */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Minimum Withdrawal Amount</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        Set the minimum withdrawal amount for each crypto currency. Set to 0 to disable withdrawals for that currency.
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys({
                                          ...config.wallet.crypto.minWithdrawalAmount,
                                          ...config.wallet.crypto.autoReviewAboveAmount,
                                        })
                                          .sort()
                                          .map((currency) => {
                                            const cryptoValue = editedWalletConfig.crypto.minWithdrawalAmount[currency] || 0
                                            const usdValue = editedWalletConfigUsd?.crypto.minWithdrawalAmount[currency] || 0
                                            const inputKey = `crypto-minWithdrawalAmount-${currency}-${cryptoInputMode === 'usd' ? 'usd' : 'crypto'}`
                                            const rawValue = rawInputValues[inputKey]

                                            // Use raw input value if available (user is typing), otherwise use the numeric value
                                            // Format USD values to 2 decimal places for display (e.g., 9.999995971914 -> 10.00)
                                            const displayValue = rawValue !== undefined
                                              ? rawValue
                                              : (cryptoInputMode === 'usd'
                                                ? (usdValue ? Number(usdValue.toFixed(2)) : 0)
                                                : (cryptoValue || 0))

                                            const equivalentUsd = cryptoValue > 0 ? convertCryptoToUsd(currency, cryptoValue) : 0
                                            const equivalentCrypto = usdValue > 0 ? convertUsdToCrypto(currency, usdValue) : 0

                                            return (
                                              <div key={currency} className="space-y-2">
                                                <Label>{currency}</Label>
                                                <Input
                                                  type="number"
                                                  step={cryptoInputMode === 'usd' ? "0.01" : "0.00000001"}
                                                  min="0"
                                                  value={displayValue}
                                                  onChange={(e) =>
                                                    handleWalletValueChange(
                                                      'crypto',
                                                      'minWithdrawalAmount',
                                                      currency,
                                                      e.target.value,
                                                      cryptoInputMode === 'usd'
                                                    )
                                                  }
                                                  onBlur={() => {
                                                    setRawInputValues((prev) => {
                                                      const newValues = { ...prev }
                                                      delete newValues[inputKey]
                                                      return newValues
                                                    })
                                                  }}
                                                  disabled={updateWalletWithdrawalConfigMutation.isPending}
                                                  placeholder="0"
                                                />
                                                {cryptoInputMode === 'usd' && equivalentCrypto > 0 && (
                                                  <p className="text-xs text-muted-foreground">
                                                    ≈ {equivalentCrypto.toFixed(8)} {currency}
                                                  </p>
                                                )}
                                                {cryptoInputMode === 'crypto' && equivalentUsd > 0 && (
                                                  <p className="text-xs text-muted-foreground">
                                                    ≈ ${equivalentUsd.toFixed(2)} USD
                                                  </p>
                                                )}
                                                {editedWalletConfig.crypto.minWithdrawalAmount[currency] !==
                                                  config.wallet.crypto.minWithdrawalAmount[currency] && (
                                                    <Badge variant="outline" className="text-orange-600">
                                                      Modified
                                                    </Badge>
                                                  )}
                                              </div>
                                            )
                                          })}
                                      </div>
                                      <Button
                                        onClick={() => handleSaveWalletConfig('crypto', 'minWithdrawalAmount')}
                                        disabled={updateWalletWithdrawalConfigMutation.isPending}
                                      >
                                        {updateWalletWithdrawalConfigMutation.isPending ? 'Saving...' : 'Save Minimum Withdrawal Amounts'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Auto Review Above Amount */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Auto Review Above Amount</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        Withdrawals above this amount will require manual admin review. Set to 0 to disable auto-review.
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys({
                                          ...config.wallet.crypto.minWithdrawalAmount,
                                          ...config.wallet.crypto.autoReviewAboveAmount,
                                        })
                                          .sort()
                                          .map((currency) => {
                                            const cryptoValue = editedWalletConfig.crypto.autoReviewAboveAmount[currency] || 0
                                            const usdValue = editedWalletConfigUsd?.crypto.autoReviewAboveAmount[currency] || 0
                                            const inputKey = `crypto-autoReviewAboveAmount-${currency}-${cryptoInputMode === 'usd' ? 'usd' : 'crypto'}`
                                            const rawValue = rawInputValues[inputKey]

                                            // Use raw input value if available (user is typing), otherwise use the numeric value
                                            // Format USD values to 2 decimal places for display (e.g., 9.999995971914 -> 10.00)
                                            const displayValue = rawValue !== undefined
                                              ? rawValue
                                              : (cryptoInputMode === 'usd'
                                                ? (usdValue ? Number(usdValue.toFixed(2)) : 0)
                                                : (cryptoValue || 0))

                                            const equivalentUsd = cryptoValue > 0 ? convertCryptoToUsd(currency, cryptoValue) : 0
                                            const equivalentCrypto = usdValue > 0 ? convertUsdToCrypto(currency, usdValue) : 0

                                            return (
                                              <div key={currency} className="space-y-2">
                                                <Label>{currency}</Label>
                                                <Input
                                                  type="number"
                                                  step={cryptoInputMode === 'usd' ? "0.01" : "0.00000001"}
                                                  min="0"
                                                  value={displayValue}
                                                  onChange={(e) =>
                                                    handleWalletValueChange(
                                                      'crypto',
                                                      'autoReviewAboveAmount',
                                                      currency,
                                                      e.target.value,
                                                      cryptoInputMode === 'usd'
                                                    )
                                                  }
                                                  onBlur={() => {
                                                    // Clear raw input value on blur so it uses the numeric value
                                                    setRawInputValues((prev) => {
                                                      const newValues = { ...prev }
                                                      delete newValues[inputKey]
                                                      return newValues
                                                    })
                                                  }}
                                                  disabled={updateWalletWithdrawalConfigMutation.isPending}
                                                  placeholder="0"
                                                />
                                                {cryptoInputMode === 'usd' && equivalentCrypto > 0 && (
                                                  <p className="text-xs text-muted-foreground">
                                                    ≈ {equivalentCrypto.toFixed(8)} {currency}
                                                  </p>
                                                )}
                                                {cryptoInputMode === 'crypto' && equivalentUsd > 0 && (
                                                  <p className="text-xs text-muted-foreground">
                                                    ≈ ${equivalentUsd.toFixed(2)} USD
                                                  </p>
                                                )}
                                                {editedWalletConfig.crypto.autoReviewAboveAmount[currency] !==
                                                  config.wallet.crypto.autoReviewAboveAmount[currency] && (
                                                    <Badge variant="outline" className="text-orange-600">
                                                      Modified
                                                    </Badge>
                                                  )}
                                              </div>
                                            )
                                          })}
                                      </div>
                                      <Button
                                        onClick={() => handleSaveWalletConfig('crypto', 'autoReviewAboveAmount')}
                                        disabled={updateWalletWithdrawalConfigMutation.isPending}
                                      >
                                        {updateWalletWithdrawalConfigMutation.isPending ? 'Saving...' : 'Save Auto Review Thresholds'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Referrals</Label>
                          <p className="text-sm text-muted-foreground">Enable referral program</p>
                        </div>
                        <Switch
                          checked={config.features.referrals.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('features.referrals.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Notifications</Label>
                          <p className="text-sm text-muted-foreground">Enable push notifications</p>
                        </div>
                        <Switch
                          checked={config.features.notifications.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('features.notifications.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Chat Support</Label>
                          <p className="text-sm text-muted-foreground">Enable chat support feature</p>
                        </div>
                        <Switch
                          checked={config.features.chatSupport.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('features.chatSupport.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Beta Features</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable beta features for testing
                          </p>
                        </div>
                        <Switch
                          checked={config.features.betaFeatures.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('features.betaFeatures.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">File Uploads</Label>
                          <p className="text-sm text-muted-foreground">Enable file uploads</p>
                        </div>
                        <Switch
                          checked={config.features.fileUploads.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('features.fileUploads.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </TabsContent>

                    {/* Announcements Tab */}
                    <TabsContent value="announcements" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Announcement Banner</Label>
                          <p className="text-sm text-muted-foreground">Enable announcement banner</p>
                        </div>
                        <Switch
                          checked={config.announcement.banner.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('announcement.banner.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Banner Text</Label>
                        <Input
                          value={config.announcement.banner.text}
                          onChange={(e) =>
                            handleConfigInputChange('announcement.banner.text', e.target.value)
                          }
                          disabled={isUpdating}
                          placeholder="Enter banner text"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Force Popup</Label>
                          <p className="text-sm text-muted-foreground">Enable forced popup</p>
                        </div>
                        <Switch
                          checked={config.announcement.forcePopup.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('announcement.forcePopup.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Popup Text</Label>
                        <Input
                          value={config.announcement.forcePopup.text}
                          onChange={(e) =>
                            handleConfigInputChange('announcement.forcePopup.text', e.target.value)
                          }
                          disabled={isUpdating}
                          placeholder="Enter popup text"
                        />
                      </div>
                    </TabsContent>

                    {/* Version Tab */}
                    <TabsContent value="version" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Minimum Supported Version</Label>
                        <Input
                          value={config.app.version.minimumSupported}
                          onChange={(e) =>
                            handleConfigInputChange('app.version.minimumSupported', e.target.value)
                          }
                          disabled={isUpdating}
                          placeholder="1.0.0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Latest Version</Label>
                        <Input
                          value={config.app.version.latest}
                          onChange={(e) =>
                            handleConfigInputChange('app.version.latest', e.target.value)
                          }
                          disabled={isUpdating}
                          placeholder="1.0.0"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Force Update</Label>
                          <p className="text-sm text-muted-foreground">
                            Force app update for users
                          </p>
                        </div>
                        <Switch
                          checked={config.app.version.forceUpdate.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigToggle('app.version.forceUpdate.enabled', checked)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </TabsContent>

                    {/* Integrations Tab */}
                    <TabsContent value="integrations" className="space-y-4 mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Quidax Integration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Onramp Receiver Address</Label>
                            <div className="flex gap-2">
                              <Input
                                value={isQuidaxReceiverEditing ? quidaxReceiverInput : (config.quidax?.onramp?.receiverAddress || '')}
                                onChange={(e) => {
                                  setIsQuidaxReceiverEditing(true)
                                  setQuidaxReceiverInput(e.target.value)
                                }}
                                disabled={isUpdating}
                                placeholder="Enter Quidax receiver address"
                                className="flex-1"
                              />
                              <Button
                                disabled={isUpdating || !isQuidaxReceiverEditing}
                                onClick={async () => {
                                  await handleConfigInputChange('quidax.onramp.receiverAddress', quidaxReceiverInput)
                                  setIsQuidaxReceiverEditing(false)
                                  showSuccessToast('Quidax receiver address updated successfully')
                                }}
                              >
                                {isUpdating ? 'Updating...' : 'Update'}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              The default deposit address used for QUIDAX onramp swaps.
                            </p>
                          </div>

                          <div className="pt-4 border-t space-y-2">
                            <Label>Off-ramp Bank Account</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Select the bank and enter the account number for QUIDAX offramp transactions.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs">Bank</Label>
                                <Select
                                  value={isQuidaxOfframpEditing ? selectedQuidaxBankCode : (config.quidax?.offramp?.bankCode || '')}
                                  onValueChange={(value) => {
                                    setIsQuidaxOfframpEditing(true)
                                    setSelectedQuidaxBankCode(value)
                                    // if we just started editing, populate account number from config if we haven't already
                                    if (!isQuidaxOfframpEditing && !quidaxAccountNumber) {
                                      setQuidaxAccountNumber(config.quidax?.offramp?.accountNumber || '')
                                    }
                                  }}
                                  disabled={isUpdating || saveQuidaxBankMutation.isPending || isLoadingQuidaxBanks}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={isLoadingQuidaxBanks ? "Loading banks..." : "Select a Bank"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {quidaxBanks?.map((bank: any) => (
                                      <SelectItem key={bank.code} value={bank.code}>
                                        {bank.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex-1 space-y-2">
                                <Label className="text-xs">Account Number</Label>
                                <Input
                                  value={isQuidaxOfframpEditing ? quidaxAccountNumber : (config.quidax?.offramp?.accountNumber || '')}
                                  onChange={(e) => {
                                    setIsQuidaxOfframpEditing(true)
                                    setQuidaxAccountNumber(e.target.value)
                                    // if we just started editing, populate bank code from config if we haven't already
                                    if (!isQuidaxOfframpEditing && !selectedQuidaxBankCode) {
                                      setSelectedQuidaxBankCode(config.quidax?.offramp?.bankCode || '')
                                    }
                                  }}
                                  disabled={isUpdating || saveQuidaxBankMutation.isPending}
                                  placeholder="Enter account number"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <Button
                                disabled={
                                  isUpdating ||
                                  saveQuidaxBankMutation.isPending ||
                                  !isQuidaxOfframpEditing ||
                                  !selectedQuidaxBankCode ||
                                  !quidaxAccountNumber
                                }
                                onClick={() => {
                                  saveQuidaxBankMutation.mutate({
                                    bankCode: selectedQuidaxBankCode,
                                    accountNumber: quidaxAccountNumber
                                  })
                                }}
                              >
                                {saveQuidaxBankMutation.isPending ? 'Saving...' : 'Save Bank Account'}
                              </Button>
                            </div>

                            {!isQuidaxOfframpEditing && config.quidax?.offramp?.bankName && (
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">
                                Active Bank: {config.quidax.offramp.bankName}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No configuration found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Currency Pairs Tab */}
        <TabsContent value="currency-pairs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Currency Pairs</CardTitle>
                <Button onClick={() => setIsCreateCurrencyPairOpen(true)}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Add Pair
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPairs && !currencyPairs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader />
                </div>
              ) : isPermissionError(pairsError) ? (
                <PermissionError message={handleApiError(pairsError)} variant="inline" />
              ) : pairsError ? (
                <div className="text-sm text-destructive">{handleApiError(pairsError)}</div>
              ) : (
                <DataTable
                  data={currencyPairs || []}
                  columns={currencyPairsColumns}
                  isLoading={isFetchingPairs}
                  refreshable={true}
                  onRefresh={() => refetchPairs()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thresh0ld Currencies Tab */}
        <TabsContent value="thresh0ld-currencies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thresh0ld Currencies</CardTitle>
                <Button onClick={() => setIsCreateThresh0ldCurrencyOpen(true)}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Add Currency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingThresh0ldCurrencies && !thresh0ldCurrencies ? (
                <div className="flex items-center justify-center py-12">
                  <Loader />
                </div>
              ) : isPermissionError(thresh0ldCurrenciesError) ? (
                <PermissionError message={handleApiError(thresh0ldCurrenciesError)} variant="inline" />
              ) : thresh0ldCurrenciesError ? (
                <div className="text-sm text-destructive">{handleApiError(thresh0ldCurrenciesError)}</div>
              ) : (
                <DataTable
                  data={thresh0ldCurrencies || []}
                  columns={thresh0ldCurrenciesColumns}
                  isLoading={isFetchingThresh0ldCurrencies}
                  refreshable={true}
                  onRefresh={() => refetchThresh0ldCurrencies()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thresh0ld Tokens Tab */}
        <TabsContent value="thresh0ld-tokens">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thresh0ld Tokens</CardTitle>
                <Button onClick={() => setIsCreateThresh0ldTokenOpen(true)}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Add Token
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingThresh0ldTokens && !thresh0ldTokens ? (
                <div className="flex items-center justify-center py-12">
                  <Loader />
                </div>
              ) : isPermissionError(thresh0ldTokensError) ? (
                <PermissionError message={handleApiError(thresh0ldTokensError)} variant="inline" />
              ) : thresh0ldTokensError ? (
                <div className="text-sm text-destructive">{handleApiError(thresh0ldTokensError)}</div>
              ) : (
                <DataTable
                  data={thresh0ldTokens || []}
                  columns={thresh0ldTokensColumns}
                  isLoading={isFetchingThresh0ldTokens}
                  refreshable={true}
                  onRefresh={() => refetchThresh0ldTokens()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiat Currencies Tab */}
        <TabsContent value="fiat-currencies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fiat Currencies</CardTitle>
                <Button onClick={() => setIsCreateFiatCurrencyOpen(true)}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Add Currency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFiatCurrencies && !fiatCurrencies ? (
                <div className="flex items-center justify-center py-12">
                  <Loader />
                </div>
              ) : isPermissionError(fiatCurrenciesError) ? (
                <PermissionError message={handleApiError(fiatCurrenciesError)} variant="inline" />
              ) : fiatCurrenciesError ? (
                <div className="text-sm text-destructive">{handleApiError(fiatCurrenciesError)}</div>
              ) : (
                <DataTable
                  data={fiatCurrencies || []}
                  columns={fiatCurrenciesColumns}
                  isLoading={isFetchingFiatCurrencies}
                  refreshable={true}
                  onRefresh={() => refetchFiatCurrencies()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Currency Pair Dialog */}
      <Dialog open={isCreateCurrencyPairOpen} onOpenChange={setIsCreateCurrencyPairOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Currency Pair</DialogTitle>
            <DialogDescription>Add a new currency pair</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createCurrencyPairForm.handleSubmit((data) => {
              createCurrencyPairMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-base">Base Currency *</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="base"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-base"
                        placeholder="BTC"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-quote">Quote Currency *</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="quote"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-quote"
                        placeholder="USD"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-rate">Rate *</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="rate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="50000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-market-rate">Market Rate</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="marketRate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-market-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="50000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-profit-percent">Profit Percent</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="profitPercent"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-profit-percent"
                        type="number"
                        step="0.01"
                        placeholder="0.5"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-flat-fee">Flat Fee</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="flatFee"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-flat-fee"
                        type="number"
                        step="0.00000001"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-buy-rate">Buy Rate</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="buyRate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-buy-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="1479.46"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-sell-rate">Sell Rate</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="sellRate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-sell-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="1486.15"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-fee-percent">Fee Percent</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="feePercent"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currency-pair-fee-percent"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="currency-pair-provider">Provider</FieldLabel>
                <Controller
                  control={createCurrencyPairForm.control}
                  name="provider"
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || 'INTERNAL'}
                      >
                        <SelectTrigger id="currency-pair-provider" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Internal</SelectItem>
                          <SelectItem value="QUIDAX">Quidax</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCurrencyPairOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCurrencyPairMutation.isPending}>
                {createCurrencyPairMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Currency Pair Dialog */}
      <Dialog open={!!editingCurrencyPair} onOpenChange={(open) => !open && setEditingCurrencyPair(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Currency Pair</DialogTitle>
            <DialogDescription>
              Update rate and spread for {editingCurrencyPair && getPairKey(editingCurrencyPair)}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateCurrencyPairForm.handleSubmit((data) => {
              if (editingCurrencyPair) {
                updateCurrencyPairMutation.mutate({
                  pair: getPairKey(editingCurrencyPair),
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-currency-pair-rate">Rate *</FieldLabel>
                <Controller
                  control={updateCurrencyPairForm.control}
                  name="rate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-currency-pair-rate"
                        type="number"
                        step="0.00000001"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-currency-pair-spread">Spread</FieldLabel>
                <Controller
                  control={updateCurrencyPairForm.control}
                  name="spread"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-currency-pair-spread"
                        type="number"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-currency-pair-buy-rate">Buy Rate</FieldLabel>
                <Controller
                  control={updateCurrencyPairForm.control}
                  name="buyRate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-currency-pair-buy-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="1479.46"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-currency-pair-sell-rate">Sell Rate</FieldLabel>
                <Controller
                  control={updateCurrencyPairForm.control}
                  name="sellRate"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-currency-pair-sell-rate"
                        type="number"
                        step="0.00000001"
                        placeholder="1486.15"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-currency-pair-provider">Provider</FieldLabel>
                <Controller
                  control={updateCurrencyPairForm.control}
                  name="provider"
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || 'INTERNAL'}
                      >
                        <SelectTrigger id="update-currency-pair-provider" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Internal</SelectItem>
                          <SelectItem value="QUIDAX">Quidax</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCurrencyPair(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCurrencyPairMutation.isPending}>
                {updateCurrencyPairMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Fees Dialog */}
      <Dialog open={!!updatingFeesPair} onOpenChange={(open) => !open && setUpdatingFeesPair(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Fees</DialogTitle>
            <DialogDescription>
              Update fees for {updatingFeesPair && getPairKey(updatingFeesPair)}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateFeesForm.handleSubmit((data) => {
              if (updatingFeesPair) {
                updateFeesMutation.mutate({
                  pair: getPairKey(updatingFeesPair),
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-fees-flat-fee">Flat Fee</FieldLabel>
                <Controller
                  control={updateFeesForm.control}
                  name="flatFee"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-fees-flat-fee"
                        type="number"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-fees-fee-percent">Fee Percent</FieldLabel>
                <Controller
                  control={updateFeesForm.control}
                  name="feePercent"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-fees-fee-percent"
                        type="number"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUpdatingFeesPair(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateFeesMutation.isPending}>
                {updateFeesMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Spread Dialog */}
      <Dialog open={!!updatingSpreadPair} onOpenChange={(open) => !open && setUpdatingSpreadPair(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Spread</DialogTitle>
            <DialogDescription>
              Update spread for {updatingSpreadPair && getPairKey(updatingSpreadPair)}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateSpreadForm.handleSubmit((data) => {
              if (updatingSpreadPair) {
                updateSpreadMutation.mutate({
                  pair: getPairKey(updatingSpreadPair),
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-spread">Spread *</FieldLabel>
                <Controller
                  control={updateSpreadForm.control}
                  name="spread"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-spread"
                        type="number"
                        step="0.01"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUpdatingSpreadPair(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateSpreadMutation.isPending}>
                {updateSpreadMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Currency Pair Dialog */}
      <Dialog open={!!deletingCurrencyPair} onOpenChange={(open) => !open && setDeletingCurrencyPair(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Currency Pair</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingCurrencyPair && getPairKey(deletingCurrencyPair)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCurrencyPair(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingCurrencyPair) {
                  deleteCurrencyPairMutation.mutate(`${deletingCurrencyPair.base}_${deletingCurrencyPair.quote}`)
                }
              }}
              disabled={deleteCurrencyPairMutation.isPending}
            >
              {deleteCurrencyPairMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Thresh0ld Currency Dialog */}
      <Dialog open={isCreateThresh0ldCurrencyOpen} onOpenChange={setIsCreateThresh0ldCurrencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Thresh0ld Currency</DialogTitle>
            <DialogDescription>Add a new Thresh0ld currency</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createThresh0ldCurrencyForm.handleSubmit((data) => {
              createThresh0ldCurrencyMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-currency-coin">Coin *</FieldLabel>
                <Controller
                  control={createThresh0ldCurrencyForm.control}
                  name="coin"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-currency-coin"
                        placeholder="BTC"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-currency-chain">Chain *</FieldLabel>
                <Controller
                  control={createThresh0ldCurrencyForm.control}
                  name="chain"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-currency-chain"
                        placeholder="Bitcoin"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={createThresh0ldCurrencyForm.control}
                  name="isTestnet"
                  render={({ field }) => (
                    <Checkbox
                      id="thresh0ld-currency-testnet"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="thresh0ld-currency-testnet" className="cursor-pointer font-normal">
                  Testnet
                </FieldLabel>
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={createThresh0ldCurrencyForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="thresh0ld-currency-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="thresh0ld-currency-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-currency-sort-order">Sort Order</FieldLabel>
                <Controller
                  control={createThresh0ldCurrencyForm.control}
                  name="sortOrder"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-currency-sort-order"
                        type="number"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateThresh0ldCurrencyOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createThresh0ldCurrencyMutation.isPending}>
                {createThresh0ldCurrencyMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Thresh0ld Currency Dialog */}
      <Dialog open={!!editingThresh0ldCurrency} onOpenChange={(open) => !open && setEditingThresh0ldCurrency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Thresh0ld Currency</DialogTitle>
            <DialogDescription>
              Update {editingThresh0ldCurrency?.coin} on {editingThresh0ldCurrency?.chain}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateThresh0ldCurrencyForm.handleSubmit((data) => {
              if (editingThresh0ldCurrency) {
                updateThresh0ldCurrencyMutation.mutate({
                  id: editingThresh0ldCurrency.id,
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={updateThresh0ldCurrencyForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="update-thresh0ld-currency-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="update-thresh0ld-currency-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-thresh0ld-currency-sort-order">Sort Order</FieldLabel>
                <Controller
                  control={updateThresh0ldCurrencyForm.control}
                  name="sortOrder"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-thresh0ld-currency-sort-order"
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingThresh0ldCurrency(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateThresh0ldCurrencyMutation.isPending}>
                {updateThresh0ldCurrencyMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Thresh0ld Currency Dialog */}
      <Dialog open={!!deletingThresh0ldCurrency} onOpenChange={(open) => !open && setDeletingThresh0ldCurrency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thresh0ld Currency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingThresh0ldCurrency?.coin} on {deletingThresh0ldCurrency?.chain}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingThresh0ldCurrency(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingThresh0ldCurrency) {
                  deleteThresh0ldCurrencyMutation.mutate(deletingThresh0ldCurrency.id)
                }
              }}
              disabled={deleteThresh0ldCurrencyMutation.isPending}
            >
              {deleteThresh0ldCurrencyMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Thresh0ld Token Dialog */}
      <Dialog open={isCreateThresh0ldTokenOpen} onOpenChange={setIsCreateThresh0ldTokenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Thresh0ld Token</DialogTitle>
            <DialogDescription>Add a new Thresh0ld token</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createThresh0ldTokenForm.handleSubmit((data) => {
              createThresh0ldTokenMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-token-address">Address *</FieldLabel>
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-token-address"
                        placeholder="0x..."
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-token-name">Name *</FieldLabel>
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-token-name"
                        placeholder="Token Name"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-token-symbol">Symbol *</FieldLabel>
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="symbol"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-token-symbol"
                        placeholder="TKN"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-token-decimals">Decimals *</FieldLabel>
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="decimals"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-token-decimals"
                        type="number"
                        placeholder="18"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="thresh0ld-token-parent-chain">Parent Chain *</FieldLabel>
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="parentChain"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="thresh0ld-token-parent-chain"
                        placeholder="Ethereum"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="isTestnet"
                  render={({ field }) => (
                    <Checkbox
                      id="thresh0ld-token-testnet"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="thresh0ld-token-testnet" className="cursor-pointer font-normal">
                  Testnet
                </FieldLabel>
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={createThresh0ldTokenForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="thresh0ld-token-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="thresh0ld-token-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateThresh0ldTokenOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createThresh0ldTokenMutation.isPending}>
                {createThresh0ldTokenMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Thresh0ld Token Dialog */}
      <Dialog open={!!editingThresh0ldToken} onOpenChange={(open) => !open && setEditingThresh0ldToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Thresh0ld Token</DialogTitle>
            <DialogDescription>
              Update {editingThresh0ldToken?.name} ({editingThresh0ldToken?.symbol})
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateThresh0ldTokenForm.handleSubmit((data) => {
              if (editingThresh0ldToken) {
                updateThresh0ldTokenMutation.mutate({
                  id: editingThresh0ldToken.id,
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={updateThresh0ldTokenForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="update-thresh0ld-token-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="update-thresh0ld-token-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-thresh0ld-token-decimals">Decimals</FieldLabel>
                <Controller
                  control={updateThresh0ldTokenForm.control}
                  name="decimals"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-thresh0ld-token-decimals"
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingThresh0ldToken(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateThresh0ldTokenMutation.isPending}>
                {updateThresh0ldTokenMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Thresh0ld Token Dialog */}
      <Dialog open={!!deletingThresh0ldToken} onOpenChange={(open) => !open && setDeletingThresh0ldToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thresh0ld Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingThresh0ldToken?.name} ({deletingThresh0ldToken?.symbol})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingThresh0ldToken(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingThresh0ldToken) {
                  deleteThresh0ldTokenMutation.mutate(deletingThresh0ldToken.id)
                }
              }}
              disabled={deleteThresh0ldTokenMutation.isPending}
            >
              {deleteThresh0ldTokenMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Fiat Currency Dialog */}
      <Dialog open={isCreateFiatCurrencyOpen} onOpenChange={setIsCreateFiatCurrencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fiat Currency</DialogTitle>
            <DialogDescription>Add a new fiat currency</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createFiatCurrencyForm.handleSubmit((data) => {
              createFiatCurrencyMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="fiat-currency-symbol">Symbol *</FieldLabel>
                <Controller
                  control={createFiatCurrencyForm.control}
                  name="symbol"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="fiat-currency-symbol"
                        placeholder="USD"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="fiat-currency-name">Name *</FieldLabel>
                <Controller
                  control={createFiatCurrencyForm.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="fiat-currency-name"
                        placeholder="US Dollar"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="fiat-currency-country-code">Country Code *</FieldLabel>
                <Controller
                  control={createFiatCurrencyForm.control}
                  name="countryCode"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="fiat-currency-country-code"
                        placeholder="US"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={createFiatCurrencyForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="fiat-currency-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="fiat-currency-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateFiatCurrencyOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFiatCurrencyMutation.isPending}>
                {createFiatCurrencyMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Fiat Currency Dialog */}
      <Dialog open={!!editingFiatCurrency} onOpenChange={(open) => !open && setEditingFiatCurrency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fiat Currency</DialogTitle>
            <DialogDescription>
              Update {editingFiatCurrency?.symbol} - {editingFiatCurrency?.name}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={updateFiatCurrencyForm.handleSubmit((data) => {
              if (editingFiatCurrency) {
                updateFiatCurrencyMutation.mutate({
                  id: editingFiatCurrency.id,
                  data,
                })
              }
            })}
            className="space-y-4"
          >
            <FieldGroup>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-fiat-currency-name">Name</FieldLabel>
                <Controller
                  control={updateFiatCurrencyForm.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-fiat-currency-name"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field className="space-y-2">
                <FieldLabel htmlFor="update-fiat-currency-country-code">Country Code</FieldLabel>
                <Controller
                  control={updateFiatCurrencyForm.control}
                  name="countryCode"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="update-fiat-currency-country-code"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                    </>
                  )}
                />
              </Field>
              <Field orientation="horizontal" className="flex items-center space-x-2">
                <Controller
                  control={updateFiatCurrencyForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      id="update-fiat-currency-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor="update-fiat-currency-active" className="cursor-pointer font-normal">
                  Active
                </FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingFiatCurrency(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateFiatCurrencyMutation.isPending}>
                {updateFiatCurrencyMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Fiat Currency Dialog */}
      <Dialog open={!!deletingFiatCurrency} onOpenChange={(open) => !open && setDeletingFiatCurrency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fiat Currency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingFiatCurrency?.symbol} - {deletingFiatCurrency?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingFiatCurrency(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingFiatCurrency) {
                  deleteFiatCurrencyMutation.mutate(deletingFiatCurrency.id)
                }
              }}
              disabled={deleteFiatCurrencyMutation.isPending}
            >
              {deleteFiatCurrencyMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
