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
import { Plus, Calendar, Package, AlertTriangle } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"

const categories = [
  { value: "hair-care", label: "Cuidado Capilar" },
  { value: "styling", label: "Estilizado" },
  { value: "beard-care", label: "Cuidado de Barba" },
  { value: "coloring", label: "Coloración" },
  { value: "shaving", label: "Afeitado" },
  { value: "tools", label: "Herramientas" },
  { value: "supplies", label: "Suministros" },
]

// Interface para proveedor
interface Proveedor {
  id: number
  nombre: string
  contacto: string
  telefono: string
  email: string
  activo: boolean
}

// Simulación de datos de proveedores desde la base de datos
const proveedoresSimulados: Proveedor[] = [
  { id: 1, nombre: "Distribuidora Beauty Pro", contacto: "María González", telefono: "+502 2234-5678", email: "ventas@beautypro.com", activo: true },
  { id: 2, nombre: "Importadora Estilo GT", contacto: "Carlos Mendoza", telefono: "+502 2345-6789", email: "pedidos@estilogt.com", activo: true },
  { id: 3, nombre: "Suministros Profesionales", contacto: "Ana López", telefono: "+502 2456-7890", email: "info@suministrospro.com", activo: true },
  { id: 4, nombre: "Barbería Supplies Inc", contacto: "Roberto Silva", telefono: "+502 2567-8901", email: "ventas@barberiasupplies.com", activo: true },
  { id: 5, nombre: "Productos Capilares SA", contacto: "Sofía Ramírez", telefono: "+502 2678-9012", email: "comercial@prodcapilares.com", activo: true },
  { id: 6, nombre: "Cosméticos Premium Ltda", contacto: "Luis Morales", telefono: "+502 2789-0123", email: "pedidos@cosmeticospremium.com", activo: true },
]

export function ProductDialog() {
  const [open, setOpen] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(false)
  const { canCreate } = usePermissions()

  // Cargar proveedores al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarProveedores()
    }
  }, [open])

  const cargarProveedores = async () => {
    setLoading(true)
    try {
      // Simular carga desde API/base de datos
      await new Promise(resolve => setTimeout(resolve, 500))
      // Filtrar solo proveedores activos
      const proveedoresActivos = proveedoresSimulados.filter(p => p.activo)
      setProveedores(proveedoresActivos)
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const expirationDate = formData.get('expirationDate') as string
    
    // Validar fecha de caducidad si se proporcionó
    if (expirationDate) {
      const expDate = new Date(expirationDate)
      const today = new Date()
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 30) {
        const confirmed = window.confirm(
          `⚠️ ADVERTENCIA: El producto caducará en ${diffDays} días (${expDate.toLocaleDateString()}). ¿Desea continuar agregándolo al inventario?`
        )
        if (!confirmed) return
      }
    }
    
    // Aquí iría la lógica para guardar el producto con todos los campos
    console.log('Datos del producto:', {
      nombre: formData.get('name'),
      sku: formData.get('sku'),
      proveedor_id: formData.get('supplier'),
      categoria: formData.get('category'),
      unidad: formData.get('unit'),
      precio: formData.get('price'),
      stock: formData.get('stock'),
      stock_minimo: formData.get('minStock'),
      fecha_caducidad: expirationDate || null,
      descripcion: formData.get('description')
    })
    
    setOpen(false)
  }

  if (!canCreate("productos")) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            <DialogDescription>Completa la información del producto para agregarlo al inventario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input id="name" name="name" placeholder="Ej: Shampoo Profesional 500ml" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input id="sku" name="sku" placeholder="Ej: SHP-001" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier" className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Proveedor</span>
                  <Badge variant="outline" className="text-xs">
                    {proveedores.length} disponibles
                  </Badge>
                </Label>
                <Select disabled={loading} name="supplier" required>
                  <SelectTrigger id="supplier" className="h-12">
                    <SelectValue placeholder={loading ? "Cargando proveedores..." : "Seleccionar proveedor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{proveedor.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {proveedor.contacto} • {proveedor.telefono}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {proveedores.length === 0 && !loading && (
                      <SelectItem value="no-providers" disabled>
                        <span className="text-muted-foreground">No hay proveedores disponibles</span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Select name="unit" required>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unidad</SelectItem>
                  <SelectItem value="bottle">Botella</SelectItem>
                  <SelectItem value="box">Caja</SelectItem>
                  <SelectItem value="pack">Paquete</SelectItem>
                  <SelectItem value="can">Lata</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio Unitario (Q)</Label>
                <Input id="price" name="price" type="number" placeholder="0.00" step="0.01" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expirationDate" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de Caducidad</span>
                </Label>
                <Input 
                  id="expirationDate"
                  name="expirationDate" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span>Opcional - Solo para productos perecederos</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock Actual</Label>
                <Input id="stock" name="stock" type="number" placeholder="0" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input id="minStock" name="minStock" type="number" placeholder="0" required />
                <p className="text-xs text-muted-foreground">
                  Se alertará cuando el stock sea menor a este valor
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="Descripción detallada del producto..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Producto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
