"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { ExitDialogNew } from "@/components/exit-dialog-new"
import { ExitsTable } from "@/components/exits-table-new"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Calendar, TrendingDown, Package, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { salidasService } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function ExitsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { canView, canCreate } = usePermissions()
  const [stats, setStats] = useState({
    salidasMes: 0,
    productosDespachados: 0,
    productosCount: 0
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
    window.addEventListener('salidas:created', handleCreated)
    return () => window.removeEventListener('salidas:created', handleCreated)
  }, [authLoading, user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const salidas = await salidasService.getAll(1, 1000)

      // FILTRAR SI ES EMPLEADO (HOTEL)
      let salidasFiltradas = salidas
      if (user?.rol === 'empleado' && user.id) {
        salidasFiltradas = salidas.filter(s => s.creadoPor === user.id)
      }

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const salidasMes = salidasFiltradas.filter(s => 
        new Date(s.fechaSalida) >= firstDayOfMonth
      )

      const productosDespachados = salidasMes.reduce((sum, s) => 
        sum + (s.detalleSalida?.length || (s as any).DetalleSalida?.length || 0), 0
      )

      setStats({
        salidasMes: salidasMes.length,
        productosDespachados,
        productosCount: salidasFiltradas.reduce((sum, s) => 
          sum + (s.detalleSalida?.length || (s as any).DetalleSalida?.length || 0), 0
        )
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const salidas = await salidasService.getAll(1, 1000)
      
      const headers = ['Número', 'Fecha', 'Motivo', 'Destino', 'Productos', 'Estado']
      const rows = salidas.map(salida => [
        salida.numeroSalida || '',
        new Date(salida.fechaSalida).toLocaleDateString('es-GT'),
        salida.motivo || '',
        salida.destino || '',
        (salida.detalleSalida?.length || (salida as any).DetalleSalida?.length || 0).toString(),
        salida.estado || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success(`${salidas.length} ventas exportadas exitosamente`)
    } catch (error) {
      toast.error('Error al exportar ventas')
      console.error('Error al exportar:', error)
    }
  }

  // Verificar permiso después de todos los hooks
  if (!canView("salidas")) {
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
                <h1 className="text-3xl font-bold text-balance">Gestión de Ventas</h1>
                <p className="mt-2 text-muted-foreground">
                  Registra y gestiona las ventas de productos desde los hoteles.
                </p>
              </div>
              {canCreate("salidas") && <ExitDialogNew />}
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
                      <CardTitle className="text-sm font-medium text-muted-foreground">Salidas del Mes</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.salidasMes}</div>
                      <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Productos Despachados</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.productosDespachados}</div>
                      <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Histórico</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.productosCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">Productos totales</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar por producto, destino o referencia..." className="pl-10" />
                  </div>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>

                <ExitsTable key={refreshKey} />
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
