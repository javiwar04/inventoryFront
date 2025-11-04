import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen">
      <Skeleton className="w-64 h-full" />
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
