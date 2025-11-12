"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { salidasService, type Salida, registrarAuditoria } from "@/lib/api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ExitDetailDialog } from "@/components/exit-detail-dialog"

export function ExitsTable() {
  const [items, setItems] = useState<Salida[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedSalida, setSelectedSalida] = useState<Salida | null>(null)

  useEffect(() => {
    loadData()
    
    const onCreated = () => loadData()
    window.addEventListener('salidas:created', onCreated)
    return () => window.removeEventListener('salidas:created', onCreated)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await salidasService.getAll()
      console.log('=== SALIDAS CARGADAS ===', data) // Debug
      setItems(data)
    } catch (err: any) {
      toast.error('Error al cargar salidas', { description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const salida = items.find(x => x.id === deleteId)
      await salidasService.delete(deleteId)
      toast.success('Salida eliminada')
      setItems(prev => prev.filter(x => x.id !== deleteId))
      // Registrar auditoría
      try {
        await registrarAuditoria({
          accion: 'eliminar',
          modulo: 'salidas',
          descripcion: `Salida eliminada: ${salida?.numeroSalida ?? ('#' + deleteId)}`,
          detalles: JSON.stringify(salida ?? { id: deleteId }),
          registroId: deleteId
        })
      } catch (e) {
        console.warn('No se pudo registrar auditoría (salida eliminar)', e)
      }
      setDeleteId(null)
    } catch (err: any) {
      toast.error('Error al eliminar', { description: err?.message })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' })
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
              <TableHead>Motivo</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay salidas registradas
                </TableCell>
              </TableRow>
            ) : (
              items.map(salida => (
                <TableRow key={salida.id}>
                  <TableCell className="font-mono font-semibold">{salida.numeroSalida}</TableCell>
                  <TableCell>{formatDate(salida.fechaSalida)}</TableCell>
                  <TableCell>{salida.motivo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{salida.destino || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(salida.detalleSalida?.length || (salida as any).DetalleSalida?.length || 0)} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={salida.estado === 'completada' ? 'default' : 'secondary'}>
                      {salida.estado}
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
                        <DropdownMenuItem onClick={() => setSelectedSalida(salida)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(salida.id)}>
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

      <ExitDetailDialog 
        salida={selectedSalida}
        open={!!selectedSalida}
        onOpenChange={(open) => !open && setSelectedSalida(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar salida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la salida del sistema.
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
