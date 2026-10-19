import { LayoutList, Columns3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { KdsViewMode } from "@/hooks/usePersistedViewMode"

interface ViewModeToggleProps {
  viewMode: KdsViewMode
  onViewModeChange: (mode: KdsViewMode) => void
}

const modes: { id: KdsViewMode; label: string; icon: typeof LayoutList }[] = [
  { id: "list", label: "Listagem", icon: LayoutList },
  { id: "kanban", label: "Kanban", icon: Columns3 },
]

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1">
      {modes.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(id)}
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs sm:text-sm",
            viewMode === id
              ? "bg-muted text-foreground hover:bg-muted"
              : "text-muted-foreground hover:text-foreground",
          )}
          title={label}
          aria-pressed={viewMode === id}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}
