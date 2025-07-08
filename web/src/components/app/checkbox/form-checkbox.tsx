'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type FormCheckboxProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: string
  description?: string
  className?: string
  disabled?: boolean
}

export function FormCheckbox<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: FormCheckboxProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel
            htmlFor={`checkbox-${name}`}
            className="flex items-start space-x-3 cursor-pointer"
          >
            <FormControl>
              <Checkbox
                id={`checkbox-${name}`}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                className="mt-0.5"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              {label && <span className="font-normal">{label}</span>}
              {description && <FormDescription>{description}</FormDescription>}
            </div>
          </FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
