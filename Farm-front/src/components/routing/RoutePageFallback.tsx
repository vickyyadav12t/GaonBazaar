import { Loader2 } from 'lucide-react';

/** Minimal full-width placeholder while lazy route chunks load */
export function RoutePageFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,rgba(216,155,43,0.08),transparent_34%),linear-gradient(180deg,#fbf4e4_0%,#f6ecd9_100%)] px-6 text-[#6c5a3d]"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d7c7a8] bg-[#fff8ea] shadow-[0_8px_18px_rgba(74,60,37,0.08)]">
        <Loader2 className="h-7 w-7 shrink-0 animate-spin text-[#315f3b]" aria-hidden />
      </div>
      <p className="text-sm font-medium text-[#315f3b]">Loading page</p>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
