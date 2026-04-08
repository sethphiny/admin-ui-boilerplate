import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemApi } from '@/api/endpoints/system/system'
import { SystemConfig, FlatSystemConfig, ConfigUpdateResponse } from '@/types/admin/system'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

export function useSystemConfig() {
  const queryClient = useQueryClient()

  // Fetch structured config
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery<SystemConfig>({
    queryKey: ['system-config-structured'],
    queryFn: () => systemApi.getStructuredConfig(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Update config mutation
  const updateMutation = useMutation<ConfigUpdateResponse, unknown, FlatSystemConfig>({
    mutationFn: (updates: FlatSystemConfig) => systemApi.updateSystemConfig(updates),
    onSuccess: (response) => {
      // Invalidate and refetch config
      queryClient.invalidateQueries({ queryKey: ['system-config-structured'] })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      
      // Check if any critical configs were changed
      const criticalChanges = Object.values(response).filter((change) => change.isCritical)
      if (criticalChanges.length > 0) {
        showSuccessToast(
          `Configuration updated. ${criticalChanges.length} critical setting(s) changed.`
        )
      } else {
        showSuccessToast('Configuration updated successfully')
      }
    },
    onError: (error) => {
      showErrorToast(error)
    },
  })

  const updateConfig = async (updates: FlatSystemConfig) => {
    return updateMutation.mutateAsync(updates)
  }

  return {
    config,
    loading: isLoading,
    error,
    reload: refetch,
    updateConfig,
    isUpdating: updateMutation.isPending,
  }
}

