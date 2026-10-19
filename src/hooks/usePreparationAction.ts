import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ItemStatus } from "@/hooks/useLoadOrdersByTerminal"
import type { PreparationAction } from "@/utils/kanbanStatusTransitions"
import { PREPARATION_STATUS_MUTATION_KEY } from "@/hooks/preparationStatusMutationKey"
import {
  applyOptimisticOrderStatus,
  invalidateOrdersAfterStatusChange,
  restoreOrdersQueries,
  updateOrderStatusInCache,
  type OrdersCacheSnapshot,
} from "@/utils/updateOrderStatusInCache"

const ACTION_STATUS: Record<PreparationAction, ItemStatus> = {
  start: "preparoEmProducao",
  pause: "preparoPausado",
  finish: "preparoFinalizado",
}

const ACTION_PATH: Record<PreparationAction, string> = {
  start: "iniciar",
  pause: "pausar",
  finish: "finalizar",
}

export function usePreparationAction(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [PREPARATION_STATUS_MUTATION_KEY],
    mutationFn: async ({
      orderId,
      action,
    }: {
      orderId: number
      action: PreparationAction
    }) => {
      if (!companyId || !orderId) {
        throw new Error("Empresa e id são obrigatórios")
      }

      const { data } = await api.post(
        `/shared/kds/${companyId}/preparos/${orderId}/${ACTION_PATH[action]}`,
      )

      return { data, orderId, action }
    },
    onMutate: async ({ orderId, action }) => {
      const nextStatus = ACTION_STATUS[action]
      const dataHoraStatus =
        action === "start" ? new Date().toISOString() : undefined

      const snapshot = await applyOptimisticOrderStatus(
        queryClient,
        orderId,
        nextStatus,
        dataHoraStatus,
      )

      return { snapshot } as { snapshot: OrdersCacheSnapshot }
    },
    onError: (_error, _variables, context) => {
      restoreOrdersQueries(queryClient, context?.snapshot)
    },
    onSuccess: ({ data, orderId, action }) => {
      if (action === "start") {
        const dataHoraStatus =
          (data as { dataHoraStatus?: string })?.dataHoraStatus ??
          new Date().toISOString()
        updateOrderStatusInCache(
          queryClient,
          orderId,
          ACTION_STATUS[action],
          dataHoraStatus,
        )
      }
    },
    onSettled: () => {
      invalidateOrdersAfterStatusChange(queryClient)
    },
  })
}
