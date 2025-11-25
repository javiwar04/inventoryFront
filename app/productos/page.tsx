"use client"

import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { ProductDialog } from "@/components/product-dialog"
import { ProductsTable } from "@/components/products-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, Filter } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { useState, useEffect } from "react"
import { productosService } from "@/lib/api"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoriasService, proveedoresService } from "@/lib/api"

export default function ProductsPage() {
  const [term, setTerm] = useState("")
  const [productos, setProductos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all")
  const [proveedorFilter, setProveedorFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const { canView, canCreate } = usePermissions()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [prods, cats, provs] = await Promise.all([
        productosService.getAll(),
        categoriasService.getAll(),
        proveedoresService.getAll()
      ])
      setProductos(prods)
      setCategorias(cats)
      setProveedores(provs)
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const handleExport = () => {
    try {
      // Filtrar productos según los filtros activos
      let filtered = productos

      if (term) {
        filtered = filtered.filter(p => 
          p.nombre.toLowerCase().includes(term.toLowerCase()) || 
          p.sku.toLowerCase().includes(term.toLowerCase())
        )
      }

      if (categoriaFilter !== "all") {
        filtered = filtered.filter(p => p.categoriaId === parseInt(categoriaFilter))
      }

      if (proveedorFilter !== "all") {
        filtered = filtered.filter(p => p.proveedorId === parseInt(proveedorFilter))
      }

      if (stockFilter === "bajo") {
        filtered = filtered.filter(p => p.stock <= p.stockMinimo)
      } else if (stockFilter === "normal") {
        filtered = filtered.filter(p => p.stock > p.stockMinimo && p.stock < p.stockMaximo)
      } else if (stockFilter === "alto") {
        filtered = filtered.filter(p => p.stock >= p.stockMaximo)
      }

      // Crear CSV
      const headers = ['SKU', 'Nombre', 'Categoría', 'Proveedor', 'Stock', 'Stock Mín', 'Stock Máx', 'Precio', 'Costo', 'Estado']
      const rows = filtered.map(p => [
        p.sku,
        p.nombre,
        p.categoria?.nombre || 'Sin categoría',
        p.proveedor?.nombre || 'Sin proveedor',
        p.stock,
        p.stockMinimo,
        p.stockMaximo,
        `Q${p.precio.toFixed(2)}`,
        `Q${p.costo.toFixed(2)}`,
        p.activo ? 'Activo' : 'Inactivo'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toast.success(`${filtered.length} productos exportados correctamente`)
    } catch (error) {
      console.error('Error exportando:', error)
      toast.error('Error al exportar productos')
    }
  }

  // Verificar permiso para ver productos (después de todos los hooks)
  if (!canView("productos")) {
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

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Productos</h1>
                <p className="mt-2 text-muted-foreground">Gestiona el catálogo completo de productos del inventario</p>
              </div>
              {canCreate("productos") && <ProductDialog />}
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por nombre o SKU..." className="pl-10" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>

            {showFilters && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Categoría</label>
                      <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Proveedor</label>
                      <Select value={proveedorFilter} onValueChange={setProveedorFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los proveedores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los proveedores</SelectItem>
                          {proveedores.map(prov => (
                            <SelectItem key={prov.id} value={prov.id.toString()}>{prov.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Estado de Stock</label>
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="bajo">Stock Bajo</SelectItem>
                          <SelectItem value="normal">Stock Normal</SelectItem>
                          <SelectItem value="alto">Stock Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(categoriaFilter !== "all" || proveedorFilter !== "all" || stockFilter !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        setCategoriaFilter("all")
                        setProveedorFilter("all")
                        setStockFilter("all")
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <ProductsTable search={term} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
