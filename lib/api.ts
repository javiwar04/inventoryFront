import api from './axios'

// ============================================================================
// TIPOS DE DATOS (basados en la base de datos que diseñamos)
// ============================================================================

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'administrador' | 'empleado' | 'supervisor'
  activo: boolean
  fecha_creacion: string
  ultimo_acceso: string | null
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion: string | null
  categoria_id: number
  categoria: string
  proveedor_id: number
  proveedor_nombre: string
  precio: number
  stock_actual: number
  stock_minimo: number
  unidad: string
  fecha_vencimiento: string | null
  activo: boolean
  fecha_creacion: string
}

export interface Proveedor {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  nit: string | null
  direccion: string | null
  estado: string
  fechaCreacion: string | null
  fechaActualizacion: string | null
  creadoPor: number | null
}

export interface Entrada {
  id: number
  producto_id: number
  producto_nombre: string
  proveedor_id: number
  proveedor_nombre: string
  cantidad: number
  precio_unitario: number
  precio_total: number
  fecha_entrada: string
  usuario_id: number
  usuario_nombre: string
  observaciones: string | null
  fecha_creacion: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: Usuario
  token: string
  message: string
}

// ============================================================================
// SERVICIOS DE AUTENTICACIÓN (usando UsuariosController)
// ============================================================================

export const authService = {
  // Probar conexión con el backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await api.get('/usuarios')
      return response.status === 200
    } catch (error) {
      console.error('Test connection failed:', error)
      return false
    }
  },

  // Login usando email/username y contraseña (temporal hasta que implementes auth real)
  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    try {
      // Primero verificar conexión
      const isConnected = await this.testConnection()
      if (!isConnected) {
        throw new Error('❌ No se puede conectar con el servidor.\n\n🔧 Verifica:\n• Tu API esté corriendo en http://localhost:5152\n• CORS esté configurado correctamente')
      }

      let user: Usuario | null = null

      // Intentar buscar por email primero
      if (emailOrUsername.includes('@')) {
        try {
          const userResponse = await api.get(`/usuarios/email/${encodeURIComponent(emailOrUsername)}`)
          user = userResponse.data
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error
          }
        }
      }

      // Si no se encontró por email, intentar por username
      if (!user) {
        try {
          const userResponse = await api.get(`/usuarios/username/${encodeURIComponent(emailOrUsername)}`)
          user = userResponse.data
        } catch (error: any) {
          if (error.response?.status === 404) {
            throw new Error(`Usuario no encontrado: "${emailOrUsername}"`)
          }
          throw error
        }
      }

      if (!user) {
        throw new Error(`Usuario no encontrado: "${emailOrUsername}"`)
      }
      
      // TODO: Agregar validación de contraseña real aquí
      // Por ahora simulamos login exitoso si el usuario existe
      const mockToken = `jwt-${user.id}-${Date.now()}` // Token temporal
      
      return {
        user,
        token: mockToken,
        message: 'Login exitoso'
      }
    } catch (error: any) {
      // Mejorar mensajes de error
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        throw new Error('❌ Error de conexión\n\n🔧 Soluciones:\n• Verifica que tu API de .NET esté corriendo en http://localhost:5152\n• Configura CORS en Program.cs\n• Revisa la consola de tu API por errores')
      }
      
      throw error
    }
  },

  // Logout (simplificado)
  async logout(): Promise<void> {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
  },

  // Verificar si usuario existe por email
  async getUserByEmail(email: string): Promise<Usuario> {
    const response = await api.get(`/usuarios/email/${encodeURIComponent(email)}`)
    return response.data
  },

  // Verificar si usuario existe por username
  async getUserByUsername(username: string): Promise<Usuario> {
    const response = await api.get(`/usuarios/username/${encodeURIComponent(username)}`)
    return response.data
  }
}

// ============================================================================
// SERVICIOS DE USUARIOS (basado en UsuariosController)
// ============================================================================

export const usuariosService = {
  // Obtener todos los usuarios
  async getAll(): Promise<Usuario[]> {
    const response = await api.get('/usuarios')
    return response.data
  },

  // Obtener usuario por ID
  async getById(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}`)
    return response.data
  },

  // Obtener usuario por username
  async getByUsername(username: string): Promise<Usuario> {
    const response = await api.get(`/usuarios/username/${encodeURIComponent(username)}`)
    return response.data
  },

  // Obtener usuario por email
  async getByEmail(email: string): Promise<Usuario> {
    const response = await api.get(`/usuarios/email/${encodeURIComponent(email)}`)
    return response.data
  },

  // Crear nuevo usuario
  async create(usuario: Omit<Usuario, 'id' | 'fecha_creacion' | 'ultimo_acceso'>): Promise<Usuario> {
    const response = await api.post('/usuarios', usuario)
    return response.data
  },

  // Actualizar usuario
  async update(id: number, usuario: Partial<Usuario>): Promise<void> {
    await api.put(`/usuarios/${id}`, { ...usuario, id })
  },

  // Eliminar usuario
  async delete(id: number): Promise<void> {
    await api.delete(`/usuarios/${id}`)
  },

  // Obtener permisos de un usuario
  async getPermisos(id: number): Promise<any[]> {
    const response = await api.get(`/usuarios/${id}/permisos`)
    return response.data
  },

  // Asignar permiso a usuario
  async asignarPermiso(usuarioId: number, permisoId: number, asignadoPor?: number): Promise<any> {
    const params = asignadoPor ? `?asignadoPor=${asignadoPor}` : ''
    const response = await api.post(`/usuarios/${usuarioId}/permisos/${permisoId}${params}`)
    return response.data
  },

  // Revocar permiso de usuario
  async revocarPermiso(usuarioId: number, permisoId: number): Promise<void> {
    await api.delete(`/usuarios/${usuarioId}/permisos/${permisoId}`)
  }
}

// ============================================================================
// SERVICIOS DE PRODUCTOS (basado en ProductosController)
// ============================================================================

export const productosService = {
  // Obtener productos paginados (por defecto página 1, 20 elementos)
  async getAll(page: number = 1, pageSize: number = 100): Promise<Producto[]> {
    const response = await api.get(`/productos?page=${page}&pageSize=${pageSize}`)
    return response.data
  },

  // Obtener todos los productos sin paginación
  async getAllUnpaged(): Promise<Producto[]> {
    const response = await api.get('/productos?page=1&pageSize=1000') // Traer muchos
    return response.data
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Producto> {
    const response = await api.get(`/productos/${id}`)
    return response.data
  },

  // Obtener producto por SKU
  async getBySku(sku: string): Promise<Producto> {
    const response = await api.get(`/productos/sku/${encodeURIComponent(sku)}`)
    return response.data
  },

  // Buscar productos por término
  async search(term: string): Promise<Producto[]> {
    const response = await api.get(`/productos/buscar?term=${encodeURIComponent(term)}`)
    return response.data
  },

  // Crear nuevo producto
  async create(producto: Omit<Producto, 'id' | 'fecha_creacion' | 'categoria' | 'proveedor_nombre'>): Promise<Producto> {
    const response = await api.post('/productos', producto)
    return response.data
  },

  // Actualizar producto
  async update(id: number, producto: Partial<Producto>): Promise<void> {
    await api.put(`/productos/${id}`, { ...producto, id })
  },

  // Eliminar producto
  async delete(id: number): Promise<void> {
    await api.delete(`/productos/${id}`)
  },

  // Obtener movimientos de un producto específico
  async getMovimientos(id: number, max: number = 100): Promise<any[]> {
    const response = await api.get(`/productos/${id}/movimientos?max=${max}`)
    return response.data
  }
}

// ============================================================================
// SERVICIOS DE PROVEEDORES (basado en ProveedoresController)
// ============================================================================

export const proveedoresService = {
  // Obtener todos los proveedores (ordenados por nombre)
  async getAll(): Promise<Proveedor[]> {
    const response = await api.get('/proveedores')
    return response.data
  },

  // Obtener proveedor por ID
  async getById(id: number): Promise<Proveedor> {
    const response = await api.get(`/proveedores/${id}`)
    return response.data
  },

  // Buscar proveedores por término
  async search(term: string): Promise<Proveedor[]> {
    const response = await api.get(`/proveedores/buscar?term=${encodeURIComponent(term)}`)
    return response.data
  },

  // Crear nuevo proveedor
  async create(proveedor: {
    nombre: string
    contacto?: string | null
    telefono?: string | null
    email?: string | null
    nit?: string | null
    direccion?: string | null
    estado?: string
    creadoPor?: number | null
  }): Promise<Proveedor> {
    const response = await api.post('/proveedores', {
      ...proveedor,
      estado: proveedor.estado || 'Activo' // Valor por defecto
    })
    return response.data
  },

  // Actualizar proveedor
  async update(id: number, proveedor: {
    nombre?: string
    contacto?: string | null
    telefono?: string | null
    email?: string | null
    nit?: string | null
    direccion?: string | null
    estado?: string
  }): Promise<void> {
    await api.put(`/proveedores/${id}`, { 
      ...proveedor, 
      id,
      estado: proveedor.estado || 'Activo'
    })
  },

  // Eliminar proveedor
  async delete(id: number): Promise<void> {
    await api.delete(`/proveedores/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE ENTRADAS
// ============================================================================

export const entradasService = {
  // Obtener todas las entradas
  async getAll(): Promise<Entrada[]> {
    const response = await api.get('/entradas')
    return response.data
  },

  // Obtener entrada por ID
  async getById(id: number): Promise<Entrada> {
    const response = await api.get(`/entradas/${id}`)
    return response.data
  },

  // Registrar nueva entrada
  async create(entrada: {
    producto_id: number
    cantidad: number
    precio_unitario: number
    fecha_entrada: string
    observaciones?: string
  }): Promise<Entrada> {
    const response = await api.post('/entradas', entrada)
    return response.data
  },

  // Actualizar entrada
  async update(id: number, entrada: Partial<Entrada>): Promise<Entrada> {
    const response = await api.put(`/entradas/${id}`, entrada)
    return response.data
  },

  // Eliminar entrada
  async delete(id: number): Promise<void> {
    await api.delete(`/entradas/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE CATEGORÍAS (si tienes endpoints específicos)
// ============================================================================

export const categoriasService = {
  async getAll(): Promise<{ id: number; nombre: string; descripcion?: string }[]> {
    const response = await api.get('/categorias')
    return response.data
  },

  async create(categoria: { nombre: string; descripcion?: string }) {
    const response = await api.post('/categorias', categoria)
    return response.data
  }
}

// ============================================================================
// SERVICIOS DE DASHBOARDS Y ESTADÍSTICAS
// ============================================================================

export const statsService = {
  // Estadísticas generales del dashboard
  async getDashboardStats(): Promise<{
    total_productos: number
    productos_stock_bajo: number
    total_entradas_mes: number
    valor_inventario: number
  }> {
    const response = await api.get('/stats/dashboard')
    return response.data
  },

  // Movimientos recientes
  async getMovimientosRecientes(): Promise<any[]> {
    const response = await api.get('/stats/movimientos-recientes')
    return response.data
  }
}

// Exportar todo como un objeto por defecto para facilidad de uso
export default {
  auth: authService,
  usuarios: usuariosService,
  productos: productosService,
  proveedores: proveedoresService,
  entradas: entradasService,
  categorias: categoriasService,
  stats: statsService
}