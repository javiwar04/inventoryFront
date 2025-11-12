'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'bg-white dark:bg-neutral-950 text-foreground border border-border shadow-lg rounded-md',
          description: 'text-sm text-muted-foreground',
          icon: 'text-foreground',
          actionButton:
            'bg-transparent hover:bg-secondary text-foreground border border-border/50',
          cancelButton:
            'bg-transparent hover:bg-secondary text-foreground border border-border/50',
        },
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--card))',
          '--normal-text': 'hsl(var(--card-foreground))',
          '--normal-border': 'hsl(var(--border))',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
