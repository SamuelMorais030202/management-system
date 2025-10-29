"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PreparoProducao } from "@/hooks/useLoadOrdersByTerminal"

interface OrderDetailsModalProps {
  order: PreparoProducao | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null

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

  const config = statusConfig[order.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-start justify-between rounded-lg border bg-muted/50 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">#{order.keyId}</span>
                <span className="text-sm text-muted-foreground">{order.clienteNome}</span>
              </div>
              <div className="text-sm text-muted-foreground">{order.comandaNumero}</div>
              {order.dataHoraStatus && (
                <div className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                  PEDIDO ATRASADO
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Entrega {order.tempoPreparo}</div>
              <div className={cn("mt-2 inline-block rounded px-3 py-1 text-sm font-bold", config.bg, config.text)}>
                {config.label}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="text-sm font-medium text-muted-foreground">Tempo de Preparo</div>
            <div className="mt-1 font-mono text-2xl font-bold">{order.tempoPreparo}</div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Itens do Pedido</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {item.qtde}x {item.nome}
                      </div>
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="mt-3 space-y-2 border-l-2 border-muted pl-4">
                          <div className="text-xs font-medium uppercase text-muted-foreground">Modificadores</div>
                          {item.adicionais.map((modifier, modIndex) => (
                            <div key={modIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                              {modifier.qtde}x {modifier.nome}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de Itens</span>
              <span className="font-semibold">{order.items.reduce((acc, item) => acc + item.qtde, 0)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
