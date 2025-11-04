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
  DollarSign
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

interface ConfiguracionSistema {
  id: number
  clave: string
  valor: string
  descripcion: string
  categoria: 'general' | 'inventario' | 'notificaciones' | 'seguridad' | 'empresa'
  tipo: 'string' | 'number' | 'boolean' | 'json'
  fecha_actualizacion: string
  actualizado_por: number
}

const configuracionesDefault: ConfiguracionSistema[] = [
  // Configuraciones de Empresa
  {
    id: 1,
    clave: 'empresa_nombre',
    valor: 'Barbería Premium',
    descripcion: 'Nombre de la empresa o barbería',
    categoria: 'empresa',
    tipo: 'string',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 2,
    clave: 'empresa_direccion',
    valor: 'Calle Principal #123, Ciudad',
    descripcion: 'Dirección física de la barbería',
    categoria: 'empresa',
    tipo: 'string',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 3,
    clave: 'empresa_telefono',
    valor: '+1 234-567-8900',
    descripcion: 'Número de teléfono principal',
    categoria: 'empresa',
    tipo: 'string',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 4,
    clave: 'empresa_email',
    valor: 'info@barberiapremium.com',
    descripcion: 'Email principal de la empresa',
    categoria: 'empresa',
    tipo: 'string',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  
  // Configuraciones de Inventario
  {
    id: 5,
    clave: 'stock_minimo_default',
    valor: '10',
    descripcion: 'Cantidad mínima de stock por defecto para nuevos productos',
    categoria: 'inventario',
    tipo: 'number',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 6,
    clave: 'dias_alerta_vencimiento',
    valor: '30',
    descripcion: 'Días antes del vencimiento para mostrar alerta',
    categoria: 'inventario',
    tipo: 'number',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 7,
    clave: 'auto_descuento_stock',
    valor: 'true',
    descripcion: 'Descontar automáticamente del stock al registrar salidas',
    categoria: 'inventario',
    tipo: 'boolean',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 8,
    clave: 'moneda_sistema',
    valor: 'USD',
    descripcion: 'Moneda principal del sistema (USD, EUR, MXN, etc.)',
    categoria: 'inventario',
    tipo: 'string',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  
  // Configuraciones de Notificaciones
  {
    id: 9,
    clave: 'notificaciones_email',
    valor: 'true',
    descripcion: 'Habilitar notificaciones por email',
    categoria: 'notificaciones',
    tipo: 'boolean',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 10,
    clave: 'notificaciones_stock_bajo',
    valor: 'true',
    descripcion: 'Notificar cuando el stock esté bajo',
    categoria: 'notificaciones',
    tipo: 'boolean',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 11,
    clave: 'notificaciones_vencimientos',
    valor: 'true',
    descripcion: 'Notificar productos próximos a vencer',
    categoria: 'notificaciones',
    tipo: 'boolean',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  
  // Configuraciones de Seguridad
  {
    id: 12,
    clave: 'sesion_timeout_minutos',
    valor: '120',
    descripcion: 'Tiempo en minutos antes de cerrar sesión automáticamente',
    categoria: 'seguridad',
    tipo: 'number',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 13,
    clave: 'password_min_length',
    valor: '8',
    descripcion: 'Longitud mínima requerida para contraseñas',
    categoria: 'seguridad',
    tipo: 'number',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  {
    id: 14,
    clave: 'backup_automatico',
    valor: 'true',
    descripcion: 'Realizar respaldos automáticos de la base de datos',
    categoria: 'seguridad',
    tipo: 'boolean',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  },
  
  // Configuración General con JSON
  {
    id: 15,
    clave: 'configuracion_smtp',
    valor: '{"servidor": "smtp.gmail.com", "puerto": 587, "ssl": true, "usuario": "", "password": ""}',
    descripcion: 'Configuración del servidor SMTP para envío de emails',
    categoria: 'general',
    tipo: 'json',
    fecha_actualizacion: new Date().toISOString(),
    actualizado_por: 1
  }
]

export default function ConfiguracionPage() {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionSistema[]>(configuracionesDefault)
  const [isLoading, setIsLoading] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState<string>('general')
  const { toast } = useToast()

  const categorias = [
    { id: 'general', nombre: 'General', icon: Settings, color: 'text-gray-500' },
    { id: 'empresa', nombre: 'Empresa', icon: Building2, color: 'text-blue-500' },
    { id: 'inventario', nombre: 'Inventario', icon: DollarSign, color: 'text-green-500' },
    { id: 'notificaciones', nombre: 'Notificaciones', icon: Bell, color: 'text-orange-500' },
    { id: 'seguridad', nombre: 'Seguridad', icon: Shield, color: 'text-red-500' },
  ]

  const configuracionesFiltradas = configuraciones.filter(
    config => config.categoria === categoriaActiva
  )

  const updateConfiguracion = (id: number, nuevoValor: string) => {
    setConfiguraciones(prev => 
      prev.map(config => 
        config.id === id 
          ? { 
              ...config, 
              valor: nuevoValor, 
              fecha_actualizacion: new Date().toISOString(),
              actualizado_por: 1 // ID del usuario actual
            }
          : config
      )
    )
  }

  const guardarConfiguraciones = async () => {
    setIsLoading(true)
    
    try {
      // Simular guardado en base de datos
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "✅ Configuraciones guardadas",
        description: "Los cambios se han aplicado exitosamente",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "❌ Error al guardar",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetearConfiguraciones = () => {
    setConfiguraciones(configuracionesDefault)
    toast({
      title: "🔄 Configuraciones restablecidas",
      description: "Se han restaurado los valores por defecto",
      variant: "default"
    })
  }

  const renderCampo = (config: ConfiguracionSistema) => {
    switch (config.tipo) {
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
            value={config.valor}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full"
          />
        )
      
      case 'json':
        return (
          <Textarea
            value={config.valor}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full min-h-[100px] font-mono text-sm"
            placeholder='{"ejemplo": "valor"}'
          />
        )
      
      default: // 'string'
        return (
          <Input
            type={config.clave.includes('email') ? 'email' : 'text'}
            value={config.valor}
            onChange={(e) => updateConfiguracion(config.id, e.target.value)}
            className="w-full"
          />
        )
    }
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
                  Gestiona las configuraciones globales de la barbería y el sistema de inventario
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
                  disabled={isLoading}
                  className="hover-lift bg-gradient-success"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
                                Actualizado: {new Date(config.fecha_actualizacion).toLocaleString()}
                              </span>
                            </span>
                            <span>Por: Usuario ID {config.actualizado_por}</span>
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