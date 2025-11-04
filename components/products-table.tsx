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
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

const products = [
  {
    id: 1,
    sku: "SHP-001",
    name: "Shampoo Profesional 500ml",
    category: "Cuidado Capilar",
    stock: 24,
    minStock: 15,
    price: 85.0,
    unit: "Botella",
  },
  {
    id: 2,
    sku: "GEL-002",
    name: "Gel Fijador Extra Fuerte 250ml",
    category: "Estilizado",
    stock: 45,
    minStock: 20,
    price: 65.0,
    unit: "Botella",
  },
  {
    id: 3,
    sku: "CER-003",
    name: "Cera Modeladora Mate",
    category: "Estilizado",
    stock: 8,
    minStock: 15,
    price: 95.0,
    unit: "Unidad",
  },
  {
    id: 4,
    sku: "TIN-004",
    name: "Tinte Permanente Negro",
    category: "Coloración",
    stock: 32,
    minStock: 10,
    price: 120.0,
    unit: "Caja",
  },
  {
    id: 5,
    sku: "NAV-005",
    name: "Navajas Desechables (Paquete 10)",
    category: "Herramientas",
    stock: 5,
    minStock: 20,
    price: 45.0,
    unit: "Paquete",
  },
  {
    id: 6,
    sku: "ACE-006",
    name: "Aceite para Barba 30ml",
    category: "Cuidado de Barba",
    stock: 67,
    minStock: 25,
    price: 110.0,
    unit: "Botella",
  },
  {
    id: 7,
    sku: "BAL-007",
    name: "Bálsamo After Shave 100ml",
    category: "Cuidado de Barba",
    stock: 12,
    minStock: 18,
    price: 75.0,
    unit: "Botella",
  },
  {
    id: 8,
    sku: "POM-008",
    name: "Pomada Brillante 100g",
    category: "Estilizado",
    stock: 89,
    minStock: 30,
    price: 85.0,
    unit: "Unidad",
  },
  {
    id: 9,
    sku: "ESP-009",
    name: "Espuma de Afeitar 200ml",
    category: "Afeitado",
    stock: 28,
    minStock: 20,
    price: 55.0,
    unit: "Lata",
  },
  {
    id: 10,
    sku: "TOA-010",
    name: "Toallas Desechables (Paquete 50)",
    category: "Suministros",
    stock: 15,
    minStock: 10,
    price: 35.0,
    unit: "Paquete",
  },
  {
    id: 11,
    sku: "PEI-011",
    name: "Peine Profesional Carbono",
    category: "Herramientas",
    stock: 42,
    minStock: 15,
    price: 25.0,
    unit: "Unidad",
  },
  {
    id: 12,
    sku: "CEP-012",
    name: "Cepillo Barbero Limpieza",
    category: "Herramientas",
    stock: 18,
    minStock: 12,
    price: 30.0,
    unit: "Unidad",
  },
]

export function ProductsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const { canEdit, canDelete } = usePermissions()

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "Sin Stock", variant: "destructive" as const }
    if (stock < minStock) return { label: "Stock Bajo", variant: "secondary" as const }
    return { label: "En Stock", variant: "default" as const }
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => {
            const status = getStockStatus(product.stock, product.minStock)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">
                  <span className={product.stock < product.minStock ? "text-destructive font-semibold" : ""}>
                    {product.stock}
                  </span>
                  <span className="text-muted-foreground text-xs ml-1">/ {product.minStock}</span>
                </TableCell>
                <TableCell className="text-right font-mono">Q{product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
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
                      {canEdit("productos") && (
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canDelete("productos") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
