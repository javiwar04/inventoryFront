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
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function EntriesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { canView, canCreate } = usePermissions()
  const [stats, setStats] = useState({
    entradasMes: 0,
    productosIngresados: 0,
    inversionTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      loadStats()
    }
    
    const handleCreated = () => {
      setRefreshKey(prev => prev + 1)
      if (!authLoading) loadStats()
    }
    window.addEventListener('entradas:created', handleCreated)
    return () => window.removeEventListener('entradas:created', handleCreated)
  }, [authLoading, user])

  const loadStats = async () => {
    try {
      setLoading(true)
      // FIX: Reducido de 1000 a 50 para evitar errores de conexión (500 Internal Server Error)
      const [entradas, productos] = await Promise.all([
        entradasService.getAll(1, 50),
        productosService.getAll()
      ])

      // FILTRAR SI ES EMPLEADO (HOTEL)
      let entradasFiltradas = entradas
      if (user?.rol === 'empleado' && user.id) {
        entradasFiltradas = entradas.filter(e => e.creadoPor === user.id)
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()
      
      // Conteo Mes Actual (Using UTC components to match date string face value)
      const entradasMes = entradasFiltradas.filter(e => {
        const d = new Date(e.fechaEntrada)
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
      }).length

      // Totales Históricos (del usuario/hotel)
      const productosIngresados = entradasFiltradas.reduce((sum, e) => 
        sum + (e.detalles?.reduce((acc: number, d) => acc + d.cantidad, 0) || e.detalleEntrada?.reduce((acc: number, d) => acc + d.cantidad, 0) || (e as any).DetalleEntrada?.length || 0), 0
      )

      const inversionTotal = entradasFiltradas.reduce((sum, e) => 
        sum + (e.total || 0), 0
      )

      setStats({
        entradasMes,
        productosIngresados,
        inversionTotal
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const entradas = await entradasService.getAll(1, 1000)
      
      const headers = ['Número', 'Fecha', 'Proveedor', 'Factura', 'Productos', 'Total', 'Estado']
      const rows = entradas.map(e => [
        e.numeroEntrada,
        new Date(e.fechaEntrada).toLocaleDateString('es-GT'),
        typeof e.proveedor === 'string' ? e.proveedor : (e.proveedor?.nombre || 'N/A'),
        e.numeroFactura || 'N/A',
        (e.detalles?.length || e.detalleEntrada?.length || 0).toString(),
        `Q${(e.total || 0).toFixed(2)}`,
        e.estado || 'completada'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `entradas_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success(`${entradas.length} entradas exportadas correctamente`)
    } catch (error) {
      console.error('Error exportando:', error)
      toast.error('Error al exportar entradas')
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
                  <Button variant="outline" onClick={handleExport}>
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
