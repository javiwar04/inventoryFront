"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Pencil, Trash2, Search, Loader2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CategoryDialog } from "@/components/category-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { categoriasService, registrarAuditoria } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  codigo?: string
  estado?: string
}

export function CategoriesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<Categoria[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar categorías desde la API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await categoriasService.getAll()
        setCategories(data)
      } catch (err: any) {
        console.error('Error loading categories:', err)
        setError(err.message || 'Error al cargar categorías')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()

    // Escuchar eventos globales para refrescar sin recargar la página
    const onCreated = (e: Event) => {
      const detail = (e as CustomEvent).detail as Categoria
      setCategories(prev => [...prev, detail])
    }
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as Categoria
      setCategories(prev => prev.map(c => c.id === detail.id ? { ...c, ...detail } : c))
    }
    window.addEventListener('categories:created', onCreated)
    window.addEventListener('categories:updated', onUpdated)
    return () => {
      window.removeEventListener('categories:created', onCreated)
      window.removeEventListener('categories:updated', onUpdated)
    }
  }, [])

  // Filtrar categorías
  const filteredCategories = categories.filter(
    (category) =>
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize))
  const visibleCategories = filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cargando categorías..."
              disabled
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando categorías...</span>
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
            Error al cargar categorías: {error}
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
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredCategories.length} categorías
        </Badge>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {/* Edit dialog */}
        {selectedCategory && (
          <CategoryDialog
            category={selectedCategory}
            onSuccess={async () => {
              setSelectedCategory(null)
              // reload
              try {
                const data = await categoriasService.getAll()
                setCategories(data)
              } catch (err) {
                console.error(err)
              }
            }}
          />
        )}

        {/* Delete confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (deleteId == null) return
                const cat = categories.find(c => c.id === deleteId)
                try {
                  await categoriasService.delete(deleteId)
                  setCategories((prev) => prev.filter(c => c.id !== deleteId))
                  const code = (cat as any)?.codigo
                  const label = code || cat?.nombre || `#${deleteId}`
                  toast.success('Categoría eliminada', { description: `Se eliminó la categoría ${label}` })
                  // Registrar auditoría
                  try {
                    await registrarAuditoria({
                      accion: 'eliminar',
                      modulo: 'categorias',
                      descripcion: `Categoría eliminada: ${label}`,
                      detalles: JSON.stringify(cat ?? { id: deleteId }),
                      registroId: deleteId
                    })
                  } catch (e) {
                    console.warn('No se pudo registrar auditoría (categoría eliminar)', e)
                  }
                } catch (err: any) {
                  console.error('Error deleting category', err)
                  toast.error('Error al eliminar', { description: err?.message || 'No se pudo eliminar la categoría' })
                } finally {
                  setDeleteId(null)
                }
              }}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {categories.length === 0 ? 'No hay categorías registradas' : 'No se encontraron categorías'}
                </TableCell>
              </TableRow>
            ) : (
              visibleCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-sm">{(category as any).codigo ?? '-'}</TableCell>
                  <TableCell className="font-medium">{category.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.descripcion || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedCategory(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(category.id)}>
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
          <div className="text-sm text-muted-foreground">Mostrando {((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, filteredCategories.length)} de {filteredCategories.length}</div>
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
    </div>
  )
}
