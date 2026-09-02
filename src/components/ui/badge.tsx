import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "focus-editorial inline-flex items-center gap-1 rounded-none border border-rule px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-signal text-signal",
        secondary: "border-rule text-ink",
        destructive: "border-signal text-signal",
        outline: "border-rule text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
