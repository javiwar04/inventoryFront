"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { salidasService, type Salida, registrarAuditoria, proveedoresService } from "@/lib/api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ExitDetailDialog } from "@/components/exit-detail-dialog"
import { useAuth } from "@/contexts/auth-context"

export function ExitsTable() {
  const { user } = useAuth()
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
      // FIX: Limitamos a 50
      const data = await salidasService.getAll(1, 50)

      // Si es empleado, filtrar solo sus salidas (Lógica de Hotel/Sucursal por Usuario)
      let filteredData = data
      if (user?.rol === 'empleado' && user.id) {
        if (user.sedeId && user.sedeId !== 0) {
            // Si tiene sede asignada, intentamos filtrar por Destino = Nombre Sede
            try {
                // TODO: Idealmente esto debería venir del backend o estar en el contexto
                const proveedores = await proveedoresService.getAll()
                const miSede = proveedores.find(p => p.id === user.sedeId)
                if (miSede) {
                    const nombreSede = miSede.nombre.trim().toLowerCase()
                    filteredData = data.filter(item => 
                        (item.destino?.trim().toLowerCase() === nombreSede) || (item.creadoPor === user.id)
                    )
                } else {
                    filteredData = data.filter(item => item.creadoPor === user.id)
                }
            } catch (error) {
                console.error('Error al filtrar por sede:', error)
                filteredData = data.filter(item => item.creadoPor === user.id)
            }
        } else {
            filteredData = data.filter(item => item.creadoPor === user.id)
        }
      }

      console.log('=== SALIDAS CARGADAS ===', filteredData) // Debug
      setItems(filteredData)
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
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC' // UTC para evitar el desfase de dia (T00:00-06:00 = dia anterior)
    })
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
            {visibleItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay salidas registradas
                </TableCell>
              </TableRow>
            ) : (
              visibleItems.map(salida => (
                <TableRow key={salida.id}>
                  <TableCell className="font-mono font-semibold">{salida.numeroSalida}</TableCell>
                  <TableCell>{formatDate(salida.fechaSalida)}</TableCell>
                  <TableCell>
                    {(salida.metodoPago === 'Cortesía' || salida.metodoPago?.includes('Cortes')) ? 'Cortesía' : salida.motivo}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{salida.destino || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(salida.detalles?.length || salida.detalleSalida?.length || (salida as any).DetalleSalida?.length || 0)} items
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

      {/* Pagination controls */}
      <div className="flex items-center justify-between p-3">
        <div className="text-sm text-muted-foreground">Mostrando {((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, items.length)} de {items.length}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>Primera</Button>
          <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Anterior</Button>
          <input type="number" className="w-16 text-center rounded border px-1" min={1} max={totalPages} value={currentPage} onChange={(e) => { const v = Number(e.target.value) || 1; setCurrentPage(Math.min(Math.max(1, v), totalPages)) }} />
          <span className="text-sm self-center">/ {totalPages}</span>
          <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Siguiente</Button>
          <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Última</Button>
        </div>
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
