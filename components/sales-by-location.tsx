"use client"

import { useState, useEffect } from "react"
import type { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { salidasService } from "@/lib/api"
import { Loader2, Store } from "lucide-react"

export function SalesByLocation({ dateRange }: { dateRange?: DateRange }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      // Fetch data - using limit 100000 as per user preference for full history
      const salidas = await salidasService.getAll(1, 100000)
      
      // Filter by "Venta" or "Cortesía"
      let filtered = salidas.filter(s => s.motivo === 'Venta' || s.motivo === 'Cortesía')

      // Date Filter
      if (dateRange?.from) {
        const fromStr = dateRange.from.toLocaleDateString('en-CA') // YYYY-MM-DD
        filtered = filtered.filter(s => s.fechaSalida.split('T')[0] >= fromStr)
      }
      if (dateRange?.to) {
        const toStr = dateRange.to.toLocaleDateString('en-CA')
        filtered = filtered.filter(s => s.fechaSalida.split('T')[0] <= toStr)
      }

      // Group by Destino (Sede)
      const locationMap = new Map<string, { name: string, total: number, quantity: number }>()

      filtered.forEach(sale => {
        const sede = sale.destino || 'Sin Sede'
        const current = locationMap.get(sede) || { name: sede, total: 0, quantity: 0 }
        
        // Sum total amount (money)
        if (sale.total) {
            current.total += Number(sale.total)
        } else {
            // Fallback if total not on header, iterate details
            const dets = sale.detalles || sale.detalleSalida || []
            current.total += dets.reduce((acc, d) => acc + ((d.subtotal) || (d.cantidad * (d.precioUnitario || 0))), 0)
        }

        // Sum quantity of items
        const dets = sale.detalles || sale.detalleSalida || []
        current.quantity += dets.reduce((acc, d) => acc + d.cantidad, 0)
        
        locationMap.set(sede, current)
      })

      const chartData = Array.from(locationMap.values())
        .sort((a, b) => b.total - a.total)

      setData(chartData)

    } catch (err) {
      console.error('Error loading sales by location', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-sm text-sm">
          <p className="font-bold">{label}</p>
          <p className="text-primary">
            Ventas: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-muted-foreground">
            Items: {payload[0].payload.quantity} u
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="h-4 w-4" />
          Ventas por Sede
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No hay datos de ventas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/30" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
              />
              <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                name="Total Vendido"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
