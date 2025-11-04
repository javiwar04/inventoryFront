"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockCategories = [
  {
    id: 1,
    name: "Cuidado Capilar",
    code: "CAP",
    description: "Productos para el cuidado del cabello",
    products: 15,
    status: "active",
  },
  {
    id: 2,
    name: "Estilizado",
    code: "EST",
    description: "Productos para estilizar el cabello",
    products: 12,
    status: "active",
  },
  {
    id: 3,
    name: "Cuidado de Barba",
    code: "BAR",
    description: "Productos para el cuidado de la barba",
    products: 8,
    status: "active",
  },
  {
    id: 4,
    name: "Coloración",
    code: "COL",
    description: "Tintes y productos de coloración",
    products: 10,
    status: "active",
  },
  { id: 5, name: "Afeitado", code: "AFE", description: "Productos para afeitado", products: 6, status: "active" },
  {
    id: 6,
    name: "Herramientas",
    code: "HER",
    description: "Herramientas profesionales",
    products: 9,
    status: "active",
  },
  { id: 7, name: "Suministros", code: "SUM", description: "Suministros generales", products: 5, status: "active" },
]

export function CategoriesTable() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCategories = mockCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
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
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-mono text-sm">{category.code}</TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">{category.description}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{category.products}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                    Activa
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
