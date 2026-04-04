"use client"

import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { KardexView } from "@/components/kardex-view"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { Card } from "@/components/ui/card"

export default function KardexPage() {
  const { canView } = usePermissions()

  if (!canView("productos")) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <StaticSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
              </Card>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <StaticSidebar />
        <div className="flex flex-1 flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background border-b border-border/40">
              <div className="container px-6 py-8">
                <h1 className="text-4xl font-bold text-gradient mb-2">Kardex</h1>
                <p className="text-lg text-muted-foreground">
                  Historial de movimientos por producto — formato contable
                </p>
              </div>
            </div>
            <div className="container px-6 py-8">
              <KardexView />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
