"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Pie, PieChart, Cell } from "recharts"
import { Loader2, Truck, DollarSign, TrendingUp, Star } from "lucide-react"
import { proveedoresService, entradasService, productosService } from "@/lib/api"
import type { DateRange } from "react-day-picker"

interface SupplierStats {
  id: number
  nombre: string
  totalCompras: number
  unidadesCompradas: number
  gastoTotal: number
  productosDistintos: number
  costoPromedio: number
  entradasCount: number
}

interface Props {
  dateRange?: DateRange
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
]

export function SupplierAnalyticsReport({ dateRange }: Props) {
  const [data, setData] = useState<SupplierStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proveedores, entradasAll, productos] = await Promise.all([
        proveedoresService.getAll(),
        entradasService.getAll(1, 10000),
        productosService.getAll()
      ])

      const entradas = dateRange?.from && dateRange?.to
        ? entradasAll.filter(e => {
            const f = new Date(e.fechaEntrada)
            return f >= dateRange.from! && f <= dateRange.to!
          })
        : entradasAll

      const stats: SupplierStats[] = proveedores.map(prov => {
        const entradasProv = entradas.filter(e => 
          e.proveedorId === prov.id ||
          (typeof e.proveedor === 'string' && e.proveedor.toLowerCase() === prov.nombre.toLowerCase()) ||
          (typeof e.proveedor === 'object' && e.proveedor?.nombre?.toLowerCase() === prov.nombre.toLowerCase())
        )

        let unidadesCompradas = 0
        let gastoTotal = 0
        const productosSet = new Set<number>()

        for (const ent of entradasProv) {
          const detalles = ent.detalles || ent.detalleEntrada || []
          for (const d of detalles) {
            unidadesCompradas += d.cantidad
            gastoTotal += d.subtotal || (d.cantidad * d.precioUnitario)
            productosSet.add(d.productoId)
          }
        }

        return {
          id: prov.id,
          nombre: prov.nombre,
          totalCompras: entradasProv.length,
          unidadesCompradas,
          gastoTotal,
          productosDistintos: productosSet.size,
          costoPromedio: unidadesCompradas > 0 ? gastoTotal / unidadesCompradas : 0,
          entradasCount: entradasProv.length
        }
      }).sort((a, b) => b.gastoTotal - a.gastoTotal)

      setData(stats)
    } catch (err) {
      console.error('Error cargando analítica de proveedores:', err)
    } finally {
      setLoading(false)
    }
  }

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const totalGasto = data.reduce((s, d) => s + d.gastoTotal, 0)
  const totalUnidades = data.reduce((s, d) => s + d.unidadesCompradas, 0)
  const topProveedor = data[0]

  const pieData = data.filter(d => d.gastoTotal > 0).slice(0, 8).map(d => ({
    name: d.nombre.length > 18 ? d.nombre.slice(0, 18) + '…' : d.nombre,
    value: d.gastoTotal
  }))

  const barData = data.filter(d => d.unidadesCompradas > 0).slice(0, 10).map(d => ({
    nombre: d.nombre.length > 15 ? d.nombre.slice(0, 15) + '…' : d.nombre,
    unidades: d.unidadesCompradas,
    gasto: d.gastoTotal
  }))

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Gasto Total Proveedores</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtQ(totalGasto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Compradas</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnidades.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proveedores Activos</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.filter(d => d.totalCompras > 0).length}</div>
            <p className="text-xs text-muted-foreground">De {data.length} registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Proveedor</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{topProveedor?.nombre || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {topProveedor ? fmtQ(topProveedor.gastoTotal) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie chart de distribución de gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => fmtQ(value)} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart de volumen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volumen por Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'gasto' ? fmtQ(value) : value.toLocaleString(),
                    name === 'unidades' ? 'Unidades' : 'Gasto'
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="unidades" fill="hsl(var(--chart-1))" name="Unidades" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Analítica Detallada por Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Gasto Total</TableHead>
                  <TableHead className="text-right">Costo Promedio/Ud</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">% del Gasto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant={idx < 3 ? 'default' : 'outline'} className="w-7 justify-center">
                        {idx + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.nombre}</TableCell>
                    <TableCell className="text-right">{row.entradasCount}</TableCell>
                    <TableCell className="text-right">{row.unidadesCompradas.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtQ(row.gastoTotal)}</TableCell>
                    <TableCell className="text-right">{fmtQ(row.costoPromedio)}</TableCell>
                    <TableCell className="text-right">{row.productosDistintos}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {totalGasto > 0 ? ((row.gastoTotal / totalGasto) * 100).toFixed(1) : '0.0'}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
