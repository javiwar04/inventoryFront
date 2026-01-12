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
import { Plus, Loader2, Building2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { proveedoresService, type Proveedor, registrarAuditoria } from "@/lib/api"

interface SupplierDialogProps {
  supplier?: Proveedor | null
  onSuccess?: () => void
}

export function SupplierDialog({ supplier, onSuccess }: SupplierDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!supplier

  // Controlar apertura/cierre del diálogo
  useEffect(() => {
    if (supplier) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [supplier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const proveedorData = {
        nombre: formData.get('name') as string,
        contacto: formData.get('contact') as string || null,
        telefono: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        direccion: formData.get('address') as string || null,
        nit: formData.get('nit') as string || null,
        estado: 'Activo',
        creadoPor: user?.id || 1, // ID del usuario actual
      }

      console.log('Datos a enviar:', proveedorData)

      if (isEditing && supplier) {
        await proveedoresService.update(supplier.id, proveedorData)
        toast.success("Hotel actualizado", {
          description: `${proveedorData.nombre} ha sido actualizado correctamente.`,
        })
        try {
          registrarAuditoria({
            accion: 'actualizar',
            modulo: 'proveedores',
            descripcion: `Hotel actualizado: ${proveedorData.nombre}`,
            detalles: JSON.stringify({ id: supplier.id, ...proveedorData }),
            registroId: supplier.id
          })
        } catch (e) {
          console.warn('No se pudo registrar auditoría (proveedor actualizar)', e)
        }
      } else {
        await proveedoresService.create(proveedorData)
        toast.success("Hotel agregado", {
          description: `${proveedorData.nombre} ha sido agregado al sistema.`,
        })
        try {
          // registrar auditoría para creación
          registrarAuditoria({
            accion: 'crear',
            modulo: 'proveedores',
            descripcion: `Hotel creado: ${proveedorData.nombre}`,
            detalles: JSON.stringify(proveedorData),
            registroId: undefined
          })
        } catch (e) {
          console.warn('No se pudo registrar auditoría (proveedor crear)', e)
        }
      }

      // Limpiar formulario y cerrar diálogo
      const form = e.target as HTMLFormElement
      form.reset()
      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error saving supplier:', err)
      console.error('Response status:', err.response?.status)
      console.error('Response data:', err.response?.data)
      console.error('Response headers:', err.response?.headers)
      
      let errorMessage = 'Error al guardar proveedor'
      
      if (err.response?.status === 500) {
        const responseData = err.response?.data
        
        // Detectar errores de duplicados
        if (typeof responseData === 'string') {
          if (responseData.includes('UNIQUE KEY constraint') || responseData.includes('duplicate key')) {
            // Extraer qué campo está duplicado
            if (responseData.includes('telefono') || responseData.match(/duplicate key value is \((\d+)\)/)) {
              errorMessage = 'Ya existe un proveedor con este número de teléfono.'
            } else if (responseData.includes('email')) {
              errorMessage = 'Ya existe un proveedor con este correo electrónico.'
            } else if (responseData.includes('nit')) {
              errorMessage = 'Ya existe un proveedor con este NIT.'
            } else {
              errorMessage = 'Ya existe un proveedor con estos datos. Por favor, verifica los campos únicos.'
            }
          } else if (responseData.includes('foreign key constraint')) {
            errorMessage = 'Error de relación con otros datos. Contacta al administrador.'
          } else {
            errorMessage = 'Error interno del servidor. Verifica que los datos sean correctos.'
          }
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.errors) {
        // Errores de validación de .NET
        const errors = Object.values(err.response.data.errors).flat()
        errorMessage = errors.join(', ')
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data)
      } else {
        errorMessage = err.message
      }
      
      toast.error("Error al guardar", {
        description: errorMessage,
      })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Limpiar estado cuando se cierra el diálogo
      setError(null)
      onSuccess?.() // Esto limpiará selectedSupplier en el componente padre
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="gradient-primary hover-lift smooth-transition shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Modifica los datos del proveedor.' : 'Registra un nuevo proveedor para el sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Proveedor *</Label>
              <Input 
                id="name" 
                name="name"
                placeholder="Ej: Distribuidora Beauty Pro" 
                defaultValue={supplier?.nombre || ''}
                required 
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact">Persona de Contacto</Label>
                <Input 
                  id="contact" 
                  name="contact"
                  placeholder="Ej: Juan Pérez" 
                  defaultValue={supplier?.contacto || ''}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel" 
                  placeholder="Ej: 5555-5555" 
                  defaultValue={supplier?.telefono || ''}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="proveedor@ejemplo.com" 
                  defaultValue={supplier?.email || ''}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nit">NIT</Label>
                <Input 
                  id="nit" 
                  name="nit"
                  placeholder="Ej: 12345678-9" 
                  defaultValue={supplier?.nit || ''}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input 
                id="address" 
                name="address"
                placeholder="Dirección completa del proveedor" 
                defaultValue={supplier?.direccion || ''}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar Proveedor</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
