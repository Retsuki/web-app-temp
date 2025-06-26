import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";

export interface PrimaryButtonProps 
  extends React.ComponentProps<"button">,
    VariantProps<typeof Button> {
  asChild?: boolean;
}

export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryButtonProps
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "bg-indigo-600 hover:bg-indigo-700 text-white",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});

PrimaryButton.displayName = "PrimaryButton";
