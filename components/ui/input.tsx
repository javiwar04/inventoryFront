"use client"

import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, value, defaultValue, onChange, ...props }: React.ComponentProps<'input'>) {
  // Determine if the parent is controlling the input (passed `value` prop)
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value') || value !== undefined

  // Internal state to manage the input when uncontrolled by the parent.
  const [internalValue, setInternalValue] = React.useState<string>(() => {
    if (isControlled) return (value as any) ?? ''
    return (defaultValue as any) ?? ''
  })

  // Keep internal state in sync if parent switches to controlled mode or updates value
  React.useEffect(() => {
    if (isControlled) {
      setInternalValue((value as any) ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value)
    if (onChange) onChange(e)
  }

  const valueToUse = isControlled ? ((value as any) ?? '') : internalValue

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      value={valueToUse}
      onChange={handleChange}
      {...(props as React.ComponentProps<'input'>)}
    />
  )
}

export { Input }
