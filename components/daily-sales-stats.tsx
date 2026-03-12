"use client"

import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { salidasService } from "@/lib/api"
import { Loader2, TrendingUp, ShoppingCart, Store, Package } from "lucide-react"

interface DailyStats {
  // General
  ventaPromedioDiariaGeneral: number
  unidadesPromedioDiarioGeneral: number
  totalVentasPeriodo: number
  totalUnidadesPeriodo: number
  diasConVentas: number
  diasTotales: number
  // Por hotel
  porHotel: {
    hotel: string
    ventaPromedioDiaria: number
    unidadesPromedioDiario: number
    totalVentas: number
    totalUnidades: number
    diasConVentas: number
  }[]
  // Producto más vendido general
  productoTopGeneral: { nombre: string; unidadesDiarias: number; totalUnidades: number } | null
  // Producto más vendido por hotel
  productoTopPorHotel: {
    hotel: string
    producto: string
    unidadesDiarias: number
    totalUnidades: number
  }[]
}

export function DailySalesStats({ dateRange }: { dateRange?: DateRange }) {
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      const salidas = await salidasService.getAll(1, 100000)

      // Filtrar solo ventas reales
      let ventas = salidas.filter(s => s.motivo === "Venta" || s.motivo === "Cortesía")

      // Aplicar filtro de fechas
      if (dateRange?.from) {
        const fromStr = dateRange.from.toLocaleDateString("en-CA")
        ventas = ventas.filter(s => s.fechaSalida.split("T")[0] >= fromStr)
      }
      if (dateRange?.to) {
        const toStr = dateRange.to.toLocaleDateString("en-CA")
        ventas = ventas.filter(s => s.fechaSalida.split("T")[0] <= toStr)
      }

      // Calcular rango de días
      if (ventas.length === 0) {
        setStats({
          ventaPromedioDiariaGeneral: 0,
          unidadesPromedioDiarioGeneral: 0,
          totalVentasPeriodo: 0,
          totalUnidadesPeriodo: 0,
          diasConVentas: 0,
          diasTotales: 0,
          porHotel: [],
          productoTopGeneral: null,
          productoTopPorHotel: [],
        })
        return
      }

      const fechas = ventas.map(v => v.fechaSalida.split("T")[0])
      const fechaUnicas = new Set(fechas)
      const diasConVentas = fechaUnicas.size

      // Días totales del período
      const sortedFechas = [...fechaUnicas].sort()
      const primerDia = new Date(sortedFechas[0])
      const ultimoDia = new Date(sortedFechas[sortedFechas.length - 1])
      const diasTotales = Math.max(1, Math.ceil((ultimoDia.getTime() - primerDia.getTime()) / (1000 * 60 * 60 * 24)) + 1)

      // Totales generales
      let totalVentas = 0
      let totalUnidades = 0
      const productoMap = new Map<string, number>()
      const hotelMap = new Map<string, { ventas: number; unidades: number; fechas: Set<string>; productos: Map<string, number> }>()

      ventas.forEach(venta => {
        const hotel = venta.destino || "Sin Sede"
        const fecha = venta.fechaSalida.split("T")[0]
        const detalles = venta.detalles || venta.detalleSalida || []

        // Total en quetzales
        let ventaTotal = 0
        if (venta.total) {
          ventaTotal = Number(venta.total)
        } else {
          ventaTotal = detalles.reduce((acc, d) => acc + ((d.subtotal) || (d.cantidad * (d.precioUnitario || 0))), 0)
        }
        totalVentas += ventaTotal

        // Total unidades
        let unidadesVenta = 0
        detalles.forEach(d => {
          const cant = d.cantidad || 0
          unidadesVenta += cant

          // Nombre del producto
          const nombreProducto = typeof d.producto === "string"
            ? d.producto
            : (d.producto?.nombre || "Desconocido")

          // Acumular global
          productoMap.set(nombreProducto, (productoMap.get(nombreProducto) || 0) + cant)

          // Acumular por hotel
          if (!hotelMap.has(hotel)) {
            hotelMap.set(hotel, { ventas: 0, unidades: 0, fechas: new Set(), productos: new Map() })
          }
          const hData = hotelMap.get(hotel)!
          hData.productos.set(nombreProducto, (hData.productos.get(nombreProducto) || 0) + cant)
        })

        totalUnidades += unidadesVenta

        // Acumular por hotel
        if (!hotelMap.has(hotel)) {
          hotelMap.set(hotel, { ventas: 0, unidades: 0, fechas: new Set(), productos: new Map() })
        }
        const hData = hotelMap.get(hotel)!
        hData.ventas += ventaTotal
        hData.unidades += unidadesVenta
        hData.fechas.add(fecha)
      })

      // Promedios generales (usamos diasTotales para promedio real por día calendario)
      const ventaPromedioDiariaGeneral = totalVentas / diasTotales
      const unidadesPromedioDiarioGeneral = totalUnidades / diasTotales

      // Por hotel
      const porHotel = Array.from(hotelMap.entries())
        .map(([hotel, data]) => {
          const diasHotel = Math.max(1, diasTotales) // usamos mismos días para comparar equitativamente
          return {
            hotel,
            ventaPromedioDiaria: data.ventas / diasHotel,
            unidadesPromedioDiario: data.unidades / diasHotel,
            totalVentas: data.ventas,
            totalUnidades: data.unidades,
            diasConVentas: data.fechas.size,
          }
        })
        .sort((a, b) => b.ventaPromedioDiaria - a.ventaPromedioDiaria)

      // Producto más vendido general
      let productoTopGeneral: DailyStats["productoTopGeneral"] = null
      if (productoMap.size > 0) {
        const [nombre, totalUni] = [...productoMap.entries()].sort((a, b) => b[1] - a[1])[0]
        productoTopGeneral = {
          nombre,
          unidadesDiarias: totalUni / diasTotales,
          totalUnidades: totalUni,
        }
      }

      // Producto top por hotel
      const productoTopPorHotel = Array.from(hotelMap.entries())
        .map(([hotel, data]) => {
          if (data.productos.size === 0) return null
          const [producto, totalUni] = [...data.productos.entries()].sort((a, b) => b[1] - a[1])[0]
          return {
            hotel,
            producto,
            unidadesDiarias: totalUni / diasTotales,
            totalUnidades: totalUni,
          }
        })
        .filter(Boolean) as DailyStats["productoTopPorHotel"]

      setStats({
        ventaPromedioDiariaGeneral,
        unidadesPromedioDiarioGeneral,
        totalVentasPeriodo: totalVentas,
        totalUnidadesPeriodo: totalUnidades,
        diasConVentas,
        diasTotales,
        porHotel,
        productoTopGeneral,
        productoTopPorHotel,
      })
    } catch (err) {
      console.error("Error loading daily sales stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      maximumFractionDigits: 2,
    }).format(value)

  const formatNumber = (value: number) => value.toFixed(1)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estadísticas de Ventas Diarias
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Promedio diario basado en {stats.diasTotales} día{stats.diasTotales !== 1 ? "s" : ""} del período
          {stats.diasConVentas > 0 && ` (${stats.diasConVentas} con ventas)`}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="por-hotel">Por Hotel</TabsTrigger>
            <TabsTrigger value="productos">Productos Top</TabsTrigger>
          </TabsList>

          {/* ============ TAB GENERAL ============ */}
          <TabsContent value="general">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-muted/30 border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Venta Promedio Diaria</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.ventaPromedioDiariaGeneral)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Unidades Vendidas / Día</p>
                      <p className="text-xl font-bold">{formatNumber(stats.unidadesPromedioDiarioGeneral)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Ventas (Período)</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.totalVentasPeriodo)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-muted">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Unidades (Período)</p>
                      <p className="text-xl font-bold">{stats.totalUnidadesPeriodo.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats.productoTopGeneral && (
              <div className="mt-4 p-4 rounded-lg border bg-muted/20">
                <p className="text-sm font-medium text-muted-foreground mb-1">Producto más vendido (general)</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">{stats.productoTopGeneral.nombre}</p>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatNumber(stats.productoTopGeneral.unidadesDiarias)} uds/día</p>
                    <p className="text-xs text-muted-foreground">{stats.productoTopGeneral.totalUnidades.toLocaleString()} total</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ TAB POR HOTEL ============ */}
          <TabsContent value="por-hotel">
            {stats.porHotel.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No hay datos de ventas por hotel
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel / Sede</TableHead>
                      <TableHead className="text-right">Venta Diaria Prom.</TableHead>
                      <TableHead className="text-right">Uds. Diarias Prom.</TableHead>
                      <TableHead className="text-right">Total Ventas</TableHead>
                      <TableHead className="text-right">Total Uds.</TableHead>
                      <TableHead className="text-center">Días Activos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.porHotel.map((h) => (
                      <TableRow key={h.hotel}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {h.hotel}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(h.ventaPromedioDiaria)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(h.unidadesPromedioDiario)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(h.totalVentas)}
                        </TableCell>
                        <TableCell className="text-right">
                          {h.totalUnidades.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{h.diasConVentas}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ============ TAB PRODUCTOS TOP ============ */}
          <TabsContent value="productos">
            {stats.productoTopPorHotel.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No hay datos de productos vendidos
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel / Sede</TableHead>
                      <TableHead>Producto Más Vendido</TableHead>
                      <TableHead className="text-right">Uds. Diarias Prom.</TableHead>
                      <TableHead className="text-right">Total Unidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.productoTopPorHotel.map((item) => (
                      <TableRow key={item.hotel}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {item.hotel}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.producto}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatNumber(item.unidadesDiarias)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.totalUnidades.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
