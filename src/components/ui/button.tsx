import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-editorial inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-signal text-paper-white font-mono text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-signal-hover",
        destructive:
          "border border-rule text-ink hover:border-signal hover:bg-field-conflict hover:text-signal",
        outline: "border border-ink text-ink hover:bg-ink hover:text-paper-white",
        secondary: "border border-ink text-ink hover:bg-ink hover:text-paper-white",
        ghost: "text-ink underline decoration-1 underline-offset-4 hover:text-signal",
        link: "text-signal underline decoration-1 underline-offset-4 hover:text-signal-hover",
      },
      size: {
        default: "h-9 px-5",
        sm: "h-8 px-3",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
