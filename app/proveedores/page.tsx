"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { SupplierDialog } from "@/components/supplier-dialog"
import { SuppliersTable } from "@/components/suppliers-table"
import { StatsCard } from "@/components/stats-card"
import { ProtectedRoute } from "@/components/protected-route"
import { Building2, Package, TrendingUp, Loader2 } from "lucide-react"
import { proveedoresService, productosService, entradasService } from "@/lib/api"
import { usePermissions } from "@/hooks/use-permissions"
import { Card } from "@/components/ui/card"

export default function ProveedoresPage() {
  const { canView, canCreate } = usePermissions()
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    totalProveedores: 0,
    proveedoresActivos: 0,
    totalProductos: 0,
    comprasMes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshKey])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [proveedores, productos, entradas] = await Promise.all([
        proveedoresService.getAll(),
        productosService.getAll(),
        entradasService.getAll(1, 1000)
      ])

      const activos = proveedores.filter(p => p.estado?.toLowerCase() === 'activo').length

      // Calcular compras del mes actual
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const comprasMes = entradas
        .filter(e => new Date(e.fechaEntrada) >= firstDayOfMonth)
        .reduce((sum, e) => sum + (e.total || 0), 0)

      setStats({
        totalProveedores: proveedores.length,
        proveedoresActivos: activos,
        totalProductos: productos.length,
        comprasMes
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 0 }).format(value)
  }

  if (!canView("proveedores")) {
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
      <div className="flex h-screen bg-background">
        <StaticSidebar />
        <div className="flex flex-1 flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-background border-b border-border/40">
              <div className="container px-6 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">Proveedores</h1>
                    <p className="text-lg text-muted-foreground">
                      Gestiona y administra todos los proveedores
                    </p>
                  </div>
                  {canCreate("proveedores") && <SupplierDialog onSuccess={handleSupplierSuccess} />}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="container px-6 py-8">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Total Proveedores"
                        value={stats.totalProveedores.toString()}
                        change={`${stats.proveedoresActivos} activos`}
                        changeType="neutral"
                        icon={Building2}
                      />
                    </div>
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Productos Suministrados"
                        value={stats.totalProductos.toString()}
                        change="Productos en catálogo"
                        changeType="neutral"
                        icon={Package}
                      />
                    </div>
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Compras Este Mes"
                        value={formatCurrency(stats.comprasMes)}
                        change="Total entradas"
                        changeType="positive"
                        icon={TrendingUp}
                      />
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift smooth-transition">
                    <div className="p-6 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold">Lista de Proveedores</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Administra la información de todos tus proveedores
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <SuppliersTable key={refreshKey} onSupplierChange={handleSupplierSuccess} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
