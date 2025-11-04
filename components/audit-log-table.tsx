"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Plus, Edit, Trash2, FileText, Package, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

const auditLogs = [
  {
    id: 1,
    timestamp: "2024-11-03 14:32:15",
    user: "Juan Pérez",
    action: "create",
    module: "Productos",
    description: "Creó el producto 'Shampoo Profesional 500ml'",
    details: "SKU: SHP-001, Stock inicial: 24",
    ipAddress: "192.168.1.45",
  },
  {
    id: 2,
    timestamp: "2024-11-03 13:15:42",
    user: "María González",
    action: "update",
    module: "Entradas",
    description: "Registró entrada de productos",
    details: "Gel Fijador Extra Fuerte - Cantidad: 30 unidades",
    ipAddress: "192.168.1.52",
  },
  {
    id: 3,
    timestamp: "2024-11-03 12:08:33",
    user: "Carlos Ramírez",
    action: "delete",
    module: "Productos",
    description: "Eliminó el producto 'Producto Descontinuado'",
    details: "SKU: OLD-999, Motivo: Producto descontinuado",
    ipAddress: "192.168.1.45",
  },
  {
    id: 4,
    timestamp: "2024-11-03 11:45:20",
    user: "Ana López",
    action: "update",
    module: "Salidas",
    description: "Registró salida de productos",
    details: "Cera Modeladora Mate - Cantidad: 5 unidades - Motivo: Venta",
    ipAddress: "192.168.1.67",
  },
  {
    id: 5,
    timestamp: "2024-11-03 10:22:18",
    user: "Juan Pérez",
    action: "update",
    module: "Productos",
    description: "Actualizó precio del producto",
    details: "Aceite para Barba 30ml - Precio anterior: Q105.00 - Nuevo: Q110.00",
    ipAddress: "192.168.1.45",
  },
  {
    id: 6,
    timestamp: "2024-11-03 09:15:05",
    user: "María González",
    action: "create",
    module: "Entradas",
    description: "Registró entrada de productos",
    details: "Tinte Permanente Negro - Cantidad: 15 unidades - Proveedor: Distribuidora XYZ",
    ipAddress: "192.168.1.52",
  },
  {
    id: 7,
    timestamp: "2024-11-02 16:45:30",
    user: "Carlos Ramírez",
    action: "update",
    module: "Productos",
    description: "Ajustó stock mínimo",
    details: "Navajas Desechables - Stock mínimo anterior: 15 - Nuevo: 20",
    ipAddress: "192.168.1.45",
  },
  {
    id: 8,
    timestamp: "2024-11-02 15:30:12",
    user: "Ana López",
    action: "view",
    module: "Reportes",
    description: "Generó reporte de inventario",
    details: "Período: Octubre 2024 - Formato: PDF",
    ipAddress: "192.168.1.67",
  },
]

export function AuditLogTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterAction === "all" || log.action === filterAction

    return matchesSearch && matchesFilter
  })

  const getActionBadge = (action: string) => {
    const badges = {
      create: { label: "Crear", variant: "default" as const, icon: Plus },
      update: { label: "Actualizar", variant: "secondary" as const, icon: Edit },
      delete: { label: "Eliminar", variant: "destructive" as const, icon: Trash2 },
      view: { label: "Ver", variant: "outline" as const, icon: Eye },
    }
    const badge = badges[action as keyof typeof badges] || badges.view
    const Icon = badge.icon
    return (
      <Badge variant={badge.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    )
  }

  const getModuleIcon = (module: string) => {
    const icons = {
      Productos: Package,
      Entradas: ArrowDownToLine,
      Salidas: ArrowUpFromLine,
      Reportes: FileText,
    }
    const Icon = icons[module as keyof typeof icons] || Package
    return <Icon className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, acción o módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterAction === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("all")}
          >
            Todas
          </Button>
          <Button
            variant={filterAction === "create" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAction("create")}
          >
            Crear
          </Button>
          <Button
            variant={filterAction === "update" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterAction("update")}
          >
            Actualizar
          </Button>
          <Button
            variant={filterAction === "delete" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterAction("delete")}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getModuleIcon(log.module)}
                    <span>{log.module}</span>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm">{log.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{log.details}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
