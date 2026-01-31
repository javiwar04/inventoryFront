"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { proveedoresService, inventarioService, productosService, Producto } from "@/lib/api"
import { transferenciasService, TransferenciaCreateDto, DetalleTransferenciaCreateDto } from "@/services/transferencias"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NuevaTransferenciaDialogProps {
  onSuccess: () => void
}

interface ProductoDisponible extends Producto {
  stockActual: number
}

export function NuevaTransferenciaDialog({ onSuccess }: NuevaTransferenciaDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Data sources
  const [hoteles, setHoteles] = useState<any[]>([])
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoDisponible[]>([])
  const [allProductos, setAllProductos] = useState<Producto[]>([])

  // Form state
  const [numeroTransferencia, setNumeroTransferencia] = useState("")
  const [fechaTransferencia, setFechaTransferencia] = useState(new Date().toISOString().split('T')[0])
  const [hotelOrigenId, setHotelOrigenId] = useState<string>("")
  const [hotelDestinoId, setHotelDestinoId] = useState<string>("")
  const [observaciones, setObservaciones] = useState("")
  const [detalles, setDetalles] = useState<DetalleTransferenciaCreateDto[]>([])

  // Loading states
  const [loadingInventario, setLoadingInventario] = useState(false)

  useEffect(() => {
    if (open) {
      loadInitialData()
      // Generate default transfer number (simplified)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      setNumeroTransferencia(`TRF-${new Date().getFullYear()}-${random}`)
      resetForm(false)
    }
  }, [open])

  useEffect(() => {
    if (hotelOrigenId) {
      loadInventarioOrigen(parseInt(hotelOrigenId))
      setDetalles([]) // Reset details when source changes
    }
  }, [hotelOrigenId])

  const loadInitialData = async () => {
    try {
      const [provs, prods] = await Promise.all([
        proveedoresService.getAll(),
        productosService.getAll()
      ])
      // Filter suppliers that are likely hotels if there's a way to distinguish, otherwise show all
      setHoteles(provs)
      setAllProductos(prods)
    } catch (error) {
      console.error("Error loading initial data", error)
      toast.error("Error cargando datos iniciales")
    }
  }

  const loadInventarioOrigen = async (id: number) => {
    setLoadingInventario(true)
    try {
      const inv = await inventarioService.getByHotel(id)
      // Merge with product details and filter those with stock > 0
      const disponibles: ProductoDisponible[] = []
      
      inv.forEach((item: any) => {
          if (item.stock > 0) {
              const prod = allProductos.find(p => p.id === item.productoId)
              
              // Only include active products
              if (prod && prod.activo) {
                  disponibles.push({
                      ...prod,
                      stockActual: item.stock
                  })
              }
          }
      })
      setProductosDisponibles(disponibles)
    } catch (error) {
      console.error("Error loading inventory", error)
      toast.error("Error cargando inventario del hotel origen")
      setProductosDisponibles([])
    } finally {
      setLoadingInventario(false)
    }
  }

  const handleAddProduct = () => {
    setDetalles([...detalles, { productoId: 0, cantidad: 1, lote: "" }])
  }

  const handleRemoveProduct = (index: number) => {
    const newDetalles = [...detalles]
    newDetalles.splice(index, 1)
    setDetalles(newDetalles)
  }

  const handleProductChange = (index: number, productoId: string) => {
    const newDetalles = [...detalles]
    const pid = parseInt(productoId)
    newDetalles[index].productoId = pid
    // Check stock for this product
    const invItem = productosDisponibles.find(p => p.id === pid)
    if(!invItem || invItem.stockActual <= 0) {
        toast.warning("Producto sin stock en el origen")
    }
    setDetalles(newDetalles)
  }

  const handleQuantityChange = (index: number, cantidad: string) => {
    const newDetalles = [...detalles]
    newDetalles[index].cantidad = parseInt(cantidad) || 0
    setDetalles(newDetalles)
  }
  
  const handleLoteChange = (index: number, lote: string) => {
    const newDetalles = [...detalles]
    newDetalles[index].lote = lote
    setDetalles(newDetalles)
  }

  const getStockDisponible = (productoId: number) => {
    const uniqueItem = productosDisponibles.find(p => p.id === productoId)
    return uniqueItem ? uniqueItem.stockActual : 0
  }
  
  const getProductName = (productoId: number) => {
      const prod = allProductos.find(p => p.id === productoId)
      return prod ? prod.nombre : 'Desconocido'
  }

  const validateForm = () => {
    if (!numeroTransferencia) {
      toast.error("Número de transferencia requerido")
      return false
    }
    if (!hotelOrigenId || !hotelDestinoId) {
      toast.error("Seleccione hotel origen y destino")
      return false
    }
    if (hotelOrigenId === hotelDestinoId) {
      toast.error("Hotel origen y destino deben ser diferentes")
      return false
    }
    if (detalles.length === 0) {
      toast.error("Agregue al menos un producto")
      return false
    }

    for (const d of detalles) {
      if (!d.productoId) {
        toast.error("Seleccione un producto en todas las filas")
        return false
      }
      if (d.cantidad <= 0) {
        toast.error(`Cantidad inválida para producto ${getProductName(d.productoId)}`)
        return false
      }
      const stock = getStockDisponible(d.productoId)
      if (d.cantidad > stock) {
        toast.error(`Stock insuficiente para ${getProductName(d.productoId)}. Disponible: ${stock}`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const data: TransferenciaCreateDto = {
        numeroTransferencia,
        fechaTransferencia,
        hotelOrigenId: parseInt(hotelOrigenId),
        hotelDestinoId: parseInt(hotelDestinoId),
        observaciones,
        creadoPor: user?.id || 1, // Fallback if user context not ready
        detalles
      }

      await transferenciasService.create(data)
      toast.success("Transferencia creada exitosamente")
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error creating transfer", error)
      if (error.response?.data?.message) {
          const msg = error.response.data
          if(msg.productoId) {
             toast.error(`${msg.message}\nDisponible: ${msg.disponible}, Solicitado: ${msg.solicitado}`) 
          } else {
             toast.error(msg.message)
          }
      } else {
          toast.error("Error al crear la transferencia")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = (full: boolean = true) => {
      if(full) {
        setNumeroTransferencia("")
        setFechaTransferencia(new Date().toISOString().split('T')[0])
      }
      setHotelOrigenId("")
      setHotelDestinoId("")
      setObservaciones("")
      setDetalles([])
      setProductosDisponibles([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transferencia
         </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia de Inventario</DialogTitle>
          <DialogDescription>
            Complete los datos para transferir productos entre hoteles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Número Transferencia</Label>
            <Input 
                value={numeroTransferencia} 
                onChange={(e) => setNumeroTransferencia(e.target.value)}
                placeholder="TRF-YYYY-NNN"
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input 
                type="date"
                value={fechaTransferencia} 
                onChange={(e) => setFechaTransferencia(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Hotel Origen</Label>
            <Select value={hotelOrigenId} onValueChange={setHotelOrigenId}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                    {hoteles.map(h => (
                        <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hotel Destino</Label>
            <Select value={hotelDestinoId} onValueChange={setHotelDestinoId}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                    {hoteles.filter(h => h.id.toString() !== hotelOrigenId).map(h => (
                        <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {hotelOrigenId && hotelDestinoId && hotelOrigenId === hotelDestinoId && (
                <p className="text-sm text-red-500">Origen y destino no pueden ser iguales</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales..."
            />
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Productos</h3>
                <Button variant="outline" size="sm" onClick={handleAddProduct} disabled={!hotelOrigenId}>
                    <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                </Button>
            </div>
            
            {loadingInventario ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Producto</TableHead>
                                <TableHead>Stock Origen</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Lote (Opcional)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detalles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No hay productos agregados. Seleccione Hotel Origen para ver disponibilidad.
                                    </TableCell>
                                </TableRow>
                            )}
                            {detalles.map((detalle, index) => {
                                const stock = getStockDisponible(detalle.productoId);
                                return (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Select 
                                                value={detalle.productoId.toString()} 
                                                onValueChange={(val) => handleProductChange(index, val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar producto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {productosDisponibles.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.nombre} - {p.sku}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <span className={stock === 0 ? "text-red-500 font-bold" : ""}>
                                                {stock}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={detalle.cantidad}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                min={1}
                                                max={stock}
                                                className="w-24"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={detalle.lote || ""}
                                                onChange={(e) => handleLoteChange(index, e.target.value)}
                                                placeholder="Lote"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleRemoveProduct(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>

        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading || loadingInventario}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Transferencia
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
