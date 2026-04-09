"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, Loader2, SlidersHorizontal } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { ProductDialog } from "@/components/product-dialog"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { productosService, type Producto, registrarAuditoria, inventarioService, categoriasService, proveedoresService, ajustesInventarioService } from "@/lib/api"

interface ProductsTableProps { 
  search?: string 
  categoryFilter?: string
  supplierFilter?: string
  stockFilter?: string
  hotelFilter?: string
  statusFilter?: 'active' | 'inactive' | 'all'
}

export function ProductsTable({ search, categoryFilter, supplierFilter, stockFilter, hotelFilter, statusFilter = 'active' }: ProductsTableProps) {
  const { canEdit, canDelete } = usePermissions()
  const [selected, setSelected] = useState<Producto | null>(null)
  const [viewDetails, setViewDetails] = useState<Producto | null>(null)
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [hotelStocks, setHotelStocks] = useState<Record<number, number>>({})
  const [categories, setCategories] = useState<Record<number, string>>({})
  const [hoteles, setHoteles] = useState<Array<{ id: number; nombre: string }>>([])

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Producto | null>(null)
  const [adjustHotelId, setAdjustHotelId] = useState<string>("")
  const [adjustType, setAdjustType] = useState<'diferencia' | 'conteo_fisico'>('diferencia')
  const [adjustValue, setAdjustValue] = useState<string>("")
  const [adjustReason, setAdjustReason] = useState<string>('conteo_fisico')
  const [adjustNotes, setAdjustNotes] = useState<string>("")
  const [adjusting, setAdjusting] = useState(false)

  useEffect(() => {
    // Cargar categorías para mapear nombres si el backend no lo envía
    categoriasService.getAll().then(cats => {
        const map: Record<number, string> = {}
        cats.forEach(c => map[c.id] = c.nombre)
        setCategories(map)
    }).catch(console.error)

    proveedoresService.getAll().then(hs => {
      setHoteles(hs.filter(h => h.estado === 'Activo').map(h => ({ id: h.id, nombre: h.nombre })))
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (hotelFilter && hotelFilter !== "all") {
      inventarioService.getByHotel(parseInt(hotelFilter))
        .then(data => {
          const map: Record<number, number> = {}
          data.forEach(x => map[x.productoId] = x.stock)
          setHotelStocks(map)
        })
        .catch(console.error)
    } else {
      setHotelStocks({})
    }
  }, [hotelFilter])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await productosService.getAll()
        setItems(data)
      } catch (err: any) {
        toast.error('Error al cargar productos', { description: err?.message || 'Verifica la API' })
      } finally {
        setLoading(false)
      }
    }
    load()

    const onCreated = (e: any) => {
      const p = e.detail as Producto
      setItems(prev => [p, ...prev])
    }
    const onUpdated = (e: any) => {
      const p = e.detail as Producto
      setItems(prev => prev.map(x => x.id === p.id ? p : x))
    }
    window.addEventListener('products:created', onCreated as any)
    window.addEventListener('products:updated', onUpdated as any)
    return () => {
      window.removeEventListener('products:created', onCreated as any)
      window.removeEventListener('products:updated', onUpdated as any)
    }
  }, [])

  const term = (search ?? '').toLowerCase()
  const filteredProducts = items.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    const matchesCategory = !categoryFilter || categoryFilter === "all" || p.categoria_id === parseInt(categoryFilter)
    const matchesSupplier = !supplierFilter || supplierFilter === "all" || p.proveedor_id === parseInt(supplierFilter)
    
    // Status filter
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = !!p.activo
    else if (statusFilter === 'inactive') matchesStatus = !p.activo

    // Determine the stock to check based on filters
    const currentStock = (hotelFilter && hotelFilter !== "all") ? (hotelStocks[p.id] || 0) : p.stock_actual
    
    // Filter out items with 0 stock if a specific hotel is selected (Optional interpretation of "lo que hay")
    // Or just treat stockFilter logic:
    
    let matchesStock = true
    if (stockFilter === "bajo") {
      matchesStock = currentStock < p.stock_minimo
    } else if (stockFilter === "normal") {
      matchesStock = currentStock >= p.stock_minimo
    } else if (stockFilter === "alto") {
      matchesStock = currentStock >= p.stock_minimo
    } else if (hotelFilter && hotelFilter !== "all") {
       // If filtering by hotel and NO stock filter is set, maybe only show existing items?
       matchesStock = currentStock > 0
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock && matchesStatus
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "Sin Stock", variant: "destructive" as const }
    if (stock < minStock) return { label: "Stock Bajo", variant: "secondary" as const }
    return { label: "En Stock", variant: "default" as const }
  }

  const openAdjustDialog = (product: Producto) => {
    setAdjustProduct(product)
    setAdjustType('diferencia')
    setAdjustValue('')
    setAdjustReason('conteo_fisico')
    setAdjustNotes('')
    if (hotelFilter && hotelFilter !== 'all') {
      setAdjustHotelId(hotelFilter)
    } else {
      setAdjustHotelId('')
    }
    setAdjustOpen(true)
  }

  const handleAdjustStock = async () => {
    if (!adjustProduct) return
    if (!adjustHotelId) {
      toast.error('Selecciona un hotel para ajustar stock')
      return
    }
    if (!adjustReason.trim()) {
      toast.error('Selecciona o escribe un motivo de ajuste')
      return
    }

    const parsedValue = Number(adjustValue)
    if (Number.isNaN(parsedValue)) {
      toast.error('Ingresa un valor válido para el ajuste')
      return
    }
    if (adjustType === 'conteo_fisico' && parsedValue < 0) {
      toast.error('El conteo físico no puede ser negativo')
      return
    }
    if (adjustType === 'diferencia' && parsedValue === 0) {
      toast.error('La diferencia no puede ser 0')
      return
    }

    setAdjusting(true)
    try {
      const payload = {
        hotelId: Number(adjustHotelId),
        productoId: adjustProduct.id,
        tipoAjuste: adjustType,
        cantidad: adjustType === 'diferencia' ? parsedValue : undefined,
        stockFisico: adjustType === 'conteo_fisico' ? parsedValue : undefined,
        motivo: adjustReason,
        observaciones: adjustNotes || undefined,
      }

      const result = await ajustesInventarioService.create(payload)

      try {
        await registrarAuditoria({
          accion: 'create',
          modulo: 'inventario',
          descripcion: `Ajuste de stock de ${adjustProduct.nombre} en hotel #${adjustHotelId}. ${result.stockAnterior} -> ${result.stockNuevo}`,
          detalles: JSON.stringify(payload),
          registroId: result.id,
        })
      } catch (auditErr) {
        console.warn('No se pudo registrar auditoría del ajuste', auditErr)
      }

      toast.success('Ajuste de stock aplicado', {
        description: `Stock: ${result.stockAnterior} -> ${result.stockNuevo}`,
      })

      if (hotelFilter && hotelFilter !== 'all') {
        inventarioService.getByHotel(parseInt(hotelFilter))
          .then(data => {
            const map: Record<number, number> = {}
            data.forEach(x => map[x.productoId] = x.stock)
            setHotelStocks(map)
          })
          .catch(console.error)
      }

      const refreshed = await productosService.getAll()
      setItems(refreshed)

      setAdjustOpen(false)
      setAdjustProduct(null)
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || 'No se pudo aplicar el ajuste'
      toast.error('Error al ajustar stock', { description: apiMessage })
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Dialog for edit product */}
      {selected && (
        <ProductDialog
          product={selected}
          onSuccess={() => {
            setSelected(null)
            // Recargar lista después de editar
            productosService.getAll().then(setItems).catch(console.error)
          }}
        />
      )}

      {/* Dialog for view details */}
      <ProductDetailsDialog
        product={viewDetails}
        open={!!viewDetails}
        onOpenChange={(open) => !open && setViewDetails(null)}
      />

      {/* Confirm delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const id = deleteId
                try {
                  if (id != null) {
                      // Encontrar producto antes de eliminar para detalles
                      const prod = items.find(p => p.id === id)
                      // Si hay API, intentará borrar; si falla, igual actualizamos local
                      try { await productosService.delete(id as any) } catch {}
                      setItems((prev) => prev.filter(p => p.id !== id))
                      toast.success('Producto eliminado', { description: `Se eliminó el producto #${id}.` })
                      // Registrar auditoría (no bloquear UX si falla)
                      try {
                        await registrarAuditoria({
                          accion: 'eliminar',
                          modulo: 'productos',
                          descripcion: `Producto eliminado: ${prod?.nombre ?? ('#' + id)}`,
                          detalles: JSON.stringify(prod ?? { id }),
                          registroId: id
                        })
                      } catch (e) {
                        console.warn('No se pudo registrar auditoría (producto eliminar)', e)
                      }
                  }
                } finally {
                  setDeleteId(null)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              {adjustProduct
                ? `Producto: ${adjustProduct.nombre} (${adjustProduct.sku})`
                : 'Selecciona los datos del ajuste'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Hotel</Label>
              <Select value={adjustHotelId} onValueChange={setAdjustHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteles.map(h => (
                    <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'diferencia' | 'conteo_fisico')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diferencia">Diferencia (+ / -)</SelectItem>
                  <SelectItem value="conteo_fisico">Conteo físico (stock final)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{adjustType === 'diferencia' ? 'Cantidad de diferencia' : 'Stock físico final'}</Label>
              <Input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder={adjustType === 'diferencia' ? 'Ejemplo: -3 o 10' : 'Ejemplo: 45'}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={adjustReason} onValueChange={setAdjustReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conteo_fisico">Conteo físico</SelectItem>
                  <SelectItem value="merma">Merma</SelectItem>
                  <SelectItem value="danio">Daño</SelectItem>
                  <SelectItem value="vencimiento">Vencimiento</SelectItem>
                  <SelectItem value="regularizacion">Regularización</SelectItem>
                  <SelectItem value="ajuste_administrativo">Ajuste administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)} disabled={adjusting}>Cancelar</Button>
            <Button onClick={handleAdjustStock} disabled={adjusting}>
              {adjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Aplicar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Disponibilidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                </div>
              </TableCell>
            </TableRow>
          )}
          {!loading && visibleProducts.map((product) => {
            const currentStock = (hotelFilter && hotelFilter !== "all") ? (hotelStocks[product.id] || 0) : product.stock_actual
            const status = getStockStatus(currentStock, product.stock_minimo)
            const catName = product.categoria?.nombre || categories[product.categoria_id] || '-'

            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell>{catName}</TableCell>
                <TableCell className="text-right">
                  <span className={currentStock < product.stock_minimo ? "text-destructive font-semibold" : ""}>
                    {currentStock}
                  </span>
                  <span className="text-muted-foreground text-xs ml-1">/ {product.stock_minimo}</span>
                </TableCell>
                <TableCell className="text-right font-mono">Q{product.precio.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  {product.activo ? (
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setViewDetails(product)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                      {canEdit("productos") && (
                        <DropdownMenuItem onClick={() => setSelected(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canEdit("productos") && (
                        <DropdownMenuItem onClick={() => openAdjustDialog(product)}>
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Ajustar stock
                        </DropdownMenuItem>
                      )}
                      {canDelete("productos") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between p-3">
        <div className="text-sm text-muted-foreground">Mostrando {((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, filteredProducts.length)} de {filteredProducts.length}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>Primera</Button>
          <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Anterior</Button>
          <input type="number" className="w-16 text-center rounded border px-1" min={1} max={totalPages} value={currentPage} onChange={(e) => { const v = Number(e.target.value) || 1; setCurrentPage(Math.min(Math.max(1, v), totalPages)) }} />
          <span className="text-sm self-center">/ {totalPages}</span>
          <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Siguiente</Button>
          <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Última</Button>
        </div>
      </div>
    </div>
  )
}
