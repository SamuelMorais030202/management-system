import { useIsMutating } from "@tanstack/react-query"
import { PREPARATION_STATUS_MUTATION_KEY } from "@/hooks/preparationStatusMutationKey"

/** True enquanto qualquer mutação de status deste pedido estiver em andamento (sobrevive a remount do card). */
export function useIsOrderStatusUpdating(orderId: number) {
  return (
    useIsMutating({
      predicate: (mutation) => {
        const key = mutation.options.mutationKey
        if (
          Array.isArray(key) &&
          key[0] === PREPARATION_STATUS_MUTATION_KEY &&
          key[1] === orderId
        ) {
          return true
        }

        if (Array.isArray(key) && key[0] === PREPARATION_STATUS_MUTATION_KEY) {
          const vars = mutation.state.variables as { orderId?: number } | undefined
          return vars?.orderId === orderId
        }

        return false
      },
    }) > 0
  )
}
