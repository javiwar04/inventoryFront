"use client"

import { useState, useEffect } from "react"
import type { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { reportesService } from "@/lib/api"
import { Loader2 } from "lucide-react"

export function MonthlyComparison({ dateRange }: { dateRange?: DateRange }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const comparacion = await reportesService.getComparacionMensual(dateRange?.from, dateRange?.to)
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
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
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
                  if (name === 'entradas') return [value, 'Entradas (Unidades)']
                  if (name === 'salidas') return [value, 'Ventas (Unidades)']
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey="entradas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="salidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
