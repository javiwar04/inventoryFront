"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import type { Salida } from "@/lib/api"
import { Package, Calendar, FileText, MapPin, AlertCircle } from "lucide-react"

interface ExitDetailDialogProps {
  salida: Salida | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExitDetailDialog({ salida, open, onOpenChange }: ExitDetailDialogProps) {
  if (!salida) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper para fechas que vienen como "YYYY-MM-DD" o UTC midnight (evitar desfase horario)
  const formatDateOnly = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    })
  }

  const detalles = salida.detalleSalida || (salida as any).DetalleSalida || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles de Salida</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información general */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Número de Salida</p>
                  <p className="font-mono font-bold text-lg">{salida.numeroSalida}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Salida</p>
                  <p className="font-medium">{formatDateOnly(salida.fechaSalida)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <p className="font-medium">{salida.motivo}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Destino</p>
                  <p className="font-medium">{salida.destino || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={salida.estado === 'completada' ? 'default' : 'secondary'} className="mt-1">
                    {salida.estado}
                  </Badge>
                </div>
              </div>

              {salida.referencia && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Referencia</p>
                    <p className="font-medium">{salida.referencia}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {salida.observaciones && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Observaciones</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{salida.observaciones}</p>
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
                    <TableHead>Lote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay productos en esta salida
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
                        <TableCell className="text-sm text-muted-foreground">
                          {detalle.lote || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Fechas adicionales */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p>Creado: {formatDate(salida.fechaCreacion)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
