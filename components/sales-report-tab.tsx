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
import { Loader2, Search, Download, FileSpreadsheet, Printer, TrendingUp, CreditCard, Eye } from "lucide-react"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"
import * as XLSX from 'xlsx'
import { generarComandaPDF, generarFacturaPDF } from "@/lib/export-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SalesReportTab() {
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Raw Data
  const [allSales, setAllSales] = useState<Salida[]>([])
  const [filteredSales, setFilteredSales] = useState<Salida[]>([])
  const [hoteles, setHoteles] = useState<any[]>([])
  
  // Filters
  const [selectedHotel, setSelectedHotel] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

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
        salidasService.getAll(), // Fetch all to filter locally
        proveedoresService.getAll()
      ])
      // Filter exits that are "Ventas" (Assuming all sales created via POS have a specific nature or we just show all Salidas)
      // The POS sets 'Motivo' = 'Venta'.
      const ventas = sales.filter(s => s.motivo === 'Venta')
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
        const from = new Date(dateRange.from).setHours(0,0,0,0)
        result = result.filter(s => new Date(s.fechaSalida).getTime() >= from)
    }
    if (dateRange?.to) {
        const to = new Date(dateRange.to).setHours(23,59,59,999)
        result = result.filter(s => new Date(s.fechaSalida).getTime() <= to)
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
        if (selectedPayment === 'Tarjeta') {
            result = result.filter(s => s.metodoPago?.toLowerCase().includes('tarjeta'))
        } else {
            result = result.filter(s => s.metodoPago === selectedPayment)
        }
    }

    // Search (Client, Ticket, or Product inside details)
    if (searchTerm) {
        const lower = searchTerm.toLowerCase()
        result = result.filter(s => 
            s.numeroSalida.toLowerCase().includes(lower) ||
            (s.cliente && s.cliente.toLowerCase().includes(lower)) ||
            (s.detalleSalida && s.detalleSalida.some(d => d.producto?.nombre.toLowerCase().includes(lower)))
        )
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.fechaSalida).getTime() - new Date(a.fechaSalida).getTime())

    setFilteredSales(result)
  }

  // Stats Calculation
  const totalGlobal = filteredSales.reduce((acc, curr) => acc + (curr.total || 0), 0)
  const totalEfectivo = filteredSales.filter(s => 
    s.metodoPago === 'Efectivo' || 
    s.metodoPago === 'Efectivo Quetzales' || 
    s.metodoPago === 'Efectivo Dólares'
  ).reduce((acc, curr) => acc + (curr.total || 0), 0)
  const totalTarjeta = filteredSales.filter(s => s.metodoPago?.toLowerCase().includes('tarjeta')).reduce((acc, curr) => acc + (curr.total || 0), 0)

  const handleExportExcel = () => {
    const data = filteredSales.map(s => ({
        Fecha: new Date(s.fechaSalida).toLocaleDateString('es-GT', { timeZone: 'UTC' }),
        Ticket: s.numeroSalida,
        Cliente: s.cliente || 'Consumidor Final',
        Hotel: s.destino || 'N/A',
        MetodoPago: s.metodoPago || 'N/A',
        Total: s.total || 0,
        Items: s.detalleSalida?.length || 0,
        Observaciones: s.observaciones || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ventas")
    XLSX.writeFile(wb, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Reporte Exportado")
  }

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
                    <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
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
                        filteredSales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell>{new Date(sale.fechaSalida).toLocaleDateString('es-GT', { timeZone: 'UTC' })}</TableCell>
                                <TableCell className="font-mono text-xs">{sale.numeroSalida}</TableCell>
                                <TableCell>{sale.destino}</TableCell>
                                <TableCell>{sale.cliente || 'CF'}</TableCell>
                                <TableCell>{sale.metodoPago}</TableCell>
                                <TableCell className="text-right font-medium">Q{(sale.total || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
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
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
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
