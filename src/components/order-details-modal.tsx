
import { AlertCircle, FileText } from "lucide-react"
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
    const now = new Date()
    const diffMinutes = (now.getTime() - localDate.getTime()) / (1000 * 60)
    return diffMinutes > order.tempoPreparo
  }

  const isDelayed = isOrderDelayed(order)

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
                <span className="text-lg font-bold">#{order.preparoProducaoId}</span>
                <span className="text-sm text-muted-foreground">Cliente: {order.clienteNome}</span>
              </div>
              <div className="text-sm text-muted-foreground">Comanda: {order.comandaNumero}</div>
              {isDelayed && (
                <div className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                  PEDIDO ATRASADO
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">~ {order.tempoPreparo} min</div>
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

          {/* Observação Geral do Pedido */}
          {order.observacao && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Observação Geral do Pedido
                  </div>
                  <p className="text-sm break-words text-amber-800 dark:text-amber-200 leading-relaxed">
                    {order.observacao}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                      {item.observacao && (
                        <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3 dark:bg-blue-950/30 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Observação do Item
                              </div>
                              <p className="text-sm break-words text-blue-800 dark:text-blue-200 leading-relaxed">
                                {item.observacao}
                              </p>
                            </div>
                          </div>
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
