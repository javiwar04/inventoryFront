"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, PackagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { entradasService, productosService, proveedoresService, registrarAuditoria } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DetalleTemp {
  productoId: number
  productoNombre: string
  cantidad: number
  precioUnitario: number
  lote?: string
  fechaVencimiento?: string
}

export function EntryDialogNew() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [detalles, setDetalles] = useState<DetalleTemp[]>([])

  // Campos de entrada
  const [numeroEntrada, setNumeroEntrada] = useState('')
  const [fechaEntrada, setFechaEntrada] = useState(new Date().toISOString().split('T')[0])
  const [proveedorId, setProveedorId] = useState<string>('')
  const [numeroFactura, setNumeroFactura] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Detalle temporal
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [lote, setLote] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  useEffect(() => {
    if (open) {
      cargarDatos()
      generarNumeroEntrada()
    }
  }, [open])

  const cargarDatos = async () => {
    try {
      const [prods, provs] = await Promise.all([
        productosService.getAll(),
        proveedoresService.getAll()
      ])
      setProductos(prods)
      setProveedores(provs.filter(p => p.estado?.toLowerCase() === 'activo'))
    } catch (err) {
      console.error('Error al cargar datos:', err)
    }
  }

  const generarNumeroEntrada = () => {
    // Generar número único con timestamp más preciso y random
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setNumeroEntrada(`ENT-${timestamp}-${random}`)
  }

  const agregarDetalle = () => {
    if (!selectedProducto || !cantidad || !precioUnitario) {
      toast.error('Faltan datos', { description: 'Completa producto, cantidad y precio' })
      return
    }

    const producto = productos.find(p => p.id === Number(selectedProducto))
    if (!producto) return

    const nuevoDetalle: DetalleTemp = {
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: Number(cantidad),
      precioUnitario: Number(precioUnitario),
      lote: lote || undefined,
      fechaVencimiento: fechaVencimiento || undefined
    }

    setDetalles(prev => [...prev, nuevoDetalle])
    // Limpiar campos
    setSelectedProducto('')
    setCantidad('')
    setPrecioUnitario('')
    setLote('')
    setFechaVencimiento('')
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const calcularTotal = () => {
    return detalles.reduce((sum, det) => sum + (det.cantidad * det.precioUnitario), 0)
  }

  const handleSubmit = async () => {
    if (!numeroEntrada || !fechaEntrada) {
      toast.error('Faltan datos', { description: 'Completa número y fecha de entrada' })
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
        NumeroEntrada: numeroEntrada,
        FechaEntrada: fechaEntrada,
        Estado: 'completada',
        CreadoPor: user?.id || 1,
        Detalles: detalles.map(d => {
          const detalle: any = {
            ProductoId: d.productoId,
            Cantidad: d.cantidad,
            PrecioUnitario: d.precioUnitario
          }
          // Solo agregar campos opcionales si tienen valor
          if (d.lote && d.lote.trim()) detalle.Lote = d.lote
          if (d.fechaVencimiento) detalle.FechaVencimiento = d.fechaVencimiento
          return detalle
        })
      }

      // Solo agregar campos opcionales si tienen valor
      if (proveedorId) payload.ProveedorId = Number(proveedorId)
      if (numeroFactura && numeroFactura.trim()) payload.NumeroFactura = numeroFactura
      if (observaciones && observaciones.trim()) payload.Observaciones = observaciones

      console.log('=== PAYLOAD ENTRADA ===', JSON.stringify(payload, null, 2))
      const created = await entradasService.create(payload)
      // Intentar registrar auditoría de la creación
      try {
        await registrarAuditoria({
          accion: 'crear',
          modulo: 'entradas',
          descripcion: `Entrada registrada: ${numeroEntrada}`,
          detalles: JSON.stringify(payload),
          registroId: (created as any)?.id
        })
      } catch (e) {
        console.warn('No se pudo registrar auditoría (entrada crear)', e)
      }
      toast.success('Entrada registrada', { 
        description: `${detalles.length} producto(s) agregados al inventario. Total: Q${calcularTotal().toFixed(2)}` 
      })
      
      setOpen(false)
      resetForm()
      window.dispatchEvent(new CustomEvent('entradas:created'))
    } catch (err: any) {
      console.error('Error al registrar entrada:', err)
      toast.error('Error', { description: err?.message || 'No se pudo registrar la entrada' })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setDetalles([])
    setNumeroEntrada('')
    setFechaEntrada(new Date().toISOString().split('T')[0])
    setProveedorId('')
    setNumeroFactura('')
    setObservaciones('')
    setSelectedProducto('')
    setCantidad('')
    setPrecioUnitario('')
    setLote('')
    setFechaVencimiento('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg">
          <PackagePlus className="mr-2 h-4 w-4" />
          Nueva Entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Productos</DialogTitle>
          <DialogDescription>
            Registra productos que ingresan al inventario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número de Entrada</Label>
              <Input value={numeroEntrada} onChange={(e) => setNumeroEntrada(e.target.value)} required />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} required />
            </div>
            <div>
              <Label>Proveedor (Opcional)</Label>
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de Factura (Opcional)</Label>
              <Input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} />
          </div>

          {/* Agregar Detalle */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-3">Agregar Producto</h3>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2">
                <Label>Producto</Label>
                <Select value={selectedProducto} onValueChange={(value) => {
                  setSelectedProducto(value)
                  // Autocompletar precio unitario con el costo del producto
                  const producto = productos.find(p => p.id === Number(value))
                  if (producto && producto.costo) {
                    setPrecioUnitario(producto.costo.toString())
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} ({p.sku})
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
                <Label>Precio Unit.</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={precioUnitario} 
                    onChange={(e) => setPrecioUnitario(e.target.value)} 
                    step="0.01" 
                    min="0" 
                  />
                  {selectedProducto && precioUnitario && (() => {
                    const producto = productos.find(p => p.id === Number(selectedProducto))
                    if (!producto?.costo) return null
                    const diff = ((Number(precioUnitario) - producto.costo) / producto.costo) * 100
                    if (Math.abs(diff) < 5) return null
                    return (
                      <span className={`absolute -top-5 right-0 text-xs ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
                      </span>
                    )
                  })()}
                </div>
              </div>
              <div>
                <Label>Lote</Label>
                <Input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
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
              <h3 className="font-semibold mb-2">Productos a Ingresar ({detalles.length})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.map((det, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{det.productoNombre}</TableCell>
                      <TableCell className="text-right">{det.cantidad}</TableCell>
                      <TableCell className="text-right">Q{det.precioUnitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        Q{(det.cantidad * det.precioUnitario).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{det.lote || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => eliminarDetalle(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">TOTAL:</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      Q{calcularTotal().toFixed(2)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
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
            Registrar Entrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
