import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PrimaryButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof Button> {
  asChild?: boolean
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          'text-white',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)

PrimaryButton.displayName = 'PrimaryButton'
