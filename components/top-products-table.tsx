import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

const topProducts = [
  {
    id: 1,
    name: "Laptop Dell XPS 15",
    movements: 156,
    trend: "up",
    percentage: 12,
  },
  {
    id: 2,
    name: "Mouse Logitech MX Master",
    movements: 142,
    trend: "up",
    percentage: 8,
  },
  {
    id: 3,
    name: 'Monitor LG 27" 4K',
    movements: 128,
    trend: "down",
    percentage: 5,
  },
  {
    id: 4,
    name: "Teclado Mecánico RGB",
    movements: 115,
    trend: "up",
    percentage: 15,
  },
  {
    id: 5,
    name: "SSD 1TB NVMe",
    movements: 98,
    trend: "up",
    percentage: 10,
  },
]

export function TopProductsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Movidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.movements} movimientos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {product.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <Badge variant={product.trend === "up" ? "default" : "secondary"}>
                  {product.trend === "up" ? "+" : "-"}
                  {product.percentage}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
