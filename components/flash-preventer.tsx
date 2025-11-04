"use client"

import { useEffect, useState } from "react"

export function FlashPreventer({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Establecer fondo inmediatamente
    document.documentElement.style.backgroundColor = '#fafafa'
    document.body.style.backgroundColor = '#fafafa'
    document.body.style.color = '#0a0a0a'
    
    const timer = setTimeout(() => {
      setIsLoaded(true)
      document.body.classList.add('loaded')
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundColor: '#fafafa',
          color: '#0a0a0a'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}