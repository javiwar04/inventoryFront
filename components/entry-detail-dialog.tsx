"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import type { Entrada } from "@/lib/api"
import { Package, Calendar, FileText, Building, DollarSign, AlertCircle } from "lucide-react"

interface EntryDetailDialogProps {
  entrada: Entrada | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EntryDetailDialog({ entrada, open, onOpenChange }: EntryDetailDialogProps) {
  if (!entrada) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper para fechas que vienen como "YYYY-MM-DD" o UTC midnight
  const formatDateOnly = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      maximumFractionDigits: 2
    }).format(value)
  }

  const detalles = entrada.detalleEntrada || (entrada as any).DetalleEntrada || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de Entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Número de Entrada</p>
                  <p className="font-mono font-bold text-lg">{entrada.numeroEntrada}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Entrada</p>
                  <p className="font-medium">{formatDateOnly(entrada.fechaEntrada)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <p className="font-medium">{entrada.proveedor?.nombre || 'Sin proveedor'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Número de Factura</p>
                  <p className="font-medium">{entrada.numeroFactura || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg text-accent">{formatCurrency(entrada.total || 0)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={entrada.estado === 'completada' ? 'default' : 'secondary'} className="mt-1">
                    {entrada.estado}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {entrada.observaciones && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Observaciones</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{entrada.observaciones}</p>
            </div>
          )}

          <Separator />

          {/* Productos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({detalles.length})
            </h3>
            
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay productos en esta entrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((detalle: any, index: number) => (
                      <TableRow key={detalle.id || index}>
                        <TableCell className="font-medium">
                          {detalle.producto?.nombre || detalle.Producto?.Nombre || 'Producto desconocido'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {detalle.producto?.sku || detalle.Producto?.SKU || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{detalle.cantidad}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(detalle.precioUnitario || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(detalle.subtotal || (detalle.cantidad * detalle.precioUnitario))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {detalle.lote || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {detalle.fechaVencimiento 
                            ? new Date(detalle.fechaVencimiento).toLocaleDateString('es-GT')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Resumen de totales */}
            {detalles.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="bg-muted p-4 rounded-lg min-w-[300px]">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-accent">{formatCurrency(entrada.total || 0)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {detalles.reduce((sum: number, d: any) => sum + d.cantidad, 0)} productos totales
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fechas adicionales */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>Creado: {formatDate(entrada.fechaCreacion)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
