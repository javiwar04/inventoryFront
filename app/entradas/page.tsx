import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { EntryDialog } from "@/components/entry-dialog"
import { EntriesTable } from "@/components/entries-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function EntriesPage() {
  return (
    <ProtectedRoute requiredPermission="entradas.ver">
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Entradas de Inventario</h1>
                <p className="mt-2 text-muted-foreground">
                  Registra y gestiona todas las entradas de productos al inventario
                </p>
              </div>
              <EntryDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entradas del Mes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">328</div>
                  <p className="text-xs text-accent mt-1">+8% desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos Ingresados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,456</div>
                  <p className="text-xs text-accent mt-1">+12% desde el mes pasado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Inversión Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Q960,580</div>
                  <p className="text-xs text-accent mt-1">+15% desde el mes pasado</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por producto, proveedor o factura..." className="pl-10" />
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>

            <EntriesTable />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
