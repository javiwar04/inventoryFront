"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, PackageX, AlertTriangle, Clock, TrendingDown } from "lucide-react"
import { productosService, salidasService, entradasService, categoriasService } from "@/lib/api"
import type { DateRange } from "react-day-picker"

interface DeadStockItem {
  id: number
  nombre: string
  sku: string
  categoria: string
  stockActual: number
  costo: number
  valorRetenido: number
  diasSinMovimiento: number
  ultimoMovimiento: string | null
  estado: 'critico' | 'advertencia' | 'observacion'
}

interface Props {
  dateRange?: DateRange
}

export function DeadStockReport({ dateRange }: Props) {
  const [data, setData] = useState<DeadStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState<string>('todos')

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productos, salidasAll, entradasAll, categorias] = await Promise.all([
        productosService.getAll(),
        salidasService.getAll(1, 10000),
        entradasService.getAll(1, 10000),
        categoriasService.getAll()
      ])

      // Build category lookup
      const catLookup = new Map<number, string>()
      for (const c of categorias) {
        catLookup.set(c.id, c.nombre)
      }

      const now = new Date()
      const items: DeadStockItem[] = productos
        .filter(p => p.activo && p.stock_actual > 0)
        .map(p => {
          // Buscar último movimiento (entrada o salida) de este producto
          let ultimaFecha: Date | null = null

          for (const e of entradasAll) {
            const detalles = e.detalles || e.detalleEntrada || []
            if (detalles.some(d => d.productoId === p.id)) {
              const f = new Date(e.fechaEntrada)
              if (!ultimaFecha || f > ultimaFecha) ultimaFecha = f
            }
          }

          for (const s of salidasAll) {
            const detalles = s.detalles || s.detalleSalida || []
            if (detalles.some(d => d.productoId === p.id)) {
              const f = new Date(s.fechaSalida)
              if (!ultimaFecha || f > ultimaFecha) ultimaFecha = f
            }
          }

          const diasSinMovimiento = ultimaFecha
            ? Math.floor((now.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24))
            : 999

          const valorRetenido = p.stock_actual * (p.costo || 0)

          let estado: 'critico' | 'advertencia' | 'observacion' = 'observacion'
          if (diasSinMovimiento >= 90) estado = 'critico'
          else if (diasSinMovimiento >= 60) estado = 'advertencia'
          else if (diasSinMovimiento >= 30) estado = 'observacion'

          return {
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            categoria: (typeof p.categoria === 'object' && p.categoria?.nombre) ? p.categoria.nombre : catLookup.get(p.categoria_id) || 'Sin categoría',
            stockActual: p.stock_actual,
            costo: p.costo || 0,
            valorRetenido,
            diasSinMovimiento,
            ultimoMovimiento: ultimaFecha ? ultimaFecha.toISOString() : null,
            estado
          }
        })
        .filter(item => item.diasSinMovimiento >= 30)
        .sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento)

      setData(items)
    } catch (err) {
      console.error('Error cargando inventario muerto:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filterEstado === 'todos' ? data : data.filter(d => d.estado === filterEstado)
  const totalValorRetenido = data.reduce((s, d) => s + d.valorRetenido, 0)
  const criticos = data.filter(d => d.estado === 'critico').length
  const advertencias = data.filter(d => d.estado === 'advertencia').length

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'critico': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Crítico (+90d)</Badge>
      case 'advertencia': return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Advertencia (60-90d)</Badge>
      case 'observacion': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Observación (30-60d)</Badge>
      default: return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos Sin Rotación</CardTitle>
            <PackageX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">30+ días sin movimiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Retenido</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{fmtQ(totalValorRetenido)}</div>
            <p className="text-xs text-muted-foreground">Capital inmovilizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticos}</div>
            <p className="text-xs text-muted-foreground">+90 días sin movimiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Advertencia</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{advertencias}</div>
            <p className="text-xs text-muted-foreground">60-90 días sin movimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['todos', 'critico', 'advertencia', 'observacion'].map(est => (
          <button
            key={est}
            onClick={() => setFilterEstado(est)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterEstado === est
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {est === 'todos' ? 'Todos' : est.charAt(0).toUpperCase() + est.slice(1)}
            <span className="ml-1.5 text-xs">
              ({est === 'todos' ? data.length : data.filter(d => d.estado === est).length})
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            Inventario Sin Rotación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Valor Retenido</TableHead>
                  <TableHead className="text-right">Días Sin Mov.</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell className="font-medium">{row.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{row.categoria}</TableCell>
                    <TableCell className="text-right">{row.stockActual}</TableCell>
                    <TableCell className="text-right text-red-400">{fmtQ(row.valorRetenido)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress 
                          value={Math.min(100, (row.diasSinMovimiento / 120) * 100)} 
                          className="w-16 h-2"
                        />
                        <span className="font-semibold">{row.diasSinMovimiento}d</span>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(row.estado)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay productos sin rotación en esta categoría
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
