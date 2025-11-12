"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuditLogTable } from "@/components/audit-log-table"
import { Activity, Users, FileText, Shield, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { NoFlashWrapper } from "@/components/no-flash-wrapper"
import { usePermissions } from "@/hooks/use-permissions"
import { auditoriaService, type Auditorium } from "@/lib/api"

export default function AuditPage() {
  const { canView } = usePermissions()
  const [stats, setStats] = useState({
    accionesHoy: 0,
    usuariosActivos: 0,
    cambiosCriticos: 0,
    accionesSemanales: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const logs = await auditoriaService.getRecientes(500)
      
      const now = new Date()
      const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const hace7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Acciones de hoy
      const accionesHoy = logs.filter(log => {
        if (!log.fechaHora) return false
        const fecha = new Date(log.fechaHora)
        return fecha >= hoy
      }).length
      
      // Usuarios activos (últimas 24 horas)
      const usuariosUnicos = new Set(
        logs
          .filter(log => {
            if (!log.fechaHora) return false
            const fecha = new Date(log.fechaHora)
            return fecha >= hoy
          })
          .map(log => log.usuarioId)
          .filter(id => id !== null)
      )
      
      // Cambios críticos (eliminaciones)
      const cambiosCriticos = logs.filter(log => 
        log.accion?.toLowerCase() === 'eliminar' || log.accion?.toLowerCase() === 'delete'
      ).length
      
      // Acciones semanales
      const accionesSemanales = logs.filter(log => {
        if (!log.fechaHora) return false
        const fecha = new Date(log.fechaHora)
        return fecha >= hace7Dias
      }).length

      setStats({
        accionesHoy,
        usuariosActivos: usuariosUnicos.size,
        cambiosCriticos,
        accionesSemanales
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!canView("auditoria")) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <StaticSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Card className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
              </Card>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <NoFlashWrapper>
        <div className="flex h-screen">
          <StaticSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-balance">Bitácora y Auditoría</h1>
              <p className="mt-2 text-muted-foreground">
                Registro completo de todas las acciones realizadas en el sistema
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Acciones Hoy</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.accionesHoy}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">En las últimas 24 horas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.usuariosActivos}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">En las últimas 24 horas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cambios Críticos</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.cambiosCriticos}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Eliminaciones en últimas 24h</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Acciones Semanales</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.accionesSemanales}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">En los últimos 7 días</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividades</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditLogTable />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      </NoFlashWrapper>
    </ProtectedRoute>
  )
}
