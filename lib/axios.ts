import axios from 'axios'

// Configuración base de Axios para .NET 8 API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5152/api',
  timeout: 15000, // Aumentado para .NET
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Para CORS con .NET
})

// Interceptor para requests - añade token de autenticación
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    // Log para debugging
    if (config.method === 'post' || config.method === 'put') {
      console.log(`[AXIOS] ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para responses - maneja errores globalmente
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // No redirigir si el fallo viene del endpoint de login para poder mostrar el error en pantalla
      const isLoginRequest = (error.config?.url || '').includes('/auth/login')
      if (!isLoginRequest) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('user-data')
        }
        window.location.href = '/login'
        return
      }
    }
    
    // Manejar errores de unique constraint y otros errores del servidor de forma amigable
    const serverData = error.response?.data
    const serverText = typeof serverData === 'string' ? serverData : JSON.stringify(serverData || '')

    // Heurística: detectar violaciones de UNIQUE KEY en SQL Server
    if (serverText && (serverText.includes('Violation of UNIQUE KEY constraint') || serverText.includes('Cannot insert duplicate key') || serverText.includes('SqlException')) ) {
      // Intentar extraer valor duplicado
      const match = serverText.match(/\(([^)]+)\)/)
      const duplicatedValue = match ? match[1] : null

      // Intentar adivinar el campo
      let friendly = 'Ya existe un registro con un valor duplicado.'
      const lower = serverText.toLowerCase()
      if (lower.includes('telefono') || lower.includes('teléfono') || /\b\d{7,}\b/.test(duplicatedValue || '')) {
        friendly = 'Ya existe un proveedor con ese número de teléfono.'
      } else if (lower.includes('nit')) {
        friendly = 'Ya existe un proveedor con ese NIT.'
      } else if (duplicatedValue) {
        friendly = `Ya existe un proveedor con el valor "${duplicatedValue}".`
      }

      console.error('API Error (friendly):', friendly)
      // Rechazar con un Error más amigable para que los catch locales lo muestren
      return Promise.reject(new Error(friendly))
    }

    // Manejar otros errores HTTP: loguear status y body completo para depuración
    const status = error.response?.status
    const data = error.response?.data
    try {
      // Mostrar status y el body (puede ser JSON o texto)
      console.error('API Error status:', status, 'data:', data || error.message)
      // Si es 400, mostrar toast con detalle del servidor
      if (status === 400 && data) {
        console.error('🔴 FULL 400 RESPONSE:', JSON.stringify(data, null, 2))
        if (data.errors) {
          console.error('🔴 VALIDATION ERRORS:', JSON.stringify(data.errors, null, 2))
        }
        const detail = typeof data === 'string' ? data : (data.message || data.title || JSON.stringify(data))
        console.error('Detalle 400:', detail)
      }
    } catch (logErr) {
      // Fallback por si data tiene referencias circulares o falla stringify
      console.error('API Error (fallback):', error.message)
    }

    return Promise.reject(error)
  }
)

export default api