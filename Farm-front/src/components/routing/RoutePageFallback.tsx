import { Loader2 } from 'lucide-react';

/** Minimal full-width placeholder while lazy route chunks load */
export function RoutePageFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin shrink-0" aria-hidden />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
