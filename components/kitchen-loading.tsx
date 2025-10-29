"use client"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ChefHat, Clock, Utensils } from "lucide-react"

interface KitchenLoadingProps {
  message?: string
  showSkeleton?: boolean
}

export function KitchenLoading({ message = "Carregando pedidos...", showSkeleton = false }: KitchenLoadingProps) {
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="border-b bg-card">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {/* Search skeleton */}
              <div className="relative w-full sm:w-80">
                <div className="h-10 bg-muted rounded-md animate-pulse" />
              </div>
              {/* Date inputs skeleton */}
              <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
            </div>
            {/* Time skeleton */}
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="border-t px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 w-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </header>

        {/* Orders Grid Skeleton */}
        <main className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1536px]:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
                <div className="space-y-3">
                  {/* Header skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                  
                  {/* Customer name skeleton */}
                  <div className="h-5 w-32 bg-muted rounded" />
                  
                  {/* Items skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </div>
                  
                  {/* Timer skeleton */}
                  <div className="h-6 w-16 bg-muted rounded mx-auto" />
                  
                  {/* Button skeleton */}
                  <div className="h-8 w-full bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer Skeleton */}
        <footer className="fixed bottom-0 left-0 right-0 border-t bg-card">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Icons */}
        <div className="relative">
          <div className="flex items-center justify-center space-x-4">
            <ChefHat className="h-12 w-12 text-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <Utensils className="h-10 w-10 text-orange-500 animate-bounce" style={{ animationDelay: '200ms' }} />
            <Clock className="h-10 w-10 text-green-500 animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
          
          {/* Rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 border-2 border-primary/20 rounded-full animate-spin">
              <div className="h-20 w-20 border-2 border-transparent border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            Preparando a cozinha para você...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  )
}
