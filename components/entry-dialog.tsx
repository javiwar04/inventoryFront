"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, Building2, Calendar, FileText, DollarSign, AlertCircle } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { registrarAuditoria } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

// Interfaces
interface Producto {
  id: number
  nombre: string
  sku: string
  categoria: string
  unidad: string
  precio: number
  stock_actual: number
  stock_minimo: number
  proveedor_id: number
  proveedor_nombre: string
}

interface Proveedor {
  id: number
  nombre: string
  contacto: string
  telefono: string
  email: string
  activo: boolean
}

// Datos simulados de productos (desde BD)
const productosSimulados: Producto[] = [
  { id: 1, nombre: "Shampoo Profesional 500ml", sku: "SHP-001", categoria: "Cuidado Capilar", unidad: "botella", precio: 25.50, stock_actual: 15, stock_minimo: 10, proveedor_id: 1, proveedor_nombre: "Distribuidora Beauty Pro" },
  { id: 2, nombre: "Gel Fijador Extra Fuerte 250ml", sku: "GEL-002", categoria: "Estilizado", unidad: "tubo", precio: 18.75, stock_actual: 8, stock_minimo: 15, proveedor_id: 2, proveedor_nombre: "Importadora Estilo GT" },
  { id: 3, nombre: "Cera Modeladora Mate", sku: "CER-003", categoria: "Estilizado", unidad: "pote", precio: 35.00, stock_actual: 22, stock_minimo: 5, proveedor_id: 1, proveedor_nombre: "Distribuidora Beauty Pro" },
  { id: 4, nombre: "Tinte Permanente Negro", sku: "TIN-004", categoria: "Coloración", unidad: "tubo", precio: 45.00, stock_actual: 3, stock_minimo: 8, proveedor_id: 3, proveedor_nombre: "Suministros Profesionales" },
  { id: 5, nombre: "Aceite para Barba 30ml", sku: "ACE-005", categoria: "Cuidado de Barba", unidad: "frasco", precio: 28.00, stock_actual: 12, stock_minimo: 6, proveedor_id: 4, proveedor_nombre: "Barbería Supplies Inc" },
  { id: 6, nombre: "Champú Anticaspa 400ml", sku: "SHA-006", categoria: "Cuidado Capilar", unidad: "botella", precio: 32.50, stock_actual: 5, stock_minimo: 12, proveedor_id: 2, proveedor_nombre: "Importadora Estilo GT" },
]

// Datos simulados de proveedores (desde BD)
const proveedoresSimulados: Proveedor[] = [
  { id: 1, nombre: "Distribuidora Beauty Pro", contacto: "María González", telefono: "+502 2234-5678", email: "ventas@beautypro.com", activo: true },
  { id: 2, nombre: "Importadora Estilo GT", contacto: "Carlos Mendoza", telefono: "+502 2345-6789", email: "pedidos@estilogt.com", activo: true },
  { id: 3, nombre: "Suministros Profesionales", contacto: "Ana López", telefono: "+502 2456-7890", email: "info@suministrospro.com", activo: true },
  { id: 4, nombre: "Barbería Supplies Inc", contacto: "Roberto Silva", telefono: "+502 2567-8901", email: "ventas@barberiasupplies.com", activo: true },
]

export function EntryDialog() {
  const [open, setOpen] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)
  const [loading, setLoading] = useState(false)
  const { canCreate } = usePermissions()

  // Cargar datos al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarDatos()
    }
  }, [open])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Simular carga desde API/base de datos
      await new Promise(resolve => setTimeout(resolve, 800))
      setProductos(productosSimulados)
      setProveedores(proveedoresSimulados.filter(p => p.activo))
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (productId: string) => {
    const producto = productos.find(p => p.id === parseInt(productId))
    setProductoSeleccionado(producto || null)
    
    // Auto-seleccionar el proveedor del producto
    if (producto) {
      const proveedor = proveedores.find(p => p.id === producto.proveedor_id)
      setProveedorSeleccionado(proveedor || null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    
    // Validar que se haya seleccionado un producto
    if (!productoSeleccionado) {
      alert('⚠️ Error: Debe seleccionar un producto para registrar la entrada')
      return
    }

    // Validar que el producto tenga un proveedor asignado
    if (!proveedorSeleccionado) {
      alert('⚠️ Error: El producto seleccionado no tiene un proveedor asignado. Contacte al administrador.')
      return
    }

    const cantidad = parseInt(formData.get('quantity') as string)
    const costo = parseFloat(formData.get('cost') as string) || 0
    
    // Validar cantidad
    if (!cantidad || cantidad <= 0) {
      alert('⚠️ Error: La cantidad debe ser mayor a 0')
      return
    }
    
    // Calcular costo estimado si no se proporcionó
    const costoEstimado = cantidad * productoSeleccionado.precio
    const costoFinal = costo > 0 ? costo : costoEstimado

    // Datos para guardar en BD - proveedor siempre es el del producto
    const entradaData = {
      producto_id: productoSeleccionado.id,
      proveedor_id: proveedorSeleccionado.id, // Solo el proveedor oficial del producto
      cantidad: cantidad,
      fecha_entrada: formData.get('date'),
      numero_factura: formData.get('invoice') || null,
      costo_total: costoFinal,
      costo_unitario: costoFinal / cantidad,
      observaciones: formData.get('notes') || null,
      usuario_id: 1 // ID del usuario actual
    }

    console.log('📦 Entrada registrada:', entradaData)
    console.log(`✅ Stock actualizado: ${productoSeleccionado.nombre} +${cantidad} unidades`)
    
    // Aquí iría la lógica para:
    // 1. Guardar entrada en tabla 'entradas'
    // 2. Actualizar stock en tabla 'productos' 
    // 3. Registrar movimiento en tabla 'movimientos_stock'
    // 4. Crear registro en tabla 'auditoria'
    try {
      await registrarAuditoria({
        accion: 'crear',
        modulo: 'entradas',
        descripcion: `Entrada de ${cantidad} ${productoSeleccionado.unidad} para ${productoSeleccionado.nombre}`,
        detalles: JSON.stringify(entradaData),
        registroId: entradaData.producto_id
      })
    } catch (e) {
      console.warn('No se pudo registrar auditoría de entrada', e)
    }
    
    alert(`✅ Entrada registrada exitosamente!\n\nProducto: ${productoSeleccionado.nombre}\nCantidad: ${cantidad} ${productoSeleccionado.unidad}\nProveedor: ${proveedorSeleccionado.nombre}\nCosto total: Q${costoFinal.toFixed(2)}`)
    
    setOpen(false)
    
    // Reset del formulario
    setProductoSeleccionado(null)
    setProveedorSeleccionado(null)
  }

  if (!canCreate("entradas")) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Entrada de Inventario</DialogTitle>
            <DialogDescription>Completa la información de la entrada de productos al inventario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Producto</span>
                <Badge variant="outline" className="text-xs">
                  {productos.length} disponibles
                </Badge>
              </Label>
              <Select disabled={loading} onValueChange={handleProductSelect} name="product" required>
                <SelectTrigger id="product" className="h-12">
                  <SelectValue placeholder={loading ? "Cargando productos..." : "Seleccionar producto"} />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      <div className="flex flex-col py-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{producto.nombre}</span>
                          {producto.stock_actual <= producto.stock_minimo && (
                            <Badge variant="destructive" className="text-xs">Stock Bajo</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          SKU: {producto.sku} • Stock: {producto.stock_actual} {producto.unidad} • Q{producto.precio}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {productos.length === 0 && !loading && (
                    <SelectItem value="no-products" disabled>
                      <span className="text-muted-foreground">No hay productos disponibles</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {/* Información del producto seleccionado */}
              {productoSeleccionado && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{productoSeleccionado.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Categoría: {productoSeleccionado.categoria} • Unidad: {productoSeleccionado.unidad}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        🔗 Proveedor oficial: {productoSeleccionado.proveedor_nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Q{productoSeleccionado.precio}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {productoSeleccionado.stock_actual}
                      </p>
                    </div>
                  </div>
                  {productoSeleccionado.stock_actual <= productoSeleccionado.stock_minimo && (
                    <div className="mt-2 flex items-center space-x-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">¡Stock bajo! Mínimo: {productoSeleccionado.stock_minimo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad a Ingresar</Label>
                <Input 
                  id="quantity" 
                  name="quantity"
                  type="number" 
                  placeholder="0" 
                  min="1" 
                  required 
                />
                {productoSeleccionado && (
                  <p className="text-xs text-muted-foreground">
                    Unidad: {productoSeleccionado.unidad}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de Entrada</span>
                </Label>
                <Input 
                  id="date" 
                  name="date"
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="supplier" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Proveedor</span>
                <Badge variant="secondary" className="text-xs">
                  Asignado automáticamente
                </Badge>
              </Label>
              
              {/* Proveedor no editable - se asigna desde el producto */}
              {proveedorSeleccionado ? (
                <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{proveedorSeleccionado.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {proveedorSeleccionado.contacto} • {proveedorSeleccionado.telefono}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proveedorSeleccionado.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        🔒 Proveedor oficial
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-muted/30 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecciona un producto para ver el proveedor asignado
                  </p>
                </div>
              )}
              
              {/* Campo oculto para el formulario */}
              <input 
                type="hidden" 
                name="supplier" 
                value={proveedorSeleccionado?.id || ""} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Número de Factura</span>
                </Label>
                <Input 
                  id="invoice" 
                  name="invoice"
                  placeholder="Ej: FAC-2025-001" 
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - Para referencia contable
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost" className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Costo Total (Q)</span>
                </Label>
                <Input 
                  id="cost" 
                  name="cost"
                  type="number" 
                  placeholder="0.00" 
                  step="0.01" 
                />
                {productoSeleccionado && (
                  <p className="text-xs text-muted-foreground">
                    Precio sugerido: Q{productoSeleccionado.precio} por {productoSeleccionado.unidad}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas / Observaciones</Label>
              <Textarea 
                id="notes" 
                name="notes"
                placeholder="Información adicional sobre la entrada (condiciones, descuentos, etc.)..." 
                rows={3} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Entrada</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
