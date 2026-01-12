"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, useCallback } from "react"

export function usePermissions() {
  const { user } = useAuth()
  
  // Inicializar con permisos desde localStorage INMEDIATAMENTE
  const [permisos, setPermisos] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('user-permissions')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('Error cargando permisos:', e)
      return []
    }
  })

  useEffect(() => {
    // Sincronizar permisos cuando cambia el usuario
    if (typeof window !== 'undefined') {
      if (user) {
        try {
          const stored = localStorage.getItem('user-permissions')
          if (stored) {
            setPermisos(JSON.parse(stored))
          }
        } catch (e) {
          console.error('Error cargando permisos:', e)
        }
      } else {
        // Limpiar permisos si no hay usuario
        setPermisos([])
      }
    }
  }, [user])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (user.rol === "admin") return true
    if (permisos.includes("*")) return true
    return permisos.includes(permission)
  }, [user, permisos])

  const isAdmin = useCallback((): boolean => {
    return user?.rol === "admin"
  }, [user])

  const canCreate = useCallback((module: string): boolean => {
    return hasPermission(`${module}.crear`)
  }, [hasPermission])

  const canEdit = useCallback((module: string): boolean => {
    return hasPermission(`${module}.editar`)
  }, [hasPermission])

  const canDelete = useCallback((module: string): boolean => {
    return hasPermission(`${module}.eliminar`)
  }, [hasPermission])

  const canView = useCallback((module: string): boolean => {
    return hasPermission(`${module}.ver`)
  }, [hasPermission])

  return {
    hasPermission,
    isAdmin,
    canCreate,
    canEdit,
    canDelete,
    canView,
    user,
  }
}
