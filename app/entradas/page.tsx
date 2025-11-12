"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { EntryDialogNew } from "@/components/entry-dialog-new"
import { EntriesTable } from "@/components/entries-table-new"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Calendar, TrendingUp, DollarSign, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { entradasService, productosService } from "@/lib/api"

export default function EntriesPage() {
  const { canView, canCreate } = usePermissions()
  const [stats, setStats] = useState({
    entradasMes: 0,
    productosIngresados: 0,
    inversionTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadStats()
    
    const handleCreated = () => {
      setRefreshKey(prev => prev + 1)
      loadStats()
    }
    window.addEventListener('entradas:created', handleCreated)
    return () => window.removeEventListener('entradas:created', handleCreated)
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [entradas, productos] = await Promise.all([
        entradasService.getAll(1, 1000),
        productosService.getAll()
      ])

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const entradasMes = entradas.filter(e => 
        new Date(e.fechaEntrada) >= firstDayOfMonth
      )

      const productosIngresados = entradasMes.reduce((sum, e) => 
        sum + (e.detalleEntrada?.length || (e as any).DetalleEntrada?.length || 0), 0
      )

      const inversionTotal = entradasMes.reduce((sum, e) => 
        sum + (e.total || 0), 0
      )

      setStats({
        entradasMes: entradasMes.length,
        productosIngresados,
        inversionTotal
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 0 }).format(value)
  }

  // Verificar permiso después de todos los hooks
  if (!canView("entradas")) {
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
                <h1 className="text-3xl font-bold text-balance">Entradas de Inventario</h1>
                <p className="mt-2 text-muted-foreground">
                  Registra y gestiona todas las entradas de productos al inventario
                </p>
              </div>
              {canCreate("entradas") && <EntryDialogNew />}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Entradas del Mes</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.entradasMes}</div>
                      <p className="text-xs text-accent mt-1">Este mes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Productos Ingresados</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.productosIngresados}</div>
                      <p className="text-xs text-accent mt-1">Unidades totales</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Inversión Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.inversionTotal)}</div>
                      <p className="text-xs text-accent mt-1">Este mes</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar por producto, proveedor o factura..." className="pl-10" />
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>

                <EntriesTable key={refreshKey} />
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
