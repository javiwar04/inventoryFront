"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, PackageMinus, Loader2, CreditCard, Banknote, Gift, User, Store, Printer } from "lucide-react"
import { toast } from "sonner"
import { salidasService, productosService, proveedoresService, registrarAuditoria, inventarioService, Salida } from "@/lib/api"
import { generarFacturaPDF } from "@/lib/export-utils"
import { useAuth } from "@/contexts/auth-context"
import { getGuatemalaDate, getGuatemalaDateTime } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DetalleTemp {
  productoId: number
  productoNombre: string
  productoSku: string
  productoStock: number
  cantidad: number
  lote?: string
  precio: number
  subtotal: number
}

export function ExitDialogNew() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Data sources
  const [allProductos, setAllProductos] = useState<any[]>([]) // Master list
  const [productos, setProductos] = useState<any[]>([]) // Filtered list
  const [hoteles, setHoteles] = useState<any[]>([])

  // Cart / Details
  const [detalles, setDetalles] = useState<DetalleTemp[]>([])

  // Header Fields
  const [numeroSalida, setNumeroSalida] = useState('')
  const [fechaSalida, setFechaSalida] = useState(getGuatemalaDate())
  const [metodoPago, setMetodoPago] = useState('Efectivo Quetzales')
  const [hotelId, setHotelId] = useState('') // This maps to Destino
  const [nomCliente, setNomCliente] = useState('Consumidor Final') // This maps to Cliente
  const [observaciones, setObservaciones] = useState('')
  const [referencia, setReferencia] = useState('')

  // Loop Fields
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [lote, setLote] = useState('')

  useEffect(() => {
    if (open) {
      initialSetup()
    }
  }, [open])

  // Pre-seleccionar Sede si el usuario tiene una asignada y no es admin
  useEffect(() => {
    if (open && user?.sedeId && user.sedeId !== 0) {
      setHotelId(user.sedeId.toString())
    }
  }, [open, user])

  const initialSetup = async () => {
     await Promise.all([cargarProductos(), cargarHoteles()])
     generarNumeroSalida()
  }

  const cargarProductos = async () => {
    try {
      const prods = await productosService.getAll()
      setAllProductos(prods)
      // Inicialmente si no hay hotel seleccionado, mostrar vacío o global (decidimos mostrar vacío para obligar selección)
      setProductos([]) 
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  // Efecto para cargar inventario específico cuando cambia la Sede
  useEffect(() => {
    const updateStockPorSede = async () => {
        if (!hotelId || allProductos.length === 0) {
            setProductos([])
            return
        }

        try {
            // Obtener inventario de la sede seleccionada
            const inventarioSede = await inventarioService.getByHotel(Number(hotelId))
            
            // Mapear productos con el stock de la sede
            const productosSede = allProductos.map(p => {
                const itemInv = inventarioSede.find(i => i.productoId === p.id)
                return {
                    ...p,
                    stock_original_global: p.stock_actual, // Guardamos referencia
                    stock_actual: itemInv ? itemInv.stock : 0
                }
            }).filter(p => p.stock_actual > 0) // Filtrar solo con existencia

            setProductos(productosSede)
        } catch (error) {
            console.error('Error al cargar inventario por sede:', error)
            toast.error('Error al cargar existencias de la sede')
        }
    }

    updateStockPorSede()
  }, [hotelId, allProductos])

  const cargarHoteles = async () => {
    try {
      const data = await proveedoresService.getAll()
      // Assuming Suppliers could be hotels for now as placeholder
      setHoteles(data.filter(p => p.estado === 'Activo'))
    } catch (err) {
      console.error('Error loading hotels:', err)
    }
  }

  const generarNumeroSalida = () => {
    const now = new Date()
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setNumeroSalida(`VEN-${datePart}-${random}`)
  }

  const agregarDetalle = () => {
    const prodId = Number(selectedProducto)
    if (!prodId || !cantidad) {
      toast.error('Datos incompletos', { description: 'Selecciona producto y cantidad' })
      return
    }

    const producto = productos.find(p => p.id === prodId)
    if (!producto) return

    if (detalles.some(d => d.productoId === prodId)) {
        toast.error('Producto ya agregado', { description: 'Modifica la cantidad en la lista si deseas' })
        return
    }

    const qty = Number(cantidad)
    if (qty <= 0) {
        toast.error('Cantidad inválida')
        return
    }

    if (qty > producto.stock_actual) {
        toast.error('Stock insuficiente', { description: `Disponibles: ${producto.stock_actual}` })
        return
    }

    const precio = producto.precio || 0 
    const subtotal = precio * qty

    const nuevo: DetalleTemp = {
        productoId: producto.id,
        productoNombre: producto.nombre,
        productoSku: producto.sku,
        productoStock: producto.stock_actual,
        cantidad: qty,
        lote: lote || undefined,
        precio: precio,
        subtotal: subtotal
    }

    setDetalles([...detalles, nuevo])
    
    // Reset inputs
    setSelectedProducto('')
    setCantidad('')
    setLote('')
  }

  const eliminarDetalle = (idx: number) => {
    setDetalles(detalles.filter((_, i) => i !== idx))
  }

  const getTotalVenta = () => detalles.reduce((sum, d) => sum + d.subtotal, 0)

  const handleSubmit = async (printTicket: boolean = false) => {
    if (!numeroSalida || !fechaSalida || !metodoPago || !hotelId) {
        toast.error('Faltan campos obligatorios', { description: 'Verifica Hotel, Cliente y Método de Pago' })
        return
    }
    if (detalles.length === 0) {
        toast.error('Carrito vacío')
        return
    }

    setSaving(true)
    try {
        const total = getTotalVenta()
        const selectedHotel = hoteles.find(h => h.id.toString() === hotelId)?.nombre || 'Tienda Principal'
        
        const payload = {
            NumeroSalida: numeroSalida,
            // Ensure we strictly send YYYY-MM-DD to avoid backend DateOnly validation error
            FechaSalida: fechaSalida?.split('T')[0] || getGuatemalaDate(),
            Motivo: (metodoPago === 'Cortesía' || metodoPago.includes('Cortes') || metodoPago.includes('cortes')) ? 'Cortesía' : 'Venta',
            Destino: selectedHotel,
            Referencia: referencia,
            Observaciones: observaciones,
            Estado: 'completada',
            CreadoPor: user?.id || 1,
            Total: total,
            MetodoPago: metodoPago,
            Cliente: nomCliente,
            Detalles: detalles.map(d => ({
                ProductoId: d.productoId,
                Cantidad: d.cantidad,
                Lote: d.lote,
                PrecioUnitario: d.precio,
                Subtotal: d.subtotal
            }))
        }

        console.log('Sending Payload:', payload)
        const created = await salidasService.create(payload)

        // Audit this
        await registrarAuditoria({
            accion: 'create',
            modulo: 'ventas',
            descripcion: `Venta ${numeroSalida} - Total Q${total}`,
            detalles: JSON.stringify(payload),
            registroId: created.id
        })

        toast.success('Venta Registrada Exitosamente!')

        if (printTicket) {
             const reconstructedSalida: Salida = {
                id: created.id,
                numeroSalida: numeroSalida,
                fechaSalida: fechaSalida,
                motivo: 'Venta',
                destino: selectedHotel,
                referencia: referencia,
                observaciones: observaciones,
                estado: 'completada',
                fechaCreacion: new Date().toISOString(),
                total: total,
                metodoPago: metodoPago,
                cliente: nomCliente,
                detalleSalida: detalles.map((d, index) => ({
                    id: index,
                    salidaId: created.id,
                    productoId: d.productoId,
                    producto: { id: d.productoId, nombre: d.productoNombre, sku: d.productoSku },
                    cantidad: d.cantidad,
                    lote: d.lote || null,
                    precioUnitario: d.precio,
                    subtotal: d.subtotal
                }))
            }
            generarFacturaPDF(reconstructedSalida)
            toast.info('Generando Factura PDF...')
        }

        setOpen(false)
        resetForm()
        window.dispatchEvent(new CustomEvent('salidas:created'))
    } catch (err: any) {
        console.error('Error saving sale:', err)
        toast.error('Error al guardar', { description: err.message || 'Ocurrió un error desconocido' })
    } finally {
        setSaving(false)
    }
  }

  const resetForm = () => {
    setDetalles([])
    generarNumeroSalida()
    setNomCliente('Consumidor Final')
    setObservaciones('')
    setReferencia('')
    setSelectedProducto('')
    setCantidad('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md">
          <Banknote className="mr-2 h-4 w-4" />
          Punto de Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* Header Section */}
        <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
          <div className="flex justify-between items-center">
             <div>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Store className="h-6 w-6" />
                    Registro de Ventas
                </DialogTitle>
                <DialogDescription>
                    Sistema de facturación y control de salidas de inventario
                </DialogDescription>
             </div>
             <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Venta</div>
                <div className="text-3xl font-bold text-emerald-600">Q{getTotalVenta().toFixed(2)}</div>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Formulario Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/10 rounded-xl border">
                
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><CreditCard className="h-4 w-4"/> Método de Pago</Label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Efectivo Quetzales">Efectivo Quetzales</SelectItem>
                            <SelectItem value="Efectivo Dólares">Efectivo Dólares</SelectItem>
                            <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="Transferencia">Transferencia</SelectItem>
                            <SelectItem value="Cortesía">Cortesía / Regalo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Store className="h-4 w-4"/> Sede / Hotel</Label>
                    <Select 
                        value={hotelId} 
                        onValueChange={setHotelId}
                        disabled={!!(user?.sedeId && user.sedeId !== 0 && user.rol !== 'admin')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar Sede..." />
                        </SelectTrigger>
                        <SelectContent>
                            {hoteles.length === 0 && <SelectItem value="loading" disabled>Cargando...</SelectItem>}
                            {hoteles.map(h => (
                                <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><User className="h-4 w-4"/> Cliente</Label>
                    <Input 
                        value={nomCliente} 
                        onChange={e => setNomCliente(e.target.value)} 
                        placeholder="Nombre del Cliente"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Fecha de Venta</Label>
                    <Input type="date" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>No. Documento / Ref</Label>
                    <Input 
                        value={numeroSalida} 
                        readOnly 
                        className="font-mono bg-muted" 
                        title="Generado Automáticamente" 
                    />
                </div>
            </div>

            {/* Area de Agregar Productos */}
            <div className="space-y-4">
                <div className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-900 border rounded-lg shadow-sm">
                    <div className="flex-1 space-y-2">
                        <Label>Buscar Producto</Label>
                        <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Escriba o seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {productos.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        <span className="font-medium">{p.nombre}</span>
                                        <span className="text-muted-foreground ml-2">| Stock: {p.stock_actual} | Q{p.precio}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-32 space-y-2">
                        <Label>Cantidad</Label>
                        <Input 
                            type="number" 
                            min="1" 
                            placeholder="1" 
                            value={cantidad} 
                            onChange={e => setCantidad(e.target.value)}
                        />
                    </div>
                    <div className="w-32 space-y-2">
                        <Label>Lote (Opc.)</Label>
                        <Input 
                            placeholder="Lote..." 
                            value={lote} 
                            onChange={e => setLote(e.target.value)}
                        />
                    </div>
                    <Button onClick={agregarDetalle} size="lg" className="mb-[2px]">
                        <Plus className="mr-2 h-4 w-4" /> Agregar
                    </Button>
                </div>

                {/* Tabla de Detalle */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-center">Cant.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detalles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <PackageMinus className="h-8 w-8 opacity-50" />
                                            <span>No hay productos en la venta</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                detalles.map((det, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{det.productoNombre}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{det.productoSku}</TableCell>
                                        <TableCell className="text-right">Q{det.precio.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">{det.cantidad}</TableCell>
                                        <TableCell className="text-right font-bold">Q{det.subtotal.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => eliminarDetalle(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Observaciones / Notas</Label>
                    <Textarea 
                        placeholder="Comentarios adicionales..." 
                        value={observaciones} 
                        onChange={e => setObservaciones(e.target.value)} 
                        rows={3}
                    />
                 </div>
                 <div className="flex flex-col justify-end items-end gap-2 p-4 border rounded-lg bg-muted/10">
                    <div className="flex justify-between w-full max-w-[300px] text-sm">
                        <span>Subtotal:</span>
                        <span>Q{getTotalVenta().toFixed(2)}</span>
                    </div>
                    {/* Add Tax/Discount here if needed later */}
                    <div className="flex justify-between w-full max-w-[300px] text-xl font-bold border-t pt-2 mt-2">
                        <span>Total a Pagar:</span>
                        <span className="text-primary">Q{getTotalVenta().toFixed(2)}</span>
                    </div>
                 </div>
            </div>

        </div>

        <DialogFooter className="p-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            {/* BUTTON GROUP FOR PRINTING */}
            <div className="flex gap-2">
                <Button onClick={() => handleSubmit(false)} disabled={saving || detalles.length === 0} variant="secondary">
                    Solo Guardar
                </Button>
                <Button onClick={() => handleSubmit(true)} disabled={saving || detalles.length === 0} className="px-6 bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Cobrar e Imprimir
                </Button>
            </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
