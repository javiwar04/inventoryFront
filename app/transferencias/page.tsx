"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeftRight, 
  Search, 
  Eye, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon, 
  Filter,
  RefreshCcw
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { transferenciasService, TransferenciaListDto } from "@/services/transferencias"
import { NuevaTransferenciaDialog } from "@/components/transferencias/NuevaTransferenciaDialog"
import { DetallesTransferenciaDialog } from "@/components/transferencias/DetallesTransferenciaDialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { proveedoresService } from "@/lib/api"
import { usePermissions } from "@/hooks/use-permissions"

export default function TransferenciasPage() {
  const { canCreate, canDelete, isAdmin } = usePermissions() // Importante: usar 'isAdmin' como fallback si 'canDelete' no existe en el hook
  const [transferencias, setTransferencias] = useState<TransferenciaListDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 20
  
  // Selection
  const [selectedTransferencia, setSelectedTransferencia] = useState<TransferenciaListDto | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Filters
  const [filterHotelOrigen, setFilterHotelOrigen] = useState<string>("all")
  const [filterHotelDestino, setFilterHotelDestino] = useState<string>("all")
  const [hoteles, setHoteles] = useState<any[]>([])

  useEffect(() => {
    loadHoteles()
    loadTransferencias()
  }, [page]) // Reload when page changes

  const loadHoteles = async () => {
    try {
        const data = await proveedoresService.getAll()
        setHoteles(data)
    } catch (error) {
        console.error("Error loading hotels", error)
    }
  }

  const loadTransferencias = async () => {
    setLoading(true)
    try {
      const data = await transferenciasService.getAll(page, pageSize)
      setTransferencias(data)
    } catch (error) {
      console.error("Error loading transfers", error)
      toast.error("Error cargando transferencias")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await transferenciasService.delete(deleteId)
      toast.success("Transferencia revertida exitosamente")
      loadTransferencias()
    } catch (error) {
      console.error("Error deleting transfer", error)
      toast.error("Error al revertir la transferencia")
    } finally {
      setDeleteId(null)
    }
  }

  const openDetails = (trans: TransferenciaListDto) => {
    setSelectedTransferencia(trans)
    setDetailsOpen(true)
  }

  // Frontend filtering for search (Backend usually handles this but prompt implies simple list)
  // Implementing basic client-side filtering for search term and hotel filters if backend doesn't support params yet
  // The backend endpoint `GET /api/transferencias?page=1&pageSize=20` implies pagination. 
  // If backend implements filters, we should pass them. Assuming client-side filter of the CURRENT PAGE for now or 
  // if listing is all, but pagination suggests server-side. 
  // Given instructions don't specify backend filter params, I will just display data returned.
  
  const filteredTransferencias = transferencias.filter(t => {
     const matchSearch = t.numeroTransferencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());
     const matchOrigen = filterHotelOrigen === "all" || t.hotelOrigenId.toString() === filterHotelOrigen;
     const matchDestino = filterHotelDestino === "all" || t.hotelDestinoId.toString() === filterHotelDestino;
     
     return matchSearch && matchOrigen && matchDestino;
  })

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <StaticSidebar />
      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-primary/10 p-3 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
             </div>
             <div className="grid gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Transferencias</h1>
                <p className="text-muted-foreground">Gestiona el movimiento de productos entre hoteles</p>
             </div>
             <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadTransferencias}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
                {/* Nueva Transferencia Dialog */}
                {(canCreate('transferencias') || isAdmin()) && <NuevaTransferenciaDialog onSuccess={loadTransferencias} />}
             </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historial de Transferencias</CardTitle>
                <div className="flex items-center gap-2">
                   <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por número..."
                        className="w-[200px] pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <Select value={filterHotelOrigen} onValueChange={setFilterHotelOrigen}>
                      <SelectTrigger className="w-[180px]">
                         <SelectValue placeholder="Hotel Origen" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all">Todos los Orígenes</SelectItem>
                         {hoteles.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>)}
                      </SelectContent>
                   </Select>
                   <Select value={filterHotelDestino} onValueChange={setFilterHotelDestino}>
                      <SelectTrigger className="w-[180px]">
                         <SelectValue placeholder="Hotel Destino" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all">Todos los Destinos</SelectItem>
                         {hoteles.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
              </div>
              <CardDescription>
                Visualiza y gestiona las transferencias de inventario realizadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                       <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                             Cargando...
                          </TableCell>
                       </TableRow>
                    ) : filteredTransferencias.length === 0 ? (
                       <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                             No se encontraron transferencias.
                          </TableCell>
                       </TableRow>
                    ) : (
                       filteredTransferencias.map((trans) => (
                          <TableRow key={trans.id}>
                             <TableCell className="font-medium">{trans.numeroTransferencia}</TableCell>
                             <TableCell>{trans.fechaTransferencia}</TableCell>
                             <TableCell>{trans.hotelOrigenNombre}</TableCell>
                             <TableCell>{trans.hotelDestinoNombre}</TableCell>
                             <TableCell>
                                <Badge variant="outline" className={trans.estado === 'completada' ? 'bg-green-50 text-green-700' : ''}>
                                   {trans.estado}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right">{trans.cantidadProductos}</TableCell>
                             <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                   <Button variant="ghost" size="icon" onClick={() => openDetails(trans)}>
                                      <Eye className="h-4 w-4" />
                                   </Button>
                                   {(isAdmin()) && ( // Solo admin puede revertir
                                   <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="icon" onClick={() => setDeleteId(trans.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                         </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                         <AlertDialogHeader>
                                            <AlertDialogTitle>¿Revertir transferencia?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                               Esta acción revertirá la transferencia {trans.numeroTransferencia}. 
                                               Los productos serán devueltos al hotel origen. esta acción no se puede deshacer.
                                            </AlertDialogDescription>
                                         </AlertDialogHeader>
                                         <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>Confirmar</AlertDialogAction>
                                         </AlertDialogFooter>
                                      </AlertDialogContent>
                                   </AlertDialog>
                                   )}
                                </div>
                             </TableCell>
                          </TableRow>
                       ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <DetallesTransferenciaDialog 
         open={detailsOpen} 
         onOpenChange={setDetailsOpen} 
         transferencia={selectedTransferencia} 
      />
    </div>
  )
}
