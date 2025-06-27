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
                <FormLabel
                  key={option.value}
                  htmlFor={`${name}-${option.value}`}
                  className="flex items-start space-x-2 cursor-pointer"
                >
                  <RadioGroupItem value={option.value} id={`${name}-${option.value}`} className="mt-0.5" />
                  <div className="flex flex-col flex-1">
                    <span className="font-normal">
                      {option.label}
                    </span>
                    {option.description && (
                      <FormDescription className="mt-1">
                        {option.description}
                      </FormDescription>
                    )}
                  </div>
                </FormLabel>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}