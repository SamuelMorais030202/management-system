import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PREPARATION_STATUS_MUTATION_KEY } from "@/hooks/preparationStatusMutationKey"
import {
  applyOptimisticOrderStatus,
  invalidateOrdersAfterStatusChange,
  restoreOrdersQueries,
  updateOrderStatusInCache,
} from "@/utils/updateOrderStatusInCache"

interface StartPreparationResponse {
  preparoProducaoId: number
  status: string
  dataHoraStatus: string
}

export function useStartPreparation(companyId: number, id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [PREPARATION_STATUS_MUTATION_KEY, id],
    mutationFn: async () => {
      if (!companyId || !id) throw new Error("Empresa e id são abrigatórios")

      const { data } = await api.post<StartPreparationResponse>(
        `/shared/kds/${companyId}/preparos/${id}/iniciar`,
      )
      return data
    },
    onMutate: async () => {
      const snapshot = await applyOptimisticOrderStatus(
        queryClient,
        id,
        "preparoEmProducao",
        new Date().toISOString(),
      )
      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      restoreOrdersQueries(queryClient, context?.snapshot)
    },
    onSuccess: (data) => {
      updateOrderStatusInCache(
        queryClient,
        id,
        "preparoEmProducao",
        data?.dataHoraStatus ?? new Date().toISOString(),
      )
    },
    onSettled: () => {
      invalidateOrdersAfterStatusChange(queryClient)
    },
  })
}
