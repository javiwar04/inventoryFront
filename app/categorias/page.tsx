"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { CategoryDialog } from "@/components/category-dialog"
import { CategoriesTable } from "@/components/categories-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { NoFlashWrapper } from "@/components/no-flash-wrapper"
import { usePermissions } from "@/hooks/use-permissions"
import { FolderOpen, Package, Loader2 } from "lucide-react"
import { categoriasService, productosService } from "@/lib/api"

export default function CategoriasPage() {
  const { canView, canCreate } = usePermissions()
  const [stats, setStats] = useState({
    totalCategorias: 0,
    categoriasActivas: 0,
    totalProductos: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadStats()
  }, [refreshKey])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [categorias, productos] = await Promise.all([
        categoriasService.getAll(),
        productosService.getAll()
      ])

      const activas = categorias.filter(c => c.estado?.toLowerCase() === 'activo').length

      setStats({
        totalCategorias: categorias.length,
        categoriasActivas: activas,
        totalProductos: productos.length
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  // Verificar permiso después de todos los hooks
  if (!canView("categorias")) {
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
      <NoFlashWrapper>
        <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
                  <p className="text-muted-foreground">Gestiona las categorías de productos</p>
                </div>
                {canCreate("categorias") && <CategoryDialog onSuccess={() => setRefreshKey(prev => prev + 1)} />}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCategorias}</div>
                        <p className="text-xs text-muted-foreground">{stats.categoriasActivas} activas</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Productos Categorizados</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProductos}</div>
                        <p className="text-xs text-muted-foreground">Productos en catálogo</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lista de Categorías</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CategoriesTable key={refreshKey} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      </NoFlashWrapper>
    </ProtectedRoute>
  )
}
