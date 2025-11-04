import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { StatsCard } from "@/components/stats-card"
import { RecentMovements } from "@/components/recent-movements"
import { InventoryChart } from "@/components/inventory-chart"
import { LowStockAlert } from "@/components/low-stock-alert"
import { Package, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
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
                      Resumen general del inventario y movimientos de tu barbería
                    </p>
                  </div>
                  <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Sistema activo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="container px-6 py-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Total Productos"
                    value="1,284"
                    change="+12% desde el mes pasado"
                    changeType="positive"
                    icon={Package}
                  />
                </div>
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Entradas del Mes"
                    value="328"
                    change="+8% desde el mes pasado"
                    changeType="positive"
                    icon={ArrowDownToLine}
                  />
                </div>
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Salidas del Mes"
                    value="256"
                    change="-3% desde el mes pasado"
                    changeType="negative"
                    icon={ArrowUpFromLine}
                  />
                </div>
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Valor Inventario"
                    value="Q3,538,920"
                    change="+15% desde el mes pasado"
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
                    <LowStockAlert />
                  </div>
                </div>
              </div>

              {/* Recent Movements */}
              <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                <RecentMovements />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
