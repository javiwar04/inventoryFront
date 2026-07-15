"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateRangePicker } from "@/components/date-range-picker"
import { salidasService, proveedoresService, Salida } from "@/lib/api"
import { Loader2, Search, Download, FileSpreadsheet, Printer, TrendingUp, CreditCard, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Banknote, Edit, Save, Package, Plus, Trash2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"
import * as XLSX from 'xlsx'
import { generarComandaPDF, generarFacturaPDF } from "@/lib/export-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  PAYMENT_METHODS,
  PaymentAllocation,
  PaymentMethod,
  canonicalizePaymentMethod,
  formatSplitPayment,
  matchesPaymentFilter,
  parsePaymentMethod,
} from "@/lib/payment-methods"
import { useAuth } from "@/contexts/auth-context"

export function SalesReportTab() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "admin" || user?.rol === "administrador"
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getProductName = (d: { producto: string | { id: number; nombre: string; sku: string } | null; productoId: number }) => {
    if (typeof d.producto === 'string') return d.producto
    return d.producto?.nombre || `Producto #${d.productoId}`
  }

  // Edit Payment State
  const [editPaymentOpen, setEditPaymentOpen] = useState(false)
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Salida | null>(null)
  const [isSplitPaymentEdit, setIsSplitPaymentEdit] = useState(false)
  const [simplePaymentMethod, setSimplePaymentMethod] = useState<PaymentMethod>("Efectivo Quetzales")
  const [editPayments, setEditPayments] = useState<PaymentAllocation[]>([])
  const [assignSedeOpen, setAssignSedeOpen] = useState(false)
  const [selectedSaleForSede, setSelectedSaleForSede] = useState<Salida | null>(null)
  const [selectedSedeId, setSelectedSedeId] = useState("")
  const [assigningSede, setAssigningSede] = useState(false)

  // Raw Data
  const [allSales, setAllSales] = useState<Salida[]>([])
  const [filteredSales, setFilteredSales] = useState<Salida[]>([])
  const [hoteles, setHoteles] = useState<any[]>([])
  
  // Filters
  const [selectedHotel, setSelectedHotel] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allSales, dateRange, selectedHotel, selectedPayment, searchTerm])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sales, provs] = await Promise.all([
        salidasService.getAll(1, 100000), // Fetch all to filter locally
        proveedoresService.getAll()
      ])
      // Filter exits that are "Ventas" (Assuming all sales created via POS have a specific nature or we just show all Salidas)
      // The POS sets 'Motivo' = 'Venta' OR 'Cortesía'.
      const ventas = sales.filter(s => s.motivo === 'Venta' || s.motivo === 'Cortesía')
      setAllSales(ventas)
      setHoteles(provs.filter(p => p.estado === 'Activo'))
    } catch (err) {
      console.error("Error loading sales data", err)
      toast.error("Error cargando datos de ventas")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...allSales]

    // Date Range
    if (dateRange?.from) {
        const fromStr = dateRange.from.toLocaleDateString('en-CA');
        result = result.filter(s => {
            if (!s.fechaSalida) return false;
            // Compare YYYY-MM-DD part only
            return s.fechaSalida.split('T')[0] >= fromStr;
        })
    }
    if (dateRange?.to) {
        const toStr = dateRange.to.toLocaleDateString('en-CA');
        result = result.filter(s => {
            if (!s.fechaSalida) return false;
            return s.fechaSalida.split('T')[0] <= toStr;
        })
    }

    // Hotel (Destino)
    if (selectedHotel !== "all") {
        // Find name if ID used, or match exact string
        // The POS saves the Name in "Destino"
        const hotelName = hoteles.find(h => h.id.toString() === selectedHotel)?.nombre
        if (hotelName) {
            result = result.filter(s => s.destino === hotelName)
        }
    }

    // Payment Method
    if (selectedPayment !== "all") {
        result = result.filter(s =>
            parsePaymentMethod(s.metodoPago, s.total || 0)
                .some(payment => matchesPaymentFilter(payment.method, selectedPayment))
        )
    }

    // Search (Client, Ticket, or Product inside details)
    if (searchTerm) {
        const lower = searchTerm.toLowerCase()
        result = result.filter(s => 
            s.numeroSalida.toLowerCase().includes(lower) ||
            (s.cliente && s.cliente.toLowerCase().includes(lower)) ||
            (s.detalleSalida && s.detalleSalida.some(d => (typeof d.producto === 'string' ? d.producto : (d.producto?.nombre || ''))?.toLowerCase().includes(lower)))
        )
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.fechaSalida).getTime() - new Date(a.fechaSalida).getTime())

    setFilteredSales(result)
    setCurrentPage(1)
  }

  // Stats Calculation
  const visiblePayments = filteredSales.flatMap(s => {
      const payments = parsePaymentMethod(s.metodoPago, s.total || 0)
      return selectedPayment === "all"
          ? payments
          : payments.filter(payment => matchesPaymentFilter(payment.method, selectedPayment))
  })

  const totalGlobal = selectedPayment === "all"
      ? filteredSales.reduce((acc, curr) => acc + (curr.total || 0), 0)
      : visiblePayments.reduce((acc, payment) => acc + payment.amount, 0)
  
  // Calculate breakdown handling split payments
  let totalEfectivo = 0
  let totalTarjeta = 0

  visiblePayments.forEach(payment => {
      if (payment.method.startsWith("Efectivo")) totalEfectivo += payment.amount
      else if (payment.method === "Tarjeta") totalTarjeta += payment.amount
  })

  const openEditPayment = (sale: Salida) => {
    setSelectedSaleForEdit(sale)
    const parsed = parsePaymentMethod(sale.metodoPago, sale.total || 0)
    if (sale.metodoPago && parsed.length === 0) {
        toast.warning("El método actual no es válido", {
            description: `Corrige el valor guardado: “${sale.metodoPago}”`,
        })
    }
    if (parsed.length > 1) {
        setIsSplitPaymentEdit(true)
        setEditPayments(parsed)
    } else {
        setIsSplitPaymentEdit(false)
        setSimplePaymentMethod(parsed[0]?.method || canonicalizePaymentMethod(sale.metodoPago) || "Efectivo Quetzales")
        setEditPayments([])
    }
    setEditPaymentOpen(true)
  }

  const handleUpdatePayment = async () => {
    if (!selectedSaleForEdit) return

    let newPaymentMethod: string = simplePaymentMethod
    if (isSplitPaymentEdit) {
        if (editPayments.length < 2 || editPayments.some(payment => payment.amount <= 0)) {
            toast.error("Agrega al menos dos pagos con montos válidos")
            return
        }
        if (new Set(editPayments.map(payment => payment.method)).size !== editPayments.length) {
            toast.error("No repitas el mismo método de pago")
            return
        }

        const expectedTotal = selectedSaleForEdit.total || 0
        const paymentTotal = editPayments.reduce((sum, payment) => sum + payment.amount, 0)
        if (Math.abs(paymentTotal - expectedTotal) > 0.01) {
            toast.error("Los pagos no cuadran con el total", {
                description: `Pagos: Q${paymentTotal.toFixed(2)} · Venta: Q${expectedTotal.toFixed(2)}`,
            })
            return
        }
        newPaymentMethod = formatSplitPayment(editPayments)
    }

    try {
        await salidasService.updateMetodoPago(selectedSaleForEdit.id, newPaymentMethod)
        toast.success("Método de pago actualizado")
        setEditPaymentOpen(false)
        loadData() // Reload to refresh
    } catch (error: any) {
        console.error(error)
        toast.error("Error al actualizar método de pago", {
            description: error?.response?.data?.message || error?.message,
        })
    }
  }

  const openAssignSede = (sale: Salida) => {
    setSelectedSaleForSede(sale)
    setSelectedSedeId("")
    setAssignSedeOpen(true)
  }

  const handleAssignSede = async () => {
    if (!selectedSaleForSede || !selectedSedeId) {
        toast.error("Selecciona una sede")
        return
    }

    setAssigningSede(true)
    try {
        await salidasService.assignSede(selectedSaleForSede.id, Number(selectedSedeId))
        toast.success("Sede asignada y stock actualizado")
        setAssignSedeOpen(false)
        await loadData()
    } catch (error: any) {
        toast.error("No se pudo asignar la sede", {
            description: error?.response?.data?.message || error?.message,
        })
    } finally {
        setAssigningSede(false)
    }
  }

  const handleExportExcel = () => {
    const rows: object[] = []
    filteredSales.forEach(s => {
        const items = s.detalleSalida || s.detalles || []
        const fecha = s.fechaSalida ? s.fechaSalida.split('T')[0].split('-').reverse().join('/') : ''
        const base = {
            Fecha: fecha,
            Ticket: s.numeroSalida,
            Cliente: s.cliente || 'Consumidor Final',
            Sede: s.destino || 'N/A',
            'Método de Pago': s.metodoPago || 'N/A',
            'Total Venta (Q)': s.total || 0,
        }
        if (items.length === 0) {
            rows.push({ ...base, Producto: '(Sin detalle)', Cantidad: '', 'P. Unitario (Q)': '', 'Subtotal (Q)': '' })
        } else {
            items.forEach((d, i) => {
                const nombre = typeof d.producto === 'string'
                    ? d.producto
                    : d.producto?.nombre || `Producto #${d.productoId}`
                rows.push({
                    // Solo mostrar datos de cabecera en la primera línea de cada venta
                    ...i === 0 ? base : { Fecha: '', Ticket: '', Cliente: '', Sede: '', 'Método de Pago': '', 'Total Venta (Q)': '' },
                    Producto: nombre,
                    Cantidad: d.cantidad,
                    'P. Unitario (Q)': d.precioUnitario ?? '',
                    'Subtotal (Q)': d.subtotal ?? ''
                })
            })
        }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Ventas Detalladas")
    XLSX.writeFile(wb, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Reporte exportado")
  }
// Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage)

  
  return (
    <div className="space-y-6">
        
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/20 rounded-lg border items-end">
            <div className="space-y-2 w-full md:w-auto">
                <Label>Rango de Fechas</Label>
                <div className="w-[260px]">
                    <DateRangePicker 
                        date={dateRange} 
                        onDateChange={setDateRange} 
                        className="w-full"
                    />
                </div>
            </div>
            
            <div className="space-y-2 w-full md:w-[200px]">
                <Label>Sede / Hotel</Label>
                <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Sedes</SelectItem>
                        {hoteles.map(h => (
                            <SelectItem key={h.id} value={h.id.toString()}>{h.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 w-full md:w-[200px]">
                <Label>Método de Pago</Label>
                <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Efectivo">Efectivo (General)</SelectItem>
                        <SelectItem value="Efectivo Quetzales">Efectivo Quetzales</SelectItem>
                        <SelectItem value="Efectivo Dólares">Efectivo Dólares</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Cortesía">Cortesía</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 flex-1">
                <Label>Buscar venta</Label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por ticket, cliente o producto..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Button variant="outline" onClick={handleExportExcel} disabled={filteredSales.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
            </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Q{totalGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">Q{totalEfectivo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">{((totalEfectivo/totalGlobal || 0)*100).toFixed(0)}% del total</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tarjetas</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">Q{totalTarjeta.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">{((totalTarjeta/totalGlobal || 0)*100).toFixed(0)}% del total</p>
                </CardContent>
            </Card>
        </div>

        {/* Data Table */}
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Sede</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Método Pago</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                        </TableRow>
                    ) : filteredSales.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No se encontraron ventas con los filtros aplicados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedSales.flatMap((sale) => {
                            const details = sale.detalleSalida || sale.detalles || []
                            const isExpanded = expandedRows.has(sale.id)
                            return [
                                <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(sale.id)}>
                                    <TableCell className="w-8">
                                        {isExpanded
                                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </TableCell>
                                    <TableCell>
                                        {sale.fechaSalida ? (() => {
                                            const datePart = sale.fechaSalida.split('T')[0];
                                            const [year, month, day] = datePart.split('-');
                                            return `${day}/${month}/${year}`;
                                        })() : ''}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{sale.numeroSalida}</TableCell>
                                    <TableCell>{sale.destino}</TableCell>
                                    <TableCell>{sale.cliente || 'CF'}</TableCell>
                                    <TableCell>{sale.metodoPago}</TableCell>
                                    <TableCell className="text-right font-medium">Q{(sale.total || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-center gap-1">
                                            {isAdmin && !sale.destino && sale.numeroSalida.startsWith("PROMO-") && (
                                                <Button size="sm" variant="ghost" onClick={() => openAssignSede(sale)} title="Asignar sede y descontar stock">
                                                    <MapPin className="h-4 w-4 text-amber-500" />
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => openEditPayment(sale)} title="Editar Método de Pago">
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                const result = generarFacturaPDF(sale, 'Selvamo', true)
                                                if (result) setPreviewUrl(result.toString())
                                            }} title="Ver Factura">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => generarFacturaPDF(sale, 'Selvamo')} title="Descargar Factura">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>,
                                isExpanded && (
                                    <TableRow key={`${sale.id}-detail`} className="bg-muted/30">
                                        <TableCell colSpan={8} className="py-2 px-6">
                                            {details.length === 0 ? (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 py-1">
                                                    <Package className="h-3 w-3" /> Sin detalle de productos disponible.
                                                </p>
                                            ) : (
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-muted-foreground border-b">
                                                            <th className="text-left py-1 font-medium">Producto</th>
                                                            <th className="text-center py-1 font-medium">Cantidad</th>
                                                            <th className="text-right py-1 font-medium">P. Unitario</th>
                                                            <th className="text-right py-1 font-medium">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {details.map((d, i) => (
                                                            <tr key={i} className="border-b border-dashed last:border-0">
                                                                <td className="py-1 flex items-center gap-1">
                                                                    <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                    {getProductName(d)}
                                                                </td>
                                                                <td className="text-center py-1">{d.cantidad}</td>
                                                                <td className="text-right py-1">
                                                                    {d.precioUnitario != null ? `Q${d.precioUnitario.toFixed(2)}` : '—'}
                                                                </td>
                                                                <td className="text-right py-1 font-medium">
                                                                    {d.subtotal != null ? `Q${d.subtotal.toFixed(2)}` : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            ].filter(Boolean)
                        })
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredSales.length)} de {filteredSales.length} ventas
            </p>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <div className="text-sm font-medium">
                    Página {currentPage} de {Math.max(1, totalPages)}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>

        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
            <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Vista Previa de Factura</DialogTitle>
                </DialogHeader>
                {previewUrl && (
                    <iframe src={previewUrl} className="w-full h-full border rounded-md" />
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={assignSedeOpen} onOpenChange={setAssignSedeOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar sede a promoción</DialogTitle>
                    <CardDescription>
                        Ticket: {selectedSaleForSede?.numeroSalida} · Total: Q{selectedSaleForSede?.total?.toFixed(2)}
                    </CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Sede donde se realizó la venta</Label>
                        <Select value={selectedSedeId} onValueChange={setSelectedSedeId}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                            <SelectContent>
                                {hoteles.map(hotel => (
                                    <SelectItem key={hotel.id} value={hotel.id.toString()}>{hotel.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-sm text-amber-600">
                        Al confirmar, los productos de esta promoción se descontarán del inventario actual de la sede. La operación se cancelará si no existe stock suficiente.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAssignSedeOpen(false)} disabled={assigningSede}>Cancelar</Button>
                        <Button onClick={handleAssignSede} disabled={assigningSede || !selectedSedeId}>
                            {assigningSede && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Asignar sede
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Método de Pago</DialogTitle>
                    <CardDescription>
                        Ticket: {selectedSaleForEdit?.numeroSalida} | Total: Q{selectedSaleForEdit?.total?.toFixed(2)}
                    </CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Nuevo Método de Pago</Label>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="split-payment-edit" className="text-xs">Pago dividido</Label>
                                <Switch
                                    id="split-payment-edit"
                                    checked={isSplitPaymentEdit}
                                    onCheckedChange={(checked) => {
                                        setIsSplitPaymentEdit(checked)
                                        if (checked && editPayments.length < 2) {
                                            const alternative: PaymentMethod = simplePaymentMethod === "Tarjeta" ? "Efectivo Quetzales" : "Tarjeta"
                                            setEditPayments([
                                                { method: simplePaymentMethod, amount: selectedSaleForEdit?.total || 0 },
                                                { method: alternative, amount: 0 },
                                            ])
                                        } else if (!checked && editPayments[0]) {
                                            setSimplePaymentMethod(editPayments[0].method)
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {!isSplitPaymentEdit ? (
                            <Select value={simplePaymentMethod} onValueChange={(value) => setSimplePaymentMethod(value as PaymentMethod)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="space-y-2">
                                {editPayments.map((payment, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
                                        <Select
                                            value={payment.method}
                                            onValueChange={(value) => setEditPayments(current => current.map((item, itemIndex) =>
                                                itemIndex === index ? { ...item, method: value as PaymentMethod } : item
                                            ))}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHODS.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={payment.amount || ""}
                                            onChange={(event) => setEditPayments(current => current.map((item, itemIndex) =>
                                                itemIndex === index ? { ...item, amount: Number(event.target.value) } : item
                                            ))}
                                            aria-label={`Monto del pago ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled={editPayments.length <= 2}
                                            onClick={() => setEditPayments(current => current.filter((_, itemIndex) => itemIndex !== index))}
                                            aria-label={`Eliminar pago ${index + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={editPayments.length >= PAYMENT_METHODS.length}
                                        onClick={() => {
                                            const used = new Set(editPayments.map(payment => payment.method))
                                            const method = PAYMENT_METHODS.find(candidate => !used.has(candidate)) || "Efectivo Quetzales"
                                            setEditPayments(current => [...current, { method, amount: 0 }])
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Agregar pago
                                    </Button>
                                    <span className="text-sm font-medium">
                                        Total pagos: Q{editPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Solo se guardan métodos válidos. En pagos divididos, los montos deben sumar exactamente el total de la venta.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditPaymentOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdatePayment}>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}

function BanknoteIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
