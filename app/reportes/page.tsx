"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockValueChart } from "@/components/stock-value-chart"
import { CategoryDistribution } from "@/components/category-distribution"
import { TopProductsTable } from "@/components/top-products-table"
import { MonthlyComparison } from "@/components/monthly-comparison"
import { Download, FileText, Calendar, TrendingUp, Loader2, FileSpreadsheet } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"
import { ProtectedRoute } from "@/components/protected-route"
import { reportesService } from "@/lib/api"
import { exportarReportePDF, exportarReporteExcel } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"

export default function ReportsPage() {
  const { canView } = usePermissions()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [stats, setStats] = useState({
    totalMovimientos: 0,
    rotacionPromedio: 0,
    diasPromedioStock: 0,
    eficiencia: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      const resumen = await reportesService.getResumen(
        dateRange?.from,
        dateRange?.to
      )
      setStats(resumen)
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (formato: 'pdf' | 'excel') => {
    try {
      setExporting(true)
      toast.loading('Generando reporte...')

      // Cargar todos los datos necesarios
      const [topProductos, categorias, comparacionMensual, valorInventario] = await Promise.all([
        reportesService.getTopProductos(10),
        reportesService.getDistribucionCategorias(),
        reportesService.getComparacionMensual(),
        reportesService.getValorInventarioPorMes()
      ])

      const data = {
        titulo: 'Reporte de Inventario',
        stats,
        topProductos,
        categorias,
        comparacionMensual,
        valorInventario,
        fechaGeneracion: new Date(),
        rangoFechas: dateRange?.from && dateRange?.to 
          ? { inicio: dateRange.from, fin: dateRange.to }
          : undefined
      }

      if (formato === 'pdf') {
        await exportarReportePDF(data)
        toast.success('Reporte PDF generado exitosamente')
      } else {
        exportarReporteExcel(data)
        toast.success('Reporte Excel generado exitosamente')
      }
    } catch (err) {
      console.error('Error al exportar:', err)
      toast.error('Error al generar el reporte')
    } finally {
      setExporting(false)
      toast.dismiss()
    }
  }

  if (!canView("reportes")) {
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Reportes y Análisis</h1>
                <p className="mt-2 text-muted-foreground">
                  Visualiza estadísticas detalladas y genera reportes del inventario
                </p>
              </div>
              <div className="flex gap-2">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={exporting || loading}>
                      {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Exportar Reporte
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Exportar como PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar como Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Movimientos</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalMovimientos}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dateRange?.from ? 'Período seleccionado' : 'Histórico completo'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Rotación Promedio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.rotacionPromedio.toFixed(1)}x</div>
                      <p className="text-xs text-muted-foreground mt-1">Veces por período</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Días Promedio Stock</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.diasPromedioStock}</div>
                      <p className="text-xs text-muted-foreground mt-1">Días en inventario</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Eficiencia</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.eficiencia.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Stock adecuado</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <StockValueChart />
                  <CategoryDistribution />
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <MonthlyComparison />
                  <TopProductsTable />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
