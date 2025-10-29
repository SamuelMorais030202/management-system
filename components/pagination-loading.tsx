"use client"

import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PaginationLoadingProps {
  message?: string
}

export function PaginationLoading({ message = "Carregando mais pedidos..." }: PaginationLoadingProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}
