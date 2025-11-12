"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, PackageMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { salidasService, productosService } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DetalleTemp {
  productoId: number
  productoNombre: string
  productoStock: number
  cantidad: number
  lote?: string
}

export function ExitDialogNew() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [detalles, setDetalles] = useState<DetalleTemp[]>([])

  // Campos de salida
  const [numeroSalida, setNumeroSalida] = useState('')
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split('T')[0])
  const [motivo, setMotivo] = useState('')
  const [destino, setDestino] = useState('')
  const [referencia, setReferencia] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Detalle temporal
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [lote, setLote] = useState('')

  useEffect(() => {
    if (open) {
      cargarDatos()
      generarNumeroSalida()
    }
  }, [open])

  const cargarDatos = async () => {
    try {
      const prods = await productosService.getAll()
      // Solo productos con stock disponible
      setProductos(prods.filter(p => p.stock_actual > 0))
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const generarNumeroSalida = () => {
    // Generar número único con timestamp más preciso y random
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setNumeroSalida(`SAL-${timestamp}-${random}`)
  }

  const agregarDetalle = () => {
    if (!selectedProducto || !cantidad) {
      toast.error('Faltan datos', { description: 'Completa producto y cantidad' })
      return
    }

    const producto = productos.find(p => p.id === Number(selectedProducto))
    if (!producto) return

    const cantidadNum = Number(cantidad)
    if (cantidadNum > producto.stock_actual) {
      toast.error('Stock insuficiente', { 
        description: `Solo hay ${producto.stock_actual} unidades disponibles` 
      })
      return
    }

    const nuevoDetalle: DetalleTemp = {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoStock: producto.stock_actual,
      cantidad: cantidadNum,
      lote: lote || undefined
    }

    setDetalles(prev => [...prev, nuevoDetalle])
    // Limpiar campos
    setSelectedProducto('')
    setCantidad('')
    setLote('')
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!numeroSalida || !fechaSalida || !motivo) {
      toast.error('Faltan datos', { description: 'Completa número, fecha y motivo' })
      return
    }

    if (detalles.length === 0) {
      toast.error('Sin productos', { description: 'Agrega al menos un producto' })
      return
    }

    setSaving(true)
    try {
      // Limpiar undefined para evitar enviarlos al backend
      const payload: any = {
        NumeroSalida: numeroSalida,
        FechaSalida: fechaSalida,
        Motivo: motivo,
        Estado: 'completada',
        CreadoPor: user?.id || 1,
        Detalles: detalles.map(d => {
          const detalle: any = {
            ProductoId: d.productoId,
            Cantidad: d.cantidad
          }
          // Solo agregar Lote si existe
          if (d.lote && d.lote.trim()) {
            detalle.Lote = d.lote
          }
          return detalle
        })
      }

      // Solo agregar campos opcionales si tienen valor
      if (destino && destino.trim()) payload.Destino = destino
      if (referencia && referencia.trim()) payload.Referencia = referencia
      if (observaciones && observaciones.trim()) payload.Observaciones = observaciones

      console.log('=== PAYLOAD SALIDA ===', JSON.stringify(payload, null, 2))
      await salidasService.create(payload)
      toast.success('Salida registrada', { 
        description: `${detalles.length} producto(s) retirados del inventario` 
      })
      
      setOpen(false)
      resetForm()
      window.dispatchEvent(new CustomEvent('salidas:created'))
    } catch (err: any) {
      console.error('Error al registrar salida:', err)
      toast.error('Error', { description: err?.message || 'No se pudo registrar la salida' })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setDetalles([])
    setNumeroSalida('')
    setFechaSalida(new Date().toISOString().split('T')[0])
    setMotivo('')
    setDestino('')
    setReferencia('')
    setObservaciones('')
    setSelectedProducto('')
    setCantidad('')
    setLote('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg">
          <PackageMinus className="mr-2 h-4 w-4" />
          Nueva Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Salida de Productos</DialogTitle>
          <DialogDescription>
            Registra productos que salen del inventario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número de Salida</Label>
              <Input value={numeroSalida} onChange={(e) => setNumeroSalida(e.target.value)} required />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} required />
            </div>
            <div>
              <Label>Motivo *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venta">Venta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Merma">Merma</SelectItem>
                  <SelectItem value="Donación">Donación</SelectItem>
                  <SelectItem value="Devolución">Devolución</SelectItem>
                  <SelectItem value="Uso interno">Uso interno</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destino (Opcional)</Label>
              <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ej: Cliente, Sucursal..." />
            </div>
            <div>
              <Label>Referencia (Opcional)</Label>
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: Factura, Orden..." />
            </div>
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} />
          </div>

          {/* Agregar Detalle */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-3">Agregar Producto</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Label>Producto</Label>
                <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} (Stock: {p.stock_actual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} min="1" />
              </div>
              <div>
                <Label>Lote (Opcional)</Label>
                <Input value={lote} onChange={(e) => setLote(e.target.value)} />
              </div>
            </div>
            <Button onClick={agregarDetalle} size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Lista de Detalles */}
          {detalles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Productos a Retirar ({detalles.length})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Cantidad a Retirar</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.map((det, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{det.productoNombre}</TableCell>
                      <TableCell className="text-right">{det.productoStock}</TableCell>
                      <TableCell className="text-right font-semibold">{det.cantidad}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{det.lote || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => eliminarDetalle(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || detalles.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Salida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
