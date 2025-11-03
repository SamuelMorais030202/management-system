"use client"

import { useState, useEffect } from "react"
import { Printer, Pause, Play, ChevronDown, AlertCircle, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { OrderDetailsModal } from "./order-details-modal"
import { ObservationModal } from "./observation-modal"
import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"
import { useStartPreparation } from "@/hooks/useStartPreparation"
import { useParams } from "next/navigation"
import { useFinishPreparation } from "@/hooks/useFinishPreparation"
import { usePausePreparation } from "@/hooks/usePausePreparation"
import { handlePrintOrder } from "@/utils/handlePrint"
import { toast } from "sonner"
import { formatTimeAgo } from "@/utils/formatTimeAgo"

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
  const [showObservationModal, setShowObservationModal] = useState(false)
  const [selectedObservation, setSelectedObservation] = useState<{ text: string; type: "general" | "item"; title: string } | null>(null)
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(order.createdAt))

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

  // Atualiza o tempo relativo (há X tempo atrás) a cada minuto
  useEffect(() => {
    setTimeAgo(formatTimeAgo(order.createdAt))
    
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(order.createdAt))
    }, 60000) // Atualiza a cada minuto

    return () => clearInterval(interval)
  }, [order.createdAt])

  const handleStartCooking = () => {
    if (currentStatus === "preparoFinalizado") return
    setIsRunning(true)
    startPreparation(undefined, {
      onSuccess: () => {
        toast.success("Preparo iniciado", {
          description: `Pedido #${order.preparoProducaoId} está em produção`,
        })
        setCurrentStatus("preparoEmProducao")
      },
      onError: () => {
        toast.error("Erro ao iniciar preparo", {
          description: "Não foi possível iniciar o preparo. Tente novamente.",
        })
        setIsRunning(false)
      },
    })
  }

  const handleFinishCooking = () => {
    setIsRunning(false)
    finishPreparation(undefined, {
      onSuccess: () => {
        toast.success("Preparo finalizado", {
          description: `Pedido #${order.preparoProducaoId} foi finalizado com sucesso`,
        })
        setCurrentStatus("preparoFinalizado")
      },
      onError: () => {
        toast.error("Erro ao finalizar preparo", {
          description: "Não foi possível finalizar o preparo. Tente novamente.",
        })
        setIsRunning(true)
      },
    })
  }

  const handlePauseCooking = () => {
    setIsRunning(false)
    pausePreparation(undefined, {
      onSuccess: () => {
        toast.info("Preparo pausado", {
          description: `Pedido #${order.preparoProducaoId} foi pausado`,
        })
        setCurrentStatus("preparoPausado")
      },
      onError: () => {
        toast.error("Erro ao pausar preparo", {
          description: "Não foi possível pausar o preparo. Tente novamente.",
        })
        setIsRunning(true)
      },
    })
  }

  const handleResumeCooking = () => {
    if (currentStatus === "preparoFinalizado") return
    setIsRunning(true)
    startPreparation(undefined, {
      onSuccess: () => {
        toast.success("Preparo retomado", {
          description: `Pedido #${order.preparoProducaoId} está em produção novamente`,
        })
        setCurrentStatus("preparoEmProducao")
      },
      onError: () => {
        toast.error("Erro ao retomar preparo", {
          description: "Não foi possível retomar o preparo. Tente novamente.",
        })
        setIsRunning(false)
      },
    })
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

  // Função para truncar texto no card
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return { text, isTruncated: false }
    return {
      text: text.substring(0, maxLength).trim() + "...",
      isTruncated: true
    }
  }

  // Limites de caracteres (ajustáveis por responsividade)
  const MAX_OBSERVACAO_GERAL_LENGTH = 120 // ~2 linhas em mobile
  const MAX_OBSERVACAO_ITEM_LENGTH = 80 // ~1.5 linhas em mobile

  const observacaoGeralTruncated = order.observacao 
    ? truncateText(order.observacao, MAX_OBSERVACAO_GERAL_LENGTH)
    : null

  // Calcula o progresso do preparo (0-100%) baseado no timer
  const [progress, setProgress] = useState(0)
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    if (order.status === "preparoAguardandoProducao" || !order.tempoPreparo) {
      setProgress(0)
      setIsOverdue(false)
      return
    }

    if (order.status === "preparoFinalizado" || order.status === "preparoCancelado") {
      setProgress(100)
      setIsOverdue(false)
      return
    }

    if (!order.dataHoraStatus || !isRunning) {
      // Calcula baseado no timer atual quando pausado
      if (order.status === "preparoPausado" && timer !== "00:00:00") {
        const [h, m, s] = timer.split(":").map(Number)
        const elapsedSeconds = h * 3600 + m * 60 + s
        const estimatedSeconds = order.tempoPreparo * 60
        const calculatedProgress = (elapsedSeconds / estimatedSeconds) * 100
        setProgress(Math.min(100, calculatedProgress))
        setIsOverdue(calculatedProgress > 100)
      } else {
        setProgress(0)
        setIsOverdue(false)
      }
      return
    }

    // Calcula baseado no timer para atualização em tempo real
    const [h, m, s] = timer.split(":").map(Number)
    const elapsedSeconds = h * 3600 + m * 60 + s
    const estimatedSeconds = order.tempoPreparo * 60
    const calculatedProgress = (elapsedSeconds / estimatedSeconds) * 100
    setProgress(Math.min(100, calculatedProgress))
    setIsOverdue(calculatedProgress > 100)
  }, [timer, order.status, order.tempoPreparo, order.dataHoraStatus, isRunning])

  return (
    <>
      <Card className="flex min-w-[280px] max-w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-sm font-bold text-blue-600 cursor-pointer hover:underline hover:opacity-80 transition"
                onClick={() => setShowDetailsModal(true)}
              >
                #{order.preparoProducaoId}
              </span>
            </div>
            <span className="truncate text-sm text-muted-foreground">Garçom: {order.garcom || "Não informado"}</span>
            <span className="truncate text-sm text-muted-foreground">Cliente: {order.clienteNome || "Não informado"}</span>
            <span className="truncate text-sm text-muted-foreground">Mesa: {order.mesaNumero || "Não informado"}</span>
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
            {timeAgo && (
              <div className="text-xs text-muted-foreground sm:text-right">
                {timeAgo}
              </div>
            )}
            <div className="text-xs font-medium">~ {order.tempoPreparo} min</div>
            <div className={cn("inline-block rounded px-2 py-0.5 text-xs font-bold", config.bg, config.text)}>
              {config.label}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        {(currentStatus === "preparoEmProducao" || currentStatus === "preparoPausado") && order.tempoPreparo > 0 && (
          <div className="border-b px-3 py-2 sm:px-4 sm:py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Progresso</span>
              <span className={cn(
                "text-xs font-medium",
                isOverdue ? "text-red-600 dark:text-red-500" : "text-muted-foreground"
              )}>
                {isOverdue ? `${Math.floor(progress)}%` : `${Math.floor(progress)}%`}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all duration-300 ease-out",
                  isOverdue
                    ? "bg-red-500 dark:bg-red-600"
                    : progress < 50
                    ? "bg-green-500 dark:bg-green-600"
                    : progress < 80
                    ? "bg-yellow-500 dark:bg-yellow-600"
                    : "bg-orange-500 dark:bg-orange-600"
                )}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            {/* Mensagem de atraso */}
            {isOverdue && (
              <div className="mt-2.5 rounded-md bg-red-50 border border-red-200 p-2 dark:bg-red-950/30 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-900 dark:text-red-100 sm:text-sm">
                      ⚠️ Pedido em Atraso
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-200 mt-0.5">
                      O tempo estimado de preparo foi ultrapassado. Finalize o pedido o quanto antes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Observação Geral do Pedido */}
        {order.observacao && (
          <div className="mx-3 mb-2 sm:mx-4 sm:mb-3">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 sm:p-3 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5 sm:h-5 sm:w-5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 sm:text-sm">
                      Observação Geral
                    </div>
                    {observacaoGeralTruncated?.isTruncated && (
                      <button
                        onClick={() => setShowDetailsModal(true)}
                        className="text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 underline font-medium"
                      >
                        Ver mais
                      </button>
                    )}
                  </div>
                  <p 
                    className="text-xs break-words text-amber-800 dark:text-amber-200 sm:text-sm leading-relaxed overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (order.observacao) {
                        setSelectedObservation({
                          text: order.observacao,
                          type: "general",
                          title: `Observação Geral - Pedido #${order.preparoProducaoId}`
                        })
                        setShowObservationModal(true)
                      }
                    }}
                  >
                    {observacaoGeralTruncated?.text || order.observacao}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 space-y-2 p-3 sm:space-y-3 sm:p-4">
          {displayItems.map((item, index) => (
            <div key={index} className="text-sm">
              <div className="break-words font-medium">
                {item.qtde} {item.nome}
              </div>
              {item.adicionais && item.adicionais.length > 0 && (
                <div className="ml-3 mt-1 space-y-0.5 sm:ml-4">
                  {item.adicionais.map((modifier, modIndex) => (
                    <div key={modIndex} className="break-words text-xs text-muted-foreground">
                      {item.qtde} {modifier.nome}
                    </div>
                  ))}
                </div>
              )}
              {item.observacao && (() => {
                const observacaoItemTruncated = truncateText(item.observacao, MAX_OBSERVACAO_ITEM_LENGTH)
                return (
                  <div className="mt-1.5 sm:mt-2 ml-0 sm:ml-2">
                    <div className="inline-flex items-start gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2 py-1.5 sm:px-2.5 sm:py-2 dark:bg-blue-950/30 dark:border-blue-800 max-w-full">
                      <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 sm:h-3.5 sm:w-3.5" />
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-xs break-words text-blue-800 dark:text-blue-200 leading-relaxed sm:text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (item.observacao) {
                              setSelectedObservation({
                                text: item.observacao,
                                type: "item",
                                title: `Observação do Item - ${item.qtde}x ${item.nome}`
                              })
                              setShowObservationModal(true)
                            }
                          }}
                        >
                          {observacaoItemTruncated.text}
                        </p>
                        {observacaoItemTruncated.isTruncated && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.observacao) {
                                setSelectedObservation({
                                  text: item.observacao,
                                  type: "item",
                                  title: `Observação do Item - ${item.qtde}x ${item.nome}`
                                })
                                setShowObservationModal(true)
                              }
                            }}
                            className="text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 underline font-medium mt-0.5"
                          >
                            Ver mais
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
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
      
      {selectedObservation && (
        <ObservationModal
          open={showObservationModal}
          onOpenChange={setShowObservationModal}
          title={selectedObservation.title}
          observation={selectedObservation.text}
          type={selectedObservation.type}
        />
      )}
    </>
  )
}
