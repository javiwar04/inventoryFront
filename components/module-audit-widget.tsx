"use client"

import { useEffect, useState } from "react"
import { auditoriaService, type Auditorium } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  modulo: string
  title?: string
}

export default function ModuleAuditWidget({ modulo, title }: Props) {
  const [logs, setLogs] = useState<Auditorium[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailText, setDetailText] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [modulo])

  const load = async () => {
    try {
      setLoading(true)
      const data = await auditoriaService.getByModulo(modulo, 500)
      setLogs(data)
      setCurrentPage(1)
    } catch (e) {
      console.error('Error cargando auditoría por módulo', e)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const visible = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? `Actividad reciente: ${modulo}`}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No hay actividad reciente</TableCell>
                  </TableRow>
                ) : (
                  visible.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-sm">{l.fechaHora ? format(new Date(l.fechaHora), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}</TableCell>
                      <TableCell>{(l as any).usuarioNombre ?? l.usuario?.nombre ?? `Usuario #${l.usuarioId}`}</TableCell>
                      <TableCell className="font-mono text-sm">{l.accion}</TableCell>
                      <TableCell className="text-sm">{l.descripcion}</TableCell>
                      <TableCell className="text-right text-xs">
                        {l.detalles ? (
                          <Button size="sm" variant="outline" onClick={() => { setDetailText(l.detalles); setDetailOpen(true) }}>
                            <FileText className="mr-2 h-4 w-4" /> Ver
                          </Button>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">Mostrando {((currentPage-1)*pageSize)+1} - {Math.min(currentPage*pageSize, logs.length)} de {logs.length}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>Primera</Button>
                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Anterior</Button>
                <div className="flex items-center px-2">
                  <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const v = Number(e.target.value) || 1; setCurrentPage(Math.min(Math.max(1, v), totalPages)) }} className="w-16 text-center rounded border px-1" />
                  <span className="text-sm ml-2">de {totalPages}</span>
                </div>
                <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Siguiente</Button>
                <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Última</Button>
              </div>
            </div>
          </div>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles de auditoría</DialogTitle>
            </DialogHeader>
            <div className="mt-2 max-h-[60vh] overflow-auto bg-muted p-2 rounded">
              <pre className="text-xs whitespace-pre-wrap">{(() => {
                try { const parsed = detailText ? JSON.parse(detailText) : null; return parsed ? JSON.stringify(parsed, null, 2) : (detailText ?? '-') } catch (e) { return detailText ?? '-' }
              })()}</pre>
            </div>
            <DialogFooter>
              <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
