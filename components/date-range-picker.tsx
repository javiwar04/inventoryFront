"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DateRangePicker({ className, date, onDateChange }: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(date)

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateChange?.(range)
  }

  const applyPreset = (key: string) => {
    const today = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (key) {
      case 'today':
        from = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        to = from
        break
      case '7':
        from = addDays(today, -6)
        to = today
        break
      case '30':
        from = addDays(today, -29)
        to = today
        break
      case '90':
        from = addDays(today, -89)
        to = today
        break
      case 'month':
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
      case 'year':
        from = startOfYear(today)
        to = endOfYear(today)
        break
      default:
        from = undefined
        to = undefined
    }

    handleSelect(from && to ? { from, to } : undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es}
          />
          <div className="p-3 border-t flex flex-wrap gap-2 bg-muted/5">
            <button type="button" onClick={() => applyPreset('today')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Hoy</button>
            <button type="button" onClick={() => applyPreset('7')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Últimos 7 días</button>
            <button type="button" onClick={() => applyPreset('30')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Últimos 30 días</button>
            <button type="button" onClick={() => applyPreset('90')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Últimos 90 días</button>
            <button type="button" onClick={() => applyPreset('month')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Mes actual</button>
            <button type="button" onClick={() => applyPreset('year')} className="text-xs px-2 py-1 rounded bg-white/80 hover:bg-white">Año actual</button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
