"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Info,
  Building2,
  Clock,
  DollarSign,
  Loader2
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { configuracionService, type Configuracion, registrarAuditoria } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState<string>('general')

  const categorias = [
    { id: 'general', nombre: 'General', icon: Settings, color: 'text-gray-500' },
    { id: 'empresa', nombre: 'Empresa', icon: Building2, color: 'text-blue-500' },
    { id: 'inventario', nombre: 'Inventario', icon: DollarSign, color: 'text-green-500' },
    { id: 'notificaciones', nombre: 'Notificaciones', icon: Bell, color: 'text-orange-500' },
    { id: 'seguridad', nombre: 'Seguridad', icon: Shield, color: 'text-red-500' },
  ]

  useEffect(() => {
    cargarConfiguraciones()
  }, [])

  const cargarConfiguraciones = async () => {
    setIsLoading(true)
    try {
      const data = await configuracionService.getAll()
      setConfiguraciones(data)
    } catch (error) {
      console.error('Error cargando configuraciones:', error)
      toast.error('Error al cargar configuraciones', {
        description: 'No se pudieron cargar las configuraciones del sistema'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const configuracionesFiltradas = configuraciones.filter(
    config => config.categoria === categoriaActiva
  )

  const updateConfiguracion = (id: number, nuevoValor: string) => {
    setConfiguraciones(prev => 
      prev.map(config => 
        config.id === id 
          ? { 
              ...config, 
              valor: nuevoValor
            }
          : config
      )
    )
  }

  const guardarConfiguraciones = async () => {
    setIsSaving(true)
    
    try {
      // Actualizar todas las configuraciones modificadas
      const promises = configuraciones.map(config => 
        configuracionService.update(config.id, {
          clave: config.clave,
          valor: config.valor,
          descripcion: config.descripcion,
          tipo: config.tipo,
          categoria: config.categoria,
          actualizadoPor: user?.id
        })
      )
      
      await Promise.all(promises)
      
      // Registrar auditoría
      await registrarAuditoria({
        accion: 'actualizar',
        modulo: 'configuracion',
        descripcion: `Configuraciones del sistema actualizadas`,
        detalles: JSON.stringify({ categoria: categoriaActiva })
      })
      
      toast.success('Configuraciones guardadas', {
        description: 'Los cambios se han aplicado exitosamente'
      })
      
      // Recargar para obtener las fechas actualizadas del backend
      await cargarConfiguraciones()
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar', {
        description: 'No se pudieron guardar las configuraciones'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetearConfiguraciones = async () => {
    try {
      await cargarConfiguraciones()
      toast.success('Configuraciones recargadas', {
        description: 'Se han restaurado los valores desde la base de datos'
      })
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudieron recargar las configuraciones'
      })
    }
  }

  const renderCampo = (config: Configuracion) => {
    const tipo = config.tipo?.toLowerCase() || 'string'
    
    switch (tipo) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={`config-${config.id}`}
              checked={config.valor === 'true'}
              onCheckedChange={(checked) => 
                updateConfiguracion(config.id, checked ? 'true' : 'false')
              }
            />
            <Label htmlFor={`config-${config.id}`} className="text-sm">
              {config.valor === 'true' ? 'Habilitado' : 'Deshabilitado'}
            </Label>
          </div>
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={config.valor || ''}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full"
          />
        )
      
      case 'json':
        return (
          <Textarea
            value={config.valor || ''}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full min-h-[100px] font-mono text-sm"
            placeholder='{"ejemplo": "valor"}'
          />
        )
      
      default: // 'string'
        return (
          <Input
            type={config.clave?.includes('email') ? 'email' : 'text'}
            value={config.valor || ''}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full"
          />
        )
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute adminOnly>
        <div className="flex h-screen">
          <StaticSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando configuraciones...</p>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Configuración del Sistema</h1>
                <p className="mt-2 text-muted-foreground">
                  Gestiona las configuraciones globales de la empresa y el sistema de inventario
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={resetearConfiguraciones}
                  className="hover-lift"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restablecer
                </Button>
                <Button
                  onClick={guardarConfiguraciones}
                  disabled={isSaving}
                  className="hover-lift bg-gradient-success"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar de categorías */}
              <div className="lg:col-span-1">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Categorías</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categorias.map((categoria) => {
                      const Icon = categoria.icon
                      return (
                        <Button
                          key={categoria.id}
                          variant={categoriaActiva === categoria.id ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            categoriaActiva === categoria.id 
                              ? "bg-gradient-primary text-white" 
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => setCategoriaActiva(categoria.id)}
                        >
                          <Icon className={`mr-2 h-4 w-4 ${categoria.color}`} />
                          {categoria.nombre}
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Contenido principal */}
              <div className="lg:col-span-3">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {(() => {
                        const categoria = categorias.find(c => c.id === categoriaActiva)
                        if (categoria) {
                          const Icon = categoria.icon
                          return <Icon className="h-5 w-5" />
                        }
                        return null
                      })()}
                      <span>
                        Configuración de {categorias.find(c => c.id === categoriaActiva)?.nombre}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {configuracionesFiltradas.map((config, index) => (
                      <div key={config.id}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor={`config-${config.id}`} className="text-sm font-medium">
                                {config.clave.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {config.descripcion}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {config.tipo}
                            </Badge>
                          </div>
                          
                          {renderCampo(config)}
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Actualizado: {config.fechaActualizacion 
                                  ? new Date(config.fechaActualizacion).toLocaleString('es-GT')
                                  : 'N/A'}
                              </span>
                            </span>
                            {config.actualizadoPor && (
                              <span>Por: Usuario ID {config.actualizadoPor}</span>
                            )}
                          </div>
                        </div>
                        
                        {index < configuracionesFiltradas.length - 1 && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-sm">Información</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Los cambios se aplican inmediatamente al guardar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <h3 className="font-semibold text-sm">Precaución</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Algunos cambios requieren reinicio del sistema
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-sm">Respaldo</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Las configuraciones se respaldan automáticamente
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}