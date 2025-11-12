"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { statsService } from "@/lib/api"

export function RecentMovements() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
              <div key={movement.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
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
                    <p className="font-medium text-sm truncate">{movement.numero}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {movement.descripcion} • {formatDate(movement.fecha)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <Badge 
                    variant={movement.estado === 'completada' ? 'default' : 'secondary'}
                    className={movement.tipo === "entrada" ? "bg-green-600" : "bg-red-600"}
                  >
                    {movement.tipo === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
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
  )
}
