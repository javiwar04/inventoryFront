"use client"

import { memo, useEffect, useState } from "react"
import { SidebarNav } from "./sidebar-nav"

// Memorizar el sidebar para evitar re-renderizados innecesarios
export const StableSidebar = memo(function StableSidebar() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex h-screen w-72 flex-col bg-card border-r border-border/40 glass-card">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-white text-xs">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">Inventario Pro</span>
              <span className="text-xs text-muted-foreground">Cargando...</span>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return <SidebarNav />
})