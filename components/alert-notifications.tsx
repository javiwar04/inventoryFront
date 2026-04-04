"use client"

import { useEffect, useState } from "react"
import { Bell, AlertTriangle, Package, CalendarClock, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { statsService, vencimientosService } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Alert {
  id: string
  tipo: 'stock_bajo' | 'vencimiento' | 'critico'
  titulo: string
  descripcion: string
  ruta: string
}

export function AlertNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 60000) // Each minute
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      const alertList: Alert[] = []

      // Stock bajo
      try {
        const stockBajo = await statsService.getProductosStockBajo()
        for (const p of stockBajo.slice(0, 5)) {
          alertList.push({
            id: `stock-${p.id}`,
            tipo: 'stock_bajo',
            titulo: `Stock bajo: ${p.nombre}`,
            descripcion: `${p.stock_actual}/${p.stock_minimo} unidades`,
            ruta: '/productos'
          })
        }
        if (stockBajo.length > 5) {
          alertList.push({
            id: 'stock-more',
            tipo: 'stock_bajo',
            titulo: `+${stockBajo.length - 5} productos con stock bajo`,
            descripcion: 'Ver todos los productos',
            ruta: '/productos'
          })
        }
      } catch (e) {
        console.warn('Error cargando stock bajo:', e)
      }

      // Vencimientos
      try {
        const vencimientos = await vencimientosService.getAll()
        const criticos = vencimientos.filter(v => {
          if (!v.fechaVencimiento) return false
          const dias = Math.ceil((new Date(v.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return dias <= 7
        })

        for (const v of criticos.slice(0, 3)) {
          const dias = Math.ceil((new Date(v.fechaVencimiento!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          alertList.push({
            id: `venc-${v.id}`,
            tipo: dias <= 0 ? 'critico' : 'vencimiento',
            titulo: dias <= 0 ? `VENCIDO: ${v.nombre}` : `Vence en ${dias}d: ${v.nombre}`,
            descripcion: `Lote: ${v.numeroLote} — ${v.stockLote} uds`,
            ruta: '/vencimientos'
          })
        }
        if (criticos.length > 3) {
          alertList.push({
            id: 'venc-more',
            tipo: 'vencimiento',
            titulo: `+${criticos.length - 3} productos por vencer`,
            descripcion: 'Ver todos los vencimientos',
            ruta: '/vencimientos'
          })
        }
      } catch (e) {
        console.warn('Error cargando vencimientos:', e)
      }

      setAlerts(alertList)
    } catch (err) {
      console.error('Error cargando alertas:', err)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'stock_bajo': return <Package className="h-4 w-4 text-yellow-500" />
      case 'vencimiento': return <CalendarClock className="h-4 w-4 text-orange-500" />
      case 'critico': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getColor = (tipo: string) => {
    switch (tipo) {
      case 'critico': return 'border-l-red-500'
      case 'stock_bajo': return 'border-l-yellow-500'
      case 'vencimiento': return 'border-l-orange-500'
      default: return 'border-l-primary'
    }
  }

  const criticalCount = alerts.filter(a => a.tipo === 'critico').length
  const totalCount = alerts.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-lift smooth-transition">
          <AlertTriangle className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge 
              className={`absolute -right-1 -top-1 h-5 min-w-5 p-0 text-xs flex items-center justify-center ${
                criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
              }`}
            >
              {totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border rounded-md max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="text-sm font-semibold flex items-center justify-between">
          <span>Alertas del Sistema</span>
          {totalCount > 0 && (
            <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'} className="text-xs">
              {totalCount} alerta{totalCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Sin alertas activas
          </div>
        ) : (
          alerts.map(alert => (
            <DropdownMenuItem
              key={alert.id}
              className={`cursor-pointer flex items-start gap-3 p-3 border-l-2 ${getColor(alert.tipo)}`}
              onClick={() => router.push(alert.ruta)}
            >
              <div className="mt-0.5">{getIcon(alert.tipo)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{alert.titulo}</div>
                <div className="text-xs text-muted-foreground">{alert.descripcion}</div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
