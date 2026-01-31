"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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
  ArrowLeftRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

// Navegación estática que siempre se muestra
const staticNavSections = [
  {
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Resumen general",
      },
      {
        title: "Productos",
        href: "/productos",
        icon: Package,
        description: "Gestión de inventario",
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
      },
      {
        title: "Ventas",
        href: "/salidas",
        icon: ArrowUpFromLine,
        description: "Registro de ventas",
      },
      {
        title: "Transferencias",
        href: "/transferencias",
        icon: ArrowLeftRight,
        description: "Mover entre hoteles",
      },
      {
        title: "Vencimientos",
        href: "/vencimientos",
        icon: CalendarClock,
        description: "Productos próximos a vencer",
        badge: "3",
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
      },
      {
        title: "Hoteles",
        href: "/proveedores",
        icon: Building2,
        description: "Gestión de hoteles",
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
      },
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: Users,
        description: "Gestión de usuarios",
      },
    ],
  },
]

export function StaticSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const showExpanded = !isCollapsed || isHovered

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                <Image src="/logoselvamo.png" alt="Logo" width={24} height={24} className="object-contain" />
              </div>
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-sm font-semibold leading-none whitespace-nowrap">SELVAMO</span>
                <span className="text-xs text-muted-foreground leading-none whitespace-nowrap">Sistema Inventario</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5 animate-in fade-in duration-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Image src="/logoselvamo.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-6">
        {staticNavSections.map((section, sectionIndex) => (
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
                            variant="secondary" 
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
            
            {showExpanded && sectionIndex < staticNavSections.length - 1 && (
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