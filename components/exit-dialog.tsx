"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { registrarAuditoria } from "@/lib/api"

export function ExitDialog() {
  const [open, setOpen] = useState(false)
  const { canCreate } = usePermissions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Recoger datos del formulario
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const productoId = formData.get('product')
    const cantidad = parseInt((formData.get('quantity') as string) || '0')
    const fecha = formData.get('date')
    const motivo = formData.get('reason')
    const destino = formData.get('destination')
    const referencia = formData.get('reference')
    const notas = formData.get('notes')

    const salidaData = {
      productoId,
      cantidad,
      fecha,
      motivo,
      destino,
      referencia,
      notas
    }

    // Aquí iría la lógica para registrar la salida en la API
    try {
      await registrarAuditoria({
        accion: 'crear',
        modulo: 'salidas',
        descripcion: `Salida de ${cantidad} unidades (producto: ${productoId})`,
        detalles: JSON.stringify(salidaData),
        registroId: typeof productoId === 'string' ? parseInt(productoId) : undefined
      })
    } catch (e) {
      console.warn('No se pudo registrar auditoría de salida', e)
    }

    setOpen(false)
  }

  if (!canCreate("salidas")) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Salida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Salida de Inventario</DialogTitle>
            <DialogDescription>Completa la información de la salida de productos del inventario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Producto</Label>
              <Select>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Shampoo Profesional 500ml (Stock: 24)</SelectItem>
                  <SelectItem value="2">Gel Fijador Extra Fuerte 250ml (Stock: 45)</SelectItem>
                  <SelectItem value="3">Cera Modeladora Mate (Stock: 8)</SelectItem>
                  <SelectItem value="4">Tinte Permanente Negro (Stock: 32)</SelectItem>
                  <SelectItem value="5">Aceite para Barba 30ml (Stock: 67)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" type="number" placeholder="0" min="1" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha de Salida</Label>
                <Input id="date" type="date" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo de Salida</Label>
              <Select>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Uso interno">Uso interno</SelectItem>
                  <SelectItem value="Donación">Donación</SelectItem>
                  <SelectItem value="Cortesía">Cortesía</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">Destino / Cliente</Label>
              <Input id="destination" placeholder="Nombre del cliente o destino" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Número de Referencia</Label>
              <Input id="reference" placeholder="Ej: ORD-2024-001" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas / Observaciones</Label>
              <Textarea id="notes" placeholder="Información adicional sobre la salida..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Salida</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
