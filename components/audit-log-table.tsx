"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Plus, Edit, Trash2, FileText, Package, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { auditoriaService, type Auditorium } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "./ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function AuditLogTable() {
  const [logs, setLogs] = useState<Auditorium[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")
  const [filterModulo, setFilterModulo] = useState<string>("all")
  const [maxRecords, setMaxRecords] = useState(100)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState<string | null>(null)
  const [selectedDescripcion, setSelectedDescripcion] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [maxRecords])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await auditoriaService.getRecientes(maxRecords)
      setLogs(data)
    } catch (error) {
      console.error('Error al cargar logs de auditoría:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = filterAction === "all" || log.accion?.toLowerCase() === filterAction.toLowerCase()
    const matchesModulo = filterModulo === "all" || log.modulo?.toLowerCase() === filterModulo.toLowerCase()

    return matchesSearch && matchesAction && matchesModulo
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
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, módulo o detalles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center">Acción:</span>
            <Button
              variant={filterAction === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAction("all")}
            >
              Todas
            </Button>
            <Button
              variant={filterAction === "crear" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAction("crear")}
            >
              Crear
            </Button>
            <Button
              variant={filterAction === "actualizar" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterAction("actualizar")}
            >
              Actualizar
            </Button>
            <Button
              variant={filterAction === "eliminar" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilterAction("eliminar")}
            >
              Eliminar
            </Button>
          </div>

          <div className="flex gap-2 ml-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center">Módulo:</span>
            <Button
              variant={filterModulo === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterModulo("all")}
            >
              Todos
            </Button>
            <Button
              variant={filterModulo === "productos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterModulo("productos")}
            >
              Productos
            </Button>
            <Button
              variant={filterModulo === "entradas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterModulo("entradas")}
            >
              Entradas
            </Button>
            <Button
              variant={filterModulo === "salidas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterModulo("salidas")}
            >
              Salidas
            </Button>
            <Button
              variant={filterModulo === "usuarios" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterModulo("usuarios")}
            >
              Usuarios
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Origen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron registros de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {log.fechaHora ? format(new Date(log.fechaHora), "dd/MM/yyyy HH:mm:ss", { locale: es }) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.usuario?.nombre || (log as any).usuarioNombre || `Usuario #${log.usuarioId}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getModuleIcon(log.modulo)}
                        <span>{log.modulo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.accion)}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm">{log.descripcion}</div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.detalles ? (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedDetails(log.detalles); setSelectedDescripcion(log.descripcion ?? null); setDetailModalOpen(true); }}>
                          <FileText className="mr-2 h-4 w-4" /> Ver detalles
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Detalles modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de auditoría</DialogTitle>
            {selectedDescripcion && <DialogDescription>{selectedDescripcion}</DialogDescription>}
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-auto bg-muted p-4 rounded">
            <pre className="text-xs whitespace-pre-wrap">{(() => {
              try {
                const parsed = selectedDetails ? JSON.parse(selectedDetails) : null
                return parsed ? JSON.stringify(parsed, null, 2) : (selectedDetails ?? '-')
              } catch (e) {
                return selectedDetails ?? '-'
              }
            })()}</pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
