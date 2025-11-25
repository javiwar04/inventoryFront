"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
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
  ChevronLeft,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

type BadgeVariant = "destructive" | "default" | "secondary" | "outline"

interface NavItem {
  title: string
  href: string
  icon: any
  description: string
  badge?: string | null
  badgeVariant?: BadgeVariant
  permission?: string // Permiso requerido para ver este item
  adminOnly?: boolean // Mantener por compatibilidad
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
        permission: "productos.ver",
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
        permission: "entradas.ver",
      },
      {
        title: "Salidas",
        href: "/salidas",
        icon: ArrowUpFromLine,
        description: "Stock saliente",
        badge: null,
        permission: "salidas.ver",
      },
      {
        title: "Vencimientos",
        href: "/vencimientos",
        icon: CalendarClock,
        description: "Productos próximos a vencer",
        badge: "3",
        badgeVariant: "destructive",
        permission: "productos.ver",
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
        badge: null,
        permission: "categorias.ver",
      },
      {
        title: "Proveedores",
        href: "/proveedores",
        icon: Building2,
        description: "Gestión de proveedores",
        badge: null,
        permission: "proveedores.ver",
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
        permission: "reportes.ver",
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
        badge: null,
        permission: "auditoria.ver",
      },
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: Users,
        description: "Gestión de usuarios",
        badge: null,
        permission: "usuarios.ver",
      },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { hasPermission, isAdmin } = usePermissions()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const showExpanded = !isCollapsed || isHovered

  // Filtrar secciones según permisos
  const visibleSections = useMemo(() => {
    if (!user) return []
    
    return navSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Dashboard siempre visible
        if (item.href === "/") return true
        
        // Si tiene permiso específico, mostrarlo
        if (item.permission) {
          return hasPermission(item.permission)
        }
        
        // Si es adminOnly y es admin, mostrarlo
        if (item.adminOnly) {
          return isAdmin()
        }
        
        // Por defecto, mostrar
        return true
      }),
    })).filter((section) => section.items.length > 0)
  }, [user, hasPermission, isAdmin])

  // Fallback si no hay secciones visibles
  if (!visibleSections || visibleSections.length === 0) {
    return (
      <div className={cn(
        "flex h-screen flex-col bg-card border-r border-border/40 glass-card transition-all duration-300",
        showExpanded ? "w-72" : "w-16"
      )}>
        <div className="flex h-16 items-center justify-between px-3 border-b border-border/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            {showExpanded && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">Inventario Pro</span>
                <span className="text-xs text-muted-foreground">Cargando...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "flex h-screen flex-col bg-card border-r border-border/40 glass-card transition-all duration-300 ease-in-out relative",
        showExpanded ? "w-72" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-border bg-card shadow-md hover:bg-accent transition-all duration-300",
          !showExpanded && "rotate-180"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Header del sidebar */}
      <div className="flex h-16 items-center justify-center border-b border-border/40">
        {showExpanded ? (
          <div className="flex items-center justify-between w-full px-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary flex-shrink-0">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-sm font-semibold leading-none whitespace-nowrap">Inventario Pro</span>
                <span className="text-xs text-muted-foreground leading-none whitespace-nowrap">Barbería Moderna</span>
              </div>
            </div>
            {isAdmin() && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 animate-in fade-in duration-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-6">
        {visibleSections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-3">
            {showExpanded && (
              <div className="flex items-center space-x-2 px-2 animate-in fade-in duration-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {section.title}
                </h3>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            )}
            
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={`${item.href}-${itemIndex}`}
                    href={item.href}
                    title={!showExpanded ? item.title : undefined}
                    className={cn(
                      "group flex items-center justify-between rounded-xl text-sm font-medium smooth-transition hover-lift",
                      showExpanded ? "px-3 py-3" : "px-2 py-2 justify-center",
                      isActive
                        ? "bg-gradient-primary text-white shadow-lg shadow-primary/25"
                        : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn("flex items-center", showExpanded ? "space-x-3" : "")}>
                      <div className={cn(
                        "flex items-center justify-center rounded-lg smooth-transition",
                        showExpanded ? "h-8 w-8" : "h-6 w-6",
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {showExpanded && (
                        <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
                          <span className="leading-none whitespace-nowrap">{item.title}</span>
                          <span className={cn(
                            "text-xs leading-none whitespace-nowrap",
                            isActive ? "text-white/70" : "text-muted-foreground"
                          )}>
                            {item.description}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {showExpanded && (
                      <div className="flex items-center space-x-2 animate-in fade-in duration-200">
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
                    )}
                  </Link>
                )
              })}
            </div>
            
            {showExpanded && sectionIndex < visibleSections.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer del sidebar - Configuración oculta (sin datos en DB) */}
      {/* <div className="border-t border-border/40 p-4">
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
      </div> */}
    </div>
  )
}
