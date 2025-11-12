"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  adminOnly?: boolean
}

export function ProtectedRoute({ children, requiredPermission, adminOnly }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isTokenValid, setIsTokenValid] = useState(true)

  // Verificar expiración del token en el cliente
  useEffect(() => {
    if (!isLoading) {
      const expRaw = localStorage.getItem('auth-exp')
      if (expRaw) {
        const exp = parseInt(expRaw, 10)
        // JWT exp está en segundos, Date.now() en ms
        if (Date.now() / 1000 > exp) {
          setIsTokenValid(false)
          localStorage.removeItem('auth-token')
          localStorage.removeItem('user-data')
          localStorage.removeItem('auth-exp')
        }
      }
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isTokenValid)) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, isTokenValid, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !isTokenValid) {
    return null
  }

  // Verificar si es solo para admin (acepta 'administrador' o 'admin')
  const roleIsAdmin = user?.rol === 'administrador' || (user as any)?.rol === 'admin'
  if (adminOnly && !roleIsAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="mt-2 text-muted-foreground">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    )
  }

  // Verificar permiso específico
  if (requiredPermission && user) {
    // Admin tiene acceso total sin verificar permisos específicos
    if (roleIsAdmin) {
      return <>{children}</>
    }
    
    const permisos: string[] = ((user as any)?.permisos ?? []) as string[]
    const hasPermission = permisos.includes("*") || permisos.includes(requiredPermission)
    if (!hasPermission) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Acceso Denegado</h2>
            <p className="mt-2 text-muted-foreground">No tienes permisos para acceder a esta sección</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
