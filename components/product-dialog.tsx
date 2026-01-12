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
import { Plus, Calendar, Package, AlertTriangle, Loader2 } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { productosService, type Producto } from "@/lib/api"
import { categoriasService, proveedoresService, registrarAuditoria } from "@/lib/api"

interface CategoriaOption { id: number; nombre: string; codigo?: string }

// Proveedor desde API
interface Proveedor { id: number; nombre: string; estado?: string; contacto?: string | null; telefono?: string | null; email?: string | null }

interface ProductDialogProps {
  product?: Producto | null
  onSuccess?: () => void
}

export function ProductDialog({ product, onSuccess }: ProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { canCreate } = usePermissions()

  const isEditing = !!product

  // Cargar proveedores al abrir el diálogo
  useEffect(() => {
    if (open) {
      cargarProveedores()
    }
  }, [open])

  // Cargar categorías al abrir el diálogo
  useEffect(() => {
    if (open) cargarCategorias()
  }, [open])

  // Control de apertura según modo edición
  useEffect(() => {
    if (product) {
      setOpen(true)
    }
  }, [product])

  const cargarProveedores = async () => {
    setLoading(true)
    try {
      const list = await proveedoresService.getAll()
      const activos = list.filter(p => (p.estado ?? 'Activo').toLowerCase() === 'activo')
      // Map opcional para asegurar el shape
      setProveedores(activos.map(p => ({ id: p.id, nombre: p.nombre, contacto: p.contacto, telefono: p.telefono, email: p.email })))
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCategorias = async () => {
    try {
      const data = await categoriasService.getAll()
      // mapa a opciones simples
      const opts = data.map((c: any) => ({ id: c.id, nombre: c.nombre, codigo: c.codigo }))
      setCategorias(opts)
    } catch (err) {
      console.error('Error al cargar categorías:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    
    try {
      const categoriaId = Number(formData.get('category'))
      
      const payload: any = {
        Nombre: formData.get('name') as string,
        SKU: formData.get('sku') as string,
        ProveedorId: Number(formData.get('supplier')),
        CategoriaId: categoriaId,
        UnidadMedida: formData.get('unit') as string,
        Precio: Number(formData.get('price')),
        Costo: 0, // Por ahora en 0, luego puedes agregarlo al formulario
        StockActual: Number(formData.get('stock')),
        StockMinimo: Number(formData.get('minStock')),
        Descripcion: (formData.get('description') as string) || null,
        Estado: 'activo'
      }

      if (isEditing && product) {
        await productosService.update(product.id, payload)
        toast.success('Producto actualizado', { description: `${payload.Nombre} ha sido actualizado.` })
        window.dispatchEvent(new CustomEvent('products:updated', { detail: { ...(product as any), ...payload, id: product.id } }))
        // Registrar auditoría: actualización de producto
        registrarAuditoria({
          accion: 'actualizar',
          modulo: 'productos',
          descripcion: `Producto actualizado: ${payload.Nombre}`,
          detalles: JSON.stringify({ id: product.id, ...payload }),
          registroId: product.id
        })
      } else {
        const created = await productosService.create(payload as any)
        toast.success('Producto agregado', { description: `${payload.Nombre} fue agregado al inventario.` })
        window.dispatchEvent(new CustomEvent('products:created', { detail: created }))
        // Registrar auditoría: creación de producto
        registrarAuditoria({
          accion: 'crear',
          modulo: 'productos',
          descripcion: `Producto creado: ${payload.Nombre}`,
          detalles: JSON.stringify(created),
          registroId: created?.id
        })
      }

      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error guardando producto:', err)
      const msg = err?.message || 'Error al guardar producto'
      toast.error('Error al guardar', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  if (!isEditing && !canCreate("productos")) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit} key={product?.id || 'new'}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
            <DialogDescription>{isEditing ? 'Modifica los datos del producto.' : 'Completa la información del producto para agregarlo al inventario.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input id="name" name="name" placeholder="Ej: Shampoo Profesional 500ml" defaultValue={product?.nombre || ''} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input id="sku" name="sku" placeholder="Ej: SHP-001" defaultValue={product?.sku || ''} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier" className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Hotel / Proveedor</span>
                  <Badge variant="outline" className="text-xs">
                    {proveedores.length} disponibles
                  </Badge>
                </Label>
                <Select disabled={loading} name="supplier" required defaultValue={product?.proveedor_id?.toString()}
                >
                  <SelectTrigger id="supplier" className="h-12">
                    <SelectValue placeholder={loading ? "Cargando hoteles..." : "Seleccionar hotel"} />
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
                        <span className="text-muted-foreground">No hay hoteles disponibles</span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" required defaultValue={product ? String(product.categoria_id ?? '') : undefined}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{cat.nombre}</span>
                          {cat.codigo && <span className="text-xs text-muted-foreground">{cat.codigo}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Select name="unit" required defaultValue={product?.unidad || undefined}>
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
                <Input id="price" name="price" type="number" placeholder="0.00" step="0.01" defaultValue={product?.precio ?? ''} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock Actual</Label>
                <Input id="stock" name="stock" type="number" placeholder="0" defaultValue={product?.stock_actual ?? ''} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input id="minStock" name="minStock" type="number" placeholder="0" defaultValue={product?.stock_minimo ?? ''} required />
                <p className="text-xs text-muted-foreground">
                  Se alertará cuando el stock sea menor a este valor
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de Vencimiento</span>
                </Label>
                <div className="flex items-center h-10 px-3 rounded-md border border-dashed bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Se gestiona por lote en las entradas
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="Descripción detallada del producto..." rows={3} defaultValue={product?.descripcion ?? ''} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar Producto</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
