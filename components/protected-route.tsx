"use client"

import type React from "react"

import { useEffect } from "react"
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Verificar si es solo para admin
  if (adminOnly && user?.rol !== "admin") {
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
    const hasPermission = user.permisos.includes("*") || user.permisos.includes(requiredPermission)
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
