import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"

export const dedupeOrdersById = (orders: PreparoProducao[]) => {
  const byId = new Map<number, PreparoProducao>()
  for (const order of orders) {
    byId.set(order.preparoProducaoId, order)
  }
  return Array.from(byId.values())
}

export const orderMatchesSearch = (order: PreparoProducao, search: string) => {
  if (!search) return true

  const searchableValues = [
    order.preparoProducaoId,
    order.keyId,
    order.numero,
    order.clienteNome,
    order.garcom,
    order.mesaNumero,
    order.comandaNumero,
    order.comandaId,
  ]

  return searchableValues.some(
    (value) => value != null && String(value).toLowerCase().includes(search)
  )
}
