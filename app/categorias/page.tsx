import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { CategoryDialog } from "@/components/category-dialog"
import { CategoriesTable } from "@/components/categories-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { NoFlashWrapper } from "@/components/no-flash-wrapper"
import { FolderOpen, Package } from "lucide-react"

export default function CategoriasPage() {
  return (
    <ProtectedRoute adminOnly>
      <NoFlashWrapper>
        <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
                  <p className="text-muted-foreground">Gestiona las categorías de productos de tu barbería</p>
                </div>
                <CategoryDialog />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">7</div>
                    <p className="text-xs text-muted-foreground">Categorías activas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Productos Categorizados</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">65</div>
                    <p className="text-xs text-muted-foreground">Productos en categorías</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Categorías</CardTitle>
                  <CardDescription>Administra y organiza las categorías de productos</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoriesTable />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      </NoFlashWrapper>
    </ProtectedRoute>
  )
}
