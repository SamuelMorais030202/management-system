"use client"

import { Card } from "@/components/ui/card"

export function OrderCardSkeleton() {
  return (
    <Card className="flex min-w-[280px] max-w-full flex-col overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="h-6 w-20 bg-muted rounded" />
      </div>

      {/* Content Skeleton */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Customer name */}
        <div className="h-5 w-32 bg-muted rounded" />
        
        {/* Items */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
        
        {/* Timer */}
        <div className="text-center">
          <div className="h-6 w-16 bg-muted rounded mx-auto" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t p-1.5 sm:p-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="h-8 w-full bg-muted rounded" />
        </div>
      </div>
    </Card>
  )
}
