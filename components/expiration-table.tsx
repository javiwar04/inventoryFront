"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

import { productosService, entradasService, VProductoVencimiento } from "@/lib/api"

const expirationDataSeed: VProductoVencimiento[] = []

export function ExpirationTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [data, setData] = useState<VProductoVencimiento[]>(expirationDataSeed)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVencimientos()
  }, [])

  const loadVencimientos = async () => {
    try {
      setLoading(true)
      
      try {
        const entradas = await entradasService.getAll(1, 10000)
        
        // Construir lista de vencimientos desde lotes de entradas
        const vencimientos: VProductoVencimiento[] = []
        
        // Agregar lotes de entradas con fecha de vencimiento
        entradas.forEach(entrada => {
          if (entrada.detalleEntrada) {
            entrada.detalleEntrada.forEach(detalle => {
              if (detalle.fechaVencimiento && detalle.lote) {
                try {
                  const fechaVenc = new Date(detalle.fechaVencimiento)
                  const hoy = new Date()
                  hoy.setHours(0, 0, 0, 0)
                  
                  const diasVenc = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                  
                  let estado = 'ok'
                  if (diasVenc < 0) estado = 'expired'
                  else if (diasVenc <= 30) estado = 'critical'
                  else if (diasVenc <= 90) estado = 'warning'
                  
                  vencimientos.push({
                    id: detalle.id,
                    sku: detalle.producto?.sku || '',
                    nombre: detalle.producto?.nombre || 'Producto desconocido',
                    numeroLote: detalle.lote,
                    fechaVencimiento: detalle.fechaVencimiento,
                    stockLote: detalle.cantidad,
                    diasVencimiento: diasVenc,
                    estadoVencimiento: estado
                  })
                } catch (err) {
                  console.error('Error parseando lote:', err)
                }
              }
            })
          }
        })
        
        // Ordenar por días de vencimiento (más próximos primero)
        vencimientos.sort((a, b) => (a.diasVencimiento ?? 999) - (b.diasVencimiento ?? 999))
        
        setData(vencimientos)
      } catch (apiErr) {
        console.error('Error construyendo vencimientos:', apiErr)
        setData([])
      }
    } catch (err) {
      console.error('Error cargando vencimientos:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter((item) => {
    const product = item.nombre || ''
    const batch = item.numeroLote || ''
    const matchesSearch =
      product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.toLowerCase().includes(searchTerm.toLowerCase())

    const mappedStatus = (item.estadoVencimiento || 'ok').toLowerCase()
    const matchesFilter = filterStatus === "all" || mappedStatus === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string, days: number) => {
    const s = (status || 'ok').toLowerCase()
    if (s === "critical") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Crítico ({days}d)
        </Badge>
      )
    }
    if (s === "warning") {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Próximo ({days}d)
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Normal ({days}d)
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, SKU o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === "critical" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("critical")}
          >
            Críticos
          </Button>
          <Button
            variant={filterStatus === "warning" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("warning")}
          >
            Próximos
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Cargando vencimientos...</div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.nombre}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{item.numeroLote}</TableCell>
                <TableCell className="text-right">{item.stockLote} unidades</TableCell>
                <TableCell>{item.fechaVencimiento ? new Date(item.fechaVencimiento).toLocaleDateString("es-GT") : '-'}</TableCell>
                <TableCell>{getStatusBadge(item.estadoVencimiento, item.diasVencimiento ?? 0)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Ver Detalles</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
