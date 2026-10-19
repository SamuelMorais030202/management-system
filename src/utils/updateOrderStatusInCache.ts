import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { ItemStatus, OrdersResponse, PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"

export type OrdersCacheSnapshot = {
  orders: [QueryKey, OrdersResponse | undefined][]
  search: [QueryKey, PreparoProducao[] | undefined][]
}

function patchOrder(
  order: PreparoProducao,
  orderId: number,
  status: ItemStatus,
  dataHoraStatus?: string | null,
): PreparoProducao {
  if (order.preparoProducaoId !== orderId) return order
  return {
    ...order,
    status,
    ...(dataHoraStatus !== undefined ? { dataHoraStatus } : {}),
  }
}

export function snapshotOrdersQueries(queryClient: QueryClient): OrdersCacheSnapshot {
  return {
    orders: queryClient.getQueriesData<OrdersResponse>({
      queryKey: ["load-orders-by-terminal"],
    }),
    search: queryClient.getQueriesData<PreparoProducao[]>({
      queryKey: ["search-orders-across-pages"],
    }),
  }
}

export function restoreOrdersQueries(
  queryClient: QueryClient,
  snapshot: OrdersCacheSnapshot | undefined,
) {
  if (!snapshot) return

  for (const [key, data] of snapshot.orders) {
    queryClient.setQueryData(key, data)
  }
  for (const [key, data] of snapshot.search) {
    queryClient.setQueryData(key, data)
  }
}

/** Atualiza o status do pedido nos caches de listagem sem desmontar a página. */
export function updateOrderStatusInCache(
  queryClient: QueryClient,
  orderId: number,
  status: ItemStatus,
  dataHoraStatus?: string | null,
) {
  queryClient.setQueriesData<OrdersResponse>(
    { queryKey: ["load-orders-by-terminal"] },
    (current) => {
      if (!current?.data) return current
      return {
        ...current,
        data: current.data.map((order) =>
          patchOrder(order, orderId, status, dataHoraStatus),
        ),
      }
    },
  )

  queryClient.setQueriesData<PreparoProducao[]>(
    { queryKey: ["search-orders-across-pages"] },
    (current) => {
      if (!current) return current
      return current.map((order) => patchOrder(order, orderId, status, dataHoraStatus))
    },
  )
}

/** Aplica update otimista e devolve snapshot para rollback. */
export async function applyOptimisticOrderStatus(
  queryClient: QueryClient,
  orderId: number,
  status: ItemStatus,
  dataHoraStatus?: string | null,
): Promise<OrdersCacheSnapshot> {
  await queryClient.cancelQueries({ queryKey: ["load-orders-by-terminal"] })
  await queryClient.cancelQueries({ queryKey: ["search-orders-across-pages"] })

  const snapshot = snapshotOrdersQueries(queryClient)
  updateOrderStatusInCache(queryClient, orderId, status, dataHoraStatus)
  return snapshot
}

/** Invalida contadores e agenda refetch silencioso das listagens. */
export function invalidateOrdersAfterStatusChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["order-count"] })
  queryClient.invalidateQueries({
    queryKey: ["load-orders-by-terminal"],
    refetchType: "active",
  })
  queryClient.invalidateQueries({
    queryKey: ["search-orders-across-pages"],
    refetchType: "active",
  })
}
