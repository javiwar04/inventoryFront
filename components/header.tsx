"use client"

import { Bell, Search, User, LogOut, Settings, Shield, ChevronDown } from "lucide-react"
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
import { useState } from "react"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [notifications] = useState(3) // Simulamos notificaciones

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
      <div className="container flex h-16 max-w-screen-2xl items-center px-6">
        {/* Logo y título */}
        <div className="mr-6 flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-sm font-bold text-white">B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">Barbería</span>
            <span className="text-xs text-muted-foreground">Sistema de Inventario</span>
          </div>
        </div>

        {/* Barra de búsqueda mejorada */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar productos, proveedores, movimientos..." 
              className="w-full pl-10 pr-4 bg-background/50 border-border/50 hover:border-border focus:border-primary/50 transition-colors" 
            />
          </div>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center space-x-2">
          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative hover-lift smooth-transition">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Perfil de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-11 w-auto px-3 py-2 hover-lift smooth-transition bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-600 shadow-lg"
              >
                <Avatar className="h-8 w-8 mr-3 ring-2 ring-white/20">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                    {user ? getInitials(user.nombre) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-sm font-semibold leading-none text-white">{user?.nombre || "Usuario"}</span>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user?.rol || "")}
                    <span className="text-xs text-slate-200 capitalize font-medium">{user?.rol || "Sin rol"}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 text-slate-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border-border rounded-md">
              <DropdownMenuLabel className="pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                      {user ? getInitials(user.nombre) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.nombre}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge 
                      variant={getRoleBadgeVariant(user?.rol || "")} 
                      className="w-fit text-xs h-5 px-2 capitalize"
                    >
                      {getRoleIcon(user?.rol || "")}
                      <span className="ml-1">{user?.rol || "Sin rol"}</span>
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-accent/10">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent/10">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
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
