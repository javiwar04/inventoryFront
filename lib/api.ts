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
  proveedorId: number | null
  proveedor: { id: number; nombre: string } | null
  numeroFactura: string | null
  total: number | null
  observaciones: string | null
  estado: string
  fechaCreacion: string
  detalleEntrada: DetalleEntrada[]
}

export interface DetalleEntrada {
  id: number
  entradaId: number
  productoId: number
  producto: { id: number; nombre: string; sku: string } | null
  cantidad: number
  precioUnitario: number
  subtotal: number | null
  lote: string | null
  fechaVencimiento: string | null
}

export interface Salida {
  id: number
  numeroSalida: string
  fechaSalida: string
  motivo: string
  destino: string | null
  referencia: string | null
  observaciones: string | null
  estado: string
  fechaCreacion: string
  detalleSalida: DetalleSalida[]
}

export interface DetalleSalida {
  id: number
  salidaId: number
  productoId: number
  producto: { id: number; nombre: string; sku: string } | null
  cantidad: number
  lote: string | null
}

export interface Auditorium {
  id: number
  usuarioId: number | null
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
  // Campo auxiliar que el backend puede devolver para facilitar el nombre
  usuarioNombre?: string | null
}

export interface AuthResponse {
  user: Usuario
  token: string
  message?: string
  expiresAt?: number // epoch seconds (derivado del JWT)
}

// ============================================================================
// SERVICIOS DE AUTENTICACIÓN (usando UsuariosController)
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
        const json = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))
        if (json && typeof json.exp === 'number') {
          expiresAt = json.exp
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
  async create(usuario: {
    nombre: string
    usuario1: string
    email: string
    passwordHash: string
    rol: string
    estado: string
    avatar?: string | null
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
      Avatar: usuario.avatar
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
  }): Promise<void> {
    // Convertir a PascalCase para el backend
    const payload: any = { Id: id }
    if (usuario.nombre !== undefined) payload.Nombre = usuario.nombre
    if (usuario.usuario1 !== undefined) payload.Usuario1 = usuario.usuario1
    if (usuario.email !== undefined) payload.Email = usuario.email
    if (usuario.passwordHash !== undefined) payload.PasswordHash = usuario.passwordHash
    if (usuario.rol !== undefined) payload.Rol = usuario.rol
    if (usuario.estado !== undefined) payload.Estado = usuario.estado
    if (usuario.avatar !== undefined) payload.Avatar = usuario.avatar
    
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
// SERVICIOS DE PERMISOS (basado en PermisosController)
// ============================================================================

export const permisosService = {
  // Obtener todos los permisos
  async getAll(): Promise<Permiso[]> {
    const response = await api.get('/permisos')
    return response.data
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
// SERVICIOS DE PRODUCTOS (basado en ProductosController)
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
    return response.data.map(mapProductoFromBackend)
  },

  // Obtener todos los productos sin paginación
  async getAllUnpaged(): Promise<Producto[]> {
    const response = await api.get('/productos?page=1&pageSize=1000') // Traer muchos
    return response.data.map(mapProductoFromBackend)
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
  // Obtener todas las entradas paginadas
  async getAll(page: number = 1, pageSize: number = 100): Promise<Entrada[]> {
    const response = await api.get(`/entradas?page=${page}&pageSize=${pageSize}`)
    return response.data
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
    return response.data
  },

  // Obtener salida por ID
  async getById(id: number): Promise<Salida> {
    const response = await api.get(`/salidas/${id}`)
    return response.data
  },

  // Crear nueva salida con detalles
  async create(salida: {
    NumeroSalida: string
    FechaSalida: string // formato yyyy-mm-dd
    Motivo: string
    Destino?: string
    Referencia?: string
    Observaciones?: string
    Estado: string
    CreadoPor: number
    Detalles: Array<{
      ProductoId: number
      Cantidad: number
      Lote?: string
    }>
  }): Promise<Salida> {
    const response = await api.post('/salidas', salida)
    return response.data
  },

  // Eliminar salida
  async delete(id: number): Promise<void> {
    await api.delete(`/salidas/${id}`)
  }
}

// ============================================================================
// SERVICIOS DE CATEGORÍAS (si tienes endpoints específicos)
// ============================================================================

export const categoriasService = {
  async getAll(): Promise<{ id: number; nombre: string; descripcion?: string; codigo?: string; estado?: string }[]> {
    const response = await api.get('/categorias')
    return response.data
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
    const [productos, entradas, salidas] = await Promise.all([
      productosService.getAll(),
      entradasService.getAll(1, 1000),
      salidasService.getAll(1, 1000)
    ])

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const entradasMes = entradas.filter(e => 
      new Date(e.fechaEntrada) >= firstDayOfMonth
    ).length

    const salidasMes = salidas.filter(s => 
      new Date(s.fechaSalida) >= firstDayOfMonth
    ).length

    const valorInventario = productos.reduce((sum, p) => 
      sum + (p.stock_actual * (p.costo || p.precio || 0)), 0
    )

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
    const [entradas, salidas] = await Promise.all([
      entradasService.getAll(1, limit),
      salidasService.getAll(1, limit)
    ])

    const movimientos = [
      ...entradas.map(e => ({
        id: `E-${e.id}`,
        tipo: 'entrada',
        numero: e.numeroEntrada,
        fecha: e.fechaEntrada,
        descripcion: `Entrada de ${e.proveedor?.nombre || 'Sin proveedor'}`,
        total: e.total,
        estado: e.estado
      })),
      ...salidas.map(s => ({
        id: `S-${s.id}`,
        tipo: 'salida',
        numero: s.numeroSalida,
        fecha: s.fechaSalida,
        descripcion: `Salida - ${s.motivo}`,
        destino: s.destino,
        estado: s.estado
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
    const totalSalidas = salidasFiltradas.reduce((sum, s) => 
      sum + (s.detalleSalida?.reduce((dSum, d) => dSum + d.cantidad, 0) || 0), 0
    )
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
    const productos = await productosService.getAll()

    const meses: { mes: string; valor: number }[] = []
    const now = new Date()

    // Generar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesNombre = fecha.toLocaleDateString('es-GT', { month: 'short', year: 'numeric' })
      
      // Para simplificar, usamos el valor actual del inventario
      // En un sistema más completo, deberías tener un snapshot del inventario cada mes
      // Aquí simulamos variación basada en el mes
      const factorVariacion = 1 + ((i - 6) * 0.05) // Variación gradual
      const valorMes = productos.reduce((sum, p) => 
        sum + (p.stock_actual * (p.costo || p.precio || 0)), 0
      ) * factorVariacion

      meses.push({
        mes: mesNombre,
        valor: Math.max(0, valorMes)
      })
    }

    return meses
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
        const detalles = e.detalleEntrada || []
        const cantidadProducto = detalles
          .filter(d => d.productoId === producto.id)
          .reduce((dSum, d) => dSum + d.cantidad, 0)
        return sum + cantidadProducto
      }, 0)

      // Contar salidas del producto
      const totalSalidas = salidas.reduce((sum, s) => {
        const detalles = s.detalleSalida || []
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

    // Si hay rango, podemos filtrar movimientos para calcular valores más precisos
    const entradas = fechaInicio && fechaFin
      ? entradasAll.filter(e => new Date(e.fechaEntrada) >= fechaInicio && new Date(e.fechaEntrada) <= fechaFin)
      : entradasAll

    const salidas = fechaInicio && fechaFin
      ? salidasAll.filter(s => new Date(s.fechaSalida) >= fechaInicio && new Date(s.fechaSalida) <= fechaFin)
      : salidasAll

    const categoriasStats = categorias.map(categoria => {
      const productosCategoria = productos.filter(p => p.categoria_id === categoria.id)
      const valor = productosCategoria.reduce((sum, p) => 
        sum + (p.stock_actual * (p.costo || p.precio || 0)), 0
      )
      
      return {
        categoria: categoria.nombre,
        productos: productosCategoria.length,
        valor
      }
    })

    const totalValor = categoriasStats.reduce((sum, c) => sum + c.valor, 0)

    return categoriasStats
      .map(c => ({
        ...c,
        porcentaje: totalValor > 0 ? parseFloat(((c.valor / totalValor) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.valor - a.valor)
  },

  // Comparación mensual (últimos 6 meses)
  async getComparacionMensual(fechaInicio?: Date, fechaFin?: Date) {
    const [entradasAll, salidasAll] = await Promise.all([
      entradasService.getAll(1, 10000),
      salidasService.getAll(1, 10000)
    ])

    const entradas = fechaInicio && fechaFin
      ? entradasAll.filter(e => new Date(e.fechaEntrada) >= fechaInicio && new Date(e.fechaEntrada) <= fechaFin)
      : entradasAll

    const salidas = fechaInicio && fechaFin
      ? salidasAll.filter(s => new Date(s.fechaSalida) >= fechaInicio && new Date(s.fechaSalida) <= fechaFin)
      : salidasAll

    const meses: { mes: string; entradas: number; salidas: number; diferencia: number }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesNombre = fecha.toLocaleDateString('es-GT', { month: 'short' })
      
      const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)

      const entradasMes = entradas.filter(e => {
        const fechaE = new Date(e.fechaEntrada)
        return fechaE >= primerDia && fechaE <= ultimoDia
      })

      const salidasMes = salidas.filter(s => {
        const fechaS = new Date(s.fechaSalida)
        return fechaS >= primerDia && fechaS <= ultimoDia
      })

      const totalEntradas = entradasMes.reduce((sum, e) => sum + (e.total || 0), 0)
      const totalSalidas = salidasMes.length // O puedes calcular valor monetario

      meses.push({
        mes: mesNombre,
        entradas: totalEntradas,
        salidas: totalSalidas,
        diferencia: totalEntradas - totalSalidas
      })
    }

    return meses
  }
}

// ============================================================================
// SERVICIO DE AUDITORÍA
// ============================================================================

export const auditoriaService = {
  // GET /api/auditoria/recientes?max=50
  async getRecientes(max: number = 50): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/recientes?max=${max}`)
    return response.data
  },

  // GET /api/auditoria/usuario/{usuarioId}?max=30
  async getByUsuario(usuarioId: number, max: number = 30): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/usuario/${usuarioId}?max=${max}`)
    return response.data
  },

  // GET /api/auditoria/modulo/{modulo}?max=100
  async getByModulo(modulo: string, max: number = 100): Promise<Auditorium[]> {
    const response = await api.get(`/auditoria/modulo/${modulo}?max=${max}`)
    return response.data
  },

  // POST /api/auditoria
  async registrar(audit: Partial<Auditorium>): Promise<Auditorium> {
    const response = await api.post('/auditoria', audit)
    return response.data
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
  auditoria: auditoriaService
}