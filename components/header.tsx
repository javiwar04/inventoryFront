"use client"

import { Bell, Search, User, LogOut, Settings, Shield, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { auditoriaService, type Auditorium } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Auditorium[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
      // Recargar cada 30 segundos
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const logs = await auditoriaService.getRecientes(10)
      setNotifications(logs)
      // Contar actividades de los últimos 5 minutos como "no leídas"
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const unread = logs.filter(log => new Date(log.fechaHora || '') > fiveMinutesAgo).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    }
  }

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'create': return 'text-green-500'
      case 'update': return 'text-blue-500'
      case 'delete': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getActionText = (accion: string) => {
    switch (accion) {
      case 'create': return 'Creó'
      case 'update': return 'Actualizó'
      case 'delete': return 'Eliminó'
      case 'view': return 'Consultó'
      default: return accion
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (rol: string) => {
    switch (rol) {
      case "admin":
        return "default"
      case "gerente":
        return "secondary"
      case "empleado":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Shield className="h-3 w-3" />
      case "gerente":
        return <Settings className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 w-full items-center px-6 justify-between">
        {/* Logo y título */}
        <div className="mr-6 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Image src="/logoselvamo.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">SELVAMO</span>
            <span className="text-xs text-muted-foreground">Sistema de Inventario</span>
          </div>
        </div>

        {/* Barra de búsqueda mejorada */}
        <div className="flex flex-1 items-center px-6 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar productos, proveedores, movimientos..." 
              className="w-full pl-10 pr-4 bg-background/50 border-border/50 hover:border-border focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center space-x-3 ml-6">
          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover-lift smooth-transition">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border rounded-md max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="text-sm font-semibold">
                Actividad Reciente
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay actividad reciente
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <DropdownMenuItem 
                    key={idx} 
                    className="cursor-pointer hover:bg-accent/10 flex-col items-start p-3 space-y-1"
                    onClick={() => router.push('/auditoria')}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-medium ${getActionColor(notif.accion)}`}>
                        {getActionText(notif.accion)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {notif.fechaHora && formatDistanceToNow(new Date(notif.fechaHora), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{notif.descripcion}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {notif.modulo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        por {notif.usuarioNombre || notif.usuario?.nombre || 'Sistema'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-center justify-center text-primary hover:bg-primary/10"
                onClick={() => router.push('/auditoria')}
              >
                Ver todas las actividades
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Perfil de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative h-10 w-10 rounded-full hover-lift smooth-transition"
              >
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                    {user ? getInitials(user.nombre) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border rounded-md">
              <DropdownMenuLabel className="pb-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.nombre}</p>
                  <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
                  <Badge 
                    variant={getRoleBadgeVariant(user?.rol || "")} 
                    className="w-fit text-xs h-5 px-2 capitalize mt-1"
                  >
                    {getRoleIcon(user?.rol || "")}
                    <span className="ml-1">{user?.rol || "Sin rol"}</span>
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
