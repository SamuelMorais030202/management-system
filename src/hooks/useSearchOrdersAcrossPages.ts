import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  fetchAllOrdersByTerminal,
  PreparoProducao,
} from "@/hooks/useLoadOrdersByTerminal"
import { dedupeOrdersById, orderMatchesSearch } from "@/utils/orderSearch"

const SEARCH_DEBOUNCE_MS = 400

export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function useSearchOrdersAcrossPages({
  terminal,
  companyId,
  dataInicial,
  dataFinal,
  status,
  searchQuery,
}: {
  terminal: string
  companyId: number
  dataInicial?: string
  dataFinal?: string
  status?: string
  searchQuery: string
}) {
  const debouncedSearch = useDebouncedValue(searchQuery.trim())
  const normalizedSearch = debouncedSearch.toLowerCase()
  const isSearchActive = normalizedSearch.length > 0
  const isDebouncing = searchQuery.trim() !== debouncedSearch

  const query = useQuery<PreparoProducao[]>({
    queryKey: [
      "search-orders-across-pages",
      terminal,
      companyId,
      dataInicial,
      dataFinal,
      status,
      normalizedSearch,
    ],
    queryFn: async () => {
      const allOrders = await fetchAllOrdersByTerminal({
        terminal,
        companyId,
        dataInicial,
        dataFinal,
        status,
        limit: 100,
      })

      return dedupeOrdersById(allOrders).filter((order) =>
        orderMatchesSearch(order, normalizedSearch)
      )
    },
    enabled: isSearchActive && !!terminal && !!companyId,
    staleTime: 5_000,
  })

  return {
    ...query,
    isSearchActive,
    isDebouncing,
    debouncedSearch,
  }
}
