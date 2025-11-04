import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

const lowStockProducts = [
  { id: 1, name: "Cable HDMI 2m", stock: 5, minStock: 20 },
  { id: 2, name: "Adaptador USB-C", stock: 8, minStock: 25 },
  { id: 3, name: "Batería Laptop HP", stock: 3, minStock: 15 },
  { id: 4, name: "Memoria RAM 8GB", stock: 12, minStock: 30 },
]

export function LowStockAlert() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Productos con Stock Bajo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">Mínimo requerido: {product.minStock}</p>
              </div>
              <Badge variant="destructive">{product.stock} unidades</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
