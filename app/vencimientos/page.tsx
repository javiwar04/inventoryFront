"use client"

import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpirationTable } from "@/components/expiration-table"
import { AlertTriangle, Calendar, Package, XCircle, Download } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { useEffect, useState } from "react"
import { productosService, entradasService } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function ExpirationsPage() {
  const { canView } = usePermissions()
  const [stats, setStats] = useState({
    total: 0,
    vencen30: 0,
    vencen90: 0,
    vencidos: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // FIX: Reducido a 100 para evitar crash
      const entradas = await entradasService.getAll(1, 100)

      let total = 0
      let vencen30 = 0
      let vencen90 = 0
      let vencidos = 0
      const hoy = new Date()

      // Contar lotes de entradas con vencimiento
      entradas.forEach(e => {
        if (e.detalleEntrada) {
          e.detalleEntrada.forEach(d => {
            if (d.fechaVencimiento && d.lote) {
              total++
              const fechaVenc = new Date(d.fechaVencimiento)
              const dias = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
              
              if (dias < 0) vencidos++
              else if (dias <= 30) vencen30++
              else if (dias <= 90) vencen90++
            }
          })
        }
      })

      setStats({ total, vencen30, vencen90, vencidos })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  const handleExport = async () => {
    try {
      const entradas = await entradasService.getAll(1, 10000)
      
      const vencimientos: any[] = []
      const hoy = new Date()

      entradas.forEach(entrada => {
        if (entrada.detalleEntrada) {
          entrada.detalleEntrada.forEach(detalle => {
            if (detalle.fechaVencimiento && detalle.lote) {
              const fechaVenc = new Date(detalle.fechaVencimiento)
              const dias = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
              
              let estado = 'Normal'
              if (dias < 0) estado = 'Vencido'
              else if (dias <= 30) estado = 'Crítico'
              else if (dias <= 90) estado = 'Advertencia'
              
              vencimientos.push({
                sku: typeof detalle.producto === 'object' ? (detalle.producto?.sku || '') : '',
                nombre: typeof detalle.producto === 'string' ? detalle.producto : (detalle.producto?.nombre || 'Desconocido'),
                lote: detalle.lote,
                cantidad: detalle.cantidad,
                fechaVenc: detalle.fechaVencimiento,
                dias,
                estado
              })
            }
          })
        }
      })

      const headers = ['SKU', 'Producto', 'Lote', 'Cantidad', 'Fecha Vencimiento', 'Días Restantes', 'Estado']
      const rows = vencimientos.map(v => [
        v.sku,
        v.nombre,
        v.lote,
        v.cantidad.toString(),
        new Date(v.fechaVenc).toLocaleDateString('es-GT'),
        v.dias.toString(),
        v.estado
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `vencimientos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success(`${vencimientos.length} productos exportados exitosamente`)
    } catch (error) {
      toast.error('Error al exportar vencimientos')
      console.error('Error al exportar:', error)
    }
  }

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
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-balance">Control de Vencimientos</h1>
              <p className="mt-2 text-muted-foreground">
                Monitorea las fechas de vencimiento de tus productos para evitar pérdidas
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">Con fecha de vencimiento</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vencen en 30 días</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.vencen30}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención urgente</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vencen en 90 días</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.vencen90}</div>
                  <p className="text-xs text-muted-foreground mt-1">Planificar rotación</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos Vencidos</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.vencidos}</div>
                  <p className="text-xs text-accent mt-1">{stats.vencidos === 0 ? 'Excelente control' : 'Requiere acción'}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Productos por Vencer</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <ExpirationTable />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
