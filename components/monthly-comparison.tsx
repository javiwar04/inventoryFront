"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
  { month: "Ene", entradas: 2456, salidas: 1892, diferencia: 564 },
  { month: "Feb", entradas: 2678, salidas: 2134, diferencia: 544 },
  { month: "Mar", entradas: 2534, salidas: 2089, diferencia: 445 },
  { month: "Abr", entradas: 2890, salidas: 2345, diferencia: 545 },
  { month: "May", entradas: 2756, salidas: 2198, diferencia: 558 },
  { month: "Jun", entradas: 2912, salidas: 2267, diferencia: 645 },
]

export function MonthlyComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación Mensual de Movimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="entradas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Entradas" />
            <Bar dataKey="salidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Salidas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
