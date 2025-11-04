"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

const expirationData = [
  {
    id: 1,
    sku: "SHP-001",
    product: "Shampoo Profesional 500ml",
    batch: "LOT-2024-001",
    quantity: 12,
    expirationDate: "2025-02-15",
    daysUntilExpiration: 104,
    status: "ok",
  },
  {
    id: 2,
    sku: "TIN-004",
    product: "Tinte Permanente Negro",
    batch: "LOT-2024-045",
    quantity: 8,
    expirationDate: "2025-01-20",
    daysUntilExpiration: 78,
    status: "warning",
  },
  {
    id: 3,
    sku: "ACE-006",
    product: "Aceite para Barba 30ml",
    batch: "LOT-2024-089",
    quantity: 15,
    expirationDate: "2024-12-10",
    daysUntilExpiration: 37,
    status: "warning",
  },
  {
    id: 4,
    sku: "BAL-007",
    product: "Bálsamo After Shave 100ml",
    batch: "LOT-2024-023",
    quantity: 5,
    expirationDate: "2024-11-25",
    daysUntilExpiration: 22,
    status: "critical",
  },
  {
    id: 5,
    sku: "ESP-009",
    product: "Espuma de Afeitar 200ml",
    batch: "LOT-2024-067",
    quantity: 20,
    expirationDate: "2025-03-30",
    daysUntilExpiration: 147,
    status: "ok",
  },
  {
    id: 6,
    sku: "CER-003",
    product: "Cera Modeladora Mate",
    batch: "LOT-2024-012",
    quantity: 3,
    expirationDate: "2024-11-15",
    daysUntilExpiration: 12,
    status: "critical",
  },
  {
    id: 7,
    sku: "GEL-002",
    product: "Gel Fijador Extra Fuerte 250ml",
    batch: "LOT-2024-078",
    quantity: 25,
    expirationDate: "2025-04-10",
    daysUntilExpiration: 158,
    status: "ok",
  },
  {
    id: 8,
    sku: "POM-008",
    product: "Pomada Brillante 100g",
    batch: "LOT-2024-034",
    quantity: 18,
    expirationDate: "2024-12-28",
    daysUntilExpiration: 55,
    status: "warning",
  },
]

export function ExpirationTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredData = expirationData.filter((item) => {
    const matchesSearch =
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || item.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string, days: number) => {
    if (status === "critical") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Crítico ({days}d)
        </Badge>
      )
    }
    if (status === "warning") {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Próximo ({days}d)
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Normal ({days}d)
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, SKU o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === "critical" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("critical")}
          >
            Críticos
          </Button>
          <Button
            variant={filterStatus === "warning" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("warning")}
          >
            Próximos
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.product}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{item.batch}</TableCell>
                <TableCell className="text-right">{item.quantity} unidades</TableCell>
                <TableCell>{new Date(item.expirationDate).toLocaleDateString("es-GT")}</TableCell>
                <TableCell>{getStatusBadge(item.status, item.daysUntilExpiration)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
