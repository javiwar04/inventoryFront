"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Loader2 } from "lucide-react"
import { statsService, type Producto } from "@/lib/api"

export function LowStockAlert() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await statsService.getProductosStockBajo()
      setProductos(data.slice(0, 5)) // Solo mostrar los primeros 5
    } catch (err) {
      console.error('Error al cargar productos con stock bajo:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Productos con Stock Bajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Productos con Stock Bajo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {productos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">¡Todo bien! No hay productos con stock bajo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {productos.map((product) => (
              <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {product.stock_minimo} | Actual: {product.stock_actual}
                  </p>
                </div>
                <Badge variant="destructive" className="ml-2">
                  {product.stock_actual} un.
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
