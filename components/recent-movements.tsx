"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { statsService, productosService, Producto } from "@/lib/api"
import { ProductDetailsDialog } from "@/components/product-details-dialog"

export function RecentMovements() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await statsService.getMovimientosRecientes(8)
      setMovements(data)
    } catch (err) {
      console.error('Error al cargar movimientos:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
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
    <>
      <Card>
      <CardHeader>
        <CardTitle>Movimientos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3 w-full">
                  <div className={`rounded-lg p-2 mt-1 ${
                      movement.tipo === "entrada" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                    }`}
                    >
                    {movement.tipo === "entrada" ? (
                      <ArrowDownToLine className="h-4 w-4" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{movement.numero} • {movement.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(movement.fecha)}</p>

                    {/* Productos list: show up to 3 items with cantidad */}
                    {movement.productos && movement.productos.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {movement.productos.slice(0, 3).map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const id = Number(p.productoId ?? p.id)
                                try {
                                  setLoadingProductId(id)
                                  const prod = await productosService.getById(id)
                                  setSelectedProduct(prod)
                                  setProductDialogOpen(true)
                                } catch (err) {
                                  console.error('Error cargando producto:', err)
                                } finally {
                                  setLoadingProductId(null)
                                }
                              }}
                              className="font-medium text-xs hover:underline flex items-center gap-2"
                              disabled={loadingProductId === (p.productoId ?? p.id)}
                            >
                              {loadingProductId === (p.productoId ?? p.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                p.nombre
                              )}
                            </button>
                            <span className="text-xs">•</span>
                            <span className="text-xs">{p.cantidad} unidades</span>
                          </div>
                        ))}
                        {movement.productos.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{movement.productos.length - 3} más</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <Badge 
                    variant={movement.estado === 'completada' ? 'default' : 'secondary'}
                    className={movement.tipo === "entrada" ? "bg-green-600" : "bg-red-600"}
                  >
                    {movement.tipo === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
                  {/* Mostrar total de unidades al lado del badge */}
                  {movement.productos && movement.productos.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{movement.productos.reduce((s: number, p: any) => s + (p.cantidad || 0), 0)} uds</p>
                  )}
                  {movement.total && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Q{movement.total.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      </Card>
      {/* Diálogo de detalles de producto */}
      <ProductDetailsDialog
        product={selectedProduct}
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open)
          if (!open) setSelectedProduct(null)
        }}
      />
    </>
  )
}
