"use client"

import { useState } from "react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Edit, Trash2, Shield, CheckCircle2, XCircle } from "lucide-react"

const mockUsers = [
  {
    id: "1",
    nombre: "Administrador",
    usuario: "admin",
    email: "admin@barberia.com",
    rol: "admin",
    estado: "activo",
    ultimoAcceso: "2024-01-15 10:30",
    permisos: ["*"],
  },
  {
    id: "2",
    nombre: "Gerente Principal",
    usuario: "gerente",
    email: "gerente@barberia.com",
    rol: "gerente",
    estado: "activo",
    ultimoAcceso: "2024-01-15 09:15",
    permisos: ["productos.ver", "productos.crear", "entradas.ver", "salidas.ver", "reportes.ver"],
  },
  {
    id: "3",
    nombre: "Empleado",
    usuario: "empleado",
    email: "empleado@barberia.com",
    rol: "empleado",
    estado: "activo",
    ultimoAcceso: "2024-01-14 16:45",
    permisos: ["productos.ver", "entradas.ver", "salidas.ver"],
  },
  {
    id: "4",
    nombre: "Carlos Méndez",
    usuario: "cmendez",
    email: "carlos@barberia.com",
    rol: "empleado",
    estado: "inactivo",
    ultimoAcceso: "2024-01-10 14:20",
    permisos: ["productos.ver"],
  },
]

export function UsersTable() {
  const [users] = useState(mockUsers)

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Badge>Administrador</Badge>
      case "gerente":
        return <Badge variant="secondary">Gerente</Badge>
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Permisos</TableHead>
            <TableHead>Último Acceso</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.nombre}</div>
                    <div className="text-sm text-muted-foreground">@{user.usuario}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getRoleBadge(user.rol)}</TableCell>
              <TableCell>
                {user.estado === "activo" ? (
                  <div className="flex items-center gap-2 text-accent">
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
              <TableCell>
                {user.permisos.includes("*") ? (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Acceso Total
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">{user.permisos.length} permisos</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.ultimoAcceso}</TableCell>
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
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="mr-2 h-4 w-4" />
                      Gestionar Permisos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
