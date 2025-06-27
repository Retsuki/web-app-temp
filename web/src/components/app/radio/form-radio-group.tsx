'use client';

import type { FieldPath, FieldValues, Control } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

type FormRadioGroupProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  options: RadioOption[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
};

export function FormRadioGroup<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
  className,
  orientation = 'vertical',
  disabled,
}: FormRadioGroupProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
              className={cn(
                orientation === 'horizontal' && 'flex flex-row space-x-4',
                orientation === 'vertical' && 'space-y-2'
              )}
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                  <div className="flex flex-col">
                    <FormLabel
                      htmlFor={`${name}-${option.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {option.label}
                    </FormLabel>
                    {option.description && (
                      <FormDescription className="mt-1">
                        {option.description}
                      </FormDescription>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}