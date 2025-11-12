"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type Usuario } from "@/lib/api"

interface AuthContextType {
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      try {
        // Cargar usuario desde localStorage si existe
        const savedUser = localStorage.getItem('user-data')
        const savedToken = localStorage.getItem('auth-token')
        
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setUser(null)
        // Limpiar datos corruptos
        localStorage.removeItem('user-data')
        localStorage.removeItem('auth-token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const authResponse = await authService.login(username, password)
      localStorage.setItem('auth-token', authResponse.token)
      localStorage.setItem('user-data', JSON.stringify(authResponse.user))
      if (authResponse.expiresAt) {
        localStorage.setItem('auth-exp', authResponse.expiresAt.toString())
      }
      setUser(authResponse.user)
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Siempre limpiar el estado local
      setUser(null)
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user-data')
      localStorage.removeItem('auth-exp')
      localStorage.removeItem('user-permissions')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}
