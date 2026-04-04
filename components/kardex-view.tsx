"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, BookOpen, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Search } from "lucide-react"
import { productosService, entradasService, salidasService } from "@/lib/api"
import type { Producto } from "@/lib/api"

interface KardexEntry {
  fecha: string
  tipo: 'entrada' | 'salida' | 'transferencia'
  documento: string
  descripcion: string
  entrada: number
  salida: number
  saldo: number
  costoUnitario: number
  valorTotal: number
}

export function KardexView() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [entries, setEntries] = useState<KardexEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadProductos()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      loadKardex(Number(selectedProductId))
    }
  }, [selectedProductId])

  const loadProductos = async () => {
    try {
      const prods = await productosService.getAll()
      setProductos(prods)
    } catch (err) {
      console.error('Error cargando productos:', err)
    } finally {
      setInitialLoading(false)
    }
  }

  const loadKardex = async (productoId: number) => {
    try {
      setLoading(true)
      const [entradasAll, salidasAll] = await Promise.all([
        entradasService.getAll(1, 10000),
        salidasService.getAll(1, 10000)
      ])

      const producto = productos.find(p => p.id === productoId)
      const costo = producto?.costo || 0

      const movimientos: KardexEntry[] = []

      // Procesar entradas
      for (const e of entradasAll) {
        const detalles = e.detalles || e.detalleEntrada || []
        const detProd = detalles.find(d => d.productoId === productoId)
        if (detProd) {
          movimientos.push({
            fecha: e.fechaEntrada,
            tipo: 'entrada',
            documento: e.numeroEntrada,
            descripcion: `Entrada de ${typeof e.proveedor === 'string' ? e.proveedor : e.proveedor?.nombre || 'Proveedor'}`,
            entrada: detProd.cantidad,
            salida: 0,
            saldo: 0, // Se calcula después
            costoUnitario: detProd.precioUnitario || costo,
            valorTotal: 0
          })
        }
      }

      // Procesar salidas
      for (const s of salidasAll) {
        const detalles = s.detalles || s.detalleSalida || []
        const detProd = detalles.find(d => d.productoId === productoId)
        if (detProd) {
          movimientos.push({
            fecha: s.fechaSalida,
            tipo: 'salida',
            documento: s.numeroSalida,
            descripcion: `${s.motivo} — ${s.destino || 'Sin destino'}`,
            entrada: 0,
            salida: detProd.cantidad,
            saldo: 0,
            costoUnitario: detProd.precioUnitario || costo,
            valorTotal: 0
          })
        }
      }

      // Ordenar por fecha
      movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

      // Calcular saldos acumulados
      let saldo = 0
      for (const mov of movimientos) {
        saldo += mov.entrada - mov.salida
        mov.saldo = saldo
        mov.valorTotal = saldo * mov.costoUnitario
      }

      setEntries(movimientos)
    } catch (err) {
      console.error('Error cargando kardex:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = useMemo(() => {
    if (!searchTerm) return productos.slice(0, 50)
    const term = searchTerm.toLowerCase()
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term)
    ).slice(0, 50)
  }, [productos, searchTerm])

  const selectedProduct = productos.find(p => p.id === Number(selectedProductId))
  const totalEntradas = entries.reduce((s, e) => s + e.entrada, 0)
  const totalSalidas = entries.reduce((s, e) => s + e.salida, 0)
  const saldoFinal = entries.length > 0 ? entries[entries.length - 1].saldo : 0

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Selector de producto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kardex de Producto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Buscar producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Seleccionar producto</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={initialLoading ? "Cargando..." : "Seleccionar producto"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredProductos.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.sku} — {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info del producto seleccionado */}
      {selectedProduct && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Producto</div>
              <div className="font-semibold truncate">{selectedProduct.nombre}</div>
              <div className="text-xs text-muted-foreground font-mono">{selectedProduct.sku}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Total Entradas</div>
              <div className="text-xl font-bold text-green-500 flex items-center gap-1">
                <ArrowDownToLine className="h-4 w-4" />
                {totalEntradas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Total Salidas</div>
              <div className="text-xl font-bold text-red-400 flex items-center gap-1">
                <ArrowUpFromLine className="h-4 w-4" />
                {totalSalidas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Saldo Final</div>
              <div className="text-xl font-bold">{saldoFinal}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Stock Actual (Sistema)</div>
              <div className={`text-xl font-bold ${selectedProduct.stock_actual !== saldoFinal ? 'text-yellow-500' : 'text-green-500'}`}>
                {selectedProduct.stock_actual}
                {selectedProduct.stock_actual !== saldoFinal && (
                  <span className="text-xs ml-1 text-yellow-500">(Diferencia: {selectedProduct.stock_actual - saldoFinal})</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla Kardex */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : selectedProductId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimientos del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right text-green-500">Entrada (+)</TableHead>
                    <TableHead className="text-right text-red-400">Salida (-)</TableHead>
                    <TableHead className="text-right font-semibold">Saldo</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs">
                        {new Date(entry.fecha).toLocaleDateString('es-GT')}
                      </TableCell>
                      <TableCell>
                        {entry.tipo === 'entrada' ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <ArrowDownToLine className="h-3 w-3 mr-1" />
                            Entrada
                          </Badge>
                        ) : entry.tipo === 'salida' ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <ArrowUpFromLine className="h-3 w-3 mr-1" />
                            Salida
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                            Transfer.
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.documento}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{entry.descripcion}</TableCell>
                      <TableCell className="text-right text-green-500 font-semibold">
                        {entry.entrada > 0 ? `+${entry.entrada}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-red-400 font-semibold">
                        {entry.salida > 0 ? `-${entry.salida}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-bold">{entry.saldo}</TableCell>
                      <TableCell className="text-right text-xs">{fmtQ(entry.costoUnitario)}</TableCell>
                      <TableCell className="text-right text-xs">{fmtQ(entry.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                  {entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados para este producto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecciona un producto para ver su Kardex</p>
            <p className="text-sm">Elige un producto del selector de arriba para ver todos sus movimientos</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
