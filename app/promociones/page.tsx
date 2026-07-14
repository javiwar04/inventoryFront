"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { StaticSidebar } from "@/components/static-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tag, Plus, Loader2, Pencil, Trash2, ShoppingCart, Power, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  promocionesService, productosService, proveedoresService,
  type Promocion, type Producto, type Proveedor,
} from "@/lib/api"
import { toast } from "sonner"

type DetalleForm = { productoId: number; cantidad: number }

const hoyStr = () => new Date().toISOString().split("T")[0]
const fmtQ = (n: number) => `Q${(n ?? 0).toFixed(2)}`

export default function PromocionesPage() {
  const { user } = useAuth()
  // Solo los administradores pueden crear/editar/activar/eliminar; los empleados solo venden.
  const esAdmin = user?.rol === "admin" || user?.rol === "administrador"

  const [promos, setPromos] = useState<Promocion[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)

  // Diálogo crear/editar
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Promocion | null>(null)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precio, setPrecio] = useState("")
  const [fechaInicio, setFechaInicio] = useState(hoyStr())
  const [fechaFin, setFechaFin] = useState(hoyStr())
  const [detalles, setDetalles] = useState<DetalleForm[]>([])
  const [prodSel, setProdSel] = useState<string>("")
  const [cantSel, setCantSel] = useState("1")

  // Diálogo vender
  const [sellOpen, setSellOpen] = useState(false)
  const [selling, setSelling] = useState(false)
  const [promoVenta, setPromoVenta] = useState<Promocion | null>(null)
  const [vecesVenta, setVecesVenta] = useState("1")
  const [destinoVenta, setDestinoVenta] = useState<string>("")
  const [metodoPago, setMetodoPago] = useState("Efectivo Quetzales")
  const [clienteVenta, setClienteVenta] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [pr, prod, prov] = await Promise.all([
        promocionesService.getAll(),
        productosService.getAll(),
        proveedoresService.getAll(),
      ])
      setPromos(pr)
      setProductos(prod)
      setProveedores(prov)
    } catch (err) {
      console.error("Error al cargar promociones:", err)
      toast.error("No se pudieron cargar las promociones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const productoNombre = (id: number) =>
    productos.find((p) => p.id === id)?.nombre ?? `#${id}`

  const stats = useMemo(() => {
    const activas = promos.filter((p) => p.estado === "activa").length
    const vigentes = promos.filter((p) => p.vigente).length
    return { total: promos.length, activas, vigentes }
  }, [promos])

  // ---- Crear / Editar ----
  const resetForm = () => {
    setEditing(null)
    setNombre(""); setDescripcion(""); setPrecio("")
    setFechaInicio(hoyStr()); setFechaFin(hoyStr())
    setDetalles([]); setProdSel(""); setCantSel("1")
  }

  const openCreate = () => { resetForm(); setFormOpen(true) }

  const openEdit = (p: Promocion) => {
    setEditing(p)
    setNombre(p.nombre)
    setDescripcion(p.descripcion ?? "")
    setPrecio(String(p.precio))
    setFechaInicio(p.fechaInicio?.split("T")[0] ?? hoyStr())
    setFechaFin(p.fechaFin?.split("T")[0] ?? hoyStr())
    setDetalles(p.detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad })))
    setFormOpen(true)
  }

  const addDetalle = () => {
    const id = Number(prodSel)
    const cant = Number(cantSel)
    if (!id || cant <= 0) return
    setDetalles((prev) => {
      const exist = prev.find((d) => d.productoId === id)
      if (exist) return prev.map((d) => d.productoId === id ? { ...d, cantidad: d.cantidad + cant } : d)
      return [...prev, { productoId: id, cantidad: cant }]
    })
    setProdSel(""); setCantSel("1")
  }

  const removeDetalle = (id: number) =>
    setDetalles((prev) => prev.filter((d) => d.productoId !== id))

  const handleSave = async () => {
    if (!nombre.trim()) return toast.error("Ponle un nombre a la promoción")
    const precioNum = Number(precio)
    if (isNaN(precioNum) || precioNum < 0) return toast.error("Precio inválido")
    if (fechaFin < fechaInicio) return toast.error("La fecha fin no puede ser anterior a la de inicio")
    if (detalles.length === 0) return toast.error("Agrega al menos un producto al combo")

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      precio: precioNum,
      fechaInicio,
      fechaFin,
      estado: editing?.estado ?? "activa",
      creadoPor: user?.id,
      detalles,
    }

    try {
      setSaving(true)
      if (editing) {
        await promocionesService.update(editing.id, payload)
        toast.success("Promoción actualizada")
      } else {
        await promocionesService.create(payload)
        toast.success("Promoción creada")
      }
      setFormOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      toast.error(err?.response?.data ?? "Error al guardar la promoción")
    } finally {
      setSaving(false)
    }
  }

  const toggleEstado = async (p: Promocion) => {
    const nuevo = p.estado === "activa" ? "inactiva" : "activa"
    try {
      await promocionesService.setEstado(p.id, nuevo)
      toast.success(nuevo === "activa" ? "Promoción activada" : "Promoción desactivada")
      loadData()
    } catch {
      toast.error("No se pudo cambiar el estado")
    }
  }

  const handleDelete = async (p: Promocion) => {
    if (!confirm(`¿Eliminar la promoción "${p.nombre}"?`)) return
    try {
      await promocionesService.delete(p.id)
      toast.success("Promoción eliminada")
      loadData()
    } catch {
      toast.error("No se pudo eliminar")
    }
  }

  // ---- Vender ----
  const openSell = (p: Promocion) => {
    setPromoVenta(p)
    setVecesVenta("1")
    const assignedHotel = proveedores.find((hotel) => hotel.id === user?.sedeId)
    setDestinoVenta(assignedHotel?.nombre || "")
    setMetodoPago("Efectivo Quetzales")
    setClienteVenta("")
    setSellOpen(true)
  }

  const handleSell = async () => {
    if (!promoVenta || !user?.id) return
    const veces = Number(vecesVenta)
    if (!veces || veces < 1) return toast.error("Cantidad inválida")
    if (!destinoVenta) return toast.error("Selecciona la sede de la venta")

    try {
      setSelling(true)
      await promocionesService.vender(promoVenta.id, {
        cantidad: veces,
        numeroSalida: `PROMO-${Date.now()}`,
        fechaSalida: hoyStr(),
        destino: destinoVenta,
        metodoPago,
        cliente: clienteVenta.trim() || undefined,
        creadoPor: user.id,
      })
      toast.success(`Venta registrada: ${fmtQ(promoVenta.precio * veces)}`)
      setSellOpen(false)
      try { window.dispatchEvent(new Event("salidas:created")) } catch {}
      loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data || "No se pudo registrar la venta")
    } finally {
      setSelling(false)
    }
  }

  // Solo productos activos y que no estén ya en el combo
  const productosDisponibles = productos.filter(
    (p) => p.activo && !detalles.some((d) => d.productoId === p.id)
  )

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <StaticSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
                <p className="mt-2 text-muted-foreground">
                  Combos a precio fijo y temporal (ej. 2 camisas por Q250).
                </p>
              </div>
              {esAdmin && (
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Nueva Promoción
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Promociones</CardTitle>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Activas</CardTitle>
                      <Power className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.activas}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Vigentes hoy</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.vigentes}</div></CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Lista de Promociones</CardTitle></CardHeader>
                  <CardContent>
                    {promos.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        Aún no hay promociones. Crea la primera con “Nueva Promoción”.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Incluye</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promos.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.nombre}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {p.detalles.map((d) => (
                                    <Badge key={d.productoId} variant="secondary">
                                      {d.cantidad}× {d.producto || productoNombre(d.productoId)}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{fmtQ(p.precio)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {p.fechaInicio?.split("T")[0]} → {p.fechaFin?.split("T")[0]}
                              </TableCell>
                              <TableCell>
                                {p.vigente ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Vigente</Badge>
                                ) : p.estado === "activa" ? (
                                  <Badge variant="outline">Fuera de fecha</Badge>
                                ) : (
                                  <Badge variant="destructive">Inactiva</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="default" disabled={!p.vigente} onClick={() => openSell(p)}>
                                    <ShoppingCart className="mr-1 h-4 w-4" /> Vender
                                  </Button>
                                  {esAdmin && (
                                    <>
                                      <Button size="icon" variant="ghost" title="Activar/Desactivar" onClick={() => toggleEstado(p)}>
                                        <Power className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(p)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" title="Eliminar" onClick={() => handleDelete(p)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ===== Diálogo Crear / Editar ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
            <DialogDescription>Define el combo y su precio fijo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="2 camisas por Q250" />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Precio (Q)</Label>
                <Input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="250.00" />
              </div>
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Productos del combo</Label>
              <div className="flex gap-2">
                <Select value={prodSel} onValueChange={setProdSel}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Elegir producto" /></SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre} ({fmtQ(p.precio)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" className="w-20" value={cantSel} onChange={(e) => setCantSel(e.target.value)} />
                <Button type="button" variant="secondary" onClick={addDetalle}><Plus className="h-4 w-4" /></Button>
              </div>

              {detalles.length > 0 && (
                <div className="mt-2 space-y-1 rounded-md border p-2">
                  {detalles.map((d) => (
                    <div key={d.productoId} className="flex items-center justify-between text-sm">
                      <span>{d.cantidad}× {productoNombre(d.productoId)}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeDetalle(d.productoId)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Crear promoción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Diálogo Vender ===== */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vender promoción</DialogTitle>
            <DialogDescription>{promoVenta?.nombre}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cantidad (combos)</Label>
                <Input type="number" min="1" value={vecesVenta} onChange={(e) => setVecesVenta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total a cobrar</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 font-semibold">
                  {fmtQ((promoVenta?.precio ?? 0) * (Number(vecesVenta) || 0))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Sede / Hotel (de dónde sale el stock)
                {user?.sedeId ? " · Asignada a tu usuario" : ""}
              </Label>
              <Select value={destinoVenta} onValueChange={setDestinoVenta} disabled={Boolean(user?.sedeId)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map((pv) => (
                    <SelectItem key={pv.id} value={pv.nombre}>{pv.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo Quetzales">Efectivo Quetzales</SelectItem>
                    <SelectItem value="Efectivo Dólares">Efectivo Dólares</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Cortesía">Cortesía</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Input value={clienteVenta} onChange={(e) => setClienteVenta(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOpen(false)}>Cancelar</Button>
            <Button onClick={handleSell} disabled={selling}>
              {selling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ShoppingCart className="mr-2 h-4 w-4" /> Confirmar venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
