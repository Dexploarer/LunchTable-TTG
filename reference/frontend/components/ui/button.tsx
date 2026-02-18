import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "tcg-button",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-zine shadow-zine-sm text-[10px] uppercase font-black tracking-tighter hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform",
        outline:
          "border-zine bg-background hover:bg-secondary/50 font-bold uppercase tracking-tighter text-xs shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-zine font-bold uppercase tracking-tighter text-xs shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform",
        ghost:
          "hover:bg-primary/10 hover:text-foreground font-bold uppercase tracking-tighter text-xs",
        link: "text-primary underline-offset-4 hover:underline font-bold uppercase tracking-tighter text-xs",
        // New LunchTable Variants
        primary: "tcg-button-primary",
        reputation:
          "bg-reputation text-black border-zine shadow-zine font-black uppercase tracking-tighter hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // If we were using Slot from @radix-ui/react-slot, we'd use it here for asChild
    // But since it wasn't in the original imports, we'll keep it simple for now
    // or assume the user might want to add it back if they have it installed.
    // For now, consistent with previous implementation:
    const Comp = "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
