"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { name: "Ene", entradas: 45, salidas: 32 },
  { name: "Feb", entradas: 52, salidas: 38 },
  { name: "Mar", entradas: 48, salidas: 41 },
  { name: "Abr", entradas: 61, salidas: 45 },
  { name: "May", entradas: 55, salidas: 48 },
  { name: "Jun", entradas: 67, salidas: 52 },
]

export function InventoryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="entradas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="salidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-accent" />
            <span className="text-sm text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary" />
            <span className="text-sm text-muted-foreground">Salidas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
