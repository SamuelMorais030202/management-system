
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ObservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  observation: string
  type?: "general" | "item"
}

export function ObservationModal({
  open,
  onOpenChange,
  title,
  observation,
  type = "general",
}: ObservationModalProps) {
  const Icon = type === "general" ? AlertCircle : FileText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn(
              "h-5 w-5",
              type === "general" 
                ? "text-amber-600 dark:text-amber-500" 
                : "text-blue-600 dark:text-blue-500"
            )} />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div
            className={cn(
              "rounded-lg border p-4",
              type === "general"
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
            )}
          >
            <p
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap break-words",
                type === "general"
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-blue-900 dark:text-blue-100"
              )}
            >
              {observation}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

