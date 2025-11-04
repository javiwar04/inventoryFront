import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function StatsCard({ title, value, change, changeType, icon: Icon }: StatsCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-3 w-3" />
      case "negative":
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  const getChangeStyles = () => {
    switch (changeType) {
      case "positive":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800"
      case "negative":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800"
    }
  }

  return (
    <div className="relative">
      {/* Icono principal */}
      <div className="absolute top-4 right-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Contenido */}
      <div className="pt-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
        <div className="space-y-3">
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <div className={`inline-flex items-center space-x-1 rounded-full border px-2.5 py-1 text-xs font-medium ${getChangeStyles()}`}>
            {getChangeIcon()}
            <span>{change}</span>
          </div>
        </div>
      </div>

      {/* Efecto de gradiente sutil */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 pointer-events-none" />
    </div>
  )
}
