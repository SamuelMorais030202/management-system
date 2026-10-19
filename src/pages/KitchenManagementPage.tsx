import { useEffect, useState, useCallback, useRef } from "react"
import { Search, Menu, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OrderCard } from "@/components/order-card"
import { FilterBar } from "@/components/filter-bar"
import { LocationSelectorModal } from "@/components/location-selector-modal"
import { KitchenLoading } from "@/components/kitchen-loading"
import { ViewModeToggle } from "@/components/view-mode-toggle"
import { OrdersKanbanBoard } from "@/components/orders-kanban-board"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useLoadOrdersByTerminal, PreparoProducao, TempoPreparoStatus } from "@/hooks/useLoadOrdersByTerminal"
import { useSearchOrdersAcrossPages } from "@/hooks/useSearchOrdersAcrossPages"
import { usePersistedViewMode } from "@/hooks/usePersistedViewMode"
import { getLocationTypeColor } from "@/utils/getLocationTypeColor"
import { useLoadTerminals } from "@/hooks/useLoadTerminals"
import { useKdsRealtime } from "@/hooks/useKdsRealtime"
import { useOrderCount } from "@/hooks/useOrderCount"
import { WebSocketStatus } from "@/components/websocket-status"
import { toast } from "sonner"
import { playNotificationSound, initAudioContext } from "@/utils/sound"
import { dedupeOrdersById, orderMatchesSearch } from "@/utils/orderSearch"

const KANBAN_ITEMS_PER_PAGE = 100

export interface Order {
  id: string
  customer: string
  location: string
  dueTime: string
  status:
    | "preparoAguardandoProducao"
    | "preparoEmProducao"
    | "preparoCancelado"
    | "preparoPausado"
    | "preparoFinalizado"
  items: OrderItem[]
  timer: string
  isFinishing: boolean
  atrasado?: boolean
  tempoPreparoStatus: TempoPreparoStatus
}

export interface OrderItem {
  quantity: number
  name: string
  modifiers?: string[]
}

export default function KitchenManagementPage() {
  const params = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const tenant = params.tenant?.toString();
  const terminal = params.terminal?.toString();
  const empresaId = params.id?.toString();

  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [filterStartDate, setFilterStartDate] = useState(startDate)
  const [filterEndDate, setFilterEndDate] = useState(endDate)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [listItemsPerPage, setListItemsPerPage] = useState(20)
  const [isSearching, setIsSearching] = useState(false)
  const [isChangingPage, setIsChangingPage] = useState(false)
  const { viewMode, setViewMode } = usePersistedViewMode()
  const isKanban = viewMode === "kanban"
  const itemsPerPage = isKanban ? KANBAN_ITEMS_PER_PAGE : listItemsPerPage
  const effectiveFilter = isKanban ? "all" : activeFilter

  useEffect(() => {
    if (terminal && terminal !== 'all') {
      setSelectedLocationId(Number(terminal))
    } else {
      setSelectedLocationId(null)
    }
  }, [terminal])

  useEffect(() => {
    if (!isKanban) return
    if (activeFilter !== "all") {
      setActiveFilter("all")
    }
    setCurrentPage(1)
  }, [isKanban, activeFilter])

  const { data, refetch, isPending: isOrdersPending } = useLoadOrdersByTerminal(terminal || 'all', Number(empresaId || 0), filterStartDate, filterEndDate, currentPage, itemsPerPage, effectiveFilter)
  const { data: terminals } = useLoadTerminals(Number(empresaId || 0))
  const { data: ordersCount } = useOrderCount(terminal || 'all', Number(empresaId || 0), filterStartDate, filterEndDate)

  const hasTextSearch = searchQuery.trim().length > 0
  const {
    data: searchResults,
    isFetching: isSearchFetching,
    isDebouncing: isSearchDebouncing,
  } = useSearchOrdersAcrossPages({
    terminal: terminal || "all",
    companyId: Number(empresaId || 0),
    dataInicial: filterStartDate,
    dataFinal: filterEndDate,
    status: effectiveFilter,
    searchQuery,
  })

  // IDs já vistos na sessão — troca de tab/página não deve disparar "novo pedido"
  const seenOrderIdsRef = useRef<Set<number>>(new Set())
  const skipNewOrderNotifyRef = useRef(true)

  // Reinicia a base ao mudar contexto de dados (terminal/período)
  useEffect(() => {
    seenOrderIdsRef.current = new Set()
    skipNewOrderNotifyRef.current = true
  }, [terminal, filterStartDate, filterEndDate])

  // Ignora o próximo resultado ao mudar tab, página, modo ou tamanho da página
  useEffect(() => {
    skipNewOrderNotifyRef.current = true
  }, [effectiveFilter, currentPage, itemsPerPage, viewMode])

  // Detecta novos pedidos reais (não troca de filtro)
  useEffect(() => {
    if (!data?.data) return

    const incoming = data.data
    const unseenAguardando = incoming.filter(
      (order) =>
        !seenOrderIdsRef.current.has(order.preparoProducaoId) &&
        order.status === "preparoAguardandoProducao",
    )

    for (const order of incoming) {
      seenOrderIdsRef.current.add(order.preparoProducaoId)
    }

    if (skipNewOrderNotifyRef.current) {
      skipNewOrderNotifyRef.current = false
      return
    }

    if (unseenAguardando.length === 0) return

    playNotificationSound("new-order").catch((error) => {
      console.warn("Erro ao reproduzir som:", error)
    })

    const newOrdersCount = unseenAguardando.length
    const orderLabel = newOrdersCount === 1 ? "pedido" : "pedidos"

    toast.success(
      `🔔 Novo${newOrdersCount > 1 ? "s" : ""} ${orderLabel} recebido${newOrdersCount > 1 ? "s" : ""}`,
      {
        description:
          newOrdersCount === 1
            ? `Pedido #${unseenAguardando[0].preparoProducaoId} está aguardando produção`
            : `${newOrdersCount} novos pedidos aguardando produção`,
        duration: 5000,
        position: "top-right",
        style: {
          background: "hsl(var(--background))",
          border: "2px solid hsl(var(--primary))",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "14px",
          fontWeight: "600",
        },
        className: "notification-toast",
      },
    )
  }, [data?.data])

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
  
    return () => clearInterval(interval)
  }, [])

  // Inicializa contexto de áudio na primeira interação do usuário
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext()
      // Remove listeners após primeira interação
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }

    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('keydown', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [])

  // Ref para armazenar o último timestamp de refetch (throttle)
  const lastRefetchRef = useRef<number>(0)

  // Callback memoizado para mensagens do WebSocket
  const handleWebSocketMessage = useCallback((payload: unknown) => {
    console.log("📨 [KDS Realtime] Mensagem recebida no componente:", payload)
    
    // Extrai terminal do payload de forma resiliente
    const p = payload as Record<string, any> | null
    const incomingTerminal = p && (
      p.terminalId ?? p.terminal ?? p?.data?.terminalId ?? p?.data?.terminal
    )

    console.log(`🔍 [KDS Realtime] Terminal atual: ${terminal}, Terminal do evento: ${incomingTerminal}`)

    // Só refaz a busca se: (terminal atual é "all") ou (terminal do evento bate com o atual)
    const shouldUpdate = terminal === 'all' || (
      incomingTerminal !== undefined && String(incomingTerminal) === String(terminal)
    )

    if (!shouldUpdate) {
      console.log("⏭️ [KDS Realtime] Ignorando evento - terminal não corresponde")
      return
    }

    const now = Date.now()
    if (now - lastRefetchRef.current > 500) {
      lastRefetchRef.current = now
      console.log("🔄 [KDS Realtime] Executando refetch...")
      refetch()
    } else {
      console.log("⏸️ [KDS Realtime] Refetch ignorado - muito recente (throttle)")
    }
  }, [terminal, refetch])

  // Realtime updates via WebSocket: refetch on payloads
  const { connectionStatus } = useKdsRealtime({
    companyId: Number(empresaId || 0),
    onMessage: handleWebSocketMessage,
  })

  const formatDateTime = (date: Date) => {
    const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")

    return `${weekday} ${day}/${month}/${year} | ${hours}:${minutes}:${seconds}`
  }

  // Função para verificar se um pedido está atrasado (usa status do backend e fallback local)
  const isOrderDelayed = (order: PreparoProducao) => {
    // Preferência: backend já informa o status de atraso
    if (order.tempoPreparoStatus) {
      switch (order.tempoPreparoStatus) {
        case 'tempoEmAtraso':
          return true
        case 'tempoPreparoAtencao':
        case 'tempoPreparoIndefinido':
        case 'tempoPreparoOk':
          return false
      }
    }

    // Fallback: cálculo local (compatibilidade)
    if (!order.dataHoraStatus || !order.tempoPreparo) return false
    if (order.status === "preparoFinalizado" || order.status === "preparoCancelado") return false

    const backendDate = new Date(order.dataHoraStatus)
    const localDate = new Date(backendDate.getTime() + backendDate.getTimezoneOffset() * 60000)
    const diffMinutes = (currentTime.getTime() - localDate.getTime()) / (1000 * 60)
    return diffMinutes > order.tempoPreparo
  }


  const sourceOrders = hasTextSearch
    ? (searchResults ?? [])
    : (data?.data ?? [])

  const filteredOrders =
  (hasTextSearch || data?.data) &&
  dedupeOrdersById(sourceOrders)
    .map((order) => ({
      ...order,
      atrasado: isOrderDelayed(order)
    }))
    .filter((order) => {
      // Na busca em texto, o filtro já veio de todas as páginas
      const matchesSearch = hasTextSearch
        ? true
        : orderMatchesSearch(order, searchQuery.toLowerCase().trim())

      let matchesFilter = false
      if (isKanban || activeFilter === "all") {
        matchesFilter = true
      } else if (activeFilter === "preparoEmAtraso") {
        // A API já retorna somente atrasados quando este filtro está ativo
        matchesFilter = true
      } else {
        matchesFilter = order.status === activeFilter
      }

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (a.atrasado && !b.atrasado) return -1
      if (!a.atrasado && b.atrasado) return 1

      const prioridade: Record<string, number> = {
        preparoAguardandoProducao: 1,
        preparoEmProducao: 2,
        preparoPausado: 3,
        preparoCancelado: 4,
        preparoFinalizado: 5,
      }

      const prioridadeA = prioridade[a.status] ?? 99
      const prioridadeB = prioridade[b.status] ?? 99

      if (prioridadeA === prioridadeB) {
        return 0
      }

      return prioridadeA - prioridadeB
    })

  // Early return if required parameters are missing
  if (!tenant || !terminal || !empresaId) {
    return <KitchenLoading message="Inicializando sistema..." />
  }

  if (isOrdersPending || !data) {
    return <KitchenLoading message="Carregando pedidos..." showSkeleton={true} />
  }

  const handleSearch = () => {
    setIsSearching(true)
    setFilterStartDate(startDate)
    setFilterEndDate(endDate)
    setCurrentPage(1) // Reset to first page when searching
    // The query will automatically refetch when filterStartDate and filterEndDate change
    
    // Simulate search delay for better UX
    setTimeout(() => {
      setIsSearching(false)
    }, 1000)
  }

  const filterCounts = (() => {
    const base = {
      all: 0,
      preparoAguardandoProducao: 0,
      preparoEmProducao: 0,
      preparoPausado: 0,
      preparoCancelado: 0,
      preparoFinalizado: 0,
      preparoEmAtraso: 0,
    }

    if (!ordersCount) return base

    for (const row of ordersCount) {
      switch (row.status) {
        case 'preparoAguardandoProducao':
          base.preparoAguardandoProducao += row.count
          break
        case 'preparoEmProducao':
          base.preparoEmProducao += row.count
          break
        case 'preparoPausado':
          base.preparoPausado += row.count
          break
        case 'preparoCancelado':
          base.preparoCancelado += row.count
          break
        case 'preparoFinalizado':
          base.preparoFinalizado += row.count
          break
        case 'preparoEmAtraso':
          base.preparoEmAtraso += row.count
          break
      }
    }

    base.all = base.preparoAguardandoProducao + base.preparoEmProducao + base.preparoPausado + base.preparoCancelado + base.preparoFinalizado

    return base
  })()

  const selectedLocation =
    selectedLocationId === null 
      ? { nome: 'Ver todos' }
      : terminals?.find((loc) => loc.terminalId === selectedLocationId) ??
        { nome: 'Ver todos' }

  const handleSelectLocation = (locationId: number | null) => {
    setSelectedLocationId(locationId)

    const newTerminal = locationId ? locationId.toString() : 'all'
    const newUrl = `/private/${tenant}/${empresaId}/view/${newTerminal}`

    navigate(newUrl)
  }

  const handlePageChange = (newPage: number) => {
    setIsChangingPage(true)
    setCurrentPage(newPage)
    
    setTimeout(() => {
      setIsChangingPage(false)
    }, 500)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setListItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: string) => {
    if (filter === activeFilter) return

    setCurrentPage(1)
    setActiveFilter(filter)

    // Limpa caches de listagem para não misturar pedidos entre tabs
    queryClient.removeQueries({
      queryKey: ['load-orders-by-terminal', terminal || 'all', filterStartDate, filterEndDate],
    })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b bg-card">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Campo de busca por texto */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pedido, cliente, mesa, comanda, garçom..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro de data inicial */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto"
          />

          {/* Filtro de data final */}
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto"
          />

          {/* Botão de buscar */}
          <Button 
            onClick={() => handleSearch()} 
            className="w-full sm:w-auto"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>

          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Exibe hora atual e status da conexão */}
        <div className="flex items-center gap-3">
          <WebSocketStatus status={connectionStatus} />
          <div className="text-xs font-medium sm:text-sm">{formatDateTime(currentTime)}</div>
        </div>
      </div>
        {!isKanban && (
          <div className="border-t px-4 py-3 sm:px-6">
            <div className="overflow-x-auto">
              <FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} counts={filterCounts} />
            </div>
          </div>
        )}
      </header>

      {/* Orders Grid */}
      <main className="p-4 sm:p-6 relative">
        {(isSearching || isChangingPage || (hasTextSearch && (isSearchDebouncing || isSearchFetching))) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg border">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {hasTextSearch ? "Pesquisando em todas as páginas..." : "Carregando pedidos..."}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {isKanban ? (
          <OrdersKanbanBoard
            orders={filteredOrders || []}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1536px]:grid-cols-5">
            {filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard key={order.preparoProducaoId} order={order} />
              ))
            ) : (
              <div className="col-span-full flex justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 
                        `Nenhum pedido encontrado para "${searchQuery}"` : 
                        "Não há pedidos para exibir no momento"
                      }
                    </p>
                  </div>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery("")}
                      className="mt-4"
                    >
                      Limpar busca
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-card">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsLocationModalOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded flex items-center justify-center ${getLocationTypeColor(selectedLocation.nome)}`}
              >
                <span className="text-xs font-bold text-white">
                  {selectedLocation.nome.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium sm:text-sm">{selectedLocation.nome}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasTextSearch ? (
              <span className="text-xs sm:text-sm">
                {isSearchDebouncing || isSearchFetching
                  ? "Pesquisando..."
                  : `${filteredOrders ? filteredOrders.length : 0} resultado(s) em todas as páginas`}
              </span>
            ) : isKanban ? (
              <span className="text-xs sm:text-sm">
                {filteredOrders ? filteredOrders.length : 0} pedido(s)
              </span>
            ) : (
              <>
                <select
                  value={listItemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="rounded border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!data?.pagination || currentPage <= 1 || isChangingPage}
                >
                  {isChangingPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-lg">↑</span>
                  )}
                </Button>
                <span className="text-xs sm:text-sm">
                  {isChangingPage ? (
                    "Carregando..."
                  ) : (
                    `Página ${data?.pagination?.currentPage || 1} de ${data?.pagination?.totalPages || 1}`
                  )}
                </span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data?.pagination || currentPage >= (data.pagination.totalPages || 1) || isChangingPage}
                >
                  {isChangingPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-lg">↓</span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        locations={terminals!}
        selectedLocationId={selectedLocationId}
        onSelectLocation={handleSelectLocation}
      />
    </div>
  )
}

