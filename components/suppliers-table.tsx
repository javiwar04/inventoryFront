"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Pencil, Trash2, Search, Phone, Mail, Loader2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { proveedoresService, type Proveedor, registrarAuditoria } from "@/lib/api"
import { SupplierDialog } from "./supplier-dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SuppliersTableProps {
  onSupplierChange?: () => void
}

export function SuppliersTable({ onSupplierChange }: SuppliersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Proveedor | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Proveedor | null>(null)

  // Cargar proveedores desde la API
  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await proveedoresService.getAll()
      setSuppliers(data)
    } catch (err: any) {
      console.error('Error loading suppliers:', err)
      const errorMessage = err.message || 'Error al cargar proveedores'
      setError(errorMessage)
      toast.error("Error al cargar datos", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplier: Proveedor) => {
    setSelectedSupplier(supplier)
  }

  const handleDelete = (supplier: Proveedor) => {
    setSupplierToDelete(supplier)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!supplierToDelete) return
    const id = supplierToDelete.id
    const supplierName = supplierToDelete.nombre || 'Proveedor'

    try {
      setDeleteLoading(id)
      await proveedoresService.delete(id)
      toast.success("Proveedor eliminado", {
        description: `${supplierName} ha sido eliminado del sistema.`,
      })
      await loadSuppliers()
      onSupplierChange?.()
      try {
        await registrarAuditoria({
          accion: 'eliminar',
          modulo: 'proveedores',
          descripcion: `Proveedor eliminado: ${supplierName}`,
          detalles: JSON.stringify(supplierToDelete),
          registroId: id
        })
      } catch (e) {
        console.warn('No se pudo registrar auditoría (proveedor eliminar)', e)
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err)
      toast.error("Error al eliminar", {
        description: err.message || 'No se pudo eliminar el proveedor.',
      })
    } finally {
      setDeleteLoading(null)
      setConfirmOpen(false)
      setSupplierToDelete(null)
    }
  }

  const handleSupplierSuccess = () => {
    setSelectedSupplier(null)
    loadSuppliers()
    onSupplierChange?.()
  }

  // Cerrar diálogo cuando se actualiza la lista
  useEffect(() => {
    if (selectedSupplier) {
      // Si el proveedor seleccionado ya no existe en la lista, cerrar el diálogo
      const exists = suppliers.find(s => s.id === selectedSupplier.id)
      if (!exists) {
        setSelectedSupplier(null)
      }
    }
  }, [suppliers, selectedSupplier])

  // Filtrar proveedores
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.nit?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize))
  const visibleSuppliers = filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cargando proveedores..."
              disabled
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando proveedores...</span>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar proveedores: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredSuppliers.length} proveedores
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {suppliers.length === 0 ? 'No hay proveedores registrados' : 'No se encontraron proveedores'}
                </TableCell>
              </TableRow>
            ) : (
              visibleSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.nombre}</TableCell>
                  <TableCell>{supplier.contacto || '-'}</TableCell>
                  <TableCell>
                    {supplier.telefono ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {supplier.telefono}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.email ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{supplier.nit || '-'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={supplier.estado === 'Activo' ? "default" : "secondary"} 
                      className={supplier.estado === 'Activo'
                        ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" 
                        : "bg-red-500/10 text-red-700 hover:bg-red-500/20"
                      }
                    >
                      {supplier.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={deleteLoading === supplier.id}
                        >
                          {deleteLoading === supplier.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(supplier)}
                        >
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
        {/* Pagination */}
        <div className="flex items-center justify-between p-3">
          <div className="text-sm text-muted-foreground">Mostrando {((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, filteredSuppliers.length)} de {filteredSuppliers.length}</div>
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
      
      {/* Diálogo de edición */}
      {selectedSupplier && (
        <SupplierDialog
          supplier={selectedSupplier}
          onSuccess={handleSupplierSuccess}
        />
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="text-destructive">
              {deleteLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
