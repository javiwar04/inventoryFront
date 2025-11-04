"use client"

import { useAuth } from "@/contexts/auth-context"

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.permisos.includes("*")) return true
    return user.permisos.includes(permission)
  }

  const isAdmin = (): boolean => {
    return user?.rol === "admin"
  }

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.crear`)
  }

  const canEdit = (module: string): boolean => {
    return hasPermission(`${module}.editar`)
  }

  const canDelete = (module: string): boolean => {
    return hasPermission(`${module}.eliminar`)
  }

  const canView = (module: string): boolean => {
    return hasPermission(`${module}.ver`)
  }

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
