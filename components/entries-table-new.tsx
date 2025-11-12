"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { entradasService, type Entrada, registrarAuditoria } from "@/lib/api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EntryDetailDialog } from "@/components/entry-detail-dialog"

export function EntriesTable() {
  const [items, setItems] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedEntrada, setSelectedEntrada] = useState<Entrada | null>(null)

  useEffect(() => {
    loadData()
    
    const onCreated = () => loadData()
    window.addEventListener('entradas:created', onCreated)
    return () => window.removeEventListener('entradas:created', onCreated)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await entradasService.getAll()
      console.log('=== ENTRADAS CARGADAS ===', data) // Debug
      setItems(data)
    } catch (err: any) {
      toast.error('Error al cargar entradas', { description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const entrada = items.find(x => x.id === deleteId)
      await entradasService.delete(deleteId)
      toast.success('Entrada eliminada')
      setItems(prev => prev.filter(x => x.id !== deleteId))
      // Registrar auditoría
      try {
        await registrarAuditoria({
          accion: 'eliminar',
          modulo: 'entradas',
          descripcion: `Entrada eliminada: ${entrada?.numeroEntrada ?? ('#' + deleteId)}`,
          detalles: JSON.stringify(entrada ?? { id: deleteId }),
          registroId: deleteId
        })
      } catch (e) {
        console.warn('No se pudo registrar auditoría (entrada eliminar)', e)
      }
      setDeleteId(null)
    } catch (err: any) {
      toast.error('Error al eliminar', { description: err?.message })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay entradas registradas
                </TableCell>
              </TableRow>
            ) : (
              items.map(entrada => (
                <TableRow key={entrada.id}>
                  <TableCell className="font-mono font-semibold">{entrada.numeroEntrada}</TableCell>
                  <TableCell>{formatDate(entrada.fechaEntrada)}</TableCell>
                  <TableCell>{entrada.proveedor?.nombre || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entrada.numeroFactura || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(entrada.total)}</TableCell>
                  <TableCell>
                    <Badge variant={entrada.estado === 'completada' ? 'default' : 'secondary'}>
                      {entrada.estado}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => setSelectedEntrada(entrada)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(entrada.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EntryDetailDialog 
        entrada={selectedEntrada}
        open={!!selectedEntrada}
        onOpenChange={(open) => !open && setSelectedEntrada(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la entrada del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
