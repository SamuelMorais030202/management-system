
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface WebSocketStatusProps {
  status: ConnectionStatus
}

export function WebSocketStatus({ status }: WebSocketStatusProps) {
  const statusConfig = {
    connecting: {
      icon: Loader2,
      label: "Conectando...",
      color: "text-yellow-600 dark:text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    connected: {
      icon: Wifi,
      label: "Online",
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
    },
    disconnected: {
      icon: WifiOff,
      label: "Desconectado",
      color: "text-red-600 dark:text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
    },
    error: {
      icon: WifiOff,
      label: "Erro",
      color: "text-red-600 dark:text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 sm:px-3 sm:py-2",
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 sm:h-4 sm:w-4",
          config.color,
          status === "connecting" && "animate-spin"
        )}
      />
      <span className={cn("text-xs font-medium sm:text-sm", config.color)}>
        {config.label}
      </span>
    </div>
  )
}

