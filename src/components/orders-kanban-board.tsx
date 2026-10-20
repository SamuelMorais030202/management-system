import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OrderCard, statusConfig } from "@/components/order-card"
import { ConfirmFinishDialog } from "@/components/confirm-finish-dialog"
import { usePreparationAction } from "@/hooks/usePreparationAction"
import { useIsOrderStatusUpdating } from "@/hooks/useIsOrderStatusUpdating"
import { cn } from "@/lib/utils"
import type { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"
import {
  getActionForColumnDrop,
  getDropRejectMessage,
  type KanbanColumnId,
  type PreparationAction,
} from "@/utils/kanbanStatusTransitions"

type KanbanOrder = PreparoProducao & { atrasado?: boolean }

interface KanbanColumnDef {
  id: KanbanColumnId
  label: string
  headerClass: string
}

const COLUMNS: KanbanColumnDef[] = [
  {
    id: "aguardando",
    label: "Aguardando",
    headerClass: `${statusConfig.preparoAguardandoProducao.bg} ${statusConfig.preparoAguardandoProducao.text}`,
  },
  {
    id: "atrasados",
    label: "Atrasados",
    headerClass: "bg-[#DC2626] text-white",
  },
  {
    id: "emProducao",
    label: "Em Produção",
    headerClass: `${statusConfig.preparoEmProducao.bg} ${statusConfig.preparoEmProducao.text}`,
  },
  {
    id: "pausado",
    label: "Pausado",
    headerClass: `${statusConfig.preparoPausado.bg} ${statusConfig.preparoPausado.text}`,
  },
  {
    id: "finalizados",
    label: "Finalizados",
    headerClass: `${statusConfig.preparoFinalizado.bg} ${statusConfig.preparoFinalizado.text}`,
  },
]

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id))

function getColumnId(order: KanbanOrder): KanbanColumnId | null {
  switch (order.status) {
    case "preparoCancelado":
      return null
    case "preparoFinalizado":
      return "finalizados"
    case "preparoEmProducao":
      return "emProducao"
    case "preparoPausado":
      return "pausado"
    case "preparoAguardandoProducao":
      return order.atrasado ? "atrasados" : "aguardando"
    default:
      return null
  }
}

function partitionOrders(orders: KanbanOrder[]): Record<KanbanColumnId, KanbanOrder[]> {
  const buckets: Record<KanbanColumnId, KanbanOrder[]> = {
    aguardando: [],
    atrasados: [],
    emProducao: [],
    pausado: [],
    finalizados: [],
  }

  for (const order of orders) {
    const columnId = getColumnId(order)
    if (columnId) {
      buckets[columnId].push(order)
    }
  }

  return buckets
}

function DraggableOrderCard({ order }: { order: KanbanOrder }) {
  const isUpdating = useIsOrderStatusUpdating(order.preparoProducaoId)
  const canDrag =
    !isUpdating &&
    order.status !== "preparoFinalizado" &&
    order.status !== "preparoCancelado"

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(order.preparoProducaoId),
    data: { order },
    disabled: !canDrag,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "shrink-0",
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
    >
      <OrderCard order={order} isUpdating={isUpdating} compact className="shrink-0" />
    </div>
  )
}

function KanbanColumn({
  column,
  orders,
  isOver,
}: {
  column: KanbanColumnDef
  orders: KanbanOrder[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[220px] flex-1 flex-col overflow-hidden rounded-lg border bg-muted/40 transition-shadow",
        isOver && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 px-3 py-2",
          column.headerClass,
        )}
      >
        <h2 className="text-xs font-bold uppercase tracking-wide sm:text-sm">
          {column.label}
        </h2>
        <span className="rounded bg-black/15 px-2 py-0.5 text-xs font-bold tabular-nums">
          {orders.length}
        </span>
      </header>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto p-1.5">
        {orders.length > 0 ? (
          orders.map((order) => (
            <DraggableOrderCard key={order.preparoProducaoId} order={order} />
          ))
        ) : (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Nenhum pedido
          </p>
        )}
      </div>
    </section>
  )
}

interface OrdersKanbanBoardProps {
  orders: KanbanOrder[]
  searchQuery?: string
  onClearSearch?: () => void
}

export function OrdersKanbanBoard({
  orders,
  searchQuery,
  onClearSearch,
}: OrdersKanbanBoardProps) {
  const params = useParams()
  const empresaId = Number(params.id || 0)
  const { mutateAsync: changeStatus, isPending: isChangingStatus } =
    usePreparationAction(empresaId)

  const [activeOrder, setActiveOrder] = useState<KanbanOrder | null>(null)
  const [overColumnId, setOverColumnId] = useState<KanbanColumnId | null>(null)
  const [finishConfirmOrder, setFinishConfirmOrder] = useState<KanbanOrder | null>(null)

  const columns = useMemo(() => partitionOrders(orders), [orders])
  const totalVisible = COLUMNS.reduce((sum, col) => sum + columns[col.id].length, 0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const order = event.active.data.current?.order as KanbanOrder | undefined
    setActiveOrder(order ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    if (overId && COLUMN_IDS.has(String(overId))) {
      setOverColumnId(String(overId) as KanbanColumnId)
    } else if (overId) {
      const overOrder = orders.find((o) => String(o.preparoProducaoId) === String(overId))
      setOverColumnId(overOrder ? getColumnId(overOrder) : null)
    } else {
      setOverColumnId(null)
    }
  }

  const applyStatusChange = async (order: KanbanOrder, action: PreparationAction) => {
    const labels: Record<PreparationAction, string> = {
      start: "em produção",
      pause: "pausado",
      finish: "finalizado",
    }

    try {
      await changeStatus({ orderId: order.preparoProducaoId, action })
      toast.success(`Pedido #${order.preparoProducaoId} movido para ${labels[action]}`)
    } catch {
      toast.error("Não foi possível atualizar o status", {
        description: `O pedido #${order.preparoProducaoId} voltou para a coluna anterior.`,
      })
    }
  }

  const handleConfirmFinish = async () => {
    if (!finishConfirmOrder) return
    const order = finishConfirmOrder
    setFinishConfirmOrder(null)
    await applyStatusChange(order, "finish")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null)
    setOverColumnId(null)

    const { active, over } = event
    if (!over) return

    const order = active.data.current?.order as KanbanOrder | undefined
    if (!order) return

    const overId = String(over.id)
    // Pode soltar sobre a coluna ou sobre outro card — resolve a coluna alvo
    let targetColumn: KanbanColumnId | null = null
    if (COLUMN_IDS.has(overId)) {
      targetColumn = overId as KanbanColumnId
    } else {
      const overOrder = orders.find((o) => String(o.preparoProducaoId) === overId)
      if (overOrder) {
        targetColumn = getColumnId(overOrder)
      }
    }

    if (!targetColumn) return

    const currentColumn = getColumnId(order)
    if (currentColumn === targetColumn) return

    const action = getActionForColumnDrop(order.status, targetColumn)
    if (!action) {
      toast.error(getDropRejectMessage(order.status, targetColumn))
      return
    }

    // Finalizar é definitivo — pede confirmação antes de aplicar
    if (action === "finish") {
      setFinishConfirmOrder(order)
      return
    }

    await applyStatusChange(order, action)
  }

  const handleDragCancel = () => {
    setActiveOrder(null)
    setOverColumnId(null)
  }

  if (totalVisible === 0) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `Nenhum pedido encontrado para "${searchQuery}"`
                : "Não há pedidos para exibir no momento"}
            </p>
          </div>
          {searchQuery && onClearSearch && (
            <Button variant="outline" onClick={onClearSearch} className="mt-4">
              Limpar busca
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="scrollbar-thin flex h-full min-h-0 w-full gap-2 overflow-x-auto overflow-y-hidden">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            orders={columns[column.id]}
            isOver={overColumnId === column.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeOrder ? (
          <div className="w-[240px] rotate-1 scale-[1.02] opacity-95 shadow-xl">
            <OrderCard order={activeOrder} compact className="shrink-0" />
          </div>
        ) : null}
      </DragOverlay>

      <ConfirmFinishDialog
        open={finishConfirmOrder != null}
        orderId={finishConfirmOrder?.preparoProducaoId ?? null}
        onOpenChange={(open) => {
          if (!open) setFinishConfirmOrder(null)
        }}
        onConfirm={handleConfirmFinish}
        isConfirming={isChangingStatus}
      />
    </DndContext>
  )
}
