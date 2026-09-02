import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  // A toggle's affordance depends on roundness, so this is a deliberate,
  // documented exception to the app's otherwise-square corners.
  <SwitchPrimitives.Root
    className={cn(
      "focus-editorial peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-ink transition-colors disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-signal data-[state=unchecked]:bg-rule",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-paper-white ring-0 transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0.5",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
