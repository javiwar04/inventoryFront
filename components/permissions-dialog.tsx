"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { usuariosService, permisosService, type Usuario, type Permiso, type UsuarioPermiso } from "@/lib/api"
import { Loader2, Shield } from "lucide-react"

interface PermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Usuario | null
  currentUserId?: number
}

export function PermissionsDialog({
  open,
  onOpenChange,
  user,
  currentUserId
}: PermissionsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [permisosUsuario, setPermisosUsuario] = useState<UsuarioPermiso[]>([])
  const [selectedPermisos, setSelectedPermisos] = useState<Set<number>>(new Set())

  // Cargar permisos disponibles y permisos del usuario
  useEffect(() => {
    if (open && user) {
      loadData()
    }
  }, [open, user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [todosPermisos, permisosDelUsuario] = await Promise.all([
        permisosService.getAll(),
        usuariosService.getPermisos(user.id)
      ])

      setPermisos(todosPermisos)
      setPermisosUsuario(permisosDelUsuario)

      // Inicializar permisos seleccionados
      const permisosIds = new Set(permisosDelUsuario.map(p => p.permisoId))
      setSelectedPermisos(permisosIds)
    } catch (error: any) {
      console.error("Error al cargar permisos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePermiso = (permisoId: number) => {
    setSelectedPermisos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(permisoId)) {
        newSet.delete(permisoId)
      } else {
        newSet.add(permisoId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Determinar qué permisos agregar y qué permisos revocar
      const permisosActuales = new Set(permisosUsuario.map(p => p.permisoId))
      const permisosNuevos = selectedPermisos

      // Permisos a asignar (están en nuevos pero no en actuales)
      const aAsignar = Array.from(permisosNuevos).filter(id => !permisosActuales.has(id))
      
      // Permisos a revocar (están en actuales pero no en nuevos)
      const aRevocar = Array.from(permisosActuales).filter(id => !permisosNuevos.has(id))

      // Ejecutar asignaciones
      for (const permisoId of aAsignar) {
        await usuariosService.asignarPermiso(user.id, permisoId, currentUserId)
      }

      // Ejecutar revocaciones
      for (const permisoId of aRevocar) {
        await usuariosService.revocarPermiso(user.id, permisoId)
      }

      toast({
        title: "Permisos actualizados",
        description: `Se han actualizado los permisos de ${user.nombre}`
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al guardar permisos:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    const modulo = permiso.modulo || "General"
    if (!acc[modulo]) {
      acc[modulo] = []
    }
    acc[modulo].push(permiso)
    return acc
  }, {} as Record<string, Permiso[]>)

  const modulos = Object.keys(permisosPorModulo).sort()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestionar Permisos
          </DialogTitle>
          <DialogDescription>
            {user && (
              <>
                Asigna o revoca permisos para <strong>{user.nombre}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {modulos.map(modulo => (
                <div key={modulo} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold">
                      {modulo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {permisosPorModulo[modulo].length} permisos
                    </span>
                  </div>

                  <div className="grid gap-2 pl-2 border-l-2 border-muted">
                    {permisosPorModulo[modulo].map(permiso => (
                      <div
                        key={permiso.id}
                        className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={`permiso-${permiso.id}`}
                          checked={selectedPermisos.has(permiso.id)}
                          onCheckedChange={() => togglePermiso(permiso.id)}
                          disabled={saving}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`permiso-${permiso.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {permiso.nombre}
                          </Label>
                          {permiso.descripcion && (
                            <p className="text-xs text-muted-foreground">
                              {permiso.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {modulos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay permisos disponibles</p>
                  <p className="text-sm">Crea permisos desde el módulo de permisos</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedPermisos.size} permisos seleccionados
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
