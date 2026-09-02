import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ style, ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      // Sonner defines --normal-bg/--normal-border/--normal-text itself via a
      // theme-keyed stylesheet rule, which beats plain Tailwind classNames in
      // specificity. Overriding the variables via inline style wins over
      // that rule and ties every toast to the app's own paper tokens.
      style={
        {
          "--normal-bg": "var(--color-paper-white)",
          "--normal-border": "var(--color-ink)",
          "--normal-text": "var(--color-ink)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-none! shadow-[10px_10px_0_rgba(23,32,29,0.11)]!",
          // Sonner hardcodes the description color (#3f3f3f) unless its own
          // theme prop is set to "dark" — which we don't use, since we drive
          // colors from the app's own tokens instead.
          description: "text-muted!",
          actionButton: "bg-signal! text-paper-white! rounded-none!",
          cancelButton: "bg-field-neutral! text-ink! rounded-none!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
