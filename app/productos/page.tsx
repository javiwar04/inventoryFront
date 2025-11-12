"use client"

import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { ProductDialog } from "@/components/product-dialog"
import { ProductsTable } from "@/components/products-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Filter } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"

export default function ProductsPage() {
  const [term, setTerm] = useState("")
  const { canView, canCreate } = usePermissions()

  // Verificar permiso para ver productos (después de todos los hooks)
  if (!canView("productos")) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No tienes permiso para ver esta página.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Productos</h1>
                <p className="mt-2 text-muted-foreground">Gestiona el catálogo completo de productos del inventario</p>
              </div>
              {canCreate("productos") && <ProductDialog />}
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por nombre o SKU..." className="pl-10" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>

            <ProductsTable search={term} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
