"use client"

import { useState, useEffect } from "react"
import { Printer, Pause, Play, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { OrderDetailsModal } from "./order-details-modal"
import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"
import { useStartPreparation } from "@/hooks/useStartPreparation"
import { useParams } from "next/navigation"
import { useFinishPreparation } from "@/hooks/useFinishPreparation"
import { usePausePreparation } from "@/hooks/usePausePreparation"
import { handlePrintOrder } from "@/utils/handlePrint"

interface OrderCardProps {
  order: PreparoProducao & { atrasado?: boolean }
}

const MAX_ITEMS_DISPLAY = 3

export const statusConfig = {
  preparoCancelado: { bg: "bg-[#DC2626]", text: "text-white", label: "CANCELADO" },
  preparoEmProducao: { bg: "bg-[#F97316]", text: "text-white", label: "EM PRODUÇÃO" },
  preparoAguardandoProducao: { bg: "bg-[#6B7280]", text: "text-white", label: "AGUARDANDO" },
  preparoPausado: { bg: "bg-[#FCD34D]", text: "text-gray-900", label: "PAUSADO" },
  preparoFinalizado: { bg: "bg-[#10B981]", text: "text-white", label: "FINALIZADO" },
}

const buttonColorConfig = {
  preparoAguardandoProducao: "bg-[#1F2937] hover:bg-[#111827]",
  preparoEmProducao: "bg-[#F97316] hover:bg-[#EA580C]",
  preparoPausado: "bg-[#FCD34D] hover:bg-[#FBBF24] text-gray-900",
  preparoFinalizado: "bg-[#10B981] hover:bg-[#059669]",
  preparoCancelado: "bg-[#DC2626] hover:bg-[#B91C1C]",
}

// Cores específicas para pedidos atrasados
const delayedButtonColorConfig: Record<string, string> = {
  preparoAguardandoProducao: "bg-[#DC2626] hover:bg-[#B91C1C] text-white", // Vermelho para atrasados aguardando
  preparoEmProducao: "bg-[#DC2626] hover:bg-[#B91C1C] text-white", // Vermelho para atrasados em produção
  preparoPausado: "bg-[#DC2626] hover:bg-[#B91C1C] text-white", // Vermelho para atrasados pausados
  preparoCancelado: "bg-[#DC2626] hover:bg-[#B91C1C] text-white", // Vermelho para atrasados cancelados
  preparoFinalizado: "bg-[#10B981] hover:bg-[#059669] text-white", // Verde para finalizados (não muda)
}

export function OrderCard({ order }: OrderCardProps) {
  const params = useParams()
  const empresaId = params.id?.toString()

  const [timer, setTimer] = useState("00:00:00")
  const [isRunning, setIsRunning] = useState(order.status === "preparoEmProducao")
  const [currentStatus, setCurrentStatus] = useState(order.status)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { mutate: startPreparation } = useStartPreparation(Number(empresaId || 0), order.preparoProducaoId)
  const { mutate: finishPreparation } = useFinishPreparation(Number(empresaId || 0), order.preparoProducaoId)
  const { mutate: pausePreparation } = usePausePreparation(Number(empresaId || 0), order.preparoProducaoId)

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  // Atualiza status e controle de execução quando mudar no backend
  useEffect(() => {
    setCurrentStatus(order.status)
    setIsRunning(order.status === "preparoEmProducao")
  }, [order.status])

  // 🔹 Cálculo único e confiável do tempo decorrido + incremento ao vivo
  useEffect(() => {
    // Se o pedido não foi iniciado (aguardando produção), sempre mostra 00:00:00
    if (order.status === "preparoAguardandoProducao") {
      setTimer("00:00:00")
      return
    }

    if (!order.dataHoraStatus) {
      setTimer("00:00:00")
      return
    }
  
    // ⚠️ Ajuste temporário para compensar backend salvando hora local com sufixo Z
    const backendDate = new Date(order.dataHoraStatus)
    const localDate = new Date(backendDate.getTime() + backendDate.getTimezoneOffset() * 60000)
  
    const diffSeconds = Math.max(
      0,
      Math.floor((Date.now() - localDate.getTime()) / 1000)
    )
  
    setTimer(formatSeconds(diffSeconds))
  }, [order.dataHoraStatus, order.status])

  useEffect(() => {
    if (!isRunning || order.status === "preparoFinalizado") return
  
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (!prev) return "00:00:00"
  
        const [h, m, s] = prev.split(":").map(Number)
        const total = h * 3600 + m * 60 + s + 1
        return formatSeconds(total)
      })
    }, 1000)
  
    return () => clearInterval(interval)
  }, [isRunning, order.status])

  const handleStartCooking = () => {
    if (currentStatus === "preparoFinalizado") return
    setIsRunning(true)
    startPreparation()
    setCurrentStatus("preparoEmProducao")
  }

  const handleFinishCooking = () => {
    setIsRunning(false)
    finishPreparation()
    setCurrentStatus("preparoFinalizado")
  }

  const handlePauseCooking = () => {
    setIsRunning(false)
    pausePreparation()
    setCurrentStatus("preparoPausado")
  }

  const handleResumeCooking = () => {
    if (currentStatus === "preparoFinalizado") return
    setIsRunning(true)
    startPreparation()
    setCurrentStatus("preparoEmProducao")
  }

  const config = statusConfig[currentStatus]
  const hasMoreItems = order.items.length > MAX_ITEMS_DISPLAY
  const displayItems = hasMoreItems ? order.items.slice(0, MAX_ITEMS_DISPLAY) : order.items

  // Determina a cor do botão baseado no status e se está atrasado
  const getButtonColor = () => {
    if (order.atrasado && delayedButtonColorConfig[currentStatus]) {
      return delayedButtonColorConfig[currentStatus]
    }
    return buttonColorConfig[currentStatus]
  }

  return (
    <>
      <Card className="flex min-w-[280px] max-w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-sm font-bold text-blue-600 cursor-pointer hover:underline hover:opacity-80 transition"
                onClick={() => setShowDetailsModal(true)}
              >
                #{order.keyId}
              </span>
              <span className="truncate text-sm text-muted-foreground">{order.garcom}</span>
              <span className="truncate text-sm text-muted-foreground">Cliente: {order.clienteNome}</span>
            </div>
            <div className="text-xs text-muted-foreground">{order.mesaNumero}</div>
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
            <div className="text-xs font-medium">~ {order.tempoPreparo} min</div>
            <div className={cn("inline-block rounded px-2 py-0.5 text-xs font-bold", config.bg, config.text)}>
              {config.label}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-2 p-3 sm:space-y-3 sm:p-4">
          {displayItems.map((item, index) => (
            <div key={index} className="text-sm">
              <div className="break-words font-medium">
                {item.qtde} {item.nome}
              </div>
              {item.adicionais && (
                <div className="ml-3 mt-1 space-y-0.5 sm:ml-4">
                  {item.adicionais.map((modifier, modIndex) => (
                    <div key={modIndex} className="break-words text-xs text-muted-foreground">
                      {item.qtde} {modifier.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasMoreItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailsModal(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="mr-1 h-3 w-3" />
              Ver mais {order.items.length - MAX_ITEMS_DISPLAY}{" "}
              {order.items.length - MAX_ITEMS_DISPLAY === 1 ? "item" : "itens"}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-1.5 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2">
            {currentStatus === "preparoEmProducao" ? (
              <>
                <Button
                  onClick={handleFinishCooking}
                  className={cn("flex-1 min-w-0 text-[10px] text-white sm:text-sm", getButtonColor())}
                  size="sm"
                >
                  FINALIZAR <span className="ml-1 font-mono text-[10px]">{timer}</span>
                </Button>

                <Button
                  onClick={handlePauseCooking}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0 bg-transparent sm:h-9 sm:w-9"
                  title="Pausar Preparo"
                >
                  <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </>
            ) : currentStatus === "preparoPausado" ? (
              <Button
                onClick={handleResumeCooking}
                className={cn("flex-1 min-w-0 text-[10px] text-white sm:text-sm", getButtonColor())}
                size="sm"
              >
                <Play className="mr-1 h-3 w-3" /> VOLTAR <span className="ml-1 font-mono text-[10px]">{timer}</span>
              </Button>
            ) : currentStatus === "preparoFinalizado" ? (
              <Button
                disabled
                className={cn("flex-1 min-w-0 text-[10px] text-white sm:text-sm opacity-80 cursor-not-allowed", getButtonColor())}
                size="sm"
                title="Pedido finalizado"
              >
                FINALIZADO
              </Button>
            ) : (
              <Button
                onClick={handleStartCooking}
                className={cn("flex-1 min-w-0 text-[10px] text-white sm:text-sm", getButtonColor())}
                size="sm"
              >
                INICIAR <span className="ml-1 font-mono text-[10px]">{timer}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0 bg-transparent sm:h-9 sm:w-9 cursor-pointer"
              onClick={() => handlePrintOrder(order)}
              title="Imprimir Pedido"
            >
              <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <OrderDetailsModal order={order} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
    </>
  )
}
