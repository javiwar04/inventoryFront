"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(usuario, password)
      router.push("/")
    } catch (err: any) {
      const msg = err?.message || "Error al iniciar sesión"
      setError(msg)
      // Mostrar toast con más detalle para que no se pierda si hay navegación
      const status = err?.response?.status
      const serverMsg = err?.response?.data?.message || err?.response?.data || ''
      toast.error(`Login fallido${status ? ` (HTTP ${status})` : ''}`, {
        description: typeof serverMsg === 'string' && serverMsg.length > 0 ? serverMsg : msg,
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex justify-center mb-2">
            <Image 
              src="/logoselvamo.png" 
              alt="SELVAMO Logo" 
              width={140} 
              height={140} 
              className="object-contain"
              priority
            />
          </div>
          <div>
            <CardTitle className="text-2xl">SELVAMO</CardTitle>
            <CardDescription className="text-pretty">Sistema de Gestión de Stock</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Email o Usuario</Label>
              <Input
                id="usuario"
                type="text"
                placeholder="admin@barberia.com o admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Logo WARFORGE */}
          <div className="mt-6 pt-6 border-t border-border/40 flex justify-center">
            <a href="https://www.warforgegt.com" target="_blank" rel="noopener noreferrer">
              <img 
                src="/warforge-logo.png" 
                alt="WARFORGE - Forging the Future" 
                className="h-16 w-auto opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
