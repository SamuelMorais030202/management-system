
import { cn } from "@/lib/utils"

interface StatusTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  counts: {
    active: number
    scheduled: number
    completed: number
  }
}

export function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
  const tabs = [
    { id: "active", label: "ATIVOS", count: counts.active },
    { id: "scheduled", label: "AGENDADOS", count: counts.scheduled },
    { id: "completed", label: "FINALIZADOS", count: counts.completed },
  ]

  return (
    <div className="flex items-center justify-center gap-8 px-6 pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative pb-3 text-sm font-medium transition-colors",
            activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label} <span className="ml-1">{tab.count}</span>
          {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
        </button>
      ))}
    </div>
  )
}
