"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, DollarSign, Calendar, AlertTriangle, Box, Building2 } from "lucide-react"
import type { Producto, InventarioHotel } from "@/lib/api"
import { inventarioService } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductDetailsDialogProps {
  product: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsDialog({ product, open, onOpenChange }: ProductDetailsDialogProps) {
  const [inventario, setInventario] = useState<InventarioHotel[]>([])
  const [loadingInv, setLoadingInv] = useState(false)

  useEffect(() => {
    if (open && product) {
      setLoadingInv(true)
      inventarioService.getByProducto(product.id)
        .then(setInventario)
        .catch(err => console.error('Error cargando inventario por hotel', err))
        .finally(() => setLoadingInv(false))
    } else {
      setInventario([])
    }
  }, [open, product])

  if (!product) return null

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ' 
    }).format(value)
  }

  const getStockStatus = () => {
    if (product.stock_actual === 0) return { label: "Sin Stock", variant: "destructive" as const }
    if (product.stock_actual < product.stock_minimo) return { label: "Stock Bajo", variant: "secondary" as const }
    return { label: "En Stock", variant: "default" as const }
  }

  const stockStatus = getStockStatus()

  const isExpiringSoon = () => {
    if (!product.fecha_vencimiento) return false
    const expDate = new Date(product.fecha_vencimiento)
    const today = new Date()
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 30 && diffDays >= 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalles del Producto
          </DialogTitle>
          <DialogDescription>
            Información completa de {product.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">INFORMACIÓN BÁSICA</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Nombre:</span>
                <span className="col-span-2 font-medium">{product.nombre}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">SKU:</span>
                <span className="col-span-2 font-mono text-sm">{product.sku}</span>
              </div>
              {product.descripcion && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Descripción:</span>
                  <span className="col-span-2 text-sm">{product.descripcion}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Categoría:</span>
                <span className="col-span-2">
                  <Badge variant="outline">{product.categoria?.nombre || '-'}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Proveedor:</span>
                <span className="col-span-2">{product.proveedor?.nombre || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Unidad:</span>
                <span className="col-span-2">{product.unidad}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Box className="h-4 w-4" />
              INVENTARIO GENERAL
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Stock Total:</span>
                <span className="col-span-2 font-semibold text-lg">{product.stock_actual}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <span className="col-span-2">
                  <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Distribución por Hotel */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              DISPONIBILIDAD POR HOTEL
            </h3>
            {loadingInv ? (
              <div className="text-sm text-muted-foreground">Cargando disponibilidad...</div>
            ) : inventario.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8">Sede / Hotel</TableHead>
                      <TableHead className="h-8 text-right">Stock</TableHead>
                      <TableHead className="h-8 text-right">Última Act.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventario.map((inv, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{inv.hotel}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={inv.stock > 0 ? "outline" : "secondary"}>
                            {inv.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(inv.ultimaActualizacion)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No hay registro de stock distribuido aún (Stock sin asignar).
              </div>
            )}
          </div>

          <Separator />

          {/* Precios */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              PRECIOS
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Precio Venta:</span>
                <span className="col-span-2 font-semibold text-green-600">
                  {formatCurrency(product.precio)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fechas */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              FECHAS
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm text-muted-foreground">Fecha Creación:</span>
                <span className="col-span-2 text-sm">{formatDate(product.fecha_creacion)}</span>
              </div>
              {product.fecha_vencimiento && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Fecha Vencimiento:</span>
                  <span className="col-span-2 text-sm">
                    {formatDate(product.fecha_vencimiento)}
                    {isExpiringSoon() && (
                      <Badge variant="secondary" className="ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Próximo a vencer
                      </Badge>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
