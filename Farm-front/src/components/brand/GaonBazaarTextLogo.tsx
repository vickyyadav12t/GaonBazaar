import { cn } from '@/lib/utils';

const TAGLINE = 'No middlemen, only fair deals';

const sizeStyles = {
  sm: {
    gb: 'text-[clamp(0.8125rem,2vw,0.9375rem)]',
    name: 'text-[clamp(0.875rem,2.2vw,1.0625rem)]',
    tag: 'text-[clamp(0.5625rem,1.15vw,0.6875rem)]',
  },
  md: {
    gb: 'text-[clamp(0.9375rem,2.4vw,1.0625rem)]',
    name: 'text-[clamp(0.96875rem,2.55vw,1.1875rem)]',
    tag: 'text-[clamp(0.625rem,1.3vw,0.75rem)]',
  },
  lg: {
    gb: 'text-[clamp(1rem,2.85vw,1.375rem)]',
    name: 'text-[clamp(1.125rem,3.25vw,1.5rem)]',
    tag: 'text-[clamp(0.6875rem,1.55vw,0.8125rem)]',
  },
} as const;

export type GaonBazaarTextLogoProps = {
  className?: string;
  /** White text on green/dark bars; green (#2e7d32) on light backgrounds */
  variant: 'onDark' | 'onLight';
  /** Responsive scale: navbar → sm, footer / mobile auth → md, auth hero panel → lg */
  size?: keyof typeof sizeStyles;
  /** When false, visible to assistive tech (use when not inside a labeled link). */
  decorative?: boolean;
};

export function GaonBazaarTextLogo({
  className,
  variant,
  size = 'md',
  decorative = true,
}: GaonBazaarTextLogoProps) {
  const s = sizeStyles[size];
  const primary = variant === 'onDark' ? 'text-white' : 'text-[#2e7d32]';
  const subtle = variant === 'onDark' ? 'text-white/70' : 'text-[#2e7d32]/65';

  return (
    <div
      aria-hidden={decorative ? true : undefined}
      className={cn(
        'flex items-baseline gap-2.5 font-[Inter,system-ui,sans-serif] text-left antialiased md:gap-3',
        className
      )}
    >
      <span
        className={cn(
          'shrink-0 select-none font-black leading-none tracking-tight',
          s.gb,
          primary
        )}
      >
        GB
      </span>
      <div className="flex min-w-0 flex-col leading-none">
        <span className={cn('font-semibold tracking-tight', s.name, primary)}>GaonBazaar</span>
        <span className={cn('mt-1 font-normal leading-snug', s.tag, subtle)}>{TAGLINE}</span>
      </div>
    </div>
  );
}
