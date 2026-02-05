"use client"

import { useState, useEffect } from "react"
import type { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Package, Loader2, DollarSign } from "lucide-react"
import { reportesService } from "@/lib/api"

export function TopSellingProducts({ dateRange, title = "Productos Más Vendidos", limit = 10 }: { dateRange?: DateRange, title?: string, limit?: number }) {
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const topProductos = await reportesService.getTopVendidos(limit, dateRange?.from, dateRange?.to)
      setProductos(topProductos)
    } catch (err) {
      console.error('Error al cargar top vendidos:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay ventas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {productos.map((producto, index) => (
              <div key={producto.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm font-bold text-green-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {producto.sku}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                    {producto.salidas} vendidos
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Gen: {formatCurrency(producto.valorVendido)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
