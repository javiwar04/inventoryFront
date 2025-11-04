"use client"

import { useEffect } from "react"

interface NoFlashWrapperProps {
  children: React.ReactNode
}

export function NoFlashWrapper({ children }: NoFlashWrapperProps) {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      document.body.classList.add('loaded')
    }
  }, [])

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}