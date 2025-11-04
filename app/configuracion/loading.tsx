import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Building2, DollarSign, Bell, Shield } from "lucide-react"

export default function ConfiguracionLoading() {
  return (
    <div className="flex h-screen">
      <StaticSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-80 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar de categorías skeleton */}
            <div className="lg:col-span-1">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Categorías</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[Building2, DollarSign, Bell, Shield].map((Icon, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal skeleton */}
            <div className="lg:col-span-3">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <Skeleton className="h-5 w-48" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      {index < 3 && <div className="border-t mt-6" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Información adicional skeleton */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}