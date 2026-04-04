"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Package, Layers, TrendingUp } from "lucide-react"
import { productosService, categoriasService } from "@/lib/api"

interface ValorizedItem {
  id: number
  sku: string
  nombre: string
  categoria: string
  categoriaId: number
  stockActual: number
  costo: number
  precio: number
  valorCosto: number
  valorVenta: number
  margenPotencial: number
}

interface CategoriaResumen {
  nombre: string
  totalCosto: number
  totalVenta: number
  productos: number
  unidades: number
}

export function ValorizedInventory() {
  const [data, setData] = useState<ValorizedItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productos, cats] = await Promise.all([
        productosService.getAll(),
        categoriasService.getAll()
      ])

      const items: ValorizedItem[] = productos
        .filter(p => p.activo && p.stock_actual > 0)
        .map(p => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: typeof p.categoria === 'object' && p.categoria ? p.categoria.nombre : 'Sin categoría',
          categoriaId: p.categoria_id,
          stockActual: p.stock_actual,
          costo: p.costo || 0,
          precio: p.precio || 0,
          valorCosto: p.stock_actual * (p.costo || 0),
          valorVenta: p.stock_actual * (p.precio || 0),
          margenPotencial: p.stock_actual * ((p.precio || 0) - (p.costo || 0))
        }))
        .sort((a, b) => b.valorCosto - a.valorCosto)

      // Agrupar por categoría
      const catMap = new Map<string, CategoriaResumen>()
      for (const item of items) {
        const existing = catMap.get(item.categoria)
        if (existing) {
          existing.totalCosto += item.valorCosto
          existing.totalVenta += item.valorVenta
          existing.productos += 1
          existing.unidades += item.stockActual
        } else {
          catMap.set(item.categoria, {
            nombre: item.categoria,
            totalCosto: item.valorCosto,
            totalVenta: item.valorVenta,
            productos: 1,
            unidades: item.stockActual
          })
        }
      }

      setCategorias(
        Array.from(catMap.values()).sort((a, b) => b.totalCosto - a.totalCosto)
      )
      setData(items)
    } catch (err) {
      console.error('Error cargando inventario valorizado:', err)
    } finally {
      setLoading(false)
    }
  }

  const fmtQ = (v: number) => `Q${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const totalCosto = data.reduce((s, d) => s + d.valorCosto, 0)
  const totalVenta = data.reduce((s, d) => s + d.valorVenta, 0)
  const totalMargen = totalVenta - totalCosto
  const totalUnidades = data.reduce((s, d) => s + d.stockActual, 0)

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor al Costo</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtQ(totalCosto)}</div>
            <p className="text-xs text-muted-foreground">Stock actual × costo unitario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor a Precio</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{fmtQ(totalVenta)}</div>
            <p className="text-xs text-muted-foreground">Stock actual × precio de venta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margen Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalMargen >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {fmtQ(totalMargen)}
            </div>
            <p className="text-xs text-muted-foreground">Si se vende todo el stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Unidades</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnidades.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{data.length} productos distintos</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Inventario Valorizado por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Valor al Costo</TableHead>
                  <TableHead className="text-right">Valor a Precio</TableHead>
                  <TableHead className="text-right">Margen Potencial</TableHead>
                  <TableHead className="text-right">% del Inventario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map(cat => (
                  <>
                    <TableRow 
                      key={cat.nombre} 
                      className="cursor-pointer hover:bg-accent/30 font-semibold"
                      onClick={() => setExpandedCat(expandedCat === cat.nombre ? null : cat.nombre)}
                    >
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className={`transition-transform ${expandedCat === cat.nombre ? 'rotate-90' : ''}`}>▸</span>
                          {cat.nombre}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{cat.productos}</TableCell>
                      <TableCell className="text-right">{cat.unidades.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{fmtQ(cat.totalCosto)}</TableCell>
                      <TableCell className="text-right text-green-500">{fmtQ(cat.totalVenta)}</TableCell>
                      <TableCell className="text-right">{fmtQ(cat.totalVenta - cat.totalCosto)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {totalCosto > 0 ? ((cat.totalCosto / totalCosto) * 100).toFixed(1) : '0.0'}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedCat === cat.nombre && data.filter(d => d.categoria === cat.nombre).map(item => (
                      <TableRow key={item.id} className="bg-muted/20">
                        <TableCell className="pl-10 font-mono text-xs">{item.sku} — {item.nombre}</TableCell>
                        <TableCell className="text-right">1</TableCell>
                        <TableCell className="text-right">{item.stockActual}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmtQ(item.valorCosto)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmtQ(item.valorVenta)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmtQ(item.margenPotencial)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          Costo: {fmtQ(item.costo)} | Precio: {fmtQ(item.precio)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
                {/* Totales */}
                <TableRow className="bg-primary/5 font-bold border-t-2">
                  <TableCell>TOTAL GENERAL</TableCell>
                  <TableCell className="text-right">{data.length}</TableCell>
                  <TableCell className="text-right">{totalUnidades.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{fmtQ(totalCosto)}</TableCell>
                  <TableCell className="text-right text-green-500">{fmtQ(totalVenta)}</TableCell>
                  <TableCell className="text-right">{fmtQ(totalMargen)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
