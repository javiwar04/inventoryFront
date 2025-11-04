import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

const movements = [
  {
    id: 1,
    type: "entrada",
    product: "Laptop Dell XPS 15",
    quantity: 10,
    date: "2024-01-15",
    user: "Juan Pérez",
  },
  {
    id: 2,
    type: "salida",
    product: "Mouse Logitech MX Master",
    quantity: 5,
    date: "2024-01-15",
    user: "María García",
  },
  {
    id: 3,
    type: "entrada",
    product: "Teclado Mecánico RGB",
    quantity: 15,
    date: "2024-01-14",
    user: "Carlos López",
  },
  {
    id: 4,
    type: "salida",
    product: 'Monitor LG 27"',
    quantity: 3,
    date: "2024-01-14",
    user: "Ana Martínez",
  },
  {
    id: 5,
    type: "entrada",
    product: "Webcam HD 1080p",
    quantity: 20,
    date: "2024-01-13",
    user: "Pedro Sánchez",
  },
]

export function RecentMovements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    movement.type === "entrada" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {movement.type === "entrada" ? (
                    <ArrowDownToLine className="h-4 w-4" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{movement.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {movement.user} • {movement.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={movement.type === "entrada" ? "default" : "secondary"}>
                  {movement.type === "entrada" ? "+" : "-"}
                  {movement.quantity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
