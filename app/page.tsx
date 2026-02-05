"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { StatsCard } from "@/components/stats-card"
import { RecentMovements } from "@/components/recent-movements"
import { InventoryChart } from "@/components/inventory-chart"
import { TopSellingProducts } from "@/components/top-selling-products"
import { Package, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { statsService } from "@/lib/api"
import { toast } from "sonner"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    valorInventario: 0,
    productosStockBajo: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await statsService.getDashboardStats()
      setStats(data)
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err)
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 0 }).format(value)
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
                    <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                    <p className="text-lg text-muted-foreground">
                      Resumen general del inventario y movimientos
                    </p>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Sistema activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="container px-6 py-8">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Total Productos"
                        value={stats.totalProductos.toString()}
                        change={`${stats.productosStockBajo} con stock bajo`}
                        changeType={stats.productosStockBajo > 0 ? "negative" : "positive"}
                        icon={Package}
                      />
                    </div>
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Entradas del Mes"
                        value={stats.totalEntradas.toString()}
                        change="Este mes"
                        changeType="positive"
                        icon={ArrowDownToLine}
                      />
                    </div>
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Salidas del Mes"
                        value={stats.totalSalidas.toString()}
                        change="Este mes"
                        changeType="neutral"
                        icon={ArrowUpFromLine}
                      />
                    </div>
                    <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                      <StatsCard
                        title="Valor Inventario"
                        value={formatCurrency(stats.valorInventario)}
                        change="Costo total"
                        changeType="positive"
                        icon={TrendingUp}
                      />
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid gap-8 lg:grid-cols-3 mb-8">
                    <div className="lg:col-span-2">
                      <div className="glass-card rounded-2xl p-6 h-full hover-lift smooth-transition">
                        <InventoryChart />
                      </div>
                    </div>
                    <div>
                      <div className="glass-card rounded-2xl p-6 h-full hover-lift smooth-transition">
                        <TopSellingProducts limit={5} title="Top Ventas" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Movements */}
                  <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                    <RecentMovements />
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
