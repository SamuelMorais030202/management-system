import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PREPARATION_STATUS_MUTATION_KEY } from "@/hooks/preparationStatusMutationKey"
import {
  applyOptimisticOrderStatus,
  invalidateOrdersAfterStatusChange,
  restoreOrdersQueries,
} from "@/utils/updateOrderStatusInCache"

export function useFinishPreparation(companyId: number, id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [PREPARATION_STATUS_MUTATION_KEY, id],
    mutationFn: async () => {
      if (!companyId || !id) throw new Error("Empresa e id são abrigatórios")

      const { data } = await api.post(`/shared/kds/${companyId}/preparos/${id}/finalizar`)
      return data
    },
    onMutate: async () => {
      const snapshot = await applyOptimisticOrderStatus(
        queryClient,
        id,
        "preparoFinalizado",
      )
      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      restoreOrdersQueries(queryClient, context?.snapshot)
    },
    onSettled: () => {
      invalidateOrdersAfterStatusChange(queryClient)
    },
  })
}
