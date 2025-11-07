"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { SupplierDialog } from "@/components/supplier-dialog"
import { SuppliersTable } from "@/components/suppliers-table"
import { StatsCard } from "@/components/stats-card"
import { ProtectedRoute } from "@/components/protected-route"
import { Building2, Package, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProveedoresPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSupplierSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <ProtectedRoute adminOnly>
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
                      Gestiona y administra todos los proveedores de tu barbería
                    </p>
                  </div>
                  <SupplierDialog onSuccess={handleSupplierSuccess} />
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="container px-6 py-8">
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Total Proveedores"
                    value="5"
                    change="Proveedores activos"
                    changeType="neutral"
                    icon={Building2}
                  />
                </div>
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Productos Suministrados"
                    value="100"
                    change="Productos en catálogo"
                    changeType="neutral"
                    icon={Package}
                  />
                </div>
                <div className="glass-card rounded-2xl p-6 hover-lift smooth-transition">
                  <StatsCard
                    title="Compras Este Mes"
                    value="Q 12,450"
                    change="+15% vs mes anterior"
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
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
