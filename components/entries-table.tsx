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

const entries = [
  {
    id: 1,
    date: "2024-01-15",
    product: "Laptop Dell XPS 15",
    sku: "LAP-DELL-001",
    quantity: 10,
    supplier: "Tech Distributors Inc.",
    invoice: "FAC-2024-015",
    cost: 100149.23,
    user: "Juan Pérez",
    status: "completed",
  },
  {
    id: 2,
    date: "2024-01-15",
    product: "Teclado Mecánico RGB",
    sku: "KEY-MEC-003",
    quantity: 15,
    supplier: "Gaming Supplies Co.",
    invoice: "FAC-2024-016",
    cost: 17323.85,
    user: "Carlos López",
    status: "completed",
  },
  {
    id: 3,
    date: "2024-01-14",
    product: "Webcam HD 1080p",
    sku: "WEB-HD-006",
    quantity: 20,
    supplier: "Electronics World",
    invoice: "FAC-2024-014",
    cost: 12318.46,
    user: "Pedro Sánchez",
    status: "completed",
  },
  {
    id: 4,
    date: "2024-01-14",
    product: "Mouse Logitech MX Master",
    sku: "MOU-LOG-002",
    quantity: 25,
    supplier: "Logitech Official",
    invoice: "FAC-2024-013",
    cost: 17323.08,
    user: "María García",
    status: "completed",
  },
  {
    id: 5,
    date: "2024-01-13",
    product: "SSD 1TB NVMe",
    sku: "SSD-1TB-008",
    quantity: 30,
    supplier: "Storage Solutions Ltd.",
    invoice: "FAC-2024-012",
    cost: 30027.69,
    user: "Ana Martínez",
    status: "completed",
  },
  {
    id: 6,
    date: "2024-01-13",
    product: 'Monitor LG 27" 4K',
    sku: "MON-LG-004",
    quantity: 8,
    supplier: "LG Electronics",
    invoice: "FAC-2024-011",
    cost: 27719.38,
    user: "Juan Pérez",
    status: "completed",
  },
  {
    id: 7,
    date: "2024-01-12",
    product: "Memoria RAM 8GB DDR4",
    sku: "RAM-8GB-007",
    quantity: 40,
    supplier: "Memory Masters",
    invoice: "FAC-2024-010",
    cost: 14164.92,
    user: "Carlos López",
    status: "completed",
  },
]

export function EntriesTable() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEntries = entries.filter(
    (entry) =>
      entry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoice.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Factura</TableHead>
            <TableHead className="text-right">Costo Total</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {new Date(entry.date).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{entry.product}</div>
                  <div className="text-xs text-muted-foreground font-mono">{entry.sku}</div>
                </div>
              </TableCell>
              <TableCell>{entry.supplier}</TableCell>
              <TableCell className="text-right">
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  +{entry.quantity}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{entry.invoice}</TableCell>
              <TableCell className="text-right font-mono">Q{entry.cost.toFixed(2)}</TableCell>
              <TableCell className="text-sm">{entry.user}</TableCell>
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
                      Ver Factura
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
