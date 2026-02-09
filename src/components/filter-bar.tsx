
import { cn } from "@/lib/utils"

interface FilterBarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: {
    all: number
    preparoAguardandoProducao: number
    preparoEmProducao: number
    preparoPausado: number
    preparoCancelado: number
    preparoFinalizado: number
    preparoEmAtraso: number // Added atrasado count
  }
}

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  const filters = [
    { id: "all", label: "VER TODOS", count: counts.all },
    { id: "preparoAguardandoProducao", label: "AGUARDANDO", count: counts.preparoAguardandoProducao },
    { id: "preparoEmProducao", label: "EM PRODUÇÃO", count: counts.preparoEmProducao },
    { id: "preparoPausado", label: "PAUSADO", count: counts.preparoPausado },
    { id: "preparoEmAtraso", label: "ATRASADOS", count: counts.preparoEmAtraso },
    { id: "preparoCancelado", label: "CANCELADO", count: counts.preparoCancelado },
    { id: "preparoFinalizado", label: "FINALIZADO", count: counts.preparoFinalizado },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "relative whitespace-nowrap pb-1 text-xs font-medium transition-colors sm:text-sm cursor-pointer",
            activeFilter === filter.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {filter.label} <span className="ml-1">{filter.count}</span>
          {activeFilter === filter.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
        </button>
      ))}
    </div>
  )
}
