import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
          Reading / 404
        </p>
        <h1 className="font-display text-8xl font-medium text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl font-medium text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-signal px-4 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase transition-colors hover:bg-signal-hover"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
