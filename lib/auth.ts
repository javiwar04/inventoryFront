// Sistema de autenticación simple para el frontend
// Conecta esto con tu backend cuando esté listo

export interface User {
  id: string
  nombre: string
  usuario: string
  email: string
  rol: "admin" | "gerente" | "empleado"
  permisos: string[]
  avatar?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Simulación de usuarios (reemplazar con llamadas a tu backend)
const MOCK_USERS = [
  {
    id: "1",
    usuario: "admin",
    email: "admin@barberia.com",
    password: "admin123",
    nombre: "Administrador",
    rol: "admin" as const,
    permisos: ["*"], // Todos los permisos
  },
  {
    id: "2",
    usuario: "gerente",
    email: "gerente@barberia.com",
    password: "gerente123",
    nombre: "Gerente Principal",
    rol: "gerente" as const,
    permisos: [
      "productos.ver",
      "productos.crear",
      "productos.editar",
      "entradas.ver",
      "entradas.crear",
      "salidas.ver",
      "salidas.crear",
      "reportes.ver",
    ],
  },
  {
    id: "3",
    usuario: "empleado",
    email: "empleado@barberia.com",
    password: "empleado123",
    nombre: "Empleado",
    rol: "empleado" as const,
    permisos: ["productos.ver", "entradas.ver", "salidas.ver"],
  },
]

export async function login(usuario: string, password: string): Promise<User> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = MOCK_USERS.find((u) => u.usuario === usuario && u.password === password)

  if (!user) {
    throw new Error("Credenciales inválidas")
  }

  const { password: _, ...userWithoutPassword } = user

  // Guardar en localStorage (en producción usar httpOnly cookies)
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(userWithoutPassword))
  }

  return userWithoutPassword
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_user")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("auth_user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  if (user.permisos.includes("*")) return true
  return user.permisos.includes(permission)
}

export function isAdmin(user: User | null): boolean {
  return user?.rol === "admin"
}
