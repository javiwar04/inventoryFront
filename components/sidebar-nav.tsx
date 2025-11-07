"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Settings,
  BarChart3,
  CalendarClock,
  ScrollText,
  Users,
  FolderOpen,
  Building2,
  TrendingUp,
  Shield,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type BadgeVariant = "destructive" | "default" | "secondary" | "outline"

interface NavItem {
  title: string
  href: string
  icon: any
  description: string
  badge?: string | null
  badgeVariant?: BadgeVariant
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Resumen general",
        badge: null,
      },
      {
        title: "Productos",
        href: "/productos",
        icon: Package,
        description: "Gestión de inventario",
        badge: null,
      },
    ],
  },
  {
    title: "Movimientos",
    items: [
      {
        title: "Entradas",
        href: "/entradas",
        icon: ArrowDownToLine,
        description: "Stock entrante",
        badge: "nuevo",
        badgeVariant: "secondary",
      },
      {
        title: "Salidas",
        href: "/salidas",
        icon: ArrowUpFromLine,
        description: "Stock saliente",
        badge: null,
      },
      {
        title: "Vencimientos",
        href: "/vencimientos",
        icon: CalendarClock,
        description: "Productos próximos a vencer",
        badge: "3",
        badgeVariant: "destructive",
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        title: "Categorías",
        href: "/categorias",
        icon: FolderOpen,
        description: "Organizar productos",
        adminOnly: true,
        badge: null,
      },
      {
        title: "Proveedores",
        href: "/proveedores",
        icon: Building2,
        description: "Gestión de proveedores",
        adminOnly: true,
        badge: null,
      },
    ],
  },
  {
    title: "Análisis",
    items: [
      {
        title: "Reportes",
        href: "/reportes",
        icon: TrendingUp,
        description: "Estadísticas y reportes",
        badge: null,
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        title: "Auditoría",
        href: "/auditoria",
        icon: ScrollText,
        description: "Registro de actividades",
        adminOnly: true,
        badge: null,
      },
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: Users,
        description: "Gestión de usuarios",
        adminOnly: true,
        badge: null,
      },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Asegurar que siempre tengamos una estructura válida
  const visibleSections = useMemo(() => {
    // Si no hay usuario, mostrar solo las secciones básicas
    const userRole = user?.rol || 'empleado'
    
    return navSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.adminOnly) {
          return userRole === "administrador"
        }
        return true
      }),
    })).filter((section) => section.items.length > 0)
  }, [user?.rol])

  // Fallback si no hay secciones visibles
  if (!visibleSections || visibleSections.length === 0) {
    return (
      <div className="flex h-screen w-72 flex-col bg-card border-r border-border/40 glass-card">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">Inventario Pro</span>
              <span className="text-xs text-muted-foreground">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-72 flex-col bg-card border-r border-border/40 glass-card">
      {/* Header del sidebar */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">Inventario Pro</span>
            <span className="text-xs text-muted-foreground">Barbería Moderna</span>
          </div>
        </div>
        {user?.rol === "administrador" && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {visibleSections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="flex-1 h-px bg-border/40" />
            </div>
            
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={`${item.href}-${itemIndex}`}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium smooth-transition hover-lift",
                      isActive
                        ? "bg-gradient-primary text-white shadow-lg shadow-primary/25"
                        : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg smooth-transition",
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="leading-none">{item.title}</span>
                        <span className={cn(
                          "text-xs leading-none",
                          isActive ? "text-white/70" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge 
                          variant={item.badgeVariant || "secondary"} 
                          className="text-xs h-5 px-1.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 group-hover:opacity-100 smooth-transition",
                        isActive ? "opacity-100" : ""
                      )} />
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {sectionIndex < visibleSections.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-border/40 p-4">
        <Link
          href="/configuracion"
          className="group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-foreground/70 smooth-transition hover:bg-accent/50 hover:text-foreground hover-lift"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground smooth-transition">
              <Settings className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none">Configuración</span>
              <span className="text-xs text-muted-foreground leading-none">Sistema y preferencias</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 smooth-transition" />
        </Link>
      </div>
    </div>
  )
}
