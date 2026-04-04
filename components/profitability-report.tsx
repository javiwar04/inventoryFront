"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import { productosService, salidasService, entradasService } from "@/lib/api"
import type { DateRange } from "react-day-picker"

interface ProfitabilityData {
  id: number
  nombre: string
  sku: string
  costoTotal: number
  ingresoTotal: number
  margen: number
  margenPct: number
  unidadesVendidas: number
}

interface Props {
  dateRange?: DateRange
}

export function ProfitabilityReport({ dateRange }: Props) {
  const [data, setData] = useState<ProfitabilityData[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'margen' | 'margenPct' | 'ingresoTotal'>('margen')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productos, salidasAll, entradasAll] = await Promise.all([
        productosService.getAll(),
        salidasService.getAll(1, 10000),
        entradasService.getAll(1, 10000)
      ])

      const salidas = dateRange?.from && dateRange?.to
        ? salidasAll.filter(s => {
            const f = new Date(s.fechaSalida)
            return f >= dateRange.from! && f <= dateRange.to!
          })
        : salidasAll

      const entradas = dateRange?.from && dateRange?.to
        ? entradasAll.filter(e => {
            const f = new Date(e.fechaEntrada)
            return f >= dateRange.from! && f <= dateRange.to!
          })
        : entradasAll

      const profitData: ProfitabilityData[] = productos.map(p => {
        // Total de unidades vendidas
        const unidadesVendidas = salidas.reduce((sum, s) => {
          const detalles = s.detalles || s.detalleSalida || []
          return sum + detalles
            .filter(d => d.productoId === p.id)
            .reduce((dSum, d) => dSum + d.cantidad, 0)
        }, 0)

        // Total de unidades compradas
        const unidadesCompradas = entradas.reduce((sum, e) => {
          const detalles = e.detalles || e.detalleEntrada || []
          return sum + detalles
            .filter(d => d.productoId === p.id)
            .reduce((dSum, d) => dSum + d.cantidad, 0)
        }, 0)

        // Ingreso total (precio de venta * unidades vendidas)
        const ingresoTotal = salidas.reduce((sum, s) => {
          const detalles = s.detalles || s.detalleSalida || []
          return sum + detalles
            .filter(d => d.productoId === p.id)
            .reduce((dSum, d) => dSum + (d.subtotal || d.cantidad * (d.precioUnitario || p.precio || 0)), 0)
        }, 0)

        // Costo total (costo * unidades vendidas)
        const costoTotal = unidadesVendidas * (p.costo || 0)

        const margen = ingresoTotal - costoTotal
        const margenPct = ingresoTotal > 0 ? (margen / ingresoTotal) * 100 : 0

        return {
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          costoTotal,
          ingresoTotal,
          margen,
          margenPct,
          unidadesVendidas
        }
      }).filter(p => p.unidadesVendidas > 0)

      setData(profitData)
    } catch (err) {
      console.error('Error cargando rentabilidad:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (col: 'margen' | 'margenPct' | 'ingresoTotal') => {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1
    return (a[sortBy] - b[sortBy]) * mult
  })

  const totalIngreso = data.reduce((s, d) => s + d.ingresoTotal, 0)
  const totalCosto = data.reduce((s, d) => s + d.costoTotal, 0)
  const totalMargen = totalIngreso - totalCosto
  const totalMargenPct = totalIngreso > 0 ? (totalMargen / totalIngreso) * 100 : 0

  const chartData = sorted.slice(0, 10).map(d => ({
    nombre: d.nombre.length > 15 ? d.nombre.slice(0, 15) + '…' : d.nombre,
    ingreso: d.ingresoTotal,
    costo: d.costoTotal,
    margen: d.margen
  }))

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{fmtQ(totalIngreso)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{fmtQ(totalCosto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen Total</CardTitle>
            {totalMargen >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalMargen >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {fmtQ(totalMargen)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen %</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalMargenPct >= 20 ? 'text-green-500' : totalMargenPct >= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
              {totalMargenPct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Top 10 por rentabilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Productos - Ingreso vs Costo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nombre" width={80} tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [fmtQ(value), name === 'ingreso' ? 'Ingreso' : name === 'costo' ? 'Costo' : 'Margen']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="ingreso" fill="hsl(var(--chart-2))" name="Ingreso" radius={[0, 4, 4, 0]} />
              <Bar dataKey="costo" fill="hsl(var(--chart-1))" name="Costo" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Rentabilidad por Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Uds. Vendidas</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('ingresoTotal')}>
                    <span className="inline-flex items-center gap-1">Ingreso <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('margen')}>
                    <span className="inline-flex items-center gap-1">Margen <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('margenPct')}>
                    <span className="inline-flex items-center gap-1">Margen % <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell className="font-medium">{row.nombre}</TableCell>
                    <TableCell className="text-right">{row.unidadesVendidas}</TableCell>
                    <TableCell className="text-right text-green-500">{fmtQ(row.ingresoTotal)}</TableCell>
                    <TableCell className="text-right text-red-400">{fmtQ(row.costoTotal)}</TableCell>
                    <TableCell className={`text-right font-semibold ${row.margen >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {fmtQ(row.margen)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.margenPct >= 20 ? 'default' : row.margenPct >= 10 ? 'secondary' : 'destructive'}>
                        {row.margenPct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay datos de ventas para el período seleccionado
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
