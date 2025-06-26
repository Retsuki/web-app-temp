import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";

export interface OutlineButtonProps 
  extends React.ComponentProps<"button">,
    VariantProps<typeof Button> {
  asChild?: boolean;
}

export const OutlineButton = React.forwardRef<
  HTMLButtonElement,
  OutlineButtonProps
>(({ className, variant = "outline", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});

OutlineButton.displayName = "OutlineButton";
