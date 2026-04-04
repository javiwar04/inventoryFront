"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Flame } from "lucide-react"
import { entradasService, salidasService } from "@/lib/api"

interface HeatmapCell {
  day: string
  dayIndex: number
  hour: number
  entradas: number
  salidas: number
  total: number
}

export function MovementHeatmap() {
  const [data, setData] = useState<HeatmapCell[]>([])
  const [loading, setLoading] = useState(true)
  const [maxValue, setMaxValue] = useState(1)

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7am a 6pm

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [entradas, salidas] = await Promise.all([
        entradasService.getAll(1, 10000),
        salidasService.getAll(1, 10000)
      ])

      // Matriz de conteos: día de semana x hora
      const matrix: Map<string, { entradas: number; salidas: number }> = new Map()

      // Inicializar
      for (let d = 0; d < 7; d++) {
        for (const h of hours) {
          matrix.set(`${d}-${h}`, { entradas: 0, salidas: 0 })
        }
      }

      // Solo últimos 90 días
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)

      for (const e of entradas) {
        const fecha = new Date(e.fechaEntrada)
        if (fecha < cutoff) continue
        const dayIdx = (fecha.getDay() + 6) % 7 // Lunes=0
        const hour = fecha.getHours()
        if (hour >= 7 && hour <= 18) {
          const key = `${dayIdx}-${hour}`
          const cell = matrix.get(key)
          if (cell) cell.entradas++
        }
      }

      for (const s of salidas) {
        const fecha = new Date(s.fechaSalida)
        if (fecha < cutoff) continue
        const dayIdx = (fecha.getDay() + 6) % 7
        const hour = fecha.getHours()
        if (hour >= 7 && hour <= 18) {
          const key = `${dayIdx}-${hour}`
          const cell = matrix.get(key)
          if (cell) cell.salidas++
        }
      }

      const cells: HeatmapCell[] = []
      let max = 1

      for (let d = 0; d < 7; d++) {
        for (const h of hours) {
          const cell = matrix.get(`${d}-${h}`)!
          const total = cell.entradas + cell.salidas
          if (total > max) max = total
          cells.push({
            day: days[d],
            dayIndex: d,
            hour: h,
            entradas: cell.entradas,
            salidas: cell.salidas,
            total
          })
        }
      }

      setMaxValue(max)
      setData(cells)
    } catch (err) {
      console.error('Error cargando heatmap:', err)
    } finally {
      setLoading(false)
    }
  }

  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted/30'
    const intensity = value / maxValue
    if (intensity > 0.75) return 'bg-red-500'
    if (intensity > 0.5) return 'bg-orange-500'
    if (intensity > 0.25) return 'bg-yellow-500'
    return 'bg-green-500/60'
  }

  const getOpacity = (value: number) => {
    if (value === 0) return 'opacity-30'
    const intensity = value / maxValue
    if (intensity > 0.5) return 'opacity-100'
    if (intensity > 0.25) return 'opacity-80'
    return 'opacity-60'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Mapa de Calor — Movimientos por Día y Hora
          <span className="text-xs font-normal text-muted-foreground ml-2">(Últimos 90 días)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header de horas */}
            <div className="flex items-center gap-1 mb-2">
              <div className="w-12" />
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-xs text-muted-foreground font-mono">
                  {h}:00
                </div>
              ))}
            </div>

            {/* Filas por día */}
            <TooltipProvider>
              {days.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-12 text-xs font-medium text-muted-foreground">{day}</div>
                  {hours.map(h => {
                    const cell = data.find(d => d.dayIndex === dayIdx && d.hour === h)
                    return (
                      <UITooltip key={`${dayIdx}-${h}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex-1 h-8 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${getColor(cell?.total || 0)} ${getOpacity(cell?.total || 0)}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div className="font-semibold">{day} {h}:00 - {h + 1}:00</div>
                            <div>Entradas: {cell?.entradas || 0}</div>
                            <div>Salidas: {cell?.salidas || 0}</div>
                            <div className="font-semibold">Total: {cell?.total || 0}</div>
                          </div>
                        </TooltipContent>
                      </UITooltip>
                    )
                  })}
                </div>
              ))}
            </TooltipProvider>

            {/* Leyenda */}
            <div className="flex items-center justify-end gap-3 mt-4">
              <span className="text-xs text-muted-foreground">Menos</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-green-500/60" />
                <div className="w-4 h-4 rounded-sm bg-yellow-500" />
                <div className="w-4 h-4 rounded-sm bg-orange-500" />
                <div className="w-4 h-4 rounded-sm bg-red-500" />
              </div>
              <span className="text-xs text-muted-foreground">Más</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
