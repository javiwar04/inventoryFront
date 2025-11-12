"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { reportesService } from "@/lib/api"
import { Loader2 } from "lucide-react"

export function MonthlyComparison() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const comparacion = await reportesService.getComparacionMensual()
      setData(comparacion)
    } catch (err) {
      console.error('Error al cargar comparación mensual:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación Mensual de Movimientos</CardTitle>
      </CardHeader>
      <CardContent id="monthly-comparison-chart">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'entradas') {
                    return [`Q${value.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`, 'Inversión']
                  }
                  return [value, name === 'salidas' ? 'Salidas' : name]
                }}
              />
              <Legend />
              <Bar dataKey="entradas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Inversión (Q)" />
              <Bar dataKey="salidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Salidas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
