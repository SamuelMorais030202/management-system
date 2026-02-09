import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card } from "@/components/ui/card"

interface LoadingCardProps {
  message?: string
  showSpinner?: boolean
  className?: string
}

export function LoadingCard({ 
  message = "Carregando...", 
  showSpinner = true,
  className = ""
}: LoadingCardProps) {
  return (
    <Card className={`p-6 text-center ${className}`}>
      <div className="space-y-4">
        {showSpinner && (
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Card>
  )
}
