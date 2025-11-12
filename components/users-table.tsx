"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Edit, Trash2, Shield, CheckCircle2, XCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"
import { usuariosService, type Usuario, registrarAuditoria } from "@/lib/api"
import { UserDialog } from "./user-dialog"
import { PermissionsDialog } from "./permissions-dialog"

interface UsersTableProps {
  onEditUser?: (user: Usuario) => void
  onManagePermissions?: (user: Usuario) => void
  currentUserId?: number
  refreshTrigger?: number
}

export function UsersTable({ currentUserId, refreshTrigger }: UsersTableProps) {
  const { toast } = useToast()
  const { canEdit, canDelete, hasPermission } = usePermissions()
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null)
  const [userForPermissions, setUserForPermissions] = useState<Usuario | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [refreshTrigger])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usuariosService.getAll()
      setUsers(data)
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      const deleted = userToDelete
      await usuariosService.delete(userToDelete.id)
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.nombre} ha sido eliminado`
      })
      // Registrar auditoría
      try {
        await registrarAuditoria({
          accion: 'eliminar',
          modulo: 'usuarios',
          descripcion: `Usuario eliminado: ${deleted.nombre ?? ('#' + deleted.id)}`,
          detalles: JSON.stringify(deleted),
          registroId: deleted.id
        })
      } catch (e) {
        console.warn('No se pudo registrar auditoría (usuario eliminar)', e)
      }
      loadUsers()
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive"
      })
    } finally {
      setUserToDelete(null)
    }
  }

  const handleEdit = (user: Usuario) => {
    setUserToEdit(user)
    setEditDialogOpen(true)
  }

  const handleManagePermissions = (user: Usuario) => {
    setUserForPermissions(user)
    setPermissionsDialogOpen(true)
  }

  const getRoleBadge = (rol: string) => {
    switch (rol.toLowerCase()) {
      case "administrador":
        return <Badge className="bg-purple-500">Administrador</Badge>
      case "supervisor":
        return <Badge variant="secondary">Supervisor</Badge>
      case "empleado":
        return <Badge variant="outline">Empleado</Badge>
      default:
        return <Badge variant="outline">{rol}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca"
    try {
      const date = new Date(dateString)
      return date.toLocaleString("es-GT", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Inválido"
    }
  }

  const filteredUsers = users.filter(user =>
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.usuario1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Buscador */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.nombre} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.nombre}</div>
                        <div className="text-sm text-muted-foreground">@{user.usuario1}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.rol)}</TableCell>
                  <TableCell>
                    {user.estado?.toLowerCase() === "activo" ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Activo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Inactivo</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.ultimoAcceso)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canEdit("usuarios") && (
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {hasPermission("usuarios.permisos") && (
                          <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Gestionar Permisos
                          </DropdownMenuItem>
                        )}
                        {canDelete("usuarios") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setUserToDelete(user)}
                              disabled={user.id === currentUserId}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de edición */}
      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={userToEdit}
        onSuccess={() => {
          loadUsers()
          setUserToEdit(null)
        }}
        currentUserId={currentUserId}
      />

      {/* Dialog de permisos */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        user={userForPermissions}
        currentUserId={currentUserId}
      />

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario{" "}
              <strong>{userToDelete?.nombre}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
