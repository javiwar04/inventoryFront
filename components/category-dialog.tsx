"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { categoriasService } from "@/lib/api"
interface Categoria {
  id: number
  nombre: string
  descripcion?: string | null
}
import { toast } from "sonner"

interface CategoryDialogProps {
  category?: Categoria | null
  // onSuccess receives the created/updated category (if available) so parent can optimistically update
  onSuccess?: (categoria?: any) => void
}

export function CategoryDialog({ category, onSuccess }: CategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = !!category

  useEffect(() => {
    if (category) setOpen(true)
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const nombre = (formData.get('name') as string) || ''
  // generar codigo tipo slug corto igual que en backend (máx 10 caracteres)
  const slugBase = nombre.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '')
  const generatedCodigo = slugBase.length > 0 ? slugBase.substring(0, Math.min(10, slugBase.length)) : (Math.random().toString(36).substring(2, 8)).toUpperCase()
    const codeFromInput = (formData.get('code') as string) || ''
    const codigo = codeFromInput.trim().length > 0 ? codeFromInput.trim() : generatedCodigo

    const payload = {
      nombre,
      codigo,
      descripcion: (formData.get('description') as string) || undefined,
  // usar mismo default que la BD: 'activa'
  estado: (formData.get('estado') as string) || 'activa'
    }

    try {
      if (isEditing && category) {
        await categoriasService.update(category.id, payload)
        toast.success('Categoría actualizada', { description: `${payload.nombre} ha sido actualizado.` })
        const updated = { ...category, ...payload }
        onSuccess?.(updated)
        // Disparar evento global para actualización inmediata (optimista)
        window.dispatchEvent(new CustomEvent('categories:updated', { detail: updated }))
      } else {
        const created = await categoriasService.create(payload)
        toast.success('Categoría creada', { description: `${payload.nombre} ha sido creada.` })
        onSuccess?.(created || payload)
        // Disparar evento global con la nueva categoría
        window.dispatchEvent(new CustomEvent('categories:created', { detail: created || payload }))
      }

      form.reset()
      setOpen(false)
    } catch (err: any) {
      console.error('Error guardando categoría:', err)
      toast.error('Error', { description: err?.message || 'No se pudo guardar la categoría.' })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // no auto-callback on close to avoid redundant reloads
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Categoría' : 'Agregar Nueva Categoría'}</DialogTitle>
            <DialogDescription>{isEditing ? 'Modifica los datos de la categoría.' : 'Crea una nueva categoría para organizar tus productos.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Categoría</Label>
              <Input id="name" name="name" placeholder="Ej: Cuidado Capilar" defaultValue={category?.nombre || ''} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" placeholder="Ej: CAP" defaultValue={(category as any)?.codigo || ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" placeholder="Descripción de la categoría..." rows={3} defaultValue={category?.descripcion || ''} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar Categoría</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
