"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const AVAILABLE_PERMISSIONS = [
  { id: "productos.ver", label: "Ver Productos" },
  { id: "productos.crear", label: "Crear Productos" },
  { id: "productos.editar", label: "Editar Productos" },
  { id: "productos.eliminar", label: "Eliminar Productos" },
  { id: "entradas.ver", label: "Ver Entradas" },
  { id: "entradas.crear", label: "Crear Entradas" },
  { id: "salidas.ver", label: "Ver Salidas" },
  { id: "salidas.crear", label: "Crear Salidas" },
  { id: "reportes.ver", label: "Ver Reportes" },
  { id: "reportes.exportar", label: "Exportar Reportes" },
]

export function UserDialog() {
  const [open, setOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const handleRoleChange = (role: string) => {
    // Auto-seleccionar permisos según el rol
    if (role === "admin") {
      setSelectedPermissions(["*"])
    } else if (role === "gerente") {
      setSelectedPermissions([
        "productos.ver",
        "productos.crear",
        "productos.editar",
        "entradas.ver",
        "entradas.crear",
        "salidas.ver",
        "salidas.crear",
        "reportes.ver",
      ])
    } else if (role === "empleado") {
      setSelectedPermissions(["productos.ver", "entradas.ver", "salidas.ver"])
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>Crea un nuevo usuario y asigna sus permisos de acceso al sistema</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input id="nombre" placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input id="usuario" placeholder="jperez" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="juan@barberia.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="empleado">Empleado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permisos de Acceso</Label>
            <div className="rounded-lg border p-4 space-y-3">
              {selectedPermissions.includes("*") ? (
                <div className="text-sm text-muted-foreground">
                  Este usuario tiene acceso completo a todas las funciones del sistema
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setOpen(false)}>Crear Usuario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
