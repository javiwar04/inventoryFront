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
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user-data')
      window.location.href = '/login'
    }
    
    // Manejar otros errores HTTP
    const message = error.response?.data?.message || error.message || 'Error en la solicitud'
    console.error('API Error:', message)
    
    return Promise.reject(error)
  }
)

export default api