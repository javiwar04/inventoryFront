"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface PageLoaderProps {
  title?: string
  showCards?: boolean
  cardsCount?: number
}

export function PageLoader({ title = "Cargando...", showCards = true, cardsCount = 4 }: PageLoaderProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-card">
        <div className="p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header skeleton */}
        <div className="h-16 border-b bg-card px-6 flex items-center justify-between">
          <Skeleton className="h-10 w-96" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        
        {/* Page content skeleton */}
        <main className="flex-1 p-6 bg-background">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          {showCards && (
            <div className={`grid gap-6 md:grid-cols-${cardsCount} mb-6`}>
              {[...Array(cardsCount)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-card rounded-lg border">
            <div className="p-6 border-b">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}