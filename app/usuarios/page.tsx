"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, UserX, Shield, UserPlus, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { UsersTable } from "@/components/users-table"
import { UserDialog } from "@/components/user-dialog"
import { usuariosService, type Usuario } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"

export default function UsersPage() {
  const { toast } = useToast()
  const { canView, canCreate } = usePermissions()
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<number | undefined>()

  // Verificar permiso para ver usuarios
  if (!canView("usuarios")) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No tienes permiso para ver esta página.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  useEffect(() => {
    // Obtener ID del usuario actual desde localStorage
    const userData = localStorage.getItem("user-data")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUserId(user.id)
      } catch (e) {
        console.error("Error al parsear datos de usuario:", e)
      }
    }

    loadUsers()
  }, [])

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

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    loadUsers()
  }

  // Calcular estadísticas
  const totalUsuarios = users.length
  const usuariosActivos = users.filter(u => u.estado?.toLowerCase() === "activo").length
  const usuariosInactivos = users.filter(u => u.estado?.toLowerCase() === "inactivo").length
  const administradores = users.filter(u => u.rol?.toLowerCase() === "administrador").length

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Gestión de Usuarios</h1>
                <p className="mt-2 text-muted-foreground">Administra usuarios, roles y permisos del sistema</p>
              </div>
              {canCreate("usuarios") && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              )}
            </div>

            {/* Estadísticas */}
            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{totalUsuarios}</div>
                      <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">{usuariosActivos}</div>
                      <p className="text-xs text-muted-foreground mt-1">Con acceso habilitado</p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Inactivos</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{usuariosInactivos}</div>
                      <p className="text-xs text-muted-foreground mt-1">Sin acceso al sistema</p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-purple-600">{administradores}</div>
                      <p className="text-xs text-muted-foreground mt-1">Con acceso total</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabla de usuarios */}
            <UsersTable
              currentUserId={currentUserId}
              refreshTrigger={refreshTrigger}
            />

            {/* Dialog de creación */}
            <UserDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              user={null}
              onSuccess={handleCreateSuccess}
              currentUserId={currentUserId}
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
