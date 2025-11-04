"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockValueChart } from "@/components/stock-value-chart"
import { CategoryDistribution } from "@/components/category-distribution"
import { TopProductsTable } from "@/components/top-products-table"
import { MonthlyComparison } from "@/components/monthly-comparison"
import { Download, FileText, Calendar, TrendingUp } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"
import { ProtectedRoute } from "@/components/protected-route"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  return (
    <ProtectedRoute requiredPermission="reportes.ver">
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Reportes y Análisis</h1>
                <p className="mt-2 text-muted-foreground">
                  Visualiza estadísticas detalladas y genera reportes del inventario
                </p>
              </div>
              <div className="flex gap-2">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Reporte
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Movimientos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">584</div>
                  <p className="text-xs text-accent mt-1">+5% desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rotación Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2x</div>
                  <p className="text-xs text-accent mt-1">+0.3 desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Días Promedio Stock</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground mt-1">Similar al mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Eficiencia</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.5%</div>
                  <p className="text-xs text-accent mt-1">+2.1% desde el mes pasado</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <StockValueChart />
              <CategoryDistribution />
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <MonthlyComparison />
              <TopProductsTable />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
