"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Loader2 } from "lucide-react"
import { entradasService, salidasService } from "@/lib/api"

interface ChartData {
  name: string
  entradas: number
  salidas: number
}

export function InventoryChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Obtener todos los movimientos del año
      // FIX: Reducido de 10000 a 100 para evitar crash. La gráfica será parcial hasta arreglar backend.
      const [entradas, salidas] = await Promise.all([
        entradasService.getAll(1, 100),
        salidasService.getAll(1, 100)
      ])

      // Obtener los últimos 6 meses
      const now = new Date()
      const monthsData: ChartData[] = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('es-GT', { month: 'short' })
        const year = date.getFullYear()
        const month = date.getMonth()
        
        // Contar entradas del mes
        const entradasCount = entradas.filter(e => {
          const entradaDate = new Date(e.fechaEntrada)
          return entradaDate.getFullYear() === year && entradaDate.getMonth() === month
        }).length
        
        // Contar salidas del mes
        const salidasCount = salidas.filter(s => {
          const salidaDate = new Date(s.fechaSalida)
          return salidaDate.getFullYear() === year && salidaDate.getMonth() === month
        }).length
        
        monthsData.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          entradas: entradasCount,
          salidas: salidasCount
        })
      }
      
      setData(monthsData)
    } catch (err) {
      console.error('Error al cargar datos del gráfico:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

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
