"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, FileText, Trash2 } from "lucide-react"

const exits = [
  {
    id: 1,
    date: "2024-01-15",
    product: "Mouse Logitech MX Master",
    sku: "MOU-LOG-002",
    quantity: 5,
    reason: "Venta",
    destination: "Cliente: Tech Solutions SA",
    reference: "ORD-2024-045",
    user: "María García",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-01-14",
    product: 'Monitor LG 27" 4K',
    sku: "MON-LG-004",
    quantity: 3,
    reason: "Venta",
    destination: "Cliente: Innovate Corp",
    reference: "ORD-2024-044",
    user: "Ana Martínez",
    status: "completed",
  },
  {
    id: 3,
    date: "2024-01-14",
    product: "Laptop Dell XPS 15",
    sku: "LAP-DELL-001",
    quantity: 2,
    reason: "Transferencia",
    destination: "Sucursal Norte",
    reference: "TRF-2024-012",
    user: "Juan Pérez",
    status: "completed",
  },
  {
    id: 4,
    date: "2024-01-13",
    product: "Teclado Mecánico RGB",
    sku: "KEY-MEC-003",
    quantity: 10,
    reason: "Venta",
    destination: "Cliente: Gaming Store",
    reference: "ORD-2024-043",
    user: "Carlos López",
    status: "completed",
  },
  {
    id: 5,
    date: "2024-01-13",
    product: "Cable HDMI 2m",
    sku: "CAB-HDMI-005",
    quantity: 15,
    reason: "Uso Interno",
    destination: "Departamento IT",
    reference: "INT-2024-008",
    user: "Pedro Sánchez",
    status: "completed",
  },
  {
    id: 6,
    date: "2024-01-12",
    product: "Webcam HD 1080p",
    sku: "WEB-HD-006",
    quantity: 8,
    reason: "Venta",
    destination: "Cliente: Remote Work Inc",
    reference: "ORD-2024-042",
    user: "María García",
    status: "completed",
  },
  {
    id: 7,
    date: "2024-01-12",
    product: "SSD 1TB NVMe",
    sku: "SSD-1TB-008",
    quantity: 12,
    reason: "Venta",
    destination: "Cliente: Data Systems",
    reference: "ORD-2024-041",
    user: "Ana Martínez",
    status: "completed",
  },
]

const reasonColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Venta: "default",
  Transferencia: "secondary",
  "Producto Dañado": "destructive",
  Devolución: "outline",
  "Uso Interno": "secondary",
  Otro: "outline",
}

export function ExitsTable() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredExits = exits.filter(
    (exit) =>
      exit.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exit.reference.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExits.map((exit) => (
            <TableRow key={exit.id}>
              <TableCell className="font-medium">
                {new Date(exit.date).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{exit.product}</div>
                  <div className="text-xs text-muted-foreground font-mono">{exit.sku}</div>
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{exit.destination}</TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  -{exit.quantity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={reasonColors[exit.reason] || "default"}>{exit.reason}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{exit.reference}</TableCell>
              <TableCell className="text-sm">{exit.user}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Documento
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
