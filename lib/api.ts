import api from './axios'

// ============================================================================
// TIPOS DE DATOS (basados en la base de datos que diseñamos)
// ============================================================================

export interface Usuario {
  id: number
  nombre: string
  usuario1?: string
  email: string
  passwordHash?: string
  rol: 'admin' | 'gerente' | 'empleado' | 'administrador' | 'supervisor' // Incluir todos los valores posibles
  estado: string
  avatar?: string | null
  sedeId?: number | null // ID de la sede/sucursal (proveedor) asignada
  ultimoAcceso?: string | null
  fechaCreacion?: string | null
  fechaActualizacion?: string | null
  creadoPor?: number | null
  activo?: boolean // computed del estado
  fecha_creacion?: string // alias
  ultimo_acceso?: string | null // alias
}

export interface Permiso {
  id: number
  nombre: string
  descripcion: string | null
  modulo: string
}

export interface UsuarioPermiso {
  id: number
  usuarioId: number
  permisoId: number
  fechaAsignacion: string | null
  asignadoPor: number | null
  permiso?: Permiso
  usuario?: Usuario
  asignadoPorNavigation?: Usuario
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion: string | null
  categoria_id: number
  categoria: { id: number; nombre: string; codigo?: string } | null
  proveedor_id: number
  proveedor: { id: number; nombre: string } | null
  precio: number
  costo: number
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
  numeroEntrada: string
  fechaEntrada: string
  proveedorId?: number | null
  // Ahora puede venir como string (nombre) o como objeto (antiguo/byID)
  proveedor: string | { id: number; nombre: string } | null
  numeroFactura?: string | null
  total: number | null
  observaciones?: string | null
  estado?: string
  fechaCreacion?: string
  creadoPor?: number | null
  // Soporte para ambos nombres de propiedad
  detalleEntrada?: DetalleEntrada[]
  detalles?: DetalleEntrada[]
}

export interface DetalleEntrada {
  id?: number
  entradaId?: number
  productoId: number
  // Ahora puede venir como string (nombre) o objeto
  producto: string | { id: number; nombre: string; sku: string } | null
  cantidad: number
  precioUnitario: number
  subtotal: number | null
  lote: string | null
  fechaVencimiento?: string | null
}

export interface Salida {
  id: number
  numeroSalida: string
  fechaSalida: string
  motivo: string
  destino: string | null
  referencia?: string | null
  observaciones: string | null
  estado: string
  fechaCreacion?: string
  creadoPor?: number | null 
  // Soporte para ambos
  detalleSalida?: DetalleSalida[]
  detalles?: DetalleSalida[]
  // Nuevos campos para POS/Ventas
  total?: number | null
  metodoPago?: string | null
  cliente?: string | null
}

export interface DetalleSalida {
  id?: number
  salidaId?: number
  productoId: number
  // Ahora puede venir como string (nombre) o objeto
  producto: string | { id: number; nombre: string; sku: string } | null
  cantidad: number
  lote: string | null
  // Nuevos campos para detalle de ventas
  precioUnitario?: number
  subtotal?: number
}

// Vista: Productos próximos a vencimiento
export interface VProductoVencimiento {
  id: number
  sku: string
  nombre: string
  numeroLote: string
  fechaVencimiento: string | null
  stockLote: number
  diasVencimiento?: number | null
  estadoVencimiento: string
}

export interface Auditorium {
  id: number
  usuarioId: number | null
  usuarioNombre: string
  accion: string
  modulo: string
  tablaAfectada: string | null
  registroId: number | null
  descripcion: string
  detalles: string | null
  ipAddress: string | null
  userAgent: string | null
  fechaHora: string | null
  usuario?: Usuario | null
}

export interface Configuracion {
  id: number
  clave: string
  valor: string | null
  descripcion: string | null
  tipo: string | null
  categoria: string | null
  fechaActualizacion: string | null
  actualizadoPor: number | null
}

export interface AuthResponse {
  user: Usuario
  token: string
  message?: string
  expiresAt?: number // epoch seconds (derivado del JWT)
}

// ============================================================================
// SERVICIOS DE AUTENTICACIÓN Y USUARIOS
// ============================================================================

export const authService = {
  // Login REAL contra AuthController (/api/auth/login)
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', { username, password })
      const { token, usuario, permisos } = response.data

      // Derivar expiración decodificando JWT (sin validar firma aquí)
      let expiresAt: number | undefined
      try {
        const payloadBase64 = token.split('.')[1]
        if (payloadBase64) {
          // decode base64 in browser or Node (Buffer fallback)
          const decodeBase64 = (b64: string) => {
            try {
              if (typeof globalThis !== 'undefined' && typeof (globalThis as any).atob === 'function') {
                return (globalThis as any).atob(b64)
              }
            } catch (e) {
              // fallthrough to Buffer
            }
            try {
              return Buffer.from(b64, 'base64').toString('utf8')
            } catch (e) {
              return ''
            }
          }

          const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
          const jsonText = decodeBase64(normalized)
          if (jsonText) {
            const json = JSON.parse(jsonText)
            if (json && typeof json.exp === 'number') {
              expiresAt = json.exp
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo decodificar JWT para expiración', e)
      }

      // Establecer Authorization para la siguiente llamada
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Guardar permisos si vienen en la respuesta
      if (permisos && permisos.length > 0) {
        localStorage.setItem('user-permissions', JSON.stringify(permisos))
      }

      // Intentar obtener el perfil completo compatible con la interfaz Usuario
      let fullUser: Usuario = usuario
      try {
        const id = usuario?.id ?? usuario?.Id
        if (id) {
          fullUser = await usuariosService.getById(Number(id))
        }
      } catch (e) {
        // Si falla, continuamos con el usuario básico
      }

      return { user: fullUser, token, message: 'Login exitoso', expiresAt }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('❌ Error de conexión con el servidor de autenticación.')
      }
      const apiMsg = error.response?.data?.message || error.message || 'Error al iniciar sesión'
      throw new Error(apiMsg)
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
    localStorage.removeItem('auth-exp')
    localStorage.removeItem('user-permissions')
  }
}

// ============================================================================
// SERVICIOS DE USUARIOS 
// ============================================================================

export const usuariosService = {
  // Obtener todos los usuarios
  async getAll(): Promise<Usuario[]> {
    const response = await api.get('/usuarios')
    // Robust check
    if (Array.isArray(response.data)) return response.data
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
    return []
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
  async create(usuario: {
    nombre: string
    usuario1: string
    email: string
    passwordHash: string
    rol: string
    estado: string
    avatar?: string | null
    sedeId?: number | null
    creadoPor?: number | null
  }): Promise<Usuario> {
    // Convertir a PascalCase para el backend
    const payload: any = {
      Nombre: usuario.nombre,
      Usuario1: usuario.usuario1,
      Email: usuario.email,
      PasswordHash: usuario.passwordHash,
      Rol: usuario.rol,
      Estado: usuario.estado,
      Avatar: usuario.avatar,
      SedeId: usuario.sedeId
    }
    
    // Solo agregar CreadoPor si tiene un valor válido
    if (usuario.creadoPor && usuario.creadoPor > 0) {
      payload.CreadoPor = usuario.creadoPor
    }
    
    console.log("🚀 Payload final que se enviará:", payload)
    
    const response = await api.post('/usuarios', payload)
    return response.data
  },

  // Actualizar usuario
  async update(id: number, usuario: {
    nombre?: string
    usuario1?: string
    email?: string
    passwordHash?: string
    rol?: string
    estado?: string
    avatar?: string | null
    sedeId?: number | null
  }): Promise<void> {
    // Convertir a PascalCase para el backend
    const payload: any = { Id: id }
    if (usuario.nombre !== undefined) payload.Nombre = usuario.nombre
    if (usuario.usuario1 !== undefined) payload.Usuario1 = usuario.usuario1
    if (usuario.email !== undefined) payload.Email = usuario.email
    if (usuario.passwordHash !== undefined) payload.password_hash = usuario.passwordHash
    if (usuario.rol !== undefined) payload.Rol = usuario.rol
    if (usuario.estado !== undefined) payload.Estado = usuario.estado
    if (usuario.avatar !== undefined) payload.Avatar = usuario.avatar
    if (usuario.sedeId !== undefined) payload.SedeId = usuario.sedeId
    
    await api.put(`/usuarios/${id}`, payload)
  },

  // Eliminar usuario
  async delete(id: number): Promise<void> {
    await api.delete(`/usuarios/${id}`)
  },

  // Obtener permisos de un usuario
  async getPermisos(id: number): Promise<UsuarioPermiso[]> {
    const response = await api.get(`/usuarios/${id}/permisos`)
    return response.data
  },

  // Asignar permiso a usuario
  async asignarPermiso(usuarioId: number, permisoId: number, asignadoPor?: number): Promise<UsuarioPermiso> {
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
// SERVICIOS DE PERMISOS 
// ============================================================================

export const permisosService = {
  // Obtener todos los permisos
  async getAll(): Promise<Permiso[]> {
    const response = await api.get('/permisos')
    // Robust check
    if (Array.isArray(response.data)) return response.data
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
    return []
  },

  // Obtener permiso por ID
  async getById(id: number): Promise<Permiso> {
    const response = await api.get(`/permisos/${id}`)
    return response.data
  },

  // Obtener permiso por nombre
  async getByNombre(nombre: string): Promise<Permiso> {
    const response = await api.get(`/permisos/nombre/${encodeURIComponent(nombre)}`)
    return response.data
  },

  // Crear nuevo permiso
  async create(permiso: {
    nombre: string
    descripcion?: string | null
    modulo: string
  }): Promise<Permiso> {
    const response = await api.post('/permisos', permiso)
    return response.data
  },

  // Actualizar permiso
  async update(id: number, permiso: {
    nombre?: string
    descripcion?: string | null
    modulo?: string
  }): Promise<void> {
    await api.put(`/permisos/${id}`, { ...permiso, id })
  },

  // Eliminar permiso
  async delete(id: number): Promise<void> {
    await api.delete(`/permisos/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE PRODUCTOS 
// ============================================================================

// Helper para mapear PascalCase del backend a snake_case del frontend
const mapProductoFromBackend = (p: any): Producto => ({
  id: p.id,
  sku: p.sku || p.SKU,
  nombre: p.nombre || p.Nombre,
  descripcion: p.descripcion || p.Descripcion,
  categoria_id: p.categoriaId || p.CategoriaId,
  categoria: p.categoria || p.Categoria,
  proveedor_id: p.proveedorId || p.ProveedorId,
  proveedor: p.proveedor || p.Proveedor,
  precio: p.precio || p.Precio,
  costo: p.costo || p.Costo || 0,
  stock_actual: p.stockActual || p.StockActual,
  stock_minimo: p.stockMinimo || p.StockMinimo,
  unidad: p.unidad || p.UnidadMedida,
  fecha_vencimiento: p.fechaVencimiento || p.FechaVencimiento,
  activo: p.activo || p.Activo || p.estado === 'activo',
  fecha_creacion: p.fechaCreacion || p.FechaCreacion
})

export const productosService = {
  // Obtener productos paginados (por defecto página 1, 20 elementos)
  async getAll(page: number = 1, pageSize: number = 100): Promise<Producto[]> {
    const response = await api.get(`/productos?page=${page}&pageSize=${pageSize}`)
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.data || response.data?.items || [])
    
    if (!Array.isArray(data)) return []
    return data.map(mapProductoFromBackend)
  },

  // Obtener todos los productos sin paginación
  async getAllUnpaged(): Promise<Producto[]> {
    const response = await api.get('/productos?page=1&pageSize=1000') // Traer muchos
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.data || response.data?.items || [])
    
    if (!Array.isArray(data)) return []
    return data.map(mapProductoFromBackend)
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Producto> {
    const response = await api.get(`/productos/${id}`)
    return mapProductoFromBackend(response.data)
  },

  // Obtener producto por SKU
  async getBySku(sku: string): Promise<Producto> {
    const response = await api.get(`/productos/sku/${encodeURIComponent(sku)}`)
    return mapProductoFromBackend(response.data)
  },

  // Buscar productos por término
  async search(term: string): Promise<Producto[]> {
    const response = await api.get(`/productos/buscar?term=${encodeURIComponent(term)}`)
    return response.data.map(mapProductoFromBackend)
  },

  // Crear nuevo producto
  async create(producto: Omit<Producto, 'id' | 'fecha_creacion' | 'categoria' | 'proveedor'>): Promise<Producto> {
    const response = await api.post('/productos', producto)
    return mapProductoFromBackend(response.data)
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
// SERVICIOS DE PROVEEDORES 
// ============================================================================

export const proveedoresService = {
  // Obtener todos los proveedores (ordenados por nombre)
  async getAll(): Promise<Proveedor[]> {
    const response = await api.get('/proveedores')
    // Robust check
    if (Array.isArray(response.data)) return response.data
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
    return []
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
  // Obtener todas las entradas paginadas
  async getAll(page: number = 1, pageSize: number = 100): Promise<Entrada[]> {
    const response = await api.get(`/entradas?page=${page}&pageSize=${pageSize}`)
    // Robust check for array response
    if (Array.isArray(response.data)) {
      return response.data
    }
    // If it's a paginated object { data: [], total: ... }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data
    }
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items
    }
    console.warn('entradasService.getAll received non-array:', response.data)
    return []
  },

  // Obtener entrada por ID
  async getById(id: number): Promise<Entrada> {
    const response = await api.get(`/entradas/${id}`)
    return response.data
  },

  // Crear nueva entrada con detalles
  async create(entrada: {
    NumeroEntrada: string
    FechaEntrada: string // formato yyyy-mm-dd
    ProveedorId?: number
    NumeroFactura?: string
    Observaciones?: string
    Estado: string
    CreadoPor: number
    Detalles: Array<{
      ProductoId: number
      Cantidad: number
      PrecioUnitario: number
      Lote?: string
      FechaVencimiento?: string // formato yyyy-mm-dd
    }>
  }): Promise<Entrada> {
    const response = await api.post('/entradas', entrada)
    return response.data
  },

  // Eliminar entrada
  async delete(id: number): Promise<void> {
    await api.delete(`/entradas/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE SALIDAS
// ============================================================================

export const salidasService = {
  // Obtener todas las salidas paginadas
  async getAll(page: number = 1, pageSize: number = 100): Promise<Salida[]> {
    const response = await api.get(`/salidas?page=${page}&pageSize=${pageSize}`)
    // Robust check for array response
    if (Array.isArray(response.data)) {
      return response.data
    }
    // If it's a paginated object { data: [], total: ... }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data
    }
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items
    }
    console.warn('salidasService.getAll received non-array:', response.data)
    return []
  },

  // Obtener salida por ID
  async getById(id: number): Promise<Salida> {
    const response = await api.get(`/salidas/${id}`)
    return response.data
  },

  // Crear nueva salida con detalles (Updates for POS)
  async create(salida: {
    NumeroSalida: string
    FechaSalida: string // formato yyyy-mm-dd
    Motivo: string
    Destino?: string
    Referencia?: string
    Observaciones?: string
    Estado: string
    CreadoPor: number
    // Campos POS
    Total?: number
    MetodoPago?: string
    Cliente?: string
    Detalles: Array<{
      ProductoId: number
      Cantidad: number
      Lote?: string
      PrecioUnitario?: number
      Subtotal?: number
    }>
  }): Promise<Salida> {
    const response = await api.post('/salidas', salida)
    return response.data
  },

  // Eliminar salida
  async delete(id: number): Promise<void> {
    await api.delete(`/salidas/${id}`)
  },

  // Actualizar solo método de pago (PATCH)
  async updateMetodoPago(id: number, metodoPago: string): Promise<void> {
    await api.patch(`/salidas/${id}/metodo-pago`, { MetodoPago: metodoPago })
  }
}

// ============================================================================
// SERVICIOS DE CATEGORÍAS 
// ============================================================================

export const categoriasService = {
  async getAll(): Promise<{ id: number; nombre: string; descripcion?: string; codigo?: string; estado?: string }[]> {
    const response = await api.get('/categorias')
    // Robust check
    if (Array.isArray(response.data)) return response.data
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
    return []
  },

  async create(categoria: { nombre: string; descripcion?: string; codigo?: string; estado?: string }) {
    const response = await api.post('/categorias', categoria)
    return response.data
  }
  ,
  async update(id: number, categoria: { nombre?: string; descripcion?: string; codigo?: string; estado?: string }) {
    const response = await api.put(`/categorias/${id}`, { ...categoria, id })
    return response.data
  },

  async delete(id: number) {
    await api.delete(`/categorias/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE DASHBOARDS Y ESTADÍSTICAS
// ============================================================================

export const statsService = {
  // Obtener estadísticas generales del dashboard
  async getDashboardStats(): Promise<{
    totalProductos: number
    totalEntradas: number
    totalSalidas: number
    valorInventario: number
    productosStockBajo: number
  }> {
    // Por ahora calculamos del lado del cliente hasta que tengas endpoints en el backend
    // Aumentamos el límite para cubrir el mes actual
    const [productos, entradas, salidas] = await Promise.all([
      productosService.getAll(),
      entradasService.getAll(1, 1000), // Aumentado para cubrir transacciones del mes
      salidasService.getAll(1, 1000)  // Aumentado para cubrir transacciones del mes
    ])

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const entradasMes = entradas.filter(e => {
      const d = new Date(e.fechaEntrada)
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
    }).length

    const salidasMes = salidas.filter(s => {
      const d = new Date(s.fechaSalida)
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
    }).length

    const valorInventario = productos.reduce((sum, p) => {
      const stock = Number(p.stock_actual) || 0
      const costo = Number(p.costo) || Number(p.precio) || 0
      return sum + (stock * costo)
    }, 0)

    const stockBajo = productos.filter(p => 
      p.stock_actual <= p.stock_minimo
    ).length

    return {
      totalProductos: productos.length,
      totalEntradas: entradasMes,
      totalSalidas: salidasMes,
      valorInventario,
      productosStockBajo: stockBajo
    }
  },

  // Obtener productos con stock bajo
  async getProductosStockBajo(): Promise<Producto[]> {
    const productos = await productosService.getAll()
    return productos.filter(p => p.stock_actual <= p.stock_minimo)
  },

  // Obtener movimientos recientes (últimas entradas y salidas)
  async getMovimientosRecientes(limit: number = 10): Promise<any[]> {
    // Aumentamos límite para asegurar movimientos recientes
    const [entradas, salidas] = await Promise.all([
      entradasService.getAll(1, 200),
      salidasService.getAll(1, 200)
    ])

    const movimientos = [
      ...entradas.map(e => ({
        id: `E-${e.id}`,
        tipo: 'entrada',
        numero: e.numeroEntrada,
        fecha: e.fechaEntrada,
        descripcion: `Entrada de ${typeof e.proveedor === 'string' ? e.proveedor : e.proveedor?.nombre || 'Sin proveedor'}`,
        total: e.total,
        estado: e.estado || 'N/A',
        productos: (e.detalles || e.detalleEntrada || []).map(d => ({
          productoId: d.productoId,
          nombre: typeof d.producto === 'string' ? d.producto : (d.producto?.nombre || (d.producto as any)?.Nombre || 'Desconocido'),
          sku: typeof d.producto === 'object' ? (d.producto?.sku || (d.producto as any)?.SKU || '') : '',
          cantidad: d.cantidad
        })),
      })),
      ...salidas.map(s => ({
        id: `S-${s.id}`,
        tipo: 'salida',
        numero: s.numeroSalida,
        fecha: s.fechaSalida,
        descripcion: `Salida - ${s.motivo}`,
        destino: s.destino,
        estado: s.estado || 'N/A',
        productos: (s.detalles || s.detalleSalida || []).map(d => ({
          productoId: d.productoId,
          nombre: typeof d.producto === 'string' ? d.producto : (d.producto?.nombre || (d.producto as any)?.Nombre || 'Desconocido'),
          sku: typeof d.producto === 'object' ? (d.producto?.sku || (d.producto as any)?.SKU || '') : '',
          cantidad: d.cantidad
        })),
      }))
    ]

    return movimientos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limit)
  }
}

// ============================================================================
// SERVICIO DE REPORTES
// ============================================================================
export interface InventarioHotel {
  hotel: string
  stock: number
  ubicacion?: string
  ultimaActualizacion: string
}

export const inventarioService = {
  async getByProducto(id: number): Promise<InventarioHotel[]> {
    const response = await api.get(`/inventario/producto/${id}`)
    return response.data
  },

  async getByHotel(hotelId: number): Promise<{ productoId: number; stock: number }[]> {
    const response = await api.get(`/inventario/hotel/${hotelId}`)
    return response.data
  }
}

export const reportesService = {
  // Resumen general con filtro de fechas
  async getResumen(fechaInicio?: Date, fechaFin?: Date) {
    const [productos, entradas, salidas] = await Promise.all([
      productosService.getAll(),
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    // Filtrar por rango de fechas si se proporciona
    const entradasFiltradas = fechaInicio && fechaFin
      ? entradas.filter(e => {
          const fecha = new Date(e.fechaEntrada)
          return fecha >= fechaInicio && fecha <= fechaFin
        })
      : entradas

    const salidasFiltradas = fechaInicio && fechaFin
      ? salidas.filter(s => {
          const fecha = new Date(s.fechaSalida)
          return fecha >= fechaInicio && fecha <= fechaFin
        })
      : salidas

    const totalMovimientos = entradasFiltradas.length + salidasFiltradas.length
    
    // Calcular rotación promedio (salidas / stock promedio)
    const productosConMovimiento = productos.filter(p => p.stock_actual > 0)
    const totalSalidas = salidasFiltradas.reduce((sum, s) => {
      const details = s.detalles || s.detalleSalida || []
      return sum + details.reduce((dSum, d) => dSum + d.cantidad, 0)
    }, 0)
    const stockPromedio = productosConMovimiento.reduce((sum, p) => sum + p.stock_actual, 0) / (productosConMovimiento.length || 1)
    const rotacionPromedio = stockPromedio > 0 ? totalSalidas / stockPromedio : 0

    // Días promedio en stock (aproximado basado en movimientos)
    const diasPeriodo = fechaInicio && fechaFin 
      ? Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24))
      : 30
    const diasPromedioStock = rotacionPromedio > 0 ? diasPeriodo / rotacionPromedio : diasPeriodo

    // Eficiencia (% de productos con stock adecuado)
    const productosConStockAdecuado = productos.filter(p => 
      p.stock_actual > p.stock_minimo && p.stock_actual <= p.stock_minimo * 3
    ).length
    const eficiencia = (productosConStockAdecuado / productos.length) * 100

    return {
      totalMovimientos,
      rotacionPromedio: parseFloat(rotacionPromedio.toFixed(2)),
      diasPromedioStock: Math.round(diasPromedioStock),
      eficiencia: parseFloat(eficiencia.toFixed(1))
    }
  },

  // Valor de inventario por mes (últimos 12 meses)
  async getValorInventarioPorMes(fechaInicio?: Date, fechaFin?: Date) {
    const [productos, entradasAll, salidasAll] = await Promise.all([
      productosService.getAll(),
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    const meses: { mes: string; valor: number }[] = []
    const now = new Date()

    // Generar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesNombre = fecha.toLocaleDateString('es-GT', { month: 'short', year: 'numeric' })
      const targetYear = fecha.getFullYear()
      const targetMonth = fecha.getMonth()
      
      let valorTotalMes = 0

      // Simplificación para rendimiento: Calcular fuera del loop de productos si es posible, 
      // pero requerimos stock por producto.
      // Optimizamos filtrado:
      const entradasHastaMes = entradasAll.filter(e => {
         const d = new Date(e.fechaEntrada)
         const y = d.getUTCFullYear()
         const m = d.getUTCMonth()
         return y < targetYear || (y === targetYear && m <= targetMonth)
      })

      const salidasHastaMes = salidasAll.filter(s => {
         const d = new Date(s.fechaSalida)
         const y = d.getUTCFullYear()
         const m = d.getUTCMonth()
         return y < targetYear || (y === targetYear && m <= targetMonth)
      })

      // Calcular valor solo para el mes actual (i === 0) ya que es costoso iterar todo para atras
      // O iterar todo si son pocos productos.
       for (const producto of productos) {
            // Entradas acumuladas
            const qEntradas = entradasHastaMes
                .reduce((sum, e) => {
                  const details = e.detalles || e.detalleEntrada || []
                  const item = details.find(d => d.productoId === producto.id)
                  return sum + (item?.cantidad || 0)
                }, 0)

            const qSalidas = salidasHastaMes
                .reduce((sum, s) => {
                  const details = s.detalles || s.detalleSalida || []
                  const item = details.find(d => d.productoId === producto.id)
                  return sum + (item?.cantidad || 0)
                }, 0)
            
            const stockEstimado = Math.max(0, qEntradas - qSalidas)
            // Use current cost as approximation
            valorTotalMes += stockEstimado * (Number(producto.costo) || Number(producto.precio) || 0)
       }

      meses.push({
        mes: mesNombre,
        valor: Math.round(valorTotalMes)
      })
    }

    return meses.reverse() // Return chronological order
  },

  // Top productos más movidos
  async getTopProductos(limit: number = 10, fechaInicio?: Date, fechaFin?: Date) {
    const [productos, entradasAll, salidasAll] = await Promise.all([
      productosService.getAll(),
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    // Filtrar por rango de fechas si se proporcionan
    const entradas = fechaInicio && fechaFin
      ? entradasAll.filter(e => {
          const fecha = new Date(e.fechaEntrada)
          return fecha >= fechaInicio && fecha <= fechaFin
        })
      : entradasAll

    const salidas = fechaInicio && fechaFin
      ? salidasAll.filter(s => {
          const fecha = new Date(s.fechaSalida)
          return fecha >= fechaInicio && fecha <= fechaFin
        })
      : salidasAll

    const productosStats = productos.map(producto => {
      // Contar entradas del producto
      const totalEntradas = entradas.reduce((sum, e) => {
        const detalles = e.detalles || e.detalleEntrada || []
        const cantidadProducto = detalles
          .filter(d => d.productoId === producto.id)
          .reduce((dSum, d) => dSum + d.cantidad, 0)
        return sum + cantidadProducto
      }, 0)

      // Contar salidas del producto
      const totalSalidas = salidas.reduce((sum, s) => {
        const detalles = s.detalles || s.detalleSalida || []
        const cantidadProducto = detalles
          .filter(d => d.productoId === producto.id)
          .reduce((dSum, d) => dSum + d.cantidad, 0)
        return sum + cantidadProducto
      }, 0)

      const totalMovimientos = totalEntradas + totalSalidas
      const rotacion = producto.stock_actual > 0 
        ? totalSalidas / producto.stock_actual 
        : 0
      const valorInventario = producto.stock_actual * (producto.costo || producto.precio || 0)

      return {
        id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        entradas: totalEntradas,
        salidas: totalSalidas,
        rotacion: parseFloat(rotacion.toFixed(2)),
        valorInventario
      }
    })

    // Ordenar por total de movimientos
    return productosStats
      .sort((a, b) => (b.entradas + b.salidas) - (a.entradas + a.salidas))
      .slice(0, limit)
  },

  // Distribución por categorías
  async getDistribucionCategorias(fechaInicio?: Date, fechaFin?: Date) {
    const [productos, categorias, entradasAll, salidasAll] = await Promise.all([
      productosService.getAll(),
      categoriasService.getAll(),
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    const categoriasStats = categorias.map(categoria => {
      // Comparación robusta de IDs (string/number)
      const productosCategoria = productos.filter(p => String(p.categoria_id) === String(categoria.id))
      
      const valor = productosCategoria.reduce((sum, p) => {
        const costo = Number(p.costo) || Number(p.precio) || 0
        const stock = Number(p.stock_actual) || 0
        return sum + (stock * costo)
      }, 0)
      
      return {
        categoria: categoria.nombre,
        productos: productosCategoria.length,
        valor
      }
    })

    const totalValor = categoriasStats.reduce((sum, c) => sum + c.valor, 0)

    // Solo devolver categorías que tengan algún valor o producto
    return categoriasStats
      .filter(c => c.valor > 0 || c.productos > 0)
      .map(c => ({
        ...c,
        porcentaje: totalValor > 0 ? parseFloat(((c.valor / totalValor) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.valor - a.valor)
  },

  // Comparación mensual (últimos 6 meses) - VENTAS
  async getComparacionMensual(fechaInicio?: Date, fechaFin?: Date) {
    const [entradasAll, salidasAll] = await Promise.all([
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    const entradas = fechaInicio && fechaFin
      ? entradasAll.filter(e => new Date(e.fechaEntrada) >= fechaInicio && new Date(e.fechaEntrada) <= fechaFin)
      : entradasAll

    // Filtrar SALIDAS para considerar solo VENTAS
    const ventasAll = salidasAll.filter(s => s.motivo === 'Venta')

    const ventas = fechaInicio && fechaFin
      ? ventasAll.filter(s => new Date(s.fechaSalida) >= fechaInicio && new Date(s.fechaSalida) <= fechaFin)
      : ventasAll

    const meses: { mes: string; entradas: number; salidas: number; diferencia: number }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesNombre = fecha.toLocaleDateString('es-GT', { month: 'short' })
      
      const targetYear = fecha.getFullYear()
      const targetMonth = fecha.getMonth()

      // Cantidad de Items Vendidos (no solo transacciones)
      const totalVentas = ventas.reduce((sum, s) => {
        const d = new Date(s.fechaSalida)
        // Compare UTC date parts with the target month
        if (d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth) {
           // Sumar items individuales del detalle
           const details = s.detalles || s.detalleSalida || []
           const itemsVendidos = details.reduce((isum, d) => isum + (d.cantidad || 0), 0)
           return sum + itemsVendidos
        }
        return sum
      }, 0)

      // Cantidad de Items Entrados
      const totalEntradas = entradas.reduce((sum, e) => {
        const d = new Date(e.fechaEntrada)
        if (d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth) {
            const details = e.detalles || e.detalleEntrada || []
            const itemsEntrados = details.reduce((isum, d) => isum + (d.cantidad || 0), 0)
            return sum + itemsEntrados
        }
        return sum
      }, 0)

      meses.push({
        mes: mesNombre,
        entradas: totalEntradas,
        salidas: totalVentas, // Ahora representa Ventas
        diferencia: totalEntradas - totalVentas
      })
    }

    return meses.reverse()
  }
}

// ============================================================================
// SERVICIO DE AUDITORÍA
// ============================================================================

const mapAuditoriumFromBackend = (a: any): Auditorium => ({
  id: a.id || a.Id,
  usuarioId: a.usuarioId || a.UsuarioId,
  usuarioNombre: a.usuarioNombre || a.UsuarioNombre || '',
  accion: a.accion || a.Accion,
  modulo: a.modulo || a.Modulo,
  tablaAfectada: a.tablaAfectada || a.TablaAfectada,
  registroId: a.registroId || a.RegistroId,
  descripcion: a.descripcion || a.Descripcion,
  detalles: a.detalles || a.Detalles,
  ipAddress: a.ipAddress || a.IpAddress,
  userAgent: a.userAgent || a.UserAgent,
  fechaHora: a.fechaHora || a.FechaHora,
  usuario: a.usuario || a.Usuario
})

export const auditoriaService = {
  // GET /api/auditoria/recientes?max=50
  async getRecientes(max: number = 50): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/recientes?max=${max}`)
    if (Array.isArray(response.data)) {
        return response.data.map(mapAuditoriumFromBackend)
    }
    return []
  },

  // GET /api/auditoria/usuario/{usuarioId}?max=30
  async getByUsuario(usuarioId: number, max: number = 30): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/usuario/${usuarioId}?max=${max}`)
    if (Array.isArray(response.data)) {
        return response.data.map(mapAuditoriumFromBackend)
    }
    return []
  },

  // GET /api/auditoria/modulo/{modulo}?max=100
  async getByModulo(modulo: string, max: number = 100): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/modulo/${modulo}?max=${max}`)
     if (Array.isArray(response.data)) {
        return response.data.map(mapAuditoriumFromBackend)
    }
    return []
  },

  // POST /api/auditoria
  async registrar(audit: Partial<Auditorium>): Promise<Auditorium> {
    const response = await api.post('/auditoria', audit)
    return mapAuditoriumFromBackend(response.data)
  }
}

// Helper convenience: registra una auditoría agregando metadata cliente (usuario desde localStorage,
// userAgent y fechaHora si faltan). No lanza error al frontend si falla; solo loggea para debugging.
export async function registrarAuditoria(audit: Partial<Auditorium>) {
  try {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user-data')
        if (saved) {
          const parsed = JSON.parse(saved)
          // Algunos proyectos usan 'id' o 'Id'
          const id = parsed?.id ?? parsed?.Id
          if (id) audit.usuarioId = audit.usuarioId ?? Number(id)
        }
      } catch (e) {
        console.warn('registrarAuditoria: no se pudo parsear user-data', e)
      }

      // Enriquecer con userAgent y fechaHora si no vienen
      try {
        audit.userAgent = audit.userAgent ?? (navigator && navigator.userAgent ? navigator.userAgent : null)
      } catch (e) {
        /* navigator puede no estar disponible */
      }
    }

    audit.fechaHora = audit.fechaHora ?? new Date().toISOString()

    // Normalizar/montar Detalles y construir una Descripcion legible si no viene
    // - Si `detalles` es un objeto, lo stringifyamos
    // - Si `detalles` es string y parece JSON, intentamos parsearlo para extraer un nombre
    // - Si no hay `descripcion`, construimos una frase corta: "<Modulo> <accion-esp>: <valor detectable>"
    const detalleRaw = (audit as any).detalles
    let detalleObj: any = null
    let detallesToSend: string | null = null

    if (detalleRaw !== undefined && detalleRaw !== null) {
      if (typeof detalleRaw === 'object') {
        detalleObj = detalleRaw
        try {
          detallesToSend = JSON.stringify(detalleObj)
        } catch (e) {
          detallesToSend = String(detalleRaw)
        }
      } else if (typeof detalleRaw === 'string') {
        // Si es string, intentar parsear a objeto para usar campos útiles
        const s = detalleRaw.trim()
        if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
          try {
            detalleObj = JSON.parse(s)
            detallesToSend = JSON.stringify(detalleObj)
          } catch (e) {
            // No es JSON válido, mandarlo como string tal cual
            detallesToSend = detalleRaw
          }
        } else {
          detallesToSend = detalleRaw
        }
      } else {
        detallesToSend = String(detalleRaw)
      }
    }

    // Mapear acción del frontend a los literales que acepta la base de datos
    const actionRaw = ((audit as any).accion ?? '')?.toString() ?? ''
    const actionKey = actionRaw.trim().toLowerCase()
    const actionMap: Record<string, string> = {
      crear: 'create',
      nuevo: 'create',
      registrar: 'create',
      create: 'create',

      actualizar: 'update',
      modificar: 'update',
      update: 'update',

      eliminar: 'delete',
      borrar: 'delete',
      delete: 'delete',

      ver: 'view',
      consultar: 'view',
      view: 'view'
    }

    const mappedAction = actionMap[actionKey] ?? (actionRaw ? actionRaw.toString().toLowerCase() : null)

    // Si no existe descripcion, intentar armar una legible usando detalles detectados
    let descripcionFinal: string | null = (audit as any).descripcion ?? null
    if (!descripcionFinal) {
      const moduloRaw = (audit as any).modulo ?? 'registro'
      const moduloPretty = moduloRaw ? (moduloRaw.charAt(0).toUpperCase() + moduloRaw.slice(1)) : 'Registro'

      // verbo en español según la acción mapeada
      const verbEsMap: Record<string, string> = {
        create: 'creado',
        update: 'actualizado',
        delete: 'eliminado',
        view: 'visto'
      }
      const verbEs = mappedAction ? (verbEsMap[mappedAction] ?? mappedAction) : 'modificado'

      // Buscar nombre/sku/numero en detalles para mostrar algo legible
      const nameCandidates = ['nombre', 'Nombre', 'nombreCompleto', 'nombre_proveedor', 'nombreProveedor', 'nombreProducto', 'sku', 'SKU', 'numeroEntrada', 'NumeroEntrada', 'numeroSalida', 'NumeroSalida']
      let detected: string | null = null
      if (detalleObj && typeof detalleObj === 'object') {
        for (const key of nameCandidates) {
          if (detalleObj[key] !== undefined && detalleObj[key] !== null) {
            detected = String(detalleObj[key])
            break
          }
        }
      }

      if (detected) {
        descripcionFinal = `${moduloPretty} ${verbEs}: ${detected}`
      } else if ((audit as any).registroId) {
        descripcionFinal = `${moduloPretty} ${verbEs} (id ${ (audit as any).registroId })`
      } else {
        // Fallback genérico
        descripcionFinal = `${moduloPretty} ${verbEs}`
      }
    }

    // Construir payload con PascalCase (esperado en backend C#)
    const payload: any = {
      UsuarioId: (audit as any).usuarioId ?? null,
      Accion: mappedAction,
      Modulo: (audit as any).modulo ?? null,
      TablaAfectada: (audit as any).tablaAfectada ?? null,
      RegistroId: (audit as any).registroId ?? null,
      Descripcion: descripcionFinal ?? null,
      Detalles: detallesToSend ?? null,
      IpAddress: (audit as any).ipAddress ?? null,
      UserAgent: (audit as any).userAgent ?? null,
      FechaHora: (audit as any).fechaHora ?? new Date().toISOString()
    }

    // Log para depuración: mostrar el payload que enviaremos
    try {
      console.debug('Registrar auditoría - payload (PascalCase):', payload)
    } catch (e) {
      /* ignore */
    }

    // Intentar registrar en backend (si falla, no romper la UX)
    const res = await auditoriaService.registrar(payload)
    try {
      console.debug('Registrar auditoría - respuesta:', res)
    } catch (e) {
      /* ignore */
    }
  } catch (err) {
    // No interrumpimos el flujo, solo loggeamos
    console.error('Error registrando auditoría:', err)
  }
}

// ============================================================================
// SERVICIO DE CONFIGURACIÓN
// ============================================================================
export const configuracionService = {
  // GET /api/configuracion
  async getAll(): Promise<Configuracion[]> {
    const response = await api.get('/configuracion')
    return response.data
  },

  // GET /api/configuracion/{id}
  async getById(id: number): Promise<Configuracion> {
    const response = await api.get(`/configuracion/${id}`)
    return response.data
  },

  // GET /api/configuracion/clave/{clave}
  async getByClave(clave: string): Promise<Configuracion> {
    const response = await api.get(`/configuracion/clave/${encodeURIComponent(clave)}`)
    return response.data
  },

  // GET /api/configuracion/categoria/{categoria}
  async getByCategoria(categoria: string): Promise<Configuracion[]> {
    const response = await api.get(`/configuracion/categoria/${encodeURIComponent(categoria)}`)
    return response.data
  },

  // POST /api/configuracion
  async create(config: {
    clave: string
    valor?: string | null
    descripcion?: string | null
    tipo?: string | null
    categoria?: string | null
    actualizadoPor?: number | null
  }): Promise<Configuracion> {
    const payload = {
      Clave: config.clave,
      Valor: config.valor,
      Descripcion: config.descripcion,
      Tipo: config.tipo,
      Categoria: config.categoria,
      ActualizadoPor: config.actualizadoPor,
      FechaActualizacion: new Date().toISOString()
    }
    const response = await api.post('/configuracion', payload)
    return response.data
  },

  // PUT /api/configuracion/{id}
  async update(id: number, config: {
    clave?: string
    valor?: string | null
    descripcion?: string | null
    tipo?: string | null
    categoria?: string | null
    actualizadoPor?: number | null
  }): Promise<void> {
    const payload = {
      Id: id,
      Clave: config.clave,
      Valor: config.valor,
      Descripcion: config.descripcion,
      Tipo: config.tipo,
      Categoria: config.categoria,
      ActualizadoPor: config.actualizadoPor,
      FechaActualizacion: new Date().toISOString()
    }
    await api.put(`/configuracion/${id}`, payload)
  },

  // DELETE /api/configuracion/{id}
  async delete(id: number): Promise<void> {
    await api.delete(`/configuracion/${id}`)
  }
}

// Exportar todo como un objeto por defecto para facilidad de uso
export default {
  auth: authService,
  usuarios: usuariosService,
  permisos: permisosService,
  productos: productosService,
  proveedores: proveedoresService,
  entradas: entradasService,
  salidas: salidasService,
  categorias: categoriasService,
  stats: statsService,
  reportes: reportesService,
  auditoria: auditoriaService,
  configuracion: configuracionService
}

// ============================================================================
// SERVICIO DE VENCIMIENTOS (vista VProductosVencimiento)
// ============================================================================
export const vencimientosService = {
  // GET /api/vencimientos
  async getAll(): Promise<VProductoVencimiento[]> {
    const response = await api.get('/vencimientos')
    // Backend may return FechaVencimiento as DateOnly; normalize to ISO string
    return response.data.map((v: any) => ({
      id: v.id,
      sku: v.sku || v.Sku || '',
      nombre: v.nombre || v.Nombre || '',
      numeroLote: v.numeroLote || v.NumeroLote || v.lote || v.Lote || '',
      fechaVencimiento: v.fechaVencimiento ? (typeof v.fechaVencimiento === 'string' ? v.fechaVencimiento : new Date(v.fechaVencimiento).toISOString()) : null,
      stockLote: v.stockLote ?? v.StockLote ?? 0,
      diasVencimiento: v.diasVencimiento ?? v.DiasVencimiento ?? null,
      estadoVencimiento: v.estadoVencimiento || v.EstadoVencimiento || 'ok'
    }))
  },

  async getByEstado(estado: string): Promise<VProductoVencimiento[]> {
    const response = await api.get(`/vencimientos/estado/${encodeURIComponent(estado)}`)
    return response.data
  },

  async getByProducto(productoId: number): Promise<VProductoVencimiento[]> {
    const response = await api.get(`/vencimientos/producto/${productoId}`)
    return response.data
  }
}