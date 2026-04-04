"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Loader2, History, TrendingUp, TrendingDown } from "lucide-react"
import { entradasService, productosService } from "@/lib/api"
import type { Producto } from "@/lib/api"

interface PriceHistoryEntry {
  fecha: string
  precioUnitario: number
  cantidad: number
  documento: string
  proveedor: string
}

interface Props {
  productoId?: number
}

export function PriceHistoryView({ productoId }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedId, setSelectedId] = useState<number | undefined>(productoId)
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProductos()
  }, [])

  useEffect(() => {
    if (selectedId) loadHistory(selectedId)
  }, [selectedId])

  const loadProductos = async () => {
    try {
      const prods = await productosService.getAll()
      setProductos(prods)
      if (productoId) setSelectedId(productoId)
    } catch (err) {
      console.error('Error cargando productos:', err)
    }
  }

  const loadHistory = async (prodId: number) => {
    try {
      setLoading(true)
      const entradas = await entradasService.getAll(1, 10000)

      const entries: PriceHistoryEntry[] = []
      for (const e of entradas) {
        const detalles = e.detalles || e.detalleEntrada || []
        const det = detalles.find(d => d.productoId === prodId)
        if (det && det.precioUnitario > 0) {
          entries.push({
            fecha: e.fechaEntrada,
            precioUnitario: det.precioUnitario,
            cantidad: det.cantidad,
            documento: e.numeroEntrada,
            proveedor: typeof e.proveedor === 'string' ? e.proveedor : e.proveedor?.nombre || 'Sin proveedor'
          })
        }
      }

      entries.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      setHistory(entries)
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = productos.find(p => p.id === selectedId)
  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const precioActual = history.length > 0 ? history[history.length - 1].precioUnitario : 0
  const precioInicial = history.length > 0 ? history[0].precioUnitario : 0
  const variacion = precioInicial > 0 ? ((precioActual - precioInicial) / precioInicial) * 100 : 0
  const precioMin = history.length > 0 ? Math.min(...history.map(h => h.precioUnitario)) : 0
  const precioMax = history.length > 0 ? Math.max(...history.map(h => h.precioUnitario)) : 0

  const chartData = history.map(h => ({
    fecha: new Date(h.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' }),
    precio: h.precioUnitario
  }))

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Precios de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedId || ''}
            onChange={e => setSelectedId(Number(e.target.value) || undefined)}
            className="w-full md:w-1/2 border rounded-md p-2 bg-background text-sm"
          >
            <option value="">Seleccionar producto...</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : selectedId && history.length > 0 ? (
        <>
          {/* KPIs de precio */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Precio Actual</div>
                <div className="text-xl font-bold">{fmtQ(precioActual)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Variación</div>
                <div className={`text-xl font-bold flex items-center gap-1 ${variacion >= 0 ? 'text-red-400' : 'text-green-500'}`}>
                  {variacion >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {variacion >= 0 ? '+' : ''}{variacion.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Precio Mínimo</div>
                <div className="text-xl font-bold text-green-500">{fmtQ(precioMin)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Precio Máximo</div>
                <div className="text-xl font-bold text-red-400">{fmtQ(precioMax)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de línea */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolución del Precio de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `Q${v}`} />
                  <Tooltip 
                    formatter={(value: number) => [fmtQ(value), 'Precio']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line type="monotone" dataKey="precio" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabla de historial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Cambio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry, idx) => {
                      const prevPrice = idx > 0 ? history[idx - 1].precioUnitario : entry.precioUnitario
                      const change = prevPrice > 0 ? ((entry.precioUnitario - prevPrice) / prevPrice) * 100 : 0
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{new Date(entry.fecha).toLocaleDateString('es-GT')}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.documento}</TableCell>
                          <TableCell>{entry.proveedor}</TableCell>
                          <TableCell className="text-right">{entry.cantidad}</TableCell>
                          <TableCell className="text-right font-semibold">{fmtQ(entry.precioUnitario)}</TableCell>
                          <TableCell className="text-right">
                            {idx === 0 ? (
                              <Badge variant="outline">Inicial</Badge>
                            ) : change === 0 ? (
                              <Badge variant="secondary">Sin cambio</Badge>
                            ) : (
                              <Badge variant={change > 0 ? 'destructive' : 'default'}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : selectedId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No hay historial de compras para este producto</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
