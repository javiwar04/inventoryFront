export const PAYMENT_METHODS = [
  "Efectivo Quetzales",
  "Efectivo Dólares",
  "Tarjeta",
  "Transferencia",
  "Cortesía",
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface PaymentAllocation {
  method: PaymentMethod
  amount: number
}

const normalizeText = (value: string) =>
  value.trim().toLocaleLowerCase("es-GT").normalize("NFD").replace(/[\u0300-\u036f]/g, "")

export function canonicalizePaymentMethod(value?: string | null): PaymentMethod | null {
  const normalized = normalizeText(value || "")

  if (normalized === "efectivo" || normalized === "efectivo quetzales") return "Efectivo Quetzales"
  if (normalized === "efectivo dolares") return "Efectivo Dólares"
  if (normalized === "tarjeta") return "Tarjeta"
  if (normalized === "transferencia") return "Transferencia"
  if (normalized === "cortesia") return "Cortesía"
  return null
}

function parseAmount(value: string): number | null {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parsePaymentMethod(value: string | null | undefined, saleTotal: number): PaymentAllocation[] {
  const raw = (value || "").trim()
  if (!raw) return []

  if (!raw.includes("|") && !raw.includes(":")) {
    const method = canonicalizePaymentMethod(raw)
    return method && saleTotal > 0 ? [{ method, amount: saleTotal }] : []
  }

  const allocations: PaymentAllocation[] = []
  const parts = raw.split("|")

  for (const part of parts) {
    const separator = part.lastIndexOf(":")
    if (separator < 1) return []

    const method = canonicalizePaymentMethod(part.slice(0, separator))
    const amount = parseAmount(part.slice(separator + 1))
    if (!method || amount === null) return []
    allocations.push({ method, amount })
  }

  return allocations
}

export function formatSplitPayment(allocations: PaymentAllocation[]): string {
  return allocations.map(({ method, amount }) => `${method}: Q${amount.toFixed(2)}`).join(" | ")
}

export function matchesPaymentFilter(method: PaymentMethod, filter: string): boolean {
  if (filter === "Efectivo") return method.startsWith("Efectivo")
  return method === filter
}
