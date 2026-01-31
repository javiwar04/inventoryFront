"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TransferenciaListDto } from "@/services/transferencias"
import { format } from "date-fns"

interface DetallesTransferenciaDialogProps {
  transferencia: TransferenciaListDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DetallesTransferenciaDialog({ transferencia, open, onOpenChange }: DetallesTransferenciaDialogProps) {
  if (!transferencia) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles de Transferencia {transferencia.numeroTransferencia}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Fecha:</span>
            <p>{transferencia.fechaTransferencia}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Estado:</span>
            <div>
                <Badge variant={transferencia.estado === 'completada' ? 'default' : 'secondary'}>
                    {transferencia.estado}
                </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Origen:</span>
            <p className="font-medium">{transferencia.hotelOrigenNombre}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Destino:</span>
            <p className="font-medium">{transferencia.hotelDestinoNombre}</p>
          </div>
          <div className="col-span-2 space-y-1">
            <span className="font-semibold text-muted-foreground">Observaciones:</span>
            <p className="whitespace-pre-wrap text-muted-foreground">{transferencia.observaciones || "Sin observaciones"}</p>
          </div>
        </div>

        <div className="border rounded-md mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferencia.detalles.map((detalle, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{detalle.productoNombre}</TableCell>
                  <TableCell>{detalle.productoSku}</TableCell>
                  <TableCell>{detalle.cantidad}</TableCell>
                  <TableCell>{detalle.lote || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
