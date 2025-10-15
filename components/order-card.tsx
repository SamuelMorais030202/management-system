"use client"

import { useState, useEffect } from "react"
import { Printer, Pause, Play, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Order } from "@/app/page"
import { OrderDetailsModal } from "./order-details-modal"

interface OrderCardProps {
  order: Order
}

const MAX_ITEMS_DISPLAY = 3

export function OrderCard({ order }: OrderCardProps) {
  const [timer, setTimer] = useState(order.timer)
  const [isRunning, setIsRunning] = useState(order.isFinishing)
  const [currentStatus, setCurrentStatus] = useState(order.status)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        const [hours, minutes, seconds] = prev.split(":").map(Number)
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + 1
        const newHours = Math.floor(totalSeconds / 3600)
        const newMinutes = Math.floor((totalSeconds % 3600) / 60)
        const newSeconds = totalSeconds % 60
        return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const handleStartCooking = () => {
    setIsRunning(true)
    setCurrentStatus("preparoEmProducao")
  }

  const handleFinishCooking = () => {
    setIsRunning(false)
    setCurrentStatus("preparoFinalizado")
  }

  const handlePauseCooking = () => {
    setIsRunning(false)
    setCurrentStatus("preparoPausado")
  }

  const handleResumeCooking = () => {
    setIsRunning(true)
    setCurrentStatus("preparoEmProducao")
  }

  const statusConfig = {
    preparoCancelado: {
      bg: "bg-[#DC2626]",
      text: "text-white",
      label: "CANCELADO",
    },
    preparoEmProducao: {
      bg: "bg-[#F97316]",
      text: "text-white",
      label: "EM PRODUÇÃO",
    },
    preparoAguardandoProducao: {
      bg: "bg-[#6B7280]",
      text: "text-white",
      label: "AGUARDANDO",
    },
    preparoPausado: {
      bg: "bg-[#FCD34D]",
      text: "text-gray-900",
      label: "PAUSADO",
    },
    preparoFinalizado: {
      bg: "bg-[#10B981]",
      text: "text-white",
      label: "FINALIZADO",
    },
  }

  const config = statusConfig[currentStatus]
  const hasMoreItems = order.items.length > MAX_ITEMS_DISPLAY
  const displayItems = hasMoreItems ? order.items.slice(0, MAX_ITEMS_DISPLAY) : order.items

  return (
    <>
      <Card className="flex min-w-[280px] max-w-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">#{order.id}</span>
              <span className="truncate text-sm text-muted-foreground">{order.customer}</span>
            </div>
            <div className="text-xs text-muted-foreground">{order.location}</div>
          </div>
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
            <div className="text-xs font-medium">Entrega {order.dueTime}</div>
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
                {item.quantity} {item.name}
              </div>
              {item.modifiers && (
                <div className="ml-3 mt-1 space-y-0.5 sm:ml-4">
                  {item.modifiers.map((modifier, modIndex) => (
                    <div key={modIndex} className="break-words text-xs text-muted-foreground">
                      {item.quantity} {modifier}
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
                  className={cn(
                    "flex-1 min-w-0 text-[10px] text-white sm:text-sm",
                    order.atrasado ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#F97316] hover:bg-[#EA580C]",
                  )}
                  size="sm"
                >
                  <span className="hidden sm:inline">FINALIZAR PREPARO</span>
                  <span className="truncate sm:hidden">FINALIZAR</span>
                  <span className="ml-0.5 font-mono text-[10px] sm:ml-2 sm:text-xs">{timer}</span>
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
              <>
                <Button
                  onClick={handleResumeCooking}
                  className={cn(
                    "flex-1 min-w-0 text-[10px] text-white sm:text-sm",
                    order.atrasado ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#F97316] hover:bg-[#EA580C]",
                  )}
                  size="sm"
                >
                  <Play className="mr-0.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">VOLTAR AO PREPARO</span>
                  <span className="truncate sm:hidden">VOLTAR</span>
                  <span className="ml-0.5 font-mono text-[10px] sm:ml-2 sm:text-xs">{timer}</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStartCooking}
                className={cn(
                  "flex-1 min-w-0 text-[10px] text-white sm:text-sm",
                  order.atrasado ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#1F2937] hover:bg-[#111827]",
                )}
                size="sm"
              >
                <span className="hidden sm:inline">INICIAR PREPARO</span>
                <span className="truncate sm:hidden">INICIAR</span>
                <span className="ml-0.5 font-mono text-[10px] sm:ml-2 sm:text-xs">{timer}</span>
              </Button>
            )}
            <Button variant="outline" size="icon" className="h-7 w-7 shrink-0 bg-transparent sm:h-9 sm:w-9">
              <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <OrderDetailsModal order={order} open={showDetailsModal} onOpenChange={setShowDetailsModal} />
    </>
  )
}
