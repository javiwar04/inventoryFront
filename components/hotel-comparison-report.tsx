"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { Loader2, Building2, ArrowUpDown } from "lucide-react"
import { salidasService, entradasService, proveedoresService, productosService } from "@/lib/api"
import type { DateRange } from "react-day-picker"

interface HotelStats {
  id: number
  nombre: string
  totalSalidas: number
  unidadesDespachadas: number
  costoTotal: number
  totalEntradas: number
  unidadesRecibidas: number
}

interface Props {
  dateRange?: DateRange
}

export function HotelComparisonReport({ dateRange }: Props) {
  const [data, setData] = useState<HotelStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'costoTotal' | 'unidadesDespachadas'>('costoTotal')

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proveedores, salidasAll, entradasAll, productos] = await Promise.all([
        proveedoresService.getAll(),
        salidasService.getAll(1, 10000),
        entradasService.getAll(1, 10000),
        productosService.getAll()
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

      // Mapear productos por ID para acceder al costo
      const prodMap = new Map(productos.map(p => [p.id, p]))

      const hotelStats: HotelStats[] = proveedores
        .filter(p => p.estado === 'Activo')
        .map(hotel => {
          // Salidas con destino a este hotel
          const salidaHotel = salidas.filter(s => {
            const destino = (s.destino || '').toLowerCase()
            return destino.includes(hotel.nombre.toLowerCase())
          })

          const unidadesDespachadas = salidaHotel.reduce((sum, s) => {
            const detalles = s.detalles || s.detalleSalida || []
            return sum + detalles.reduce((dSum, d) => dSum + d.cantidad, 0)
          }, 0)

          const costoTotal = salidaHotel.reduce((sum, s) => {
            const detalles = s.detalles || s.detalleSalida || []
            return sum + detalles.reduce((dSum, d) => {
              const prod = prodMap.get(d.productoId)
              return dSum + (d.subtotal || d.cantidad * (d.precioUnitario || prod?.costo || 0))
            }, 0)
          }, 0)

          // Entradas del proveedor/hotel
          const entradasHotel = entradas.filter(e => {
            const proveedor = typeof e.proveedor === 'string' 
              ? e.proveedor 
              : e.proveedor?.nombre || ''
            return proveedor.toLowerCase().includes(hotel.nombre.toLowerCase()) || 
                   e.proveedorId === hotel.id
          })

          const unidadesRecibidas = entradasHotel.reduce((sum, e) => {
            const detalles = e.detalles || e.detalleEntrada || []
            return sum + detalles.reduce((dSum, d) => dSum + d.cantidad, 0)
          }, 0)

          return {
            id: hotel.id,
            nombre: hotel.nombre,
            totalSalidas: salidaHotel.length,
            unidadesDespachadas,
            costoTotal,
            totalEntradas: entradasHotel.length,
            unidadesRecibidas
          }
        })
        .sort((a, b) => b.costoTotal - a.costoTotal)

      setData(hotelStats)
    } catch (err) {
      console.error('Error cargando comparativo hoteles:', err)
    } finally {
      setLoading(false)
    }
  }

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const chartData = data.filter(d => d.costoTotal > 0 || d.unidadesDespachadas > 0).map(d => ({
    nombre: d.nombre.length > 20 ? d.nombre.slice(0, 20) + '…' : d.nombre,
    despachos: d.unidadesDespachadas,
    costo: d.costoTotal,
    entradas: d.unidadesRecibidas
  }))

  const totalCosto = data.reduce((s, d) => s + d.costoTotal, 0)
  const totalUnidades = data.reduce((s, d) => s + d.unidadesDespachadas, 0)

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Despachos</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnidades.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unidades despachadas a hoteles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costo Total Despachos</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtQ(totalCosto)}</div>
            <p className="text-xs text-muted-foreground">Inversión en despachos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoteles Activos</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.filter(d => d.totalSalidas > 0).length}</div>
            <p className="text-xs text-muted-foreground">Con movimientos en el período</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Consumo por Hotel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'costo' ? fmtQ(value) : value.toLocaleString(),
                  name === 'despachos' ? 'Unidades Despachadas' : name === 'costo' ? 'Costo' : 'Unidades Recibidas'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="despachos" fill="hsl(var(--chart-1))" name="Despachos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="entradas" fill="hsl(var(--chart-2))" name="Recepciones" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ranking de Hoteles por Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead className="text-right">Salidas</TableHead>
                  <TableHead className="text-right">Uds. Despachadas</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Uds. Recibidas</TableHead>
                  <TableHead className="text-right">% del Total</TableHead>
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
                    <TableCell className="text-right">{row.totalSalidas}</TableCell>
                    <TableCell className="text-right font-semibold">{row.unidadesDespachadas.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{fmtQ(row.costoTotal)}</TableCell>
                    <TableCell className="text-right">{row.totalEntradas}</TableCell>
                    <TableCell className="text-right">{row.unidadesRecibidas.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {totalCosto > 0 ? ((row.costoTotal / totalCosto) * 100).toFixed(1) : '0.0'}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay datos comparativos disponibles
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
