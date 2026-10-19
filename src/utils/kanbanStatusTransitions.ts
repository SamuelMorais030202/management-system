import type { ItemStatus } from "@/hooks/useLoadOrdersByTerminal"

export type KanbanColumnId =
  | "aguardando"
  | "atrasados"
  | "emProducao"
  | "pausado"
  | "finalizados"

export type PreparationAction = "start" | "pause" | "finish"

const COLUMN_TARGET_STATUS: Record<KanbanColumnId, ItemStatus | null> = {
  aguardando: "preparoAguardandoProducao",
  atrasados: "preparoAguardandoProducao",
  emProducao: "preparoEmProducao",
  pausado: "preparoPausado",
  finalizados: "preparoFinalizado",
}

/** Resolve a ação de API necessária para mover o pedido à coluna de destino. */
export function getActionForColumnDrop(
  currentStatus: ItemStatus,
  targetColumn: KanbanColumnId,
): PreparationAction | null {
  const targetStatus = COLUMN_TARGET_STATUS[targetColumn]
  if (!targetStatus || currentStatus === targetStatus) return null

  // Finalizados é terminal — não arrasta de volta
  if (currentStatus === "preparoFinalizado" || currentStatus === "preparoCancelado") {
    return null
  }

  switch (targetColumn) {
    case "emProducao":
      if (
        currentStatus === "preparoAguardandoProducao" ||
        currentStatus === "preparoPausado"
      ) {
        return "start"
      }
      return null
    case "pausado":
      if (currentStatus === "preparoEmProducao") return "pause"
      return null
    case "finalizados":
      if (
        currentStatus === "preparoEmProducao" ||
        currentStatus === "preparoPausado"
      ) {
        return "finish"
      }
      return null
    case "aguardando":
    case "atrasados":
      return null
    default:
      return null
  }
}

export function getDropRejectMessage(
  currentStatus: ItemStatus,
  targetColumn: KanbanColumnId,
): string {
  if (currentStatus === "preparoFinalizado") {
    return "Pedidos finalizados não podem ser movidos"
  }
  if (targetColumn === "aguardando" || targetColumn === "atrasados") {
    return "Não é possível voltar o pedido para esta coluna"
  }
  if (
    targetColumn === "finalizados" &&
    currentStatus !== "preparoEmProducao" &&
    currentStatus !== "preparoPausado"
  ) {
    return "Só é possível finalizar pedidos em produção"
  }
  if (targetColumn === "pausado" && currentStatus !== "preparoEmProducao") {
    return "Só é possível pausar pedidos em produção"
  }
  if (
    targetColumn === "emProducao" &&
    currentStatus !== "preparoAguardandoProducao" &&
    currentStatus !== "preparoPausado"
  ) {
    return "Não é possível mover este pedido para em produção"
  }
  return "Movimentação não permitida"
}
