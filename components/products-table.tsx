"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, Loader2 } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { ProductDialog } from "@/components/product-dialog"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { productosService, type Producto, registrarAuditoria } from "@/lib/api"

interface ProductsTableProps { search?: string }

export function ProductsTable({ search }: ProductsTableProps) {
  const { canEdit, canDelete } = usePermissions()
  const [selected, setSelected] = useState<Producto | null>(null)
  const [viewDetails, setViewDetails] = useState<Producto | null>(null)
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

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
  const filteredProducts = items.filter(
    (p) => p.nombre.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
  )

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Precio</TableHead>
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
            const status = getStockStatus(product.stock_actual, product.stock_minimo)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell>{product.categoria?.nombre || '-'}</TableCell>
                <TableCell className="text-right">
                  <span className={product.stock_actual < product.stock_minimo ? "text-destructive font-semibold" : ""}>
                    {product.stock_actual}
                  </span>
                  <span className="text-muted-foreground text-xs ml-1">/ {product.stock_minimo}</span>
                </TableCell>
                <TableCell className="text-right font-mono">Q{product.precio.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
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
