"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Search, Menu, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OrderCard } from "@/components/order-card"
import { FilterBar } from "@/components/filter-bar"
import { LocationSelectorModal } from "@/components/location-selector-modal"
import { KitchenLoading } from "@/components/kitchen-loading"
import { useParams, useRouter } from "next/navigation"
import { useLoadOrdersByTerminal, PreparoProducao, TempoPreparoStatus } from "@/hooks/useLoadOrdersByTerminal"
import { getLocationTypeColor } from "@/utils/getLocationTypeColor"
import { useLoadTerminals } from "@/hooks/useLoadTerminals"
import { useKdsRealtime } from "@/hooks/useKdsRealtime"
import { useOrderCount } from "@/hooks/useOrderCount"

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
  const router = useRouter()

  const tenant = params.tenant?.toString();
  const terminal = params.terminal?.toString();
  const empresaId = params.id?.toString();

  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [filterStartDate, setFilterStartDate] = useState(startDate)
  const [filterEndDate, setFilterEndDate] = useState(endDate)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isSearching, setIsSearching] = useState(false)
  const [isChangingPage, setIsChangingPage] = useState(false)

  useEffect(() => {
    if (terminal && terminal !== 'all') {
      setSelectedLocationId(Number(terminal))
    } else {
      setSelectedLocationId(null)
    }
  }, [terminal])

  const { data, refetch, isFetching } = useLoadOrdersByTerminal(terminal!, Number(empresaId), filterStartDate, filterEndDate, currentPage, itemsPerPage, activeFilter)
  const { data: terminals } = useLoadTerminals(Number(empresaId))
  const { data: ordersCount } = useOrderCount(terminal!, Number(empresaId), filterStartDate, filterEndDate)


  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
  
    return () => clearInterval(interval)
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
  useKdsRealtime({
    companyId: Number(empresaId),
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


  const filteredOrders =
  data?.data &&
  data.data
    .map((order) => ({
      ...order,
      atrasado: isOrderDelayed(order)
    }))
    .filter((order) => {
      const search = searchQuery.toLowerCase().trim()

      const matchesSearch =
        order.clienteNome.toLowerCase().includes(search) ||
        String(order.keyId).includes(search) ||
        order.garcom?.toLowerCase().includes(search)

      let matchesFilter = false
      if (activeFilter === "all") {
        matchesFilter = true
      } else if (activeFilter === "preparoEmAtraso") {
        // A API já retorna somente atrasados quando este filtro está ativo
        // Mantemos também a validação local por segurança
        matchesFilter = true
      } else {
        matchesFilter = order.status === activeFilter
      }

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      // Primeiro, prioriza pedidos atrasados
      if (a.atrasado && !b.atrasado) return -1
      if (!a.atrasado && b.atrasado) return 1

      // Depois, ordem de prioridade dos status - pedidos finalizados vão para o final
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

  if (!data) {
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

    router.push(newUrl, { scroll: false })
  }

  const handlePageChange = (newPage: number) => {
    setIsChangingPage(true)
    setCurrentPage(newPage)
    
    setTimeout(() => {
      setIsChangingPage(false)
    }, 500)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    if (filter !== activeFilter) {
      setCurrentPage(1)
    }
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
              placeholder="Buscar pedidos..."
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
        </div>

        {/* Exibe hora atual */}
        <div className="text-xs font-medium sm:text-sm">{formatDateTime(currentTime)}</div>
      </div>
        <div className="border-t px-4 py-3 sm:px-6">
          <div className="overflow-x-auto">
            <FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} counts={filterCounts} />
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="p-4 sm:p-6 relative">
        {(isSearching || isFetching || isChangingPage) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg border">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-medium">Carregando pedidos...</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1536px]:grid-cols-5">
          {filteredOrders && filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.keyId} order={order} />
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
            {/* Seletor de itens por página */}
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>

            {/* Controles de paginação */}
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
