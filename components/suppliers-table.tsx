"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Pencil, Trash2, Search, Phone, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockSuppliers = [
  {
    id: 1,
    name: "Distribuidora Beauty Pro",
    contact: "Juan Pérez",
    phone: "5555-1234",
    email: "ventas@beautypro.com",
    nit: "12345678-9",
    products: 25,
    status: "active",
  },
  {
    id: 2,
    name: "Importadora Estilo GT",
    contact: "María López",
    phone: "5555-5678",
    email: "info@estilogt.com",
    nit: "98765432-1",
    products: 18,
    status: "active",
  },
  {
    id: 3,
    name: "Suministros Profesionales",
    contact: "Carlos Ramírez",
    phone: "5555-9012",
    email: "contacto@supro.com",
    nit: "45678912-3",
    products: 12,
    status: "active",
  },
  {
    id: 4,
    name: "Barbería Supplies Inc",
    contact: "Ana García",
    phone: "5555-3456",
    email: "ventas@barberiasupplies.com",
    nit: "78912345-6",
    products: 30,
    status: "active",
  },
  {
    id: 5,
    name: "Productos Capilares SA",
    contact: "Luis Morales",
    phone: "5555-7890",
    email: "info@capilares.com",
    nit: "32165498-7",
    products: 15,
    status: "active",
  },
]

export function SuppliersTable() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.nit.includes(searchTerm),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead className="text-center">Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {supplier.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {supplier.email}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{supplier.nit}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{supplier.products}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                    Activo
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
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
    </div>
  )
}
