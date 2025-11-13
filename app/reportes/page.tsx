"use client"

import { useState, useEffect, useRef } from "react"
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
import { reportesService, productosService, proveedoresService, categoriasService } from "@/lib/api"
import { exportarReportePDF, exportarReporteExcel, exportarReporteCSV } from "@/lib/export-utils"
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
  const [showFilters, setShowFilters] = useState(false)
  const [productQuery, setProductQuery] = useState('')
  const [productSuggestions, setProductSuggestions] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [providerQuery, setProviderQuery] = useState('')
  const [providerSuggestions, setProviderSuggestions] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const productTimer = useRef<number | null>(null)
  const providerTimer = useRef<number | null>(null)

  useEffect(() => {
    loadStats()
  }, [dateRange])

  useEffect(() => {
    // Load categories and saved filters
    (async () => {
      try {
        const cats = await categoriasService.getAll()
        setCategories(cats)
      } catch (e) {
        console.warn('No se pudieron cargar categorías', e)
      }
      const saved = localStorage.getItem('report-filter-presets')
      if (saved) {
        try {
          setSavedFilters(JSON.parse(saved))
        } catch (e) {
          console.warn('Error parseando filtros guardados', e)
        }
      }
    })()
  }, [])

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
        reportesService.getTopProductos(10, dateRange?.from, dateRange?.to),
        reportesService.getDistribucionCategorias(dateRange?.from, dateRange?.to),
        reportesService.getComparacionMensual(dateRange?.from, dateRange?.to),
        reportesService.getValorInventarioPorMes(dateRange?.from, dateRange?.to)
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

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      toast.loading('Generando CSV...')

      const [topProductos, categorias, comparacionMensual, valorInventario] = await Promise.all([
        reportesService.getTopProductos(1000, dateRange?.from, dateRange?.to),
        reportesService.getDistribucionCategorias(dateRange?.from, dateRange?.to),
        reportesService.getComparacionMensual(dateRange?.from, dateRange?.to),
        reportesService.getValorInventarioPorMes(dateRange?.from, dateRange?.to)
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

      exportarReporteCSV(data)
      toast.success('CSV generado')
    } catch (err) {
      console.error('Error al generar CSV:', err)
      toast.error('Error al generar CSV')
    } finally {
      setExporting(false)
      toast.dismiss()
    }
  }

  // Simple product/provider search helpers
  const searchProducts = async (term: string) => {
    // debounce simple
    if (productTimer.current) window.clearTimeout(productTimer.current)
    productTimer.current = window.setTimeout(async () => {
      if (!term || term.length < 2) {
        setProductSuggestions([])
        return
      }
      try {
        const results = await productosService.search(term)
        setProductSuggestions(results)
      } catch (e) {
        console.warn('Error buscando productos', e)
      }
    }, 300) as unknown as number
  }

  const searchProviders = async (term: string) => {
    if (providerTimer.current) window.clearTimeout(providerTimer.current)
    providerTimer.current = window.setTimeout(async () => {
      if (!term || term.length < 2) {
        setProviderSuggestions([])
        return
      }
      try {
        const results = await proveedoresService.search(term)
        setProviderSuggestions(results)
      } catch (e) {
        console.warn('Error buscando proveedores', e)
      }
    }, 300) as unknown as number
  }

  const clearFilterBadge = (key: string) => {
    switch (key) {
      case 'product':
        setSelectedProduct(null); setProductQuery(''); break
      case 'category':
        setSelectedCategory(null); break
      case 'provider':
        setSelectedProvider(null); setProviderQuery(''); break
    }
  }

  const deleteSavedFilter = (idx: number) => {
    const copy = [...savedFilters]
    copy.splice(idx, 1)
    setSavedFilters(copy)
    localStorage.setItem('report-filter-presets', JSON.stringify(copy))
    toast.success('Filtro eliminado')
  }

  const renameSavedFilter = (idx: number) => {
    const nuevo = prompt('Nuevo nombre para el filtro:', savedFilters[idx]?.name ?? '')
    if (!nuevo) return
    const copy = [...savedFilters]
    copy[idx].name = nuevo
    setSavedFilters(copy)
    localStorage.setItem('report-filter-presets', JSON.stringify(copy))
    toast.success('Filtro renombrado')
  }

  const saveFilter = (name: string) => {
    const preset = {
      name,
      dateRange: dateRange ? { from: dateRange.from?.toISOString(), to: dateRange.to?.toISOString() } : null,
      productId: selectedProduct?.id ?? null,
      categoryId: selectedCategory ?? null,
      providerId: selectedProvider?.id ?? null
    }
    const existing = [...savedFilters, preset]
    setSavedFilters(existing)
    localStorage.setItem('report-filter-presets', JSON.stringify(existing))
    toast.success('Filtro guardado')
  }

  const applySavedFilter = (preset: any) => {
    try {
      if (preset.dateRange) {
        setDateRange({ from: new Date(preset.dateRange.from), to: new Date(preset.dateRange.to) })
      }
      if (preset.productId) setSelectedProduct({ id: preset.productId })
      if (preset.categoryId) setSelectedCategory(preset.categoryId)
      if (preset.providerId) setSelectedProvider({ id: preset.providerId })
    } catch (e) {
      console.warn('Error aplicando preset', e)
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
                    <DropdownMenuItem onClick={() => handleExportCSV()}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar como CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filters quick panel */}
            <div className="mt-4 mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(s => !s)}>
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </Button>
                <div className="flex gap-2 items-center">
                  <div className="text-sm text-muted-foreground">Filtros guardados:</div>
                  <select className="border rounded p-1 text-sm" onChange={(e) => {
                    const idx = Number(e.target.value)
                    if (!isNaN(idx) && savedFilters[idx]) applySavedFilter(savedFilters[idx])
                  }}>
                    <option value="">-- seleccionar --</option>
                    {savedFilters.map((s, i) => (
                      <option key={i} value={i}>{s.name}</option>
                    ))}
                  </select>
                  {savedFilters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">Gestionar:</div>
                      <div className="flex gap-1">
                        {savedFilters.map((s, i) => (
                          <div key={i} className="flex items-center gap-1 bg-muted/10 rounded px-2 py-1 text-xs">
                            <span>{s.name}</span>
                            <button onClick={() => renameSavedFilter(i)} className="text-primary underline">Editar</button>
                            <button onClick={() => deleteSavedFilter(i)} className="text-destructive underline">Eliminar</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Producto</label>
                    <input value={productQuery} onChange={(e) => { setProductQuery(e.target.value); searchProducts(e.target.value) }} className="w-full border rounded p-2 text-sm" placeholder="Buscar producto..." />
                    {productSuggestions.length > 0 && (
                      <div className="border rounded max-h-40 overflow-auto bg-card mt-1">
                        {productSuggestions.map(p => (
                          <div key={p.id} onClick={() => { setSelectedProduct(p); setProductSuggestions([]); setProductQuery(p.nombre) }} className="p-2 hover:bg-muted/10 cursor-pointer text-sm">{p.nombre} ({p.sku})</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Categoría</label>
                    <select value={selectedCategory ?? ''} onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded p-2 text-sm">
                      <option value="">-- Todas --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Proveedor</label>
                    <input value={providerQuery} onChange={(e) => { setProviderQuery(e.target.value); searchProviders(e.target.value) }} className="w-full border rounded p-2 text-sm" placeholder="Buscar proveedor..." />
                    {providerSuggestions.length > 0 && (
                      <div className="border rounded max-h-40 overflow-auto bg-card mt-1">
                        {providerSuggestions.map(p => (
                          <div key={p.id} onClick={() => { setSelectedProvider(p); setProviderSuggestions([]); setProviderQuery(p.nombre) }} className="p-2 hover:bg-muted/10 cursor-pointer text-sm">{p.nombre}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Acciones</label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveFilter(prompt('Nombre para guardar este filtro:') || 'Filtro sin nombre')}>Guardar filtro</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedProduct(null); setSelectedCategory(null); setSelectedProvider(null); setProductQuery(''); setProviderQuery('') }}>Limpiar</Button>
                    </div>
                  </div>
                </div>
              )}
              {/* Active filter badges */}
              <div className="mt-3 flex items-center gap-2">
                {selectedProduct && (
                  <div className="px-3 py-1 rounded bg-primary/10 text-sm flex items-center gap-2">
                    <span>{selectedProduct.nombre}</span>
                    <button onClick={() => clearFilterBadge('product')} className="text-muted-foreground">×</button>
                  </div>
                )}
                {selectedCategory && (
                  <div className="px-3 py-1 rounded bg-primary/10 text-sm flex items-center gap-2">
                    <span>{categories.find(c => c.id === selectedCategory)?.nombre ?? 'Categoría'}</span>
                    <button onClick={() => clearFilterBadge('category')} className="text-muted-foreground">×</button>
                  </div>
                )}
                {selectedProvider && (
                  <div className="px-3 py-1 rounded bg-primary/10 text-sm flex items-center gap-2">
                    <span>{selectedProvider.nombre}</span>
                    <button onClick={() => clearFilterBadge('provider')} className="text-muted-foreground">×</button>
                  </div>
                )}
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
                  <StockValueChart dateRange={dateRange} />
                  <CategoryDistribution dateRange={dateRange} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  <MonthlyComparison dateRange={dateRange} />
                  <TopProductsTable dateRange={dateRange} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
