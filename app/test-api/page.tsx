"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usuariosService, productosService } from '@/lib/api'

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const data = await testFunction()
      setResult({ test: testName, success: true, data })
    } catch (err: any) {
      console.error(`Error en ${testName}:`, err)
      setError(err.response?.data?.message || err.message || 'Error desconocido')
      setResult({ test: testName, success: false, error: err })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Prueba de Conexión API</CardTitle>
          <p className="text-muted-foreground">
            Prueba la conexión con tu backend de .NET en http://localhost:5152
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Botones de prueba */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => testConnection('Obtener Usuarios', () => usuariosService.getAll())}
              disabled={loading}
              variant="outline"
            >
              📋 Probar /api/usuarios
            </Button>
            
            <Button 
              onClick={() => testConnection('Obtener Productos', () => productosService.getAll(1, 5))}
              disabled={loading}
              variant="outline"
            >
              📦 Probar /api/productos
            </Button>
          </div>

          {/* Estado de carga */}
          {loading && (
            <Alert>
              <AlertDescription>
                🔄 Probando conexión con el backend...
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                ❌ <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Resultado */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? '✅' : '❌'} {result.test}
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Éxito' : 'Error'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Información de configuración */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuración Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</div>
                <div><strong>Frontend URL:</strong> http://localhost:3000</div>
                <div><strong>Estado:</strong> <Badge variant="outline">Configurado</Badge></div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}