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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usuariosService, proveedoresService, type Usuario, type Proveedor } from "@/lib/api"
import * as bcrypt from "bcryptjs"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: Usuario | null
  onSuccess?: () => void
  currentUserId?: number // ID del usuario logueado para saber quién crea
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  currentUserId
}: UserDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  
  const [formData, setFormData] = useState({
    nombre: "",
    usuario1: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "empleado",
    estado: "activo",
    avatar: "",
    sedeId: "0" // "0" o string vacía para indicar "sin sede"
  })

  useEffect(() => {
    loadProveedores()
  }, [])

  const loadProveedores = async () => {
    try {
      const data = await proveedoresService.getAll()
      // Filtrar por activo ignorando mayúsculas/minúsculas
      setProveedores(data.filter(p => p.estado?.toLowerCase() === 'activo'))
    } catch (e) {
      console.error("Error cargando proveedores/sedes", e)
    }
  }

  useEffect(() => {
    if (user) {
      // Modo edición
      setFormData({
        nombre: user.nombre || "",
        usuario1: user.usuario1 || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        rol: user.rol || "empleado",
        estado: user.estado || "activo",
        avatar: user.avatar || "",
        sedeId: user.sedeId ? user.sedeId.toString() : "0"
      })
    } else {
      // Modo creación - resetear formulario
      setFormData({
        nombre: "",
        usuario1: "",
        email: "",
        password: "",
        confirmPassword: "",
        rol: "empleado",
        estado: "activo",
        avatar: "",
        sedeId: "0"
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.usuario1.trim()) {
      toast({
        title: "Error",
        description: "El usuario es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive"
      })
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "El formato del email no es válido",
        variant: "destructive"
      })
      return
    }

    // Si es creación, password es obligatorio
    if (!user && !formData.password) {
      toast({
        title: "Error",
        description: "La contraseña es requerida",
        variant: "destructive"
      })
      return
    }

    // Si hay password, validar que coincida
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      })
      return
    }

    // Validar longitud de password
    if (formData.password && formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      if (user) {
        // Actualizar usuario existente
        const updateData: any = {
          nombre: formData.nombre.trim(),
          usuario1: formData.usuario1.trim(),
          email: formData.email.trim(),
          rol: formData.rol,
          estado: formData.estado,
          avatar: formData.avatar.trim() || null,
          sedeId: formData.rol === 'empleado' && formData.sedeId !== "0" ? Number(formData.sedeId) : null
        }

        // Si hay nueva contraseña, hashearla
        if (formData.password) {
          const salt = await bcrypt.genSalt(10)
          const passwordHash = await bcrypt.hash(formData.password, salt)
          updateData.passwordHash = passwordHash
        } else {
          // Si no hay nueva contraseña, mantener la existente
          updateData.passwordHash = user.passwordHash
        }

        await usuariosService.update(user.id, updateData)

        toast({
          title: "Usuario actualizado",
          description: "El usuario se ha actualizado correctamente"
        })
      } else {
        // Crear nuevo usuario
        // Hashear password
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(formData.password, salt)

        const newUserData = {
          nombre: formData.nombre.trim(),
          usuario1: formData.usuario1.trim(),
          email: formData.email.trim(),
          passwordHash,
          rol: formData.rol,
          estado: formData.estado,
          avatar: formData.avatar.trim() || null,
          sedeId: formData.rol === 'empleado' && formData.sedeId !== "0" ? Number(formData.sedeId) : null,
          creadoPor: currentUserId && currentUserId > 0 ? currentUserId : undefined // undefined para omitir el campo
        }

        console.log("📤 Datos que se enviarán al backend:", newUserData)

        await usuariosService.create(newUserData)

        toast({
          title: "Usuario creado",
          description: "El usuario se ha creado correctamente"
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al guardar usuario:", error)
      
      // Detectar errores comunes y mostrar mensajes más claros
      let errorMessage = error.message || "No se pudo guardar el usuario"
      
      // Error de usuario duplicado
      if (errorMessage.includes("usuario") || errorMessage.includes("Usuario1") || errorMessage.includes("UQ__usuarios__9AFF8FC6")) {
        errorMessage = "Ya existe un usuario con ese nombre de usuario"
      }
      // Error de email duplicado
      else if (errorMessage.includes("email") || errorMessage.includes("Email") || errorMessage.includes("UQ__usuarios__AB6E6164")) {
        errorMessage = "Ya existe un usuario con ese email"
      }
      // Error genérico de valor duplicado
      else if (errorMessage.includes("Ya existe") || errorMessage.includes("duplicate") || errorMessage.includes("UNIQUE")) {
        errorMessage = "El usuario o email ya están registrados en el sistema"
      }
      
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Modifica los datos del usuario"
              : "Completa los datos para crear un nuevo usuario"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nombre completo */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Juan Pérez"
              />
            </div>

            {/* Usuario */}
            <div className="grid gap-2">
              <Label htmlFor="usuario1">
                Usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usuario1"
                value={formData.usuario1}
                onChange={(e) =>
                  setFormData({ ...formData, usuario1: e.target.value })
                }
                placeholder="juanperez"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="juan@example.com"
              />
            </div>

            {/* Contraseña */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Contraseña {!user && <span className="text-red-500">*</span>}
                {user && <span className="text-sm text-muted-foreground ml-2">(dejar vacío para no cambiar)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>

            {/* Confirmar contraseña */}
            {formData.password && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  Confirmar contraseña <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Rol */}
            <div className="grid gap-2">
              <Label htmlFor="rol">
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.rol}
                onValueChange={(value) =>
                  setFormData({ ...formData, rol: value })
                }
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sede / Sucursal (Solo para Empleados) */}
            {formData.rol === 'empleado' && (
              <div className="grid gap-2">
                <Label htmlFor="sede">
                  Sede / Sucursal Asignada (Hotel)
                </Label>
                <Select
                  value={formData.sedeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sedeId: value })
                  }
                >
                  <SelectTrigger id="sede">
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">-- Sin sede asignada --</SelectItem>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id.toString()}>
                        {prov.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El usuario solo podrá ver información relacionada a esta sede.
                </p>
              </div>
            )}

            {/* Estado */}
            <div className="grid gap-2">
              <Label htmlFor="estado">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.estado}
                onValueChange={(value) =>
                  setFormData({ ...formData, estado: value })
                }
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Avatar URL (opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="avatar">
                Avatar URL <span className="text-sm text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
